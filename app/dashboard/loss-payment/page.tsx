"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useBranch } from "@/components/branch-context";
import { supabase } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";
import { logActivity } from "@/lib/activity";

export default function LossPaymentPage() {
  const { activeBranch } = useBranch();
  const branchLabel = activeBranch === 'namnakala' ? 'Namnakala' : 'Bengali Chowk';

  const [leftMembers, setLeftMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<any | null>(null);

  // Settle Loss Payment Modal States
  const [settleMember, setSettleMember] = useState<any | null>(null);
  const [settleAmount, setSettleAmount] = useState<number | "">("");
  const [settlePaymentMode, setSettlePaymentMode] = useState<string>("Cash");
  const [settleDate, setSettleDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [settleNotes, setSettleNotes] = useState<string>("");
  const [settleReactivate, setSettleReactivate] = useState<boolean>(false);
  const [isSettling, setIsSettling] = useState<boolean>(false);

  const fetchLeftMembers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('branch', activeBranch)
        .eq('left_with_dues', true)
        .not('left_at', 'is', null)
        .gt('loss_amount', 0)
        .order('left_at', { ascending: false });

      if (error) throw error;
      if (data) setLeftMembers(data);
    } catch (err) {
      console.error("Error fetching left members:", err);
    } finally {
      setLoading(false);
    }
  }, [activeBranch]);

  useEffect(() => {
    fetchLeftMembers();
  }, [fetchLeftMembers]);

  // Open Settle Modal
  const openSettleModal = (member: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSettleMember(member);
    setSettleAmount(member.loss_amount || 0);
    setSettlePaymentMode("Cash");
    setSettleDate(new Date().toISOString().split('T')[0]);
    setSettleNotes(`Loss Payment Settlement — Cleared loss fee for ${member.full_name}`);
    setSettleReactivate(false);
  };

  // Submit Loss Payment Settlement
  const handleConfirmSettle = async () => {
    if (!settleMember) return;
    const paidAmt = Number(settleAmount);
    if (isNaN(paidAmt) || paidAmt <= 0) {
      alert("Please enter a valid payment amount greater than ₹0.");
      return;
    }

    setIsSettling(true);
    try {
      // 1. Insert into payments table
      const { error: payErr } = await supabase
        .from('payments')
        .insert([{
          member_id: settleMember.id,
          invoice_id: null,
          amount: paidAmt,
          branch: settleMember.branch || activeBranch,
          payment_mode: settlePaymentMode,
          paid_at: new Date(settleDate).toISOString(),
          notes: settleNotes || `Loss Payment Clearance for ${settleMember.full_name}`
        }]);

      if (payErr) throw payErr;

      // 2. Calculate remaining loss and update member
      const remainingLoss = Math.max(0, (settleMember.loss_amount || 0) - paidAmt);
      const memberPayload: any = {
        loss_amount: remainingLoss,
        left_with_dues: remainingLoss > 0,
        payment_status: remainingLoss > 0 ? 'LOSS' : 'PAID',
        updated_at: new Date().toISOString()
      };

      if (settleReactivate) {
        memberPayload.is_active = true;
        memberPayload.status = 'ACTIVE';
        memberPayload.seat_no = null;
        memberPayload.previous_seat_no = null;
        memberPayload.left_at = null;
        memberPayload.left_reason = null;
        memberPayload.left_with_dues = false;
        memberPayload.loss_amount = 0;
      }

      const { error: memberErr } = await supabase
        .from('members')
        .update(memberPayload)
        .eq('id', settleMember.id);

      if (memberErr) throw memberErr;

      // 3. Log Activity
      await logActivity(
        activeBranch,
        "payment_recorded",
        `Recorded Loss Payment clearance of ₹${paidAmt} (${settlePaymentMode}) for left member ${settleMember.full_name} (${settleMember.permanent_id}). Remaining Loss: ₹${remainingLoss}${settleReactivate ? ' (Student Reactivated)' : ''}`
      );

      alert(`Success! Loss payment of ₹${paidAmt.toLocaleString('en-IN')} recorded for ${settleMember.full_name}.`);

      setSettleMember(null);
      setSelectedMember(null);
      fetchLeftMembers();
    } catch (err: any) {
      console.error("Failed to settle loss payment:", err);
      alert("Error recording payment: " + (err.message || err));
    } finally {
      setIsSettling(false);
    }
  };

  // Filter list based on search term
  const filteredMembers = leftMembers.filter(m => {
    return (
      m.full_name.toLowerCase().includes(search.toLowerCase()) ||
      m.permanent_id?.toLowerCase().includes(search.toLowerCase()) ||
      m.mobile.includes(search) ||
      m.left_reason?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const totalLoss = leftMembers.reduce((sum, m) => sum + (m.loss_amount || 0), 0);
  const totalCount = leftMembers.length;

  const handleExportPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      
      const doc = new jsPDF();
      
      // Header Banner Style
      doc.setFillColor(185, 28, 28); // Dark Red color for Loss Payment
      doc.rect(0, 0, 210, 35, 'F');
      
      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("KRISHNA LIBRARY", 14, 18);
      
      // Subtitle
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(254, 226, 226);
      doc.text(`${branchLabel} Branch  |  Loss Payments Ledger`, 14, 25);
      
      // Generation Info (Date & Time)
      const nowStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
      doc.text(`Generated: ${nowStr}`, 130, 25);
      
      // Add current metadata count under header
      doc.setTextColor(51, 65, 85); // Slate 700
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(`Defaulters List (${filteredMembers.length} records)  |  Total Loss: INR ${totalLoss.toLocaleString('en-IN')}`, 14, 45);
      
      // Table Generation
      const tableHeaders = [["ID", "Name", "Father's Name", "Mobile", "Left Date", "Lost Amount", "Notes / Reason"]];
      const tableRows = filteredMembers.map(m => [
        m.permanent_id || "N/A",
        m.full_name || "N/A",
        m.father_name || "—",
        m.mobile || "N/A",
        m.left_at ? formatDate(m.left_at) : "—",
        `INR ${(m.loss_amount || 0).toLocaleString('en-IN')}`,
        m.left_reason || "No notes recorded."
      ]);
      
      autoTable(doc, {
        head: tableHeaders,
        body: tableRows,
        startY: 52,
        theme: 'striped',
        headStyles: { fillColor: [185, 28, 28], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
        bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
        alternateRowStyles: { fillColor: [254, 242, 242] }, // Light red tint
        margin: { left: 14, right: 14 },
        didDrawPage: (data) => {
          // Footer
          const pageCount = (doc as any).internal.getNumberOfPages();
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184); // Slate 400
          doc.text(
            `Page ${data.pageNumber} of ${pageCount}`,
            14,
            doc.internal.pageSize.height - 10
          );
          doc.text(
            "Confidential - Krishna Library Management System",
            doc.internal.pageSize.width - 90,
            doc.internal.pageSize.height - 10
          );
        }
      });
      
      const fileName = `Loss_Payments_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("PDF export failed:", error);
      alert("Failed to export PDF. Please check console for details.");
    }
  };

  const [role, setRole] = useState<string | null>(null);
  useEffect(() => {
    setRole(localStorage.getItem("krishna_role"));
  }, []);
  const isAdmin = role === "admin";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="page-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="page-title text-red-400 flex items-center gap-2">
            <span className="material-symbols-outlined text-2xl font-black">money_off</span>
            Loss Payments Ledger
          </h1>
          <p className="page-subtitle">
            Track members who left without clearing outstanding library fees · {branchLabel}
          </p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto items-center">
          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-sm">search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, ID, phone..."
              className="input-premium !py-2.5 !pl-9 !pr-4 !text-sm !rounded-xl w-full"
            />
          </div>
          {isAdmin && (
            <button 
              onClick={handleExportPDF}
              className="btn-ghost px-4 py-2.5 text-sm flex items-center gap-2 shrink-0 text-red-500 border border-red-500/20 hover:bg-red-500/5 transition-all"
            >
              <span className="material-symbols-outlined text-base">picture_as_pdf</span>
              Export PDF
            </button>
          )}
        </div>
      </div>

      {/* Stats overview blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="glass-pane-elevated relative overflow-hidden flex items-center gap-5 p-6 border-l-4 border-red-500 group">
          <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-[100%] blur-[40px] opacity-10 bg-red-500 group-hover:opacity-20 transition-opacity" />
          <div className="stat-icon bg-red-500/15 text-red-400 !w-12 !h-12 flex items-center justify-center rounded-xl border border-red-500/20 shadow-md">
            <span className="material-symbols-outlined text-2xl">error_med</span>
          </div>
          <div>
            <div className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider mb-0.5">Total Outstanding Loss</div>
            <h3 className="text-3xl font-black text-white drop-shadow-md">₹{totalLoss.toLocaleString('en-IN')}</h3>
          </div>
        </div>

        <div className="glass-pane-elevated relative overflow-hidden flex items-center gap-5 p-6 border-l-4 border-amber-500 group">
          <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-[100%] blur-[40px] opacity-10 bg-amber-500 group-hover:opacity-20 transition-opacity" />
          <div className="stat-icon bg-amber-500/15 text-amber-400 !w-12 !h-12 flex items-center justify-center rounded-xl border border-amber-500/20 shadow-md">
            <span className="material-symbols-outlined text-2xl">directions_run</span>
          </div>
          <div>
            <div className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider mb-0.5">Total Defaulters Left</div>
            <h3 className="text-3xl font-black text-white drop-shadow-md">{totalCount} members</h3>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="glass-pane-elevated !p-0 overflow-hidden relative min-h-[350px]">
        {loading && (
          <div className="absolute inset-0 z-10 bg-surface/60 backdrop-blur-sm flex items-center justify-center">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined animate-spin text-2xl text-red-400">progress_activity</span>
              <span className="text-sm font-medium text-on-surface-variant">Loading records...</span>
            </div>
          </div>
        )}

        <div className="px-6 py-4 border-b border-white/[0.06] bg-red-500/[0.02]">
          <h3 className="text-sm font-bold text-white font-manrope">
            Double-click a member row to view full details or click "Settle Loss" to collect payment
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap table-premium">
            <thead>
              <tr className="border-b border-[#e2e8f0]">
                <th className="px-6 py-4 font-bold text-xs uppercase text-slate-500">Member ID</th>
                <th className="px-6 py-4 font-bold text-xs uppercase text-slate-500">Name & Father Name</th>
                <th className="px-6 py-4 font-bold text-xs uppercase text-slate-500">Contact Number</th>
                <th className="px-6 py-4 font-bold text-xs uppercase text-slate-500">Left Date</th>
                <th className="px-6 py-4 font-bold text-xs uppercase text-slate-500">Lost Fee Amount</th>
                <th className="px-6 py-4 font-bold text-xs uppercase text-slate-500">Left Reason / Notes</th>
                <th className="px-6 py-4 font-bold text-xs uppercase text-slate-500 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length === 0 && !loading ? (
                <tr>
                  <td colSpan={7}>
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <span className="material-symbols-outlined text-4xl text-emerald-400 mb-2">check_circle</span>
                      <div className="text-white font-bold text-base">All Clear!</div>
                      <div className="text-on-surface-variant text-xs mt-1">No loss payment records found in this branch.</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr
                    key={member.id}
                    onDoubleClick={() => setSelectedMember(member)}
                    className="cursor-pointer hover:bg-red-500/[0.02] transition-colors group border-b border-[#f1f5f9] select-none"
                    title="Double-click to open full profile details"
                  >
                    <td className="px-6 py-4 font-semibold">
                      <span className="badge badge-danger !text-[10px] tracking-wider">{member.permanent_id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800 group-hover:text-red-400 transition-colors">{member.full_name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">S/O: {member.father_name || '—'}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-semibold">{member.mobile}</td>
                    <td className="px-6 py-4 text-slate-600 font-bold">
                      {member.left_at ? formatDate(member.left_at) : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-red-500 font-black text-sm">₹{(member.loss_amount || 0).toLocaleString('en-IN')}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs max-w-xs truncate font-medium">
                      {member.left_reason || 'No specific reason recorded.'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => openSettleModal(member, e)}
                        className="btn-primary !bg-emerald-600 hover:!bg-emerald-700 !text-white px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 ml-auto shadow-sm"
                      >
                        <span className="material-symbols-outlined text-sm">payments</span>
                        Settle Loss
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══ Detailed Member Case Modal (Double Click Overlay) ═══ */}
      {selectedMember && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-surface-container-lowest/80 backdrop-blur-md flex items-center justify-center p-4 dashboard-light-theme" 
          onClick={() => setSelectedMember(null)}
        >
          <div 
            className="glass-pane-elevated rounded-3xl w-full max-w-lg overflow-hidden animate-scale-in border border-red-500/20" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/[0.06] flex justify-between items-center bg-red-500/[0.03]">
              <h2 className="text-base font-black text-red-400 font-manrope flex items-center gap-2">
                <span className="material-symbols-outlined">account_box</span>
                Defaulter Details & Record
              </h2>
              <button 
                onClick={() => setSelectedMember(null)} 
                className="text-on-surface-variant hover:text-white p-1.5 rounded-lg hover:bg-white/[0.04] transition-all"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Profile Content */}
            <div className="p-6 space-y-6">
              <div className="flex gap-4 items-center border-b border-white/[0.06] pb-4">
                <div className="w-14 h-14 rounded-2xl bg-red-100 border border-red-200 flex items-center justify-center text-red-500 text-xl font-black">
                  {selectedMember.full_name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">{selectedMember.full_name}</h3>
                  <span className="badge badge-danger text-[9px] mt-1 font-bold">{selectedMember.permanent_id}</span>
                </div>
              </div>

              {/* Information Cards Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <InfoItem icon="person" label="Father's Name" value={selectedMember.father_name || 'N/A'} />
                <InfoItem icon="phone" label="Mobile" value={selectedMember.mobile} />
                <InfoItem icon="location_on" label="Address" value={selectedMember.address || 'N/A'} />
                <InfoItem icon="schedule" label="Shift & Plan" value={`${selectedMember.shift} (₹${selectedMember.plan_amount}/mo)`} />
                <InfoItem icon="event" label="DOB & Gender" value={`${selectedMember.dob ? selectedMember.dob.split('T')[0] : 'N/A'} · ${selectedMember.gender || 'N/A'}`} />
                <InfoItem icon="money_off" label="Unpaid Loss Amount" value={`₹${(selectedMember.loss_amount || 0).toLocaleString('en-IN')}`} isDanger={true} />
                <InfoItem icon="today" label="Date Marked Left" value={selectedMember.left_at ? formatDate(selectedMember.left_at) : 'N/A'} />
                <InfoItem icon="description" label="Notes / Reason" value={selectedMember.left_reason || 'N/A'} className="col-span-2" />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-white/[0.06] flex justify-between items-center bg-white/[0.02]">
              <button 
                onClick={() => openSettleModal(selectedMember)}
                className="btn-primary !bg-emerald-600 hover:!bg-emerald-700 !text-white px-5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">payments</span>
                Clear / Pay Loss Fee
              </button>
              <button 
                onClick={() => setSelectedMember(null)}
                className="btn-ghost px-5 py-2 text-xs font-bold rounded-xl border border-slate-300 text-slate-700"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ═══ Settle Loss Payment Modal ═══ */}
      {settleMember && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[10000] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 dashboard-light-theme" 
          onClick={() => !isSettling && setSettleMember(null)}
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in border border-emerald-500/20" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-emerald-50">
              <h2 className="text-base font-black text-emerald-800 font-manrope flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600">price_check</span>
                Clear Loss Payment
              </h2>
              <button 
                disabled={isSettling}
                onClick={() => setSettleMember(null)} 
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-all"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex justify-between items-center">
                <div>
                  <div className="font-bold text-slate-800 text-sm">{settleMember.full_name}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">ID: {settleMember.permanent_id} · Mobile: {settleMember.mobile}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-red-500">Unpaid Loss</div>
                  <div className="text-base font-black text-red-600">₹{(settleMember.loss_amount || 0).toLocaleString('en-IN')}</div>
                </div>
              </div>

              {/* Amount to collect */}
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-600 mb-1 block">
                  Payment Amount Received (₹)
                </label>
                <input
                  type="number"
                  min="1"
                  max={settleMember.loss_amount || undefined}
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  placeholder="Enter amount paid"
                />
              </div>

              {/* Payment Mode & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-600 mb-1 block">
                    Payment Mode
                  </label>
                  <select
                    value={settlePaymentMode}
                    onChange={(e) => setSettlePaymentMode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Online">Online</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-600 mb-1 block">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={settleDate}
                    onChange={(e) => setSettleDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-600 mb-1 block">
                  Remarks / Payment Notes
                </label>
                <input
                  type="text"
                  value={settleNotes}
                  onChange={(e) => setSettleNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. Cleared pending loss fee in cash"
                />
              </div>

              {/* Reactivate checkbox */}
              <div className="bg-emerald-50/50 border border-emerald-200/60 p-3 rounded-xl flex items-center gap-2.5 cursor-pointer select-none" onClick={() => setSettleReactivate(!settleReactivate)}>
                <input 
                  type="checkbox" 
                  checked={settleReactivate} 
                  onChange={(e) => setSettleReactivate(e.target.checked)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer" 
                />
                <div>
                  <div className="text-xs font-bold text-emerald-900">Reactivate Student Membership</div>
                  <div className="text-[9px] text-emerald-700">Re-enroll student into active members directory</div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
              <button 
                disabled={isSettling}
                onClick={() => setSettleMember(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl border border-slate-200"
              >
                Cancel
              </button>
              <button 
                disabled={isSettling}
                onClick={handleConfirmSettle}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center gap-2 shadow-md shadow-emerald-600/20 disabled:opacity-50"
              >
                {isSettling ? <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> : <span className="material-symbols-outlined text-sm">check_circle</span>}
                Confirm Payment
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function InfoItem({ icon, label, value, isDanger, className }: { 
  icon: string; label: string; value: string; isDanger?: boolean; className?: string 
}) {
  return (
    <div className={`bg-white/[0.03] p-3 rounded-xl border border-white/[0.05] ${className || ""}`}>
      <div className="flex items-center gap-1.5 text-[9px] uppercase font-bold text-on-surface-variant tracking-wider mb-1">
        <span className="material-symbols-outlined text-[12px]">{icon}</span>
        {label}
      </div>
      <div className={`text-xs font-semibold ${isDanger ? 'text-red-400 font-bold' : 'text-white'}`}>
        {value}
      </div>
    </div>
  );
}
