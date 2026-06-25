"use client";
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useBranch } from "@/components/branch-context";
import { supabase } from "@/lib/supabase";
import { useRouter } from 'next/navigation';
import { logActivity } from "@/lib/activity";
import { getTemplate, parseTemplate, formatWhatsAppNumber } from "@/lib/whatsapp";
import { getLibrarySetting } from "@/lib/settings";
import { checkAndReleaseSeats } from "@/lib/utils";

export default function SeatingPage() {
  const { activeBranch } = useBranch();
  const branchName = activeBranch === 'namnakala' ? 'Namnakala' : 'Bangali Chowk';
  const seats = activeBranch === 'namnakala' ? 121 : 153;
  const router = useRouter();

  
  const [seatMap, setSeatMap] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [unassignedMembers, setUnassignedMembers] = useState<any[]>([]);
  const [allActiveMembersCount, setAllActiveMembersCount] = useState(0);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [modalSearch, setModalSearch] = useState("");
  
  // Seat Search Feature States
  const [globalSearch, setGlobalSearch] = useState("");
  const [blinkingSeat, setBlinkingSeat] = useState<string | null>(null);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // WhatsApp Notification State
  const [whatsappModal, setWhatsappModal] = useState<{
    show: boolean;
    phone: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  } | null>(null);

  const occupiedCount = Object.keys(seatMap).length;
  const availableCount = seats - occupiedCount;

  // Real-time seat map statistics
  const assignedTotalMembers = Object.values(seatMap).reduce((sum, occupants) => sum + occupants.length, 0);
  const totalMembers = allActiveMembersCount;
  const morningShiftMembers = Object.values(seatMap).reduce((sum, occupants) => 
    sum + occupants.filter(m => m.shift === 'Morning').length, 0
  );
  const eveningShiftMembers = Object.values(seatMap).reduce((sum, occupants) => 
    sum + occupants.filter(m => m.shift === 'Evening').length, 0
  );
  const fullDayShiftMembers = Object.values(seatMap).reduce((sum, occupants) => 
    sum + occupants.filter(m => m.shift === 'Full Day').length, 0
  );

  // Flatten assigned members for search
  const assignedMembersList = Object.entries(seatMap).flatMap(([seat_no, occupants]) => 
    occupants.map(occ => ({ ...occ, seat_no }))
  );
  
  const searchResults = globalSearch.trim().length > 0 
    ? assignedMembersList.filter(m => 
        m.full_name.toLowerCase().includes(globalSearch.toLowerCase()) || 
        (m.permanent_id && m.permanent_id.toLowerCase().includes(globalSearch.toLowerCase()))
      )
    : [];

  const handleSearchResultClick = (seat_no: string) => {
    setGlobalSearch("");
    setShowSearchDropdown(false);
    setBlinkingSeat(seat_no);
    
    // Auto-scroll to the seat so it's visible
    setTimeout(() => {
      const element = document.getElementById(`seat-btn-${seat_no}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);

    // Stop blinking after 1.2 seconds (matches the 2x 0.5s animation)
    setTimeout(() => {
      setBlinkingSeat(null);
    }, 1200);
  };

  const fetchSeats = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('members')
      .select('id, seat_no, shift, is_active, full_name, permanent_id, mobile, subscription_end_date, outstanding_dues, payment_due_date')
      .eq('branch', activeBranch)
      .eq('is_active', true);
    
    if (data) {
      const { updatedMembers } = await checkAndReleaseSeats(data, activeBranch);
      setAllActiveMembersCount(updatedMembers.length);
      const map: Record<string, any[]> = {};
      const unassigned: any[] = [];
      updatedMembers.forEach(m => {
        if (m.seat_no) {
          if (!map[m.seat_no]) map[m.seat_no] = [];
          map[m.seat_no].push(m);
        } else {
          // Exclude unreserved members from the seat map queue
          const isUnreserved = m.permanent_id && m.permanent_id.includes('U');
          if (!isUnreserved) {
            unassigned.push(m);
          }
        }
      });
      setSeatMap(map);
      setUnassignedMembers(unassigned);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSeats();
  }, [activeBranch]);

  const handleAssignSeat = async (memberId: string) => {
    if (!selectedSeat) return;
    setIsAssigning(true);
    
    const member = unassignedMembers.find(m => m.id === memberId);
    if (member) {
      logActivity(activeBranch, "seating", `Allocated Seat #${selectedSeat} to ${member.full_name} (${member.permanent_id})`);
      
      // Update seat number in database and clear previous seat
      await supabase.from('members').update({ seat_no: selectedSeat, previous_seat_no: null }).eq('id', memberId);
      
      // Reload the seats from the database to keep UI state perfectly synced
      await fetchSeats();

      // 3. Fetch latest invoice, full member record, and payment count in parallel
      const [{ data: latestInv }, { data: fullMember }, { count: paymentCount }] = await Promise.all([
        supabase
          .from('invoices')
          .select('*')
          .eq('member_id', memberId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('members')
          .select('*')
          .eq('id', memberId)
          .maybeSingle(),
        supabase
          .from('payments')
          .select('*', { count: 'exact', head: true })
          .eq('member_id', memberId)
      ]);

      const memberToUse = fullMember || member;
      const branchLabel = activeBranch === 'namnakala' ? 'Namnakala' : 'Bengali Chowk';
      const mobileClean = formatWhatsAppNumber(memberToUse.mobile);
      const seatText = selectedSeat || 'Unassigned';
      const expiryDate = memberToUse.subscription_end_date ? new Date(memberToUse.subscription_end_date).toLocaleDateString('en-IN') : 'N/A';
      
      let paymentSection = "";
      if (latestInv) {
        const statusText = latestInv.status === 'paid' ? '✅ FULLY PAID' : latestInv.status === 'partially_paid' ? '⚠️ PARTIALLY PAID (Dues Pending)' : '❌ UNPAID';
        let dueDateLine = "";
        if (latestInv.due_amount > 0 && latestInv.due_date) {
          dueDateLine = `📅 *Payment Due Date:* ${new Date(latestInv.due_date).toLocaleDateString('en-IN')}\n`;
        }
        paymentSection = 
          `💳 *Payment Details:*\n` +
          `💰 *Total Billed:* ₹${latestInv.total_amount}\n` +
          `💵 *Amount Paid:* ₹${latestInv.paid_amount}\n` +
          `⚠️ *Outstanding Dues:* ₹${latestInv.due_amount}\n` +
          dueDateLine +
          `📈 *Payment Status:* ${statusText}\n\n`;
      } else {
        paymentSection = `💳 *Payment Details:* Pending Payment Setup\n\n`;
      }

      const isFirstPayment = (paymentCount || 0) <= 1;

      const statusText = latestInv
        ? (latestInv.status === 'paid' ? '✅ FULLY PAID' : latestInv.status === 'partially_paid' ? '⚠️ PARTIALLY PAID (Dues Pending)' : '❌ UNPAID')
        : '';
      let dueDateLine = "";
      if (latestInv && latestInv.due_amount > 0 && latestInv.due_date) {
        dueDateLine = `📅 *Payment Due Date:* ${new Date(latestInv.due_date).toLocaleDateString('en-IN')}\n`;
      }

      const templateVars: Record<string, string> = {
        name: memberToUse.full_name || '',
        branch: branchLabel,
        seat: selectedSeat.toString(),
        shift: memberToUse.shift || '',
        expiry: expiryDate,
        payment_section: paymentSection,
        total_amount: String(latestInv?.total_amount ?? 0),
        paid_amount: String(latestInv?.paid_amount ?? 0),
        due_amount: String(latestInv?.due_amount ?? 0),
        remaining_dues: String(latestInv?.due_amount ?? 0),
        due_date_line: dueDateLine,
        status: statusText,
        invoice_link: latestInv?.id ? `${window.location.origin}/invoice?id=${latestInv.id}` : 'Link Unavailable'
      };

      let templateStr = "";
      if (isFirstPayment) {
        templateStr = await getTemplate('welcome_msg');
      } else {
        templateStr = await getTemplate('seat_assigned_msg');
      }
      
      const consolidatedMsg = parseTemplate(templateStr, templateVars);

      setWhatsappModal({
        show: true,
        phone: mobileClean,
        message: consolidatedMsg,
        onConfirm: () => {
          if (mobileClean) {
            window.open(`https://wa.me/${mobileClean}?text=${encodeURIComponent(consolidatedMsg)}`, '_blank');
          }
          setWhatsappModal(null);
        },
        onCancel: () => {
          setWhatsappModal(null);
        }
      });
    }
    setIsAssigning(false);
    setSelectedSeat(null);
  };

  const handleUnassignSeat = async (memberId: string, seatNo: string) => {
    setIsAssigning(true);
    
    // Find member to log details
    const currentOccupants = seatMap[seatNo] || [];
    const member = currentOccupants.find(m => m.id === memberId);
    
    if (member) {
      logActivity(activeBranch, "seating", `Unassigned Seat #${seatNo} from ${member.full_name} (${member.permanent_id})`);
    }

    // Update database - save vacated seat in previous_seat_no
    await supabase.from('members').update({ seat_no: null, previous_seat_no: seatNo }).eq('id', memberId);
    
    // Fetch fresh database records to update UI state
    await fetchSeats();
    
    setIsAssigning(false);
  };

  const getSeatStyle = (seatId: string) => {
    const occupants = seatMap[seatId] || [];
    if (occupants.length === 0) {
      return { 
        bg: 'bg-red-500/[0.07] hover:bg-red-500/[0.14] border-red-300/60', 
        dot: '', 
        textColor: 'text-red-700/80 font-bold' 
      };
    }
    if (occupants.length === 2) {
      const shift1 = occupants[0]?.shift;
      const shift2 = occupants[1]?.shift;
      
      const getShiftColor = (s: string) => {
        if (s === 'Morning') return 'rgba(245, 158, 11, 0.45)'; // Distinct Amber
        if (s === 'Evening') return 'rgba(168, 85, 247, 0.45)'; // Distinct Purple
        return 'rgba(16, 185, 129, 0.45)'; // Distinct Emerald/Full Day
      };
      
      return { 
        bg: 'border-purple-400 hover:scale-105', 
        dot: 'multishift', 
        textColor: 'text-purple-950 font-black',
        style: {
          background: `linear-gradient(135deg, ${getShiftColor(shift1)} 50%, ${getShiftColor(shift2)} 50%)`
        }
      };
    }
    const shift = occupants[0].shift;
    if (shift === 'Full Day') {
      return { 
        bg: 'bg-emerald-500/40 hover:bg-emerald-500/50 border-emerald-500/50', 
        dot: 'bg-emerald-600 shadow-[0_0_3px_rgba(16,185,129,0.6)]', 
        textColor: 'text-emerald-950 font-black' 
      };
    }
    if (shift === 'Morning') {
      return { 
        bg: 'bg-amber-500/45 hover:bg-amber-500/55 border-amber-500/60', 
        dot: 'bg-amber-600 shadow-[0_0_3px_rgba(245,158,11,0.6)]', 
        textColor: 'text-amber-950 font-black' 
      };
    }
    if (shift === 'Evening') {
      return { 
        bg: 'bg-purple-500/40 hover:bg-purple-500/50 border-purple-500/50', 
        dot: 'bg-purple-600 shadow-[0_0_3px_rgba(168,85,247,0.6)]', 
        textColor: 'text-purple-950 font-black' 
      };
    }
    return { 
      bg: 'bg-white/[0.04] border-white/[0.08]', 
      dot: '', 
      textColor: 'text-slate-500' 
    };
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Seat Map</h1>
          <p className="page-subtitle">{branchName} Branch · {seats} Total Capacity</p>
        </div>
        {unassignedMembers.length > 0 && (
          <div className="card-premium !py-2 !px-4 flex items-center gap-2 border-orange-500/20 text-orange-500 bg-orange-500/5">
            <span className="material-symbols-outlined text-sm animate-pulse">info</span>
            <span className="text-xs font-bold font-manrope">{unassignedMembers.length} Student{unassignedMembers.length > 1 ? 's' : ''} Awaiting Seats</span>
          </div>
        )}
      </div>

      {/* 📊 Seating Dynamic Stats Tiles Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Total Members (Assigned + Unassigned) */}
        <div className="card-premium !p-4 flex items-center gap-3 bg-primary/[0.02]">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">groups</span>
          </div>
          <div>
            <div className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider leading-none">Total Members</div>
            <div className="text-lg font-black text-slate-800 mt-1.5 leading-none">{totalMembers}</div>
          </div>
        </div>

        {/* Occupied Cabins */}
        <div className="card-premium !p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">event_seat</span>
          </div>
          <div>
            <div className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider leading-none">Occupied Seats</div>
            <div className="text-lg font-black text-slate-800 mt-1.5 leading-none">{occupiedCount}</div>
          </div>
        </div>

        {/* Available Cabins */}
        <div className="card-premium !p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">chair_alt</span>
          </div>
          <div>
            <div className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider leading-none">Available Seats</div>
            <div className="text-lg font-black text-slate-800 mt-1.5 leading-none">{availableCount}</div>
          </div>
        </div>

        {/* Assigned Members (Total) */}
        <div className="card-premium !p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">group</span>
          </div>
          <div>
            <div className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider leading-none">Assigned Total</div>
            <div className="text-lg font-black text-slate-800 mt-1.5 leading-none">{assignedTotalMembers}</div>
          </div>
        </div>

        {/* Morning Shift Assigned Members */}
        <div className="card-premium !p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">light_mode</span>
          </div>
          <div>
            <div className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider leading-none">Morning Shift</div>
            <div className="text-lg font-black text-slate-800 mt-1.5 leading-none">{morningShiftMembers}</div>
          </div>
        </div>

        {/* Evening Shift Assigned Members */}
        <div className="card-premium !p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">dark_mode</span>
          </div>
          <div>
            <div className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider leading-none">Evening Shift</div>
            <div className="text-lg font-black text-slate-800 mt-1.5 leading-none">{eveningShiftMembers}</div>
          </div>
        </div>

        {/* Full Day Assigned Members */}
        <div className="card-premium !p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">wb_sunny</span>
          </div>
          <div>
            <div className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider leading-none">Full Day Shift</div>
            <div className="text-lg font-black text-slate-800 mt-1.5 leading-none">{fullDayShiftMembers}</div>
          </div>
        </div>
      </div>

      {/* Custom Styles for Seat Blinking */}
      <style>{`
        @keyframes seatBlink {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); transform: scale(1); }
          50% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0.6); transform: scale(1.15); background-color: #fca5a5 !important; border-color: #ef4444 !important; }
        }
        .seat-blink-active {
          animation: seatBlink 0.5s ease-in-out 2;
          z-index: 40;
          position: relative;
        }
      `}</style>

      {/* Legend & Search Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-700 bg-white border border-slate-200 p-3 px-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 bg-red-500/[0.07] rounded border border-red-300/60" />Available</div>
          <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 bg-emerald-500/40 rounded border border-emerald-500/50" />Full Day</div>
          <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 bg-amber-500/45 rounded border border-amber-500/60" />Morning</div>
          <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 bg-purple-500/40 rounded border border-purple-500/50" />Evening</div>
          <div className="flex items-center gap-2">
            <div 
              className="w-3.5 h-3.5 rounded border border-purple-400 shadow-sm" 
              style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.45) 50%, rgba(168, 85, 247, 0.45) 50%)' }} 
            />
            Shared / Multishift
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80 z-20">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input 
              type="text" 
              placeholder="Search student to find seat..." 
              value={globalSearch}
              onChange={(e) => {
                setGlobalSearch(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
              onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary shadow-sm"
            />
          </div>
          
          {/* Dropdown with mouse scroll */}
          {showSearchDropdown && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 overflow-y-auto z-50 p-2 overscroll-contain">
              {searchResults.map(m => (
                <button
                  key={m.id}
                  onClick={() => handleSearchResultClick(m.seat_no)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 flex flex-col transition-colors border-b border-slate-50 last:border-0"
                >
                  <span className="text-sm font-bold text-slate-800">{m.full_name}</span>
                  <div className="flex justify-between items-center mt-0.5">
                    <span className="text-[10px] text-slate-500 font-mono">{m.permanent_id}</span>
                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-black">Seat {m.seat_no}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
          {showSearchDropdown && globalSearch.length > 0 && searchResults.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl p-4 text-center z-50">
              <span className="text-xs font-semibold text-slate-500">No assigned student found</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Seat Grid */}
      <div className="card-premium overflow-x-auto relative">
        {loading && (
          <div className="absolute inset-0 z-10 bg-surface/60 backdrop-blur-sm flex items-center justify-center rounded-2xl">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined animate-spin text-2xl text-primary">progress_activity</span>
              <span className="text-sm font-medium text-on-surface-variant">Loading seat data...</span>
            </div>
          </div>
        )}
        {activeBranch === 'namnakala' ? (
          <div className="overflow-x-auto p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
            <div 
              className="grid gap-1.5 min-w-[max-content] relative w-max mx-auto px-4"
              style={{ 
                gridTemplateColumns: 'repeat(20, minmax(30px, 36px))',
                gridAutoRows: 'minmax(30px, 36px)'
              }}
            >
              {/* Row 2: Left Arrows under 1..8 */}
              <div className="flex items-center text-[#003178] opacity-70" style={{ gridRow: 2, gridColumn: '2 / 6' }}>
                <span className="material-symbols-outlined text-xl" style={{ transform: 'rotate(180deg)' }}>arrow_right_alt</span>
                <div className="h-[1.5px] bg-[#003178] w-full -ml-1" />
              </div>
              <div className="flex items-center text-[#003178] opacity-70" style={{ gridRow: 2, gridColumn: '6 / 10' }}>
                <span className="material-symbols-outlined text-xl" style={{ transform: 'rotate(180deg)' }}>arrow_right_alt</span>
                <div className="h-[1.5px] bg-[#003178] w-full -ml-1" />
              </div>

              {/* Row 2: Right Arrows under 9..16 */}
              <div className="flex items-center text-[#003178] opacity-70" style={{ gridRow: 2, gridColumn: '13 / 17' }}>
                <div className="h-[1.5px] bg-[#003178] w-full -mr-1" />
                <span className="material-symbols-outlined text-xl">arrow_right_alt</span>
              </div>
              <div className="flex items-center text-[#003178] opacity-70" style={{ gridRow: 2, gridColumn: '17 / 21' }}>
                <div className="h-[1.5px] bg-[#003178] w-full -mr-1" />
                <span className="material-symbols-outlined text-xl">arrow_right_alt</span>
              </div>
              
              {/* Row 5: Left Arrows under 33..41 */}
              <div className="flex items-center text-[#003178] opacity-70" style={{ gridRow: 5, gridColumn: '1 / 5' }}>
                <span className="material-symbols-outlined text-xl" style={{ transform: 'rotate(180deg)' }}>arrow_right_alt</span>
                <div className="h-[1.5px] bg-[#003178] w-full -ml-1" />
              </div>
              <div className="flex items-center text-[#003178] opacity-70" style={{ gridRow: 5, gridColumn: '6 / 10' }}>
                <span className="material-symbols-outlined text-xl" style={{ transform: 'rotate(180deg)' }}>arrow_right_alt</span>
                <div className="h-[1.5px] bg-[#003178] w-full -ml-1" />
              </div>

              {/* Row 5: Right Arrows under 42..48 */}
              <div className="flex items-center text-[#003178] opacity-70" style={{ gridRow: 5, gridColumn: '14 / 17' }}>
                <div className="h-[1.5px] bg-[#003178] w-full -mr-1" />
                <span className="material-symbols-outlined text-xl">arrow_right_alt</span>
              </div>
              <div className="flex items-center text-[#003178] opacity-70" style={{ gridRow: 5, gridColumn: '18 / 21' }}>
                <div className="h-[1.5px] bg-[#003178] w-full -mr-1" />
                <span className="material-symbols-outlined text-xl">arrow_right_alt</span>
              </div>

              {/* Row 9: Right Arrows under 89..94 */}
              <div className="flex items-center text-[#003178] opacity-70" style={{ gridRow: 9, gridColumn: '15 / 18' }}>
                <div className="h-[1.5px] bg-[#003178] w-full -mr-1" />
                <span className="material-symbols-outlined text-xl">arrow_right_alt</span>
              </div>
              <div className="flex items-center text-[#003178] opacity-70" style={{ gridRow: 9, gridColumn: '18 / 21' }}>
                <div className="h-[1.5px] bg-[#003178] w-full -mr-1" />
                <span className="material-symbols-outlined text-xl">arrow_right_alt</span>
              </div>

              {/* Row 10: Left Arrows above 79..71 */}
              <div className="flex items-center text-[#003178] opacity-70" style={{ gridRow: 10, gridColumn: '1 / 5' }}>
                <span className="material-symbols-outlined text-xl" style={{ transform: 'rotate(180deg)' }}>arrow_right_alt</span>
                <div className="h-[1.5px] bg-[#003178] w-full -ml-1" />
              </div>
              <div className="flex items-center text-[#003178] opacity-70" style={{ gridRow: 10, gridColumn: '6 / 10' }}>
                <span className="material-symbols-outlined text-xl" style={{ transform: 'rotate(180deg)' }}>arrow_right_alt</span>
                <div className="h-[1.5px] bg-[#003178] w-full -ml-1" />
              </div>

              {/* Sub-Right Arrows Row 13 */}
              <div className="flex items-center text-[#003178] opacity-70" style={{ gridRow: 13, gridColumn: '17 / 19' }}>
                <div className="h-[1.5px] bg-[#003178] w-full -mr-1" />
                <span className="material-symbols-outlined text-xl">arrow_right_alt</span>
              </div>
              <div className="flex items-center text-[#003178] opacity-70" style={{ gridRow: 13, gridColumn: '19 / 21' }}>
                <div className="h-[1.5px] bg-[#003178] w-full -mr-1" />
                <span className="material-symbols-outlined text-xl">arrow_right_alt</span>
              </div>

              {/* Sub-Right Arrows Row 16 */}
              <div className="flex items-center text-[#003178] opacity-70" style={{ gridRow: 16, gridColumn: '17 / 19' }}>
                <div className="h-[1.5px] bg-[#003178] w-full -mr-1" />
                <span className="material-symbols-outlined text-xl">arrow_right_alt</span>
              </div>
              <div className="flex items-center text-[#003178] opacity-70" style={{ gridRow: 16, gridColumn: '19 / 21' }}>
                <div className="h-[1.5px] bg-[#003178] w-full -mr-1" />
                <span className="material-symbols-outlined text-xl">arrow_right_alt</span>
              </div>

              {/* Top Up Arrow Vertical */}
              <div className="flex flex-col items-center justify-start text-[#003178] opacity-70" style={{ gridRow: '1 / 4', gridColumn: 11 }}>
                <span className="material-symbols-outlined text-xl" style={{ transform: 'rotate(-90deg)', marginBottom: '-6px' }}>arrow_right_alt</span>
                <div className="w-[1.5px] bg-[#003178] h-full" />
              </div>

              {/* Mid Up Arrow Vertical */}
              <div className="flex flex-col items-center justify-start text-[#003178] opacity-70" style={{ gridRow: '4 / 9', gridColumn: 11 }}>
                <span className="material-symbols-outlined text-xl" style={{ transform: 'rotate(-90deg)', marginBottom: '-6px' }}>arrow_right_alt</span>
                <div className="w-[1.5px] bg-[#003178] h-full" />
              </div>

              {/* Bottom Up Arrow Vertical */}
              <div className="flex flex-col items-center justify-start text-[#003178] opacity-70" style={{ gridRow: '11 / 18', gridColumn: 10 }}>
                <span className="material-symbols-outlined text-xl" style={{ transform: 'rotate(-90deg)', marginBottom: '-6px' }}>arrow_right_alt</span>
                <div className="w-[1.5px] bg-[#003178] h-full" />
              </div>

              {/* Bottom Down Arrow Vertical */}
              <div className="flex flex-col items-center justify-end text-[#003178] opacity-70" style={{ gridRow: '11 / 18', gridColumn: 12 }}>
                <div className="w-[1.5px] bg-[#003178] h-full" />
                <span className="material-symbols-outlined text-xl" style={{ transform: 'rotate(90deg)', marginTop: '-6px' }}>arrow_right_alt</span>
              </div>

              {/* Horizontal Separator Lines Row 7 */}
              <div className="border-b-[1.5px] border-[#003178] opacity-70 w-full self-center" style={{ gridRow: 7, gridColumn: '2 / 10' }} />
              <div className="border-b-[1.5px] border-[#003178] opacity-70 w-full self-center" style={{ gridRow: 7, gridColumn: '15 / 21' }} />

              {[...Array(seats)].map((_, i) => {
                const seatNum = i + 1;
                const seatId = seatNum.toString();
                const style = getSeatStyle(seatId);
                const occupants = seatMap[seatId] || [];
                const isSelected = selectedSeat === seatId;
                
                let r: number | 'auto' = 'auto';
                let c: number | 'auto' = 'auto';

                // LEFT BLOCK
                if (seatNum >= 1 && seatNum <= 8) {
                  r = 1; c = seatNum + 1; // C2..C9
                } else if (seatNum >= 24 && seatNum <= 32) {
                  r = 3; c = 33 - seatNum; // C1..C9
                } else if (seatNum >= 33 && seatNum <= 41) {
                  r = 4; c = seatNum - 32; // C1..C9
                } else if (seatNum >= 55 && seatNum <= 62) {
                  r = 6; c = 64 - seatNum; // C2..C9
                } else if (seatNum >= 63 && seatNum <= 70) {
                  r = 8; c = seatNum - 61; // C2..C9
                } else if (seatNum >= 71 && seatNum <= 79) {
                  r = 11; c = 80 - seatNum; // C1..C9
                } else if (seatNum >= 80 && seatNum <= 88) {
                  r = 12; c = 89 - seatNum; // C1..C9
                }
                
                // RIGHT BLOCK TOP
                else if (seatNum >= 9 && seatNum <= 16) {
                  r = 1; c = seatNum + 4; // C13..C20
                } else if (seatNum >= 17 && seatNum <= 23) {
                  r = 3; c = 37 - seatNum; // C14..C20
                } else if (seatNum >= 42 && seatNum <= 48) {
                  r = 4; c = seatNum - 28; // C14..C20
                } else if (seatNum >= 49 && seatNum <= 54) {
                  r = 6; c = 69 - seatNum; // C15..C20
                } else if (seatNum >= 89 && seatNum <= 94) {
                  r = 8; c = seatNum - 74; // C15..C20
                }

                // BOTTOM RIGHT BLOCKS
                else if (seatNum >= 95 && seatNum <= 98) {
                  r = 11; c = 115 - seatNum; // C17..C20
                } else if (seatNum >= 99 && seatNum <= 102) {
                  r = 12; c = seatNum - 82; // C17..C20
                } else if (seatNum >= 103 && seatNum <= 106) {
                  r = 14; c = 123 - seatNum; // C17..C20
                } else if (seatNum >= 107 && seatNum <= 110) {
                  r = 15; c = seatNum - 90; // C17..C20
                } else if (seatNum >= 111 && seatNum <= 114) {
                  r = 17; c = 131 - seatNum; // C17..C20
                }

                // CENTER VERTICAL BLOCK
                else if (seatNum >= 115 && seatNum <= 121) {
                  r = 132 - seatNum; c = 11; // R11..R17 at C11
                }

                return (
                  <button
                    key={i}
                    id={`seat-btn-${seatId}`}
                    onClick={() => setSelectedSeat(seatId)}
                    style={{ ...style.style, gridRowStart: r, gridColumnStart: c }}
                    className={`w-full h-full aspect-square ${style.bg} rounded-full border border-slate-200/50 flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 ${
                      isSelected ? 'ring-2 ring-primary ring-offset-1 ring-offset-surface scale-105 font-black' : ''
                    } ${blinkingSeat === seatId ? 'seat-blink-active' : ''}`}
                    title={occupants.length > 0 ? `${seatId}: ${occupants.map(o => o.full_name).join(', ')}` : `Seat ${seatId} — Available`}
                  >
                    <span className={`text-[11px] font-bold ${style.textColor || 'text-slate-500'}`}>{seatId}</span>
                    {style.dot === 'multishift' ? (
                      <div className="flex gap-0.5 mt-0.5 absolute bottom-1">
                        {occupants.map((occ, idx) => {
                          const getDotColor = (s: string) => {
                            if (s === 'Morning') return 'bg-amber-500 shadow-[0_0_3px_rgba(245,158,11,0.5)]';
                            if (s === 'Evening') return 'bg-purple-500 shadow-[0_0_3px_rgba(168,85,247,0.5)]';
                            return 'bg-emerald-500 shadow-[0_0_3px_rgba(16,185,129,0.5)]';
                          };
                          return (
                            <span key={idx} className={`w-1 h-1 rounded-full ${getDotColor(occ.shift)}`} />
                          );
                        })}
                      </div>
                    ) : (
                      style.dot && <span className={`w-1 h-1 rounded-full ${style.dot} absolute bottom-1`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : activeBranch === 'bengali-chowk' ? (
          <div className="overflow-x-auto p-4 pt-16 bg-slate-50/50 rounded-2xl border border-slate-100 relative mt-4">
            {/* Room Labels and Grid */}
            <div className="flex flex-col relative w-max mx-auto min-w-[max-content]">
              
              {/* Room Labels */}
              <div className="absolute -top-10 left-0 right-0 flex justify-between pointer-events-none px-12 md:px-24">
                <span className="font-black text-blue-900/40 tracking-widest text-lg uppercase">Light Room</span>
                <span className="font-black text-blue-900/40 tracking-widest text-lg uppercase">Dark Room</span>
              </div>

              {/* Grid Container */}
              <div 
                className="grid gap-0 relative border-[1.5px] border-blue-900/40 p-2 bg-white"
                style={{ 
                  gridTemplateColumns: 'repeat(17, minmax(34px, 40px))',
                  gridAutoRows: 'minmax(34px, 40px)'
                }}
              >
                {/* Vertical Room Divider (Red Line) */}
                <div className="flex justify-center pointer-events-none" style={{ gridRow: '1 / 18', gridColumn: 11, zIndex: 0 }}>
                  <div className="w-[1.5px] bg-red-500 h-full" />
                </div>

                {/* Walkway Labels */}
                {[2, 5, 7, 13, 16].map(col => (
                  <div key={`walkway-${col}`} style={{ gridColumn: col, gridRow: '2 / 18' }} className="flex flex-col items-center justify-center text-blue-900/30 gap-8 h-full pointer-events-none">
                    <span className="material-symbols-outlined" style={{ transform: 'rotate(-90deg)' }}>arrow_right_alt</span>
                    <span className="tracking-[0.3em] font-black uppercase text-[10px]" style={{ writingMode: 'vertical-rl' }}>Walkway</span>
                    <span className="material-symbols-outlined" style={{ transform: 'rotate(90deg)' }}>arrow_right_alt</span>
                  </div>
                ))}

                {[...Array(seats)].map((_, i) => {
                  const seatNum = i + 1;
                  const seatId = seatNum.toString();
                  
                  // Top Row Light Room
                  if (seatNum === 9) {
                    return (
                      <div key="top-light" style={{ gridRow: 1, gridColumn: '1 / 11' }} className="flex w-full">
                        {[9,8,7,6,5,4,3,2,1].map(n => {
                          const sId = n.toString();
                          const sStyle = getSeatStyle(sId);
                          const sOcc = seatMap[sId] || [];
                          const sSel = selectedSeat === sId;
                          return (
                            <button
                              key={n}
                              id={`seat-btn-${sId}`}
                              onClick={() => setSelectedSeat(sId)}
                              style={sStyle.style}
                              className={`flex-1 border-[0.5px] border-blue-900/30 flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 bg-white ${
                                sSel ? 'ring-2 ring-primary ring-offset-1 ring-offset-surface scale-105 font-black z-10 relative' : ''
                              } ${blinkingSeat === sId ? 'seat-blink-active' : ''}`}
                              title={sOcc.length > 0 ? `${sId}: ${sOcc.map(o => o.full_name).join(', ')}` : `Seat ${sId} — Available`}
                            >
                              <span className={`text-[11px] font-bold ${sStyle.textColor || 'text-blue-900'}`}>{sId}</span>
                              {sStyle.dot === 'multishift' ? (
                                <div className="flex gap-0.5 mt-0.5 absolute bottom-1">
                                  {sOcc.map((occ, idx) => {
                                    const getDotColor = (s: string) => {
                                      if (s === 'Morning') return 'bg-amber-500 shadow-[0_0_3px_rgba(245,158,11,0.5)]';
                                      if (s === 'Evening') return 'bg-purple-500 shadow-[0_0_3px_rgba(168,85,247,0.5)]';
                                      return 'bg-emerald-500 shadow-[0_0_3px_rgba(16,185,129,0.5)]';
                                    };
                                    return <span key={idx} className={`w-1 h-1 rounded-full ${getDotColor(occ.shift)}`} />;
                                  })}
                                </div>
                              ) : (
                                sStyle.dot && <span className={`w-1 h-1 rounded-full ${sStyle.dot} absolute bottom-1`} />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    );
                  }
                  if (seatNum >= 1 && seatNum <= 8) return null;

                  // Top Row Dark Room
                  if (seatNum === 153) {
                    return (
                      <div key="top-dark" style={{ gridRow: 1, gridColumn: '12 / 16' }} className="flex w-full">
                        {[153,152,151,150].map(n => {
                          const sId = n.toString();
                          const sStyle = getSeatStyle(sId);
                          const sOcc = seatMap[sId] || [];
                          const sSel = selectedSeat === sId;
                          return (
                            <button
                              key={n}
                              id={`seat-btn-${sId}`}
                              onClick={() => setSelectedSeat(sId)}
                              style={sStyle.style}
                              className={`flex-1 border-[0.5px] border-blue-900/30 flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 bg-white ${
                                sSel ? 'ring-2 ring-primary ring-offset-1 ring-offset-surface scale-105 font-black z-10 relative' : ''
                              } ${blinkingSeat === sId ? 'seat-blink-active' : ''}`}
                              title={sOcc.length > 0 ? `${sId}: ${sOcc.map(o => o.full_name).join(', ')}` : `Seat ${sId} — Available`}
                            >
                              <span className={`text-[11px] font-bold ${sStyle.textColor || 'text-blue-900'}`}>{sId}</span>
                              {sStyle.dot === 'multishift' ? (
                                <div className="flex gap-0.5 mt-0.5 absolute bottom-1">
                                  {sOcc.map((occ, idx) => {
                                    const getDotColor = (s: string) => {
                                      if (s === 'Morning') return 'bg-amber-500 shadow-[0_0_3px_rgba(245,158,11,0.5)]';
                                      if (s === 'Evening') return 'bg-purple-500 shadow-[0_0_3px_rgba(168,85,247,0.5)]';
                                      return 'bg-emerald-500 shadow-[0_0_3px_rgba(16,185,129,0.5)]';
                                    };
                                    return <span key={idx} className={`w-1 h-1 rounded-full ${getDotColor(occ.shift)}`} />;
                                  })}
                                </div>
                              ) : (
                                sStyle.dot && <span className={`w-1 h-1 rounded-full ${sStyle.dot} absolute bottom-1`} />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    );
                  }
                  if (seatNum >= 150 && seatNum <= 152) return null;

                  let r: number | 'auto' = 'auto';
                  let c: number | 'auto' = 'auto';

                  // Light Room Main Grid
                  if (seatNum >= 10 && seatNum <= 22) { r = seatNum - 6; c = 1; }
                  else if (seatNum >= 23 && seatNum <= 37) { r = 40 - seatNum; c = 3; }
                  else if (seatNum >= 38 && seatNum <= 52) { r = seatNum - 35; c = 4; }
                  else if (seatNum >= 53 && seatNum <= 64) { r = 67 - seatNum; c = 6; }
                  else if (seatNum >= 65 && seatNum <= 67) { r = 3; c = 75 - seatNum; }
                  else if (seatNum >= 68 && seatNum <= 70) { r = 6; c = seatNum - 60; }
                  else if (seatNum >= 71 && seatNum <= 73) { r = 7; c = 81 - seatNum; }
                  else if (seatNum >= 74 && seatNum <= 76) { r = 9; c = seatNum - 66; }
                  else if (seatNum >= 77 && seatNum <= 79) { r = 10; c = 87 - seatNum; }
                  else if (seatNum >= 80 && seatNum <= 82) { r = 12; c = seatNum - 72; }
                  else if (seatNum >= 83 && seatNum <= 85) { r = 13; c = 93 - seatNum; }
                  else if (seatNum >= 86 && seatNum <= 88) { r = 17; c = seatNum - 78; }
                  
                  // Dark Room Main Grid
                  else if (seatNum >= 89 && seatNum <= 103) { r = seatNum - 86; c = 12; }
                  else if (seatNum >= 104 && seatNum <= 118) { r = 121 - seatNum; c = 14; }
                  else if (seatNum >= 119 && seatNum <= 133) { r = seatNum - 116; c = 15; }
                  else if (seatNum >= 134 && seatNum <= 149) { r = 150 - seatNum; c = 17; }

                  const style = getSeatStyle(seatId);
                  const occupants = seatMap[seatId] || [];
                  const isSelected = selectedSeat === seatId;

                  return (
                    <button
                      key={i}
                      id={`seat-btn-${seatId}`}
                      onClick={() => setSelectedSeat(seatId)}
                      style={{ ...style.style, gridRowStart: r, gridColumnStart: c }}
                      className={`w-full h-full border-[0.5px] border-blue-900/30 flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 bg-white ${
                        isSelected ? 'ring-2 ring-primary ring-offset-1 ring-offset-surface scale-105 font-black z-10 relative' : ''
                      } ${blinkingSeat === seatId ? 'seat-blink-active' : ''}`}
                      title={occupants.length > 0 ? `${seatId}: ${occupants.map(o => o.full_name).join(', ')}` : `Seat ${seatId} — Available`}
                    >
                      <span className={`text-[11px] font-bold ${style.textColor || 'text-blue-900'}`}>{seatId}</span>
                      {style.dot === 'multishift' ? (
                        <div className="flex gap-0.5 mt-0.5 absolute bottom-1">
                          {occupants.map((occ, idx) => {
                            const getDotColor = (s: string) => {
                              if (s === 'Morning') return 'bg-amber-500 shadow-[0_0_3px_rgba(245,158,11,0.5)]';
                              if (s === 'Evening') return 'bg-purple-500 shadow-[0_0_3px_rgba(168,85,247,0.5)]';
                              return 'bg-emerald-500 shadow-[0_0_3px_rgba(16,185,129,0.5)]';
                            };
                            return (
                              <span key={idx} className={`w-1 h-1 rounded-full ${getDotColor(occ.shift)}`} />
                            );
                          })}
                        </div>
                      ) : (
                        style.dot && <span className={`w-1 h-1 rounded-full ${style.dot} absolute bottom-1`} />
                      )}
                    </button>
                  );
                })}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-10 md:grid-cols-12 lg:grid-cols-15 gap-2 min-w-[600px]">
            {[...Array(seats)].map((_, i) => {
              const seatId = (i + 1).toString();
              const style = getSeatStyle(seatId);
              const occupants = seatMap[seatId] || [];
              const isSelected = selectedSeat === seatId;
              
              return (
                <button
                  key={i}
                  id={`seat-btn-${seatId}`}
                  onClick={() => setSelectedSeat(seatId)}
                  style={style.style}
                  className={`aspect-square ${style.bg} rounded-lg border flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 ${
                    isSelected ? 'ring-2 ring-primary ring-offset-1 ring-offset-surface scale-105 font-black' : ''
                  } ${blinkingSeat === seatId ? 'seat-blink-active' : ''}`}
                  title={occupants.length > 0 ? `${seatId}: ${occupants.map(o => o.full_name).join(', ')}` : `Seat ${seatId} — Available`}
                >
                  <span className={`text-[10px] font-bold ${style.textColor || 'text-white/50'}`}>{seatId}</span>
                  {style.dot === 'multishift' ? (
                    <div className="flex gap-0.5 mt-0.5">
                      {occupants.map((occ, idx) => {
                        const getDotColor = (s: string) => {
                          if (s === 'Morning') return 'bg-amber-500 shadow-[0_0_3px_rgba(245,158,11,0.5)]';
                          if (s === 'Evening') return 'bg-purple-500 shadow-[0_0_3px_rgba(168,85,247,0.5)]';
                          return 'bg-emerald-500 shadow-[0_0_3px_rgba(16,185,129,0.5)]';
                        };
                        return (
                          <span key={idx} className={`w-1.5 h-1.5 rounded-full ${getDotColor(occ.shift)}`} />
                        );
                      })}
                    </div>
                  ) : (
                    style.dot && <span className={`w-1.5 h-1.5 rounded-full ${style.dot} mt-0.5`} />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══ Seat Management Modal (SaaS Redesign) ═══ */}
      {selectedSeat && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setSelectedSeat(null)}>
          <div className="bg-white border border-slate-200 shadow-2xl rounded-2xl w-full max-w-lg overflow-hidden animate-scale-in flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-xl font-v-display font-bold text-slate-900 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
                    <span className="material-symbols-outlined text-lg">event_seat</span>
                  </div>
                  Seat #{selectedSeat}
                </h2>
                <p className="text-xs font-v-body-sm text-slate-500 mt-1 ml-10">Manage assignment for this slot</p>
              </div>
              <button onClick={() => setSelectedSeat(null)} className="text-slate-400 hover:bg-slate-100 hover:text-slate-700 p-2 rounded-xl transition-all">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            
            {/* Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-white" data-lenis-prevent="true">
              {seatMap[selectedSeat] && seatMap[selectedSeat].length > 0 ? (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-[11px] font-v-label-md font-bold text-blue-700 uppercase tracking-widest mb-3">Current Occupants</h4>
                    <div className="space-y-3">
                      {seatMap[selectedSeat].map(member => (
                        <div key={member.id} className="bg-white p-4 rounded-xl flex justify-between items-center border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-sm shadow-inner">
                              {member.full_name.charAt(0)}
                            </div>
                            <div>
                              <div className="text-slate-900 font-bold text-sm font-v-body-md">{member.full_name}</div>
                              <div className="text-xs text-slate-500 font-v-body-sm mt-0.5 flex items-center gap-1.5">
                                <span className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 font-mono text-[10px]">{member.permanent_id}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300" />
                                <span className="text-blue-700 font-semibold">{member.shift}</span>
                              </div>
                            </div>
                          </div>
                          <button 
                            disabled={isAssigning}
                            onClick={() => handleUnassignSeat(member.id, selectedSeat)}
                            className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white p-2.5 rounded-xl disabled:opacity-50 transition-colors shadow-sm"
                            title="Remove from seat"
                          >
                            {isAssigning ? <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> : <span className="material-symbols-outlined text-sm">person_remove</span>}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Partial occupancy — show compatible members */}
                  {seatMap[selectedSeat].length === 1 && seatMap[selectedSeat][0].shift !== 'Full Day' && (
                    <div className="pt-5 border-t border-slate-100">
                      <h4 className="text-[11px] font-v-label-md font-bold text-orange-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500" />
                        Available Slot: {seatMap[selectedSeat][0].shift === 'Morning' ? 'Evening' : 'Morning'}
                      </h4>
                      
                      {/* Search for partial slot */}
                      <div className="relative mb-3">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                        <input 
                          type="text" 
                          placeholder="Search compatible students..."
                          value={modalSearch}
                          onChange={(e) => setModalSearch(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-sm font-v-body-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all shadow-sm"
                        />
                      </div>

                      <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1" data-lenis-prevent="true">
                        {(() => {
                          const compatible = unassignedMembers.filter(m => m.shift === (seatMap[selectedSeat][0].shift === 'Morning' ? 'Evening' : 'Morning'));
                          const filtered = compatible.filter(m => m.full_name.toLowerCase().includes(modalSearch.toLowerCase()) || m.permanent_id.toLowerCase().includes(modalSearch.toLowerCase()));
                          
                          if (compatible.length === 0) return <div className="text-xs text-slate-500 italic p-4 bg-slate-50 rounded-xl text-center border border-slate-100">No compatible members available for this slot.</div>;
                          if (filtered.length === 0) return <div className="text-xs text-slate-500 italic p-4 bg-slate-50 rounded-xl text-center border border-slate-100">No matches found for &quot;{modalSearch}&quot;.</div>;
                          
                          return filtered.map(m => (
                            <div key={m.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50 transition-all group">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">{m.full_name.charAt(0)}</div>
                                <div>
                                  <div className="text-slate-900 font-semibold text-xs font-v-body-md">{m.full_name}</div>
                                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">{m.permanent_id}</div>
                                </div>
                              </div>
                              <button disabled={isAssigning} onClick={() => { setModalSearch(""); handleAssignSeat(m.id); }} className="bg-white text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm disabled:opacity-50 hover:bg-blue-700 hover:text-white transition-all">Assign</button>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col">
                  <h3 className="text-[11px] font-v-label-md font-bold text-blue-700 uppercase tracking-widest mb-3">Assign a Member</h3>
                  
                  {unassignedMembers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-2xl border border-slate-100 my-auto">
                      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-3xl">task_alt</span>
                      </div>
                      <div className="text-sm font-bold text-slate-900 font-v-display">All Caught Up!</div>
                      <div className="text-xs text-slate-500 mt-1 text-center font-v-body-sm">Every active member has been assigned a seat.</div>
                    </div>
                  ) : (
                    <>
                      {/* Search Bar */}
                      <div className="relative mb-4">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">search</span>
                        <input 
                          type="text" 
                          placeholder="Search unassigned students by name or ID..."
                          value={modalSearch}
                          onChange={(e) => setModalSearch(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-v-body-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all shadow-sm"
                        />
                        {modalSearch && (
                          <button onClick={() => setModalSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        )}
                      </div>

                      {/* List */}
                      <div className="space-y-2 overflow-y-auto custom-scrollbar pr-1 max-h-[300px]" data-lenis-prevent="true">
                        {(() => {
                          const filtered = unassignedMembers.filter(m => m.full_name.toLowerCase().includes(modalSearch.toLowerCase()) || m.permanent_id.toLowerCase().includes(modalSearch.toLowerCase()));
                          
                          if (filtered.length === 0) {
                            return (
                              <div className="flex flex-col items-center justify-center py-10 text-center">
                                <span className="material-symbols-outlined text-3xl text-slate-300 mb-2">search_off</span>
                                <div className="text-sm font-bold text-slate-600">No matches found</div>
                                <div className="text-xs text-slate-400 font-v-body-sm mt-1">Try a different name or ID.</div>
                              </div>
                            );
                          }

                          return filtered.map(m => (
                            <div key={m.id} className="flex justify-between items-center bg-white p-3.5 rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50 transition-all group shadow-sm hover:shadow">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm border border-slate-200 shadow-inner group-hover:bg-blue-700 group-hover:text-white transition-colors">
                                  {m.full_name.charAt(0)}
                                </div>
                                <div>
                                  <div className="text-slate-900 font-bold text-sm font-v-body-md group-hover:text-blue-700 transition-colors">{m.full_name}</div>
                                  <div className="text-[11px] text-slate-500 font-v-body-sm mt-0.5 flex items-center gap-1.5">
                                    <span className="font-mono text-slate-400">{m.permanent_id}</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                                    <span className="font-semibold text-red-600">{m.shift}</span>
                                  </div>
                                </div>
                              </div>
                              <button 
                                disabled={isAssigning}
                                onClick={() => { setModalSearch(""); handleAssignSeat(m.id); }}
                                className="bg-white text-blue-700 px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-50 border border-blue-200 hover:bg-blue-700 hover:text-white hover:shadow-md transition-all flex items-center gap-1"
                              >
                                Assign <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                              </button>
                            </div>
                          ));
                        })()}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* WhatsApp Notification Confirmation Modal */}
      {whatsappModal && whatsappModal.show && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] bg-surface-container-lowest/80 backdrop-blur-md flex items-center justify-center p-4 dashboard-light-theme text-slate-800">
          <div className="glass-pane-elevated rounded-3xl w-full max-w-lg overflow-hidden animate-scale-in border border-emerald-500/20 shadow-2xl bg-white">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-emerald-50">
              <h2 className="text-base font-black text-emerald-600 font-manrope flex items-center gap-2">
                <span className="material-symbols-outlined font-black">chat</span>
                WhatsApp SMS Confirmation
              </h2>
              <button 
                onClick={whatsappModal.onCancel}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-all"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Content Preview */}
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500 font-medium">
                Do you want to send the following consolidated admission, seating, & payment details on WhatsApp?
              </p>
              
              <div className="bg-[#f8fafc] border border-slate-200 rounded-xl p-4 text-xs font-mono text-slate-800 whitespace-pre-wrap max-h-60 overflow-y-auto" data-lenis-prevent="true">
                {whatsappModal.message}
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button 
                onClick={whatsappModal.onCancel}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition-all"
              >
                Skip / Close
              </button>
              <button 
                onClick={whatsappModal.onConfirm}
                className="btn-primary !bg-emerald-600 hover:!bg-emerald-700 !text-white px-5 py-2.5 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-500/10 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm font-black">send</span>
                Send on WhatsApp
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
