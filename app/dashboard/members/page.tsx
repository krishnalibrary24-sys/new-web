"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useBranch } from "@/components/branch-context";
import { supabase } from "@/lib/supabase";
import { useRouter } from 'next/navigation';
import { logActivity } from "@/lib/activity";
import { getLibrarySetting } from "@/lib/settings";

const getMemberStatus = (member: any) => {
  const today = new Date();
  const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const in3Days = new Date(todayZero.getTime() + 3 * 24 * 60 * 60 * 1000);

  if (!member.is_active) {
    return {
      type: 'inactive',
      label: 'Inactive',
      badgeClass: 'bg-slate-500/10 border border-slate-500/20 text-slate-400 font-bold flex items-center gap-1'
    };
  }

  const isExpired = member.subscription_end_date && new Date(member.subscription_end_date) < todayZero;
  const isPayLaterOverdue = member.pay_later === true && member.payment_due_date && new Date(member.payment_due_date) < todayZero;

  if (isExpired || isPayLaterOverdue) {
    return {
      type: 'overdue',
      label: 'Overdue',
      badgeClass: 'badge badge-danger animate-pulse flex items-center gap-1 font-bold'
    };
  }

  if (member.pay_later === true) {
    return {
      type: 'pending',
      label: 'Pending',
      badgeClass: 'bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center gap-1 font-bold'
    };
  }

  if (member.subscription_end_date) {
    const end = new Date(member.subscription_end_date);
    if (end >= todayZero && end <= in3Days) {
      return {
        type: 'due-soon',
        label: 'Due Soon',
        badgeClass: 'bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center gap-1 font-bold'
      };
    }
  }

  if (!member.seat_no) {
    return {
      type: 'active-no-seat',
      label: 'Active (No Seat)',
      badgeClass: 'bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center gap-1 font-bold'
    };
  }

  return {
    type: 'active',
    label: 'Active',
    badgeClass: 'badge badge-success flex items-center gap-1 font-bold'
  };
};

export default function MembersPage() {
  const { activeBranch } = useBranch();
  const branchName = activeBranch === 'namnakala' ? 'Namnakala' : 'Bengali Chowk';
  
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'unreserved' | 'pending' | 'overdue' | 'due-soon'>('active');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name-asc' | 'name-desc' | 'seat-asc' | 'seat-desc'>('newest');
  const router = useRouter();

  // Renewal dynamic pricing states
  const [isRenewingInline, setIsRenewingInline] = useState(false);
  const [renewPrice, setRenewPrice] = useState(1000);
  const [renewDiscount, setRenewDiscount] = useState(0);
  const [renewPaymentMode, setRenewPaymentMode] = useState("Cash");

  // Renewal duration states
  const [renewDuration, setRenewDuration] = useState<number>(1);
  const [renewCustomMonths, setRenewCustomMonths] = useState<string>("");
  const [renewIsCustomDuration, setRenewIsCustomDuration] = useState<boolean>(false);
  const [renewDurationType, setRenewDurationType] = useState<"Months" | "Days">("Months");
  const [renewDurationDays, setRenewDurationDays] = useState<number | "">(30);

  const handleDurationTypeChange = (type: "Months" | "Days") => {
    if (type === renewDurationType) return;
    setRenewDurationType(type);
    const val = Number(renewPrice);
    if (type === "Days") {
      setRenewPrice(Math.round(val / 30));
    } else {
      setRenewPrice(val * 30);
    }
  };

  // Mark as Left states
  const [isMarkingLeft, setIsMarkingLeft] = useState<boolean>(false);
  const [leftWithDues, setLeftWithDues] = useState<boolean>(false);
  const [leftLossAmount, setLeftLossAmount] = useState<number>(0);
  const [leftDate, setLeftDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [leftReason, setLeftReason] = useState<string>("");

  // Display style toggler (tiles vs list)
  const [viewMode, setViewMode] = useState<'tiles' | 'list'>('tiles');

  // Edit Profile States
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [editFullName, setEditFullName] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editFatherName, setEditFatherName] = useState("");
  const [editDob, setEditDob] = useState("");
  const [editGender, setEditGender] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editShift, setEditShift] = useState("");
  const [editSeatNo, setEditSeatNo] = useState("");
  const [editJoiningDate, setEditJoiningDate] = useState("");
  const [editSubscriptionEndDate, setEditSubscriptionEndDate] = useState("");

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('members')
      .select('*')
      .eq('branch', activeBranch)
      .order('created_at', { ascending: false });
    
    if (data) setMembers(data);
    setLoading(false);
  }, [activeBranch]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Reset renewal and left states when selectedMember changes
  useEffect(() => {
    if (selectedMember) {
      const plan = selectedMember.plan_amount || (selectedMember.shift === 'Full Day' ? 1000 : 600);
      setRenewPrice(plan);
      setRenewDiscount(0);
      setRenewPaymentMode("Cash");
      setIsRenewingInline(false);
      
      setRenewDuration(1);
      setRenewCustomMonths("");
      setRenewIsCustomDuration(false);
      setRenewDurationType(selectedMember.permanent_id?.includes('U') ? "Days" : "Months");
      setRenewDurationDays(30);

      setIsMarkingLeft(false);
      setLeftWithDues(false);
      setLeftLossAmount(plan);
      setLeftDate(new Date().toISOString().split('T')[0]);
      setLeftReason("");

      // Initialize Edit Profile states
      setIsEditingProfile(false);
      setEditFullName(selectedMember.full_name || "");
      setEditMobile(selectedMember.mobile || "");
      setEditFatherName(selectedMember.father_name || "");
      setEditDob(selectedMember.dob ? selectedMember.dob.split('T')[0] : "");
      setEditGender(selectedMember.gender || "");
      setEditAddress(selectedMember.address || "");
      setEditShift(selectedMember.shift || "Full Day");
      setEditSeatNo(selectedMember.seat_no || "");
      setEditJoiningDate(selectedMember.joining_date ? selectedMember.joining_date.split('T')[0] : "");
      setEditSubscriptionEndDate(selectedMember.subscription_end_date ? selectedMember.subscription_end_date.split('T')[0] : "");
    }
  }, [selectedMember]);

  const filteredMembers = members.filter(m => {
    const matchesSearch = m.full_name.toLowerCase().includes(search.toLowerCase()) || 
      m.permanent_id.toLowerCase().includes(search.toLowerCase()) ||
      m.mobile.includes(search);
      
    const today = new Date();
    const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const in3Days = new Date(todayZero.getTime() + 3 * 24 * 60 * 60 * 1000);

    const isUnreserved = !!(m.permanent_id && m.permanent_id.includes('U'));
    const isExpired = m.subscription_end_date && new Date(m.subscription_end_date) < todayZero;
    const isPayLaterOverdue = m.pay_later === true && m.payment_due_date && new Date(m.payment_due_date) < todayZero;
    const isOverdue = m.is_active && (isExpired || isPayLaterOverdue);
    
    const isPending = m.is_active && m.pay_later === true && (!m.payment_due_date || new Date(m.payment_due_date) >= todayZero);
    
    const isDueSoon = m.is_active && !isOverdue && !isPending && m.subscription_end_date && (() => {
      const end = new Date(m.subscription_end_date);
      return end >= todayZero && end <= in3Days;
    })();
    
    const isActivePaid = m.is_active && !isOverdue && !isPending && !isUnreserved;

    let matchesFilter = false;
    if (filterStatus === 'all') {
      matchesFilter = true;
    } else if (filterStatus === 'active') {
      matchesFilter = isActivePaid;
    } else if (filterStatus === 'inactive') {
      matchesFilter = !m.is_active && !isUnreserved;
    } else if (filterStatus === 'unreserved') {
      matchesFilter = isUnreserved;
    } else if (filterStatus === 'pending') {
      matchesFilter = isPending;
    } else if (filterStatus === 'overdue') {
      matchesFilter = isOverdue;
    } else if (filterStatus === 'due-soon') {
      matchesFilter = isDueSoon;
    }
    return matchesSearch && matchesFilter;
  }).sort((a, b) => {
    if (sortBy === 'name-asc') return a.full_name.localeCompare(b.full_name);
    if (sortBy === 'name-desc') return b.full_name.localeCompare(a.full_name);
    if (sortBy === 'oldest') return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
    if (sortBy === 'seat-asc' || sortBy === 'seat-desc') {
      const rawA = a.seat_no;
      const rawB = b.seat_no;
      
      // Unassigned/null seats always go to the bottom
      if (!rawA && !rawB) return 0;
      if (!rawA) return 1;
      if (!rawB) return -1;

      // Extract numeric prefix/digits
      const seatA = parseInt(rawA.replace(/\D/g, ''), 10);
      const seatB = parseInt(rawB.replace(/\D/g, ''), 10);
      
      const isNumA = !isNaN(seatA);
      const isNumB = !isNaN(seatB);
      
      if (!isNumA && !isNumB) {
        return sortBy === 'seat-asc' ? rawA.localeCompare(rawB) : rawB.localeCompare(rawA);
      }
      if (!isNumA) return 1;
      if (!isNumB) return -1;
      
      if (seatA !== seatB) {
        return sortBy === 'seat-asc' ? seatA - seatB : seatB - seatA;
      }
      
      // Secondary alphabetical tie-breaker (e.g. "12A" vs "12B")
      return sortBy === 'seat-asc' ? rawA.localeCompare(rawB) : rawB.localeCompare(rawA);
    }
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(); // newest
  });

  const todayVal = new Date();
  const todayZeroVal = new Date(todayVal.getFullYear(), todayVal.getMonth(), todayVal.getDate());
  const in3DaysVal = new Date(todayZeroVal.getTime() + 3 * 24 * 60 * 60 * 1000);

  const activeCount = members.filter(m => {
    const isUnreserved = !!(m.permanent_id && m.permanent_id.includes('U'));
    const isExpired = m.subscription_end_date && new Date(m.subscription_end_date) < todayZeroVal;
    const isPayLaterOverdue = m.pay_later === true && m.payment_due_date && new Date(m.payment_due_date) < todayZeroVal;
    const isOverdue = m.is_active && (isExpired || isPayLaterOverdue);
    const isPending = m.is_active && m.pay_later === true && (!m.payment_due_date || new Date(m.payment_due_date) >= todayZeroVal);
    return m.is_active && !isOverdue && !isPending && !isUnreserved;
  }).length;

  const inactiveCount = members.filter(m => {
    const isUnreserved = !!(m.permanent_id && m.permanent_id.includes('U'));
    return !m.is_active && !isUnreserved;
  }).length;

  const unreservedCount = members.filter(m => m.permanent_id && m.permanent_id.includes('U')).length;

  const pendingCount = members.filter(m => {
    return m.is_active && m.pay_later === true && (!m.payment_due_date || new Date(m.payment_due_date) >= todayZeroVal);
  }).length;

  const overdueCount = members.filter(m => {
    const isExpired = m.subscription_end_date && new Date(m.subscription_end_date) < todayZeroVal;
    const isPayLaterOverdue = m.pay_later === true && m.payment_due_date && new Date(m.payment_due_date) < todayZeroVal;
    return m.is_active && (isExpired || isPayLaterOverdue);
  }).length;

  const dueSoonCount = members.filter(m => {
    const isExpired = m.subscription_end_date && new Date(m.subscription_end_date) < todayZeroVal;
    const isPayLaterOverdue = m.pay_later === true && m.payment_due_date && new Date(m.payment_due_date) < todayZeroVal;
    const isOverdue = m.is_active && (isExpired || isPayLaterOverdue);
    const isPending = m.is_active && m.pay_later === true && (!m.payment_due_date || new Date(m.payment_due_date) >= todayZeroVal);
    if (!m.is_active || isOverdue || isPending || !m.subscription_end_date) return false;
    const end = new Date(m.subscription_end_date);
    return end >= todayZeroVal && end <= in3DaysVal;
  }).length;

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this member? This cannot be undone.")) return;
    setIsActionLoading(true);
    const member = members.find(m => m.id === id);
    await supabase.from('members').delete().eq('id', id);
    if (member) {
      logActivity(activeBranch, "student_delete", `Permanently deleted member: ${member.full_name} (${member.permanent_id})`);
    }
    setMembers(prev => prev.filter(m => m.id !== id));
    setSelectedMember(null);
    setIsActionLoading(false);
  };

  const handleRenew = async (member: any) => {
    setIsActionLoading(true);
    const isDays = renewDurationType === "Days";
    const durationDaysVal = Math.max(1, Number(renewDurationDays) || 30);
    const months = renewIsCustomDuration ? Math.max(1, parseInt(renewCustomMonths) || 1) : renewDuration;
    
    const currentEnd = member.subscription_end_date ? new Date(member.subscription_end_date) : null;
    const today = new Date();
    const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const baseDate = (currentEnd && currentEnd > todayZero) ? currentEnd : todayZero;
    
    const joiningDateStr = baseDate.toISOString().split('T')[0];

    let totalPayable = 0;
    let durationStr = "";
    if (isDays) {
      totalPayable = Math.max(0, (renewPrice * durationDaysVal) - renewDiscount);
      durationStr = `${durationDaysVal} day(s)`;
      baseDate.setDate(baseDate.getDate() + durationDaysVal);
    } else {
      totalPayable = Math.max(0, (renewPrice * months) - renewDiscount);
      durationStr = `${months} month(s)`;
      baseDate.setDate(baseDate.getDate() + (months * 30));
    }
    const newEnd = baseDate;

    let seatToAllot = member.seat_no || null;
    let prevSeatVal = member.previous_seat_no || null;
    
    if (!seatToAllot && prevSeatVal) {
      const { data: occupant } = await supabase
        .from('members')
        .select('id')
        .eq('branch', member.branch)
        .eq('shift', member.shift)
        .eq('seat_no', prevSeatVal)
        .eq('is_active', true)
        .maybeSingle();

      if (!occupant) {
        seatToAllot = prevSeatVal;
        prevSeatVal = null;
      }
    }
    
    const updatedData = { 
      subscription_end_date: newEnd.toISOString(), 
      plan_amount: renewPrice, 
      is_active: true,
      pay_later: false,
      payment_due_date: null,
      left_with_dues: false,
      loss_amount: 0,
      left_at: null,
      left_reason: null,
      seat_no: seatToAllot,
      previous_seat_no: prevSeatVal,
      joining_date: joiningDateStr,
      discount: renewDiscount,
      status: 'ACTIVE',
      payment_status: 'PAID',
      outstanding_dues: 0
    };

    await supabase.from('members').update(updatedData).eq('id', member.id);

    await supabase.from('payments').insert([{
      member_id: member.id,
      amount: totalPayable,
      branch: member.branch,
      payment_mode: renewPaymentMode,
      notes: `Subscription Renewal — Joining: ${new Date(joiningDateStr).toLocaleDateString()}, Expiry: ${newEnd.toLocaleDateString()}. Duration: ${durationStr}. Base Price: ₹${renewPrice}/${isDays ? "day" : "mo"}, Discount: ₹${renewDiscount}`
    }]);

    logActivity(activeBranch, "student_renew", `Renewed subscription for ${member.full_name} (${member.permanent_id}) by ${durationStr}`);

    setMembers(prev => prev.map(m => m.id === member.id ? { ...m, ...updatedData } : m));
    setSelectedMember({ ...member, ...updatedData });
    setIsRenewingInline(false);
    setIsActionLoading(false);
    
    window.open(`/invoice?id=${member.id}`, '_blank');

    const mobile = member.mobile.replace(/[^0-9]/g, '');
    const welcomeTemplate = await getLibrarySetting(
      "welcome_msg",
      "Dear {name},\n\nWelcome to Krishna Library! Your admission is confirmed.\nBranch: {branch}\nSeat No: {seat}\nShift: {shift}\nValid Till: {expiry}\n\nHappy Learning!\nKrishna Library"
    );
    
    const branchLabel = member.branch === 'namnakala' ? 'Namnakala' : 'Bengali Chowk';
    const msg = welcomeTemplate
      .replace(/{name}/g, member.full_name)
      .replace(/{branch}/g, branchLabel)
      .replace(/{seat}/g, member.seat_no || 'Unassigned')
      .replace(/{shift}/g, member.shift)
      .replace(/{expiry}/g, newEnd.toLocaleDateString());

    window.open(`https://wa.me/${mobile}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleMarkLeft = async (member: any) => {
    if (!confirm("Are you sure you want to mark this member as LEFT? This will release their seat.")) return;
    setIsActionLoading(true);
    
    try {
      const leftPayload = {
        is_active: false,
        previous_seat_no: member.seat_no || member.previous_seat_no || null,
        seat_no: null, // Release the seat!
        left_with_dues: leftWithDues,
        loss_amount: leftWithDues ? leftLossAmount : 0,
        left_at: new Date(leftDate).toISOString(),
        left_reason: leftReason || "Member left the library",
        status: 'LEFT',
        payment_status: leftWithDues ? 'LOSS' : 'PAID',
        outstanding_dues: 0
      };

      const { error } = await supabase
        .from('members')
        .update(leftPayload)
        .eq('id', member.id);

      if (error) throw new Error(error.message);

      logActivity(
        activeBranch, 
        "student_left", 
        `Student ${member.permanent_id} marked as LEFT. Active outstanding dues converted to bad-debt loss of ₹${leftWithDues ? leftLossAmount : 0}. Reason: ${leftReason || "Member left the library"}`
      );

      setMembers(prev => prev.map(m => m.id === member.id ? { ...m, ...leftPayload } : m));
      setSelectedMember(null); // Close the profile modal
      setIsMarkingLeft(false);
    } catch (err: any) {
      alert(err.message || "Failed to mark member as left.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!editFullName.trim()) {
      alert("Name is required");
      return;
    }
    if (!editMobile.trim()) {
      alert("Mobile is required");
      return;
    }
    setIsActionLoading(true);
    try {
      const seatVal = editSeatNo.trim() || null;
      if (seatVal) {
        const { data: duplicateSeat } = await supabase
          .from('members')
          .select('id, full_name')
          .eq('branch', activeBranch)
          .eq('shift', editShift)
          .eq('seat_no', seatVal)
          .eq('is_active', true)
          .neq('id', selectedMember.id)
          .maybeSingle();

        if (duplicateSeat) {
          alert(`Seat number ${seatVal} is already occupied by ${duplicateSeat.full_name} in ${editShift} shift.`);
          setIsActionLoading(false);
          return;
        }
      }

      const updatedFields = {
        full_name: editFullName.trim(),
        mobile: editMobile.trim(),
        father_name: editFatherName.trim(),
        dob: editDob ? new Date(editDob).toISOString() : null,
        gender: editGender,
        address: editAddress.trim(),
        shift: editShift,
        seat_no: seatVal,
        joining_date: editJoiningDate ? new Date(editJoiningDate).toISOString().split('T')[0] : null,
        subscription_end_date: editSubscriptionEndDate ? new Date(editSubscriptionEndDate).toISOString() : null,
      };

      const { error } = await supabase
        .from('members')
        .update(updatedFields)
        .eq('id', selectedMember.id);

      if (error) throw error;

      logActivity(activeBranch, "student_update", `Updated profile/subscription for ${editFullName} (${selectedMember.permanent_id})`);

      setMembers(prev => prev.map(m => m.id === selectedMember.id ? { ...m, ...updatedFields } : m));
      setSelectedMember(prev => ({ ...prev, ...updatedFields }));
      setIsEditingProfile(false);
    } catch (err: any) {
      alert(err.message || "Failed to update profile.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleToggleStatus = async (member: any) => {
    setIsActionLoading(true);
    try {
      if (member.is_active) {
        const payload = {
          is_active: false,
          previous_seat_no: member.seat_no || member.previous_seat_no || null,
          seat_no: null,
          status: 'SUSPENDED'
        };
        const { error } = await supabase.from('members').update(payload).eq('id', member.id);
        if (error) throw error;
        logActivity(activeBranch, "student_suspend", `Suspended membership of ${member.full_name} (${member.permanent_id})`);
        setMembers(prev => prev.map(m => m.id === member.id ? { ...m, ...payload } : m));
        setSelectedMember({ ...member, ...payload });
      } else {
        let seatToAllot = null;
        let prevSeatVal = member.previous_seat_no || null;
        
        if (prevSeatVal) {
          const { data: occupant } = await supabase
            .from('members')
            .select('id')
            .eq('branch', member.branch)
            .eq('shift', member.shift)
            .eq('seat_no', prevSeatVal)
            .eq('is_active', true)
            .maybeSingle();

          if (!occupant) {
            seatToAllot = prevSeatVal;
            prevSeatVal = null;
          }
        }
        
        const payload = {
          is_active: true,
          seat_no: seatToAllot,
          previous_seat_no: prevSeatVal,
          status: 'ACTIVE'
        };
        const { error } = await supabase.from('members').update(payload).eq('id', member.id);
        if (error) throw error;
        logActivity(activeBranch, "student_activate", `Re-activated membership of ${member.full_name} (${member.permanent_id})`);
        setMembers(prev => prev.map(m => m.id === member.id ? { ...m, ...payload } : m));
        setSelectedMember({ ...member, ...payload });
      }
    } catch (err: any) {
      alert(err.message || "Failed to toggle member status.");
    } finally {
      setIsActionLoading(false);
    }
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Student Directory</h1>
          <p className="page-subtitle">
            {members.length} total members · {branchName} Branch
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-56 md:flex-none">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-sm">search</span>
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, ID, phone..." 
              className="input-premium !py-2.5 !pl-9 !pr-4 !text-sm !rounded-xl w-full"
            />
          </div>
          <button className="btn-ghost px-4 py-2.5 text-sm flex items-center gap-2 shrink-0">
            <span className="material-symbols-outlined text-base">download</span>
            Export
          </button>
        </div>
      </div>

      {/* Filter Tabs & Sorting */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.04] pb-4">
        <div className="flex gap-2">
          {[
            { key: 'active' as const, label: `Active (${activeCount})` },
            { key: 'inactive' as const, label: `Inactive (${inactiveCount})` },
            { key: 'unreserved' as const, label: `Unreserved (${unreservedCount})` },
            { key: 'pending' as const, label: `Pending (${pendingCount})` },
            { key: 'overdue' as const, label: `Overdue (${overdueCount})` },
            { key: 'due-soon' as const, label: `Due Soon (${dueSoonCount})` },
            { key: 'all' as const, label: `All (${members.length})` },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
                filterStatus === tab.key
                  ? (tab.key === 'overdue' ? 'bg-red-500/15 text-red-400 border-red-500/30 shadow-sm' :
                     tab.key === 'due-soon' ? 'bg-orange-500/15 text-orange-400 border-orange-500/30 shadow-sm' :
                     tab.key === 'pending' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-sm' :
                     'bg-primary/15 text-primary border-primary/20 shadow-sm')
                  : 'bg-white/[0.03] text-on-surface-variant border-white/[0.06] hover:bg-white/[0.06]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-white/[0.02] p-1 rounded-xl border border-white/[0.04] gap-1">
            <button
              onClick={() => setViewMode('tiles')}
              className={`p-1.5 rounded-lg flex items-center justify-center transition-all ${
                viewMode === 'tiles' 
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm font-bold' 
                  : 'text-on-surface-variant/60 hover:text-on-surface-variant'
              }`}
              title="Tiles View"
            >
              <span className="material-symbols-outlined text-base">grid_view</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg flex items-center justify-center transition-all ${
                viewMode === 'list' 
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm font-bold' 
                  : 'text-on-surface-variant/60 hover:text-on-surface-variant'
              }`}
              title="List View"
            >
              <span className="material-symbols-outlined text-base">list</span>
            </button>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 bg-white/[0.02] p-1.5 rounded-xl border border-white/[0.04]">
            <span className="material-symbols-outlined text-on-surface-variant text-sm pl-2">sort</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-slate-800 text-xs font-bold focus:outline-none pr-7 pl-1 cursor-pointer appearance-none [&>option]:bg-white [&>option]:text-slate-800 bg-[url('data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3e%3cpath stroke=%27%23475569%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3e%3c/svg%3e')] bg-[position:right_0.25rem_center] bg-no-repeat bg-[size:1rem_1rem]"
            >
              <option value="newest">Newest Members</option>
              <option value="oldest">Oldest Members</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="seat-asc">Seat (Low to High)</option>
              <option value="seat-desc">Seat (High to Low)</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Responsive Card Grid */}
      <div className="relative min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 z-10 bg-surface/60 backdrop-blur-sm flex items-center justify-center rounded-2xl">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined animate-spin text-2xl text-primary">progress_activity</span>
              <span className="text-sm font-medium text-on-surface-variant">Loading directory...</span>
            </div>
          </div>
        )}

        {filteredMembers.length === 0 && !loading ? (
          <div className="glass-pane-elevated flex flex-col items-center justify-center py-16">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 mb-3">search_off</span>
            <div className="text-white font-bold text-lg mb-1">No Results</div>
            <div className="text-on-surface-variant text-sm">No members match your search criteria.</div>
          </div>
        ) : viewMode === 'tiles' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredMembers.map((member) => (
              <div key={member.id} onClick={() => setSelectedMember(member)} className="glass-pane-elevated !p-5 cursor-pointer group hover:border-primary/30 transition-all hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)]">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center text-[#003178] font-black text-lg shadow-[inset_0_2px_4px_rgba(0,49,120,0.1)]">
                      {member.full_name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-white font-bold text-sm tracking-wide group-hover:text-primary transition-colors">{member.full_name}</div>
                      <span className="badge badge-info text-[9px] mt-1 tracking-widest">{member.permanent_id}</span>
                    </div>
                  </div>
                  {(() => {
                    const status = getMemberStatus(member);
                    return (
                      <span className={status.badgeClass}>
                        {status.type === 'overdue' && <span className="material-symbols-outlined text-[12px]">warning</span>}
                        {status.type === 'due-soon' && <span className="material-symbols-outlined text-[12px]">schedule</span>}
                        {status.type === 'pending' && <span className="material-symbols-outlined text-[12px]">payments</span>}
                        {status.type === 'active-no-seat' && <span className="material-symbols-outlined text-[12px]">event_seat</span>}
                        {status.type === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                        {status.label}
                      </span>
                    );
                  })()}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                  <div className="bg-white/[0.03] p-3 rounded-xl border border-white/[0.05]">
                    <div className="flex items-center gap-1.5 text-[10px] text-on-surface-variant uppercase tracking-widest mb-1 font-bold">
                      <span className="material-symbols-outlined text-[14px]">event_seat</span>
                      Seat
                    </div>
                    <div className="font-black text-white text-sm">{member.seat_no || '—'}</div>
                  </div>
                  <div className="bg-white/[0.03] p-3 rounded-xl border border-white/[0.05]">
                    <div className="flex items-center gap-1.5 text-[10px] text-on-surface-variant uppercase tracking-widest mb-1 font-bold">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      Shift
                    </div>
                    <div className="font-black text-white text-sm truncate">{member.shift}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-white/[0.06] pt-3">
                  <div className="text-on-surface-variant text-xs font-medium">{member.mobile}</div>
                  <a href={`https://wa.me/${member.mobile.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all text-sm border border-emerald-500/20">
                    <span className="material-symbols-outlined text-sm">chat</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-pane-elevated !p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap table-premium">
                <thead>
                  <tr className="border-b border-[#e2e8f0]">
                    <th className="px-6 py-4 font-bold text-xs uppercase text-slate-500">ID</th>
                    <th className="px-6 py-4 font-bold text-xs uppercase text-slate-500">Name & Contact</th>
                    <th className="px-6 py-4 font-bold text-xs uppercase text-slate-500">Seat & Shift</th>
                    <th className="px-6 py-4 font-bold text-xs uppercase text-slate-500">Status</th>
                    <th className="px-6 py-4 font-bold text-xs uppercase text-slate-500">Validity</th>
                    <th className="px-6 py-4 font-bold text-xs uppercase text-slate-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member) => (
                    <tr key={member.id} onClick={() => setSelectedMember(member)} className="cursor-pointer hover:bg-slate-50 transition-colors group animate-fade-in-fast">
                      <td className="px-6 py-4 border-b border-[#f1f5f9]">
                        <span className="badge badge-info">{member.permanent_id}</span>
                      </td>
                      <td className="px-6 py-4 border-b border-[#f1f5f9]">
                        <div className="font-bold text-slate-800">{member.full_name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{member.mobile}</div>
                      </td>
                      <td className="px-6 py-4 border-b border-[#f1f5f9]">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-md bg-emerald-500/15 text-emerald-500 flex items-center justify-center font-bold text-xs border border-emerald-500/20">
                            {member.seat_no || '—'}
                          </span>
                          <span className="text-slate-600 text-xs font-semibold">{member.shift}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 border-b border-[#f1f5f9]">
                          {(() => {
                            const status = getMemberStatus(member);
                            return (
                              <span className={status.badgeClass}>
                                {status.type === 'overdue' && <span className="material-symbols-outlined text-[10px]">warning</span>}
                                {status.type === 'due-soon' && <span className="material-symbols-outlined text-[10px]">schedule</span>}
                                {status.type === 'pending' && <span className="material-symbols-outlined text-[10px]">payments</span>}
                                {status.type === 'active-no-seat' && <span className="material-symbols-outlined text-[10px]">event_seat</span>}
                                {status.type === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                                {status.label}
                              </span>
                            );
                          })()}
                      </td>
                      <td className="px-6 py-4 border-b border-[#f1f5f9]">
                        <div className="text-xs font-bold text-[#003178]">
                          {new Date(member.subscription_end_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 border-b border-[#f1f5f9] text-right">
                        <a 
                          href={`https://wa.me/${member.mobile.replace(/[^0-9]/g, '')}`} 
                          target="_blank" rel="noreferrer" 
                          onClick={(e) => e.stopPropagation()} 
                          className="inline-flex w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-400 items-center justify-center hover:bg-emerald-500 hover:text-white transition-all text-sm border border-emerald-500/20"
                        >
                          <span className="material-symbols-outlined text-sm">chat</span>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ═══ Member Profile Modal ═══ */}
      {selectedMember && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] bg-surface-container-lowest/80 backdrop-blur-md flex items-center justify-center p-4 dashboard-light-theme" onClick={() => setSelectedMember(null)}>
          <div className="glass-pane-elevated rounded-3xl w-full max-w-2xl overflow-hidden animate-scale-in max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/[0.06] flex justify-between items-center bg-white/[0.02]">
              <h2 className="text-lg font-bold text-white font-manrope">Member Profile</h2>
              <button onClick={() => setSelectedMember(null)} className="text-on-surface-variant hover:text-white p-1.5 rounded-lg hover:bg-white/[0.04] transition-all">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1" data-lenis-prevent="true">
              <div className="flex gap-5 items-start mb-6 pb-6 border-b border-white/[0.06]">
                <div className="w-16 h-16 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center text-[#003178] text-2xl font-bold shrink-0">
                  {selectedMember.full_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-4 flex-wrap">
                    <div>
                      <h3 className="text-xl font-bold text-white">{selectedMember.full_name}</h3>
                      <p className="text-primary font-semibold text-sm mt-0.5">{selectedMember.permanent_id}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      {(() => {
                        const status = getMemberStatus(selectedMember);
                        return (
                          <span className={status.badgeClass}>
                            {status.type === 'overdue' && <span className="material-symbols-outlined text-[12px]">warning</span>}
                            {status.type === 'due-soon' && <span className="material-symbols-outlined text-[12px]">schedule</span>}
                            {status.type === 'pending' && <span className="material-symbols-outlined text-[12px]">payments</span>}
                            {status.type === 'active-no-seat' && <span className="material-symbols-outlined text-[12px]">event_seat</span>}
                            {status.type === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                            {status.label}
                          </span>
                        );
                      })()}
                      {/* Pay Later badge removed */}
                      <span className="text-[10px] text-on-surface-variant font-medium">
                        Valid till: {new Date(selectedMember.subscription_end_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {isEditingProfile ? (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm bg-white/[0.01] p-4 rounded-2xl border border-white/[0.04]">
                      <div className="space-y-1">
                        <label className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Full Name</label>
                        <input
                          type="text"
                          value={editFullName}
                          onChange={(e) => setEditFullName(e.target.value)}
                          className="input-premium !py-1.5 !text-xs w-full"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Mobile</label>
                        <input
                          type="text"
                          value={editMobile}
                          onChange={(e) => setEditMobile(e.target.value)}
                          className="input-premium !py-1.5 !text-xs w-full"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Father's Name</label>
                        <input
                          type="text"
                          value={editFatherName}
                          onChange={(e) => setEditFatherName(e.target.value)}
                          className="input-premium !py-1.5 !text-xs w-full"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">DOB</label>
                        <input
                          type="date"
                          value={editDob}
                          onChange={(e) => setEditDob(e.target.value)}
                          className="input-premium !py-1.5 !text-xs w-full"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Gender</label>
                        <select
                          value={editGender}
                          onChange={(e) => setEditGender(e.target.value)}
                          className="input-premium !py-1.5 !text-xs w-full appearance-none [&>option]:bg-white [&>option]:text-slate-800"
                        >
                          <option value="">Select</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Address</label>
                        <input
                          type="text"
                          value={editAddress}
                          onChange={(e) => setEditAddress(e.target.value)}
                          className="input-premium !py-1.5 !text-xs w-full"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Assigned Seat</label>
                        <input
                          type="text"
                          placeholder="e.g. 42"
                          value={editSeatNo}
                          onChange={(e) => setEditSeatNo(e.target.value)}
                          className="input-premium !py-1.5 !text-xs w-full"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Shift</label>
                        <select
                          value={editShift}
                          onChange={(e) => setEditShift(e.target.value)}
                          className="input-premium !py-1.5 !text-xs w-full appearance-none [&>option]:bg-white [&>option]:text-slate-800"
                        >
                          <option value="Full Day">Full Day</option>
                          <option value="Morning">Morning</option>
                          <option value="Evening">Evening</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Joining Date</label>
                        <input
                          type="date"
                          value={editJoiningDate}
                          onChange={(e) => setEditJoiningDate(e.target.value)}
                          className="input-premium !py-1.5 !text-xs w-full"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Validity Expiry Date</label>
                        <input
                          type="date"
                          value={editSubscriptionEndDate}
                          onChange={(e) => setEditSubscriptionEndDate(e.target.value)}
                          className="input-premium !py-1.5 !text-xs w-full"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                      <InfoField label="Father's Name" value={selectedMember.father_name || 'N/A'} />
                      <InfoField label="Mobile" value={selectedMember.mobile} />
                      <InfoField label="DOB / Gender" value={`${selectedMember.dob ? selectedMember.dob.split('T')[0] : 'N/A'} / ${selectedMember.gender || 'N/A'}`} />
                      <InfoField label="Address" value={selectedMember.address || 'N/A'} />
                      <InfoField label="Assigned Seat" value={selectedMember.seat_no ? `Seat ${selectedMember.seat_no}` : 'Not Allocated'} />
                      <InfoField label="Shift" value={selectedMember.shift || 'N/A'} />
                      <InfoField label="Joining Date" value={selectedMember.joining_date ? new Date(selectedMember.joining_date).toLocaleDateString() : 'N/A'} />
                    </div>
                  )}
                </div>
              </div>

              {/* Transaction Ledger */}
              <h4 className="text-xs font-bold text-on-surface-variant mb-3 uppercase tracking-widest">Last Payment</h4>
              <div className="bg-white/[0.03] border border-white/[0.04] rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/[0.03] text-on-surface-variant text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5">Amount</th>
                      <th className="px-4 py-2.5">Plan</th>
                      <th className="px-4 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-white">
                    <tr>
                      <td className="px-4 py-3 border-t border-white/[0.04]">{selectedMember.created_at.split('T')[0]}</td>
                      <td className="px-4 py-3 border-t border-white/[0.04] font-bold">₹{selectedMember.plan_amount}</td>
                      <td className="px-4 py-3 border-t border-white/[0.04]">{selectedMember.shift}</td>
                      <td className="px-4 py-3 border-t border-white/[0.04]"><span className="badge badge-success">Paid</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Dynamic Renewal Options Expandable Card */}
              {/* Dynamic Renewal Options Expandable Card */}
              {isRenewingInline && (
                <div className="mt-5 p-5 rounded-2xl bg-white/[0.02] border border-[#fdac29]/20 space-y-4 animate-fade-in-fast">
                  <div className="flex items-center gap-2 text-[#fdac29] text-xs font-bold uppercase tracking-wider">
                    <span className="material-symbols-outlined text-base">payments</span>
                    Renewal Payment Customization
                  </div>
                  
                  {/* Duration Period Type */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-on-surface-variant">Duration Period Type</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleDurationTypeChange("Months")}
                        className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all border ${
                          renewDurationType === "Months"
                            ? "bg-[#1e40af] text-white border-[#1e40af]"
                            : "bg-slate-200 hover:bg-slate-300 text-slate-800 border-slate-300"
                        }`}
                      >
                        Months System
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDurationTypeChange("Days")}
                        className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all border ${
                          renewDurationType === "Days"
                            ? "bg-[#1e40af] text-white border-[#1e40af]"
                            : "bg-slate-200 hover:bg-slate-300 text-[#003178] border-[#003178]"
                        }`}
                      >
                        Days System
                      </button>
                    </div>
                  </div>

                  {/* Membership Duration Selection */}
                  {renewDurationType === "Months" ? (
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-on-surface-variant block">Membership Duration (Months)</label>
                      <div className="grid grid-cols-5 gap-1.5">
                        {[1, 3, 6, 12].map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => {
                              setRenewDuration(m);
                              setRenewIsCustomDuration(false);
                            }}
                            className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all border ${
                              !renewIsCustomDuration && renewDuration === m
                                ? "bg-[#1e40af] text-white border-[#1e40af] shadow-md"
                                : "bg-slate-200 hover:bg-slate-300 text-slate-800 border-slate-300"
                            }`}
                          >
                            {m}M
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setRenewIsCustomDuration(true)}
                          className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all border ${
                            renewIsCustomDuration
                              ? "bg-[#1e40af] text-white border-[#1e40af] shadow-md"
                              : "bg-slate-200 hover:bg-slate-300 text-slate-800 border-slate-300"
                          }`}
                        >
                          Custom
                        </button>
                      </div>
                      {renewIsCustomDuration && (
                        <div className="max-w-[150px] mt-1.5">
                          <input
                            type="number"
                            min="1"
                            value={renewCustomMonths}
                            onChange={(e) => setRenewCustomMonths(e.target.value)}
                            className="input-premium !py-1.5 !text-xs w-full"
                            placeholder="Enter months..."
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-on-surface-variant block">Membership Duration (Days)</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={renewDurationDays}
                        onChange={(e) => setRenewDurationDays(e.target.value === "" ? "" : Math.max(1, Number(e.target.value)))}
                        className="input-premium !py-1.5 !text-xs max-w-[150px]"
                        placeholder="e.g. 15"
                      />
                    </div>
                  )}

                  {/* Pricing Configurations */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-on-surface-variant mb-1 block">
                        Base Price (₹/{renewDurationType === "Days" ? "day" : "mo"})
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={renewPrice}
                        onChange={(e) => setRenewPrice(Math.max(0, Number(e.target.value)))}
                        className="input-premium !py-2 !text-sm w-full"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-on-surface-variant mb-1 block">Total Discount (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={renewDiscount}
                        onChange={(e) => setRenewDiscount(Math.max(0, Number(e.target.value)))}
                        className="input-premium !py-2 !text-sm w-full"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-on-surface-variant mb-1 block">Payment Mode</label>
                      <select
                        disabled={isActionLoading}
                        value={renewPaymentMode}
                        onChange={(e) => setRenewPaymentMode(e.target.value)}
                        className="input-premium !py-2 !text-sm w-full appearance-none [&>option]:bg-white [&>option]:text-slate-800 disabled:opacity-50"
                      >
                        <option value="Cash">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="Card">Card</option>
                        <option value="Online">Online</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-between items-center bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl text-xs mt-2">
                    <span className="text-on-surface-variant">
                      {renewDurationType === "Days" ? (
                        <>Calculated: ₹{renewPrice.toLocaleString('en-IN')}/day * {renewDurationDays || '30'} day(s) - ₹{renewDiscount.toLocaleString('en-IN')}</>
                      ) : (
                        <>Calculated: ₹{renewPrice.toLocaleString('en-IN')}/mo * {renewIsCustomDuration ? (renewCustomMonths || '1') : renewDuration} month(s) - ₹{renewDiscount.toLocaleString('en-IN')}</>
                      )}
                    </span>
                    <span className="font-bold text-emerald-400">
                      {renewDurationType === "Days" ? (
                        <span>Final Price: ₹{Math.max(0, (renewPrice * (Number(renewDurationDays) || 30)) - renewDiscount).toLocaleString('en-IN')}</span>
                      ) : (
                        <span>Final Price: ₹{Math.max(0, (renewPrice * (renewIsCustomDuration ? (parseInt(renewCustomMonths) || 1) : renewDuration)) - renewDiscount).toLocaleString('en-IN')}</span>
                      )}
                    </span>
                  </div>
                </div>
              )}

              {/* Mark as Left sub-form */}
              {isMarkingLeft && (
                <div className="mt-5 p-5 rounded-2xl bg-white/[0.02] border border-red-500/20 space-y-4 animate-fade-in-fast">
                  <div className="flex items-center gap-2 text-red-400 text-xs font-bold uppercase tracking-wider">
                    <span className="material-symbols-outlined text-base">directions_run</span>
                    Mark Member as Left (Release Seat)
                  </div>
                  
                  {/* Left Date and Reason */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-on-surface-variant mb-1 block">Left Date</label>
                      <input
                        type="date"
                        value={leftDate}
                        onChange={(e) => setLeftDate(e.target.value)}
                        className="input-premium !py-2 !text-sm w-full"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-on-surface-variant mb-1 block">Left Reason / Notes</label>
                      <input
                        type="text"
                        value={leftReason}
                        onChange={(e) => setLeftReason(e.target.value)}
                        className="input-premium !py-2 !text-sm w-full"
                        placeholder="e.g. Finished exams / shifted out"
                      />
                    </div>
                  </div>

                  {/* Left with Unpaid Dues? (Loss Payment) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div 
                      className={`flex items-center gap-2 border p-3 rounded-xl transition-all cursor-pointer select-none ${
                        leftWithDues 
                          ? 'bg-red-500/10 border-red-500/30' 
                          : 'bg-slate-200 hover:bg-slate-300 border-slate-300'
                      }`}
                      onClick={() => setLeftWithDues(!leftWithDues)}
                    >
                      <input
                        type="checkbox"
                        checked={leftWithDues}
                        onChange={(e) => setLeftWithDues(e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded text-red-500 focus:ring-red-500 border-slate-300 cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">Left with Unpaid Dues (Loss)</span>
                        <span className="text-[9px] text-slate-500">Record unpaid fees as loss</span>
                      </div>
                    </div>
                    
                    {leftWithDues && (
                      <div className="animate-scale-in">
                        <label className="text-[10px] uppercase font-bold text-on-surface-variant mb-1 block">Outstanding Dues (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={leftLossAmount}
                          onChange={(e) => setLeftLossAmount(Math.max(0, Number(e.target.value)))}
                          className="input-premium !py-2 !text-sm w-full"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 border-t border-white/[0.06] flex flex-wrap gap-3 bg-white/[0.02]">
              {isEditingProfile ? (
                <>
                  <button disabled={isActionLoading} onClick={() => setIsEditingProfile(false)} className="btn-ghost px-4 py-2.5 disabled:opacity-50 text-xs font-bold border border-slate-300 text-slate-700 hover:bg-slate-50">
                    Cancel
                  </button>
                  <button disabled={isActionLoading} onClick={handleUpdateProfile} className="btn-primary px-4 py-2.5 flex-1 flex justify-center items-center gap-2 disabled:opacity-50 text-xs font-bold">
                    {isActionLoading ? <span className="material-symbols-outlined animate-spin text-base">progress_activity</span> : null}
                    Save Changes
                  </button>
                </>
              ) : !isRenewingInline && !isMarkingLeft ? (
                <>
                  <button disabled={isActionLoading} onClick={() => handleDelete(selectedMember.id)} className="btn-danger px-4 py-2.5 disabled:opacity-50 flex items-center gap-2 text-xs font-bold">
                    <span className="material-symbols-outlined text-base">delete</span>
                    Delete
                  </button>
                  <button disabled={isActionLoading} onClick={() => handleToggleStatus(selectedMember)} className="btn-ghost px-4 py-2.5 disabled:opacity-50 text-[#1e40af] border border-[#1e40af]/30 hover:bg-[#1e40af]/5 text-xs font-bold flex justify-center items-center gap-1.5">
                    <span className="material-symbols-outlined text-base">{selectedMember.is_active ? 'toggle_off' : 'toggle_on'}</span>
                    {selectedMember.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button disabled={isActionLoading} onClick={() => setIsMarkingLeft(true)} className="btn-ghost px-4 py-2.5 disabled:opacity-50 text-red-500 border border-red-500/20 hover:bg-red-500/10 text-xs font-bold flex justify-center items-center gap-1">
                    <span className="material-symbols-outlined text-base">directions_run</span>
                    Mark as Left
                  </button>
                  <button disabled={isActionLoading} onClick={() => setIsEditingProfile(true)} className="btn-ghost px-4 py-2.5 disabled:opacity-50 text-xs font-bold border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">edit</span>
                    Edit Profile
                  </button>
                  <button disabled={isActionLoading} onClick={() => {
                    setSelectedMember(null);
                    router.push(`/dashboard/admission?edit=${selectedMember.id}`);
                  }} className="btn-ghost px-4 py-2.5 disabled:opacity-50 text-xs font-bold border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">app_registration</span>
                    Edit in Admission
                  </button>
                  <button disabled={isActionLoading} onClick={() => setIsRenewingInline(true)} className="btn-primary px-4 py-2.5 flex-1 flex justify-center items-center gap-2 disabled:opacity-50 text-xs font-bold">
                    Renew Subscription
                  </button>
                </>
              ) : isRenewingInline ? (
                <>
                  <button disabled={isActionLoading} onClick={() => setIsRenewingInline(false)} className="btn-ghost px-4 py-2.5 disabled:opacity-50 text-xs font-bold">
                    Cancel
                  </button>
                  <button disabled={isActionLoading} onClick={() => handleRenew(selectedMember)} className="btn-primary px-4 py-2.5 flex-1 flex justify-center items-center gap-2 disabled:opacity-50 text-xs font-bold">
                    {isActionLoading ? <span className="material-symbols-outlined animate-spin text-base">progress_activity</span> : null}
                    Confirm Renewal & Print
                  </button>
                </>
              ) : (
                <>
                  <button disabled={isActionLoading} onClick={() => setIsMarkingLeft(false)} className="btn-ghost px-4 py-2.5 disabled:opacity-50 text-xs font-bold">
                    Cancel
                  </button>
                  <button disabled={isActionLoading} onClick={() => handleMarkLeft(selectedMember)} className="btn-danger px-4 py-2.5 flex-1 flex justify-center items-center gap-2 disabled:opacity-50 text-xs font-bold">
                    {isActionLoading ? <span className="material-symbols-outlined animate-spin text-base">progress_activity</span> : null}
                    Confirm Member Left
                  </button>
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider mb-0.5">{label}</div>
      <div className="text-white text-sm truncate">{value}</div>
    </div>
  );
}
