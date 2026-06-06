"use client";
import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useBranch } from "@/components/branch-context";
import { supabase } from "@/lib/supabase";
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { logActivity } from "@/lib/activity";

function RecordPaymentInner() {
  const { activeBranch } = useBranch();
  const branchLabel = activeBranch === 'namnakala' ? 'Namnakala' : 'Bangali Chowk';
  const searchParams = useSearchParams();
  const router = useRouter();
  const memberIdParam = searchParams.get('memberId');

  // Search & Student List States
  const [searchQuery, setSearchQuery] = useState("");
  const [allMembers, setAllMembers] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Student Details Modal States
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [modalMember, setModalMember] = useState<any | null>(null);

  // Payments Ledger State
  const [paymentsHistory, setPaymentsHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Payment Form States
  const [purpose, setPurpose] = useState<"dues" | "renewal">("renewal");
  const [extendMembershipInDues, setExtendMembershipInDues] = useState<boolean>(false);
  const [amount, setAmount] = useState<number | "">("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [paidAtDate, setPaidAtDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState("");

  // Pricing & Duration configuration states (shifted from admission)
  const [basePrice, setBasePrice] = useState<number | "">(1000);
  const [discount, setDiscount] = useState<number | "">("");
  const [renewDuration, setRenewDuration] = useState<number>(1);
  const [renewCustomMonths, setRenewCustomMonths] = useState<string>("");
  const [renewIsCustomDuration, setRenewIsCustomDuration] = useState<boolean>(false);
  const [renewDurationType, setRenewDurationType] = useState<"Months" | "Days">("Months");
  const [renewDurationDays, setRenewDurationDays] = useState<number | "">(30);
  const [renewShift, setRenewShift] = useState<string>("Full Day");

  // Auto-scale price on switching duration type
  const handleDurationTypeChange = (type: "Months" | "Days") => {
    if (type === renewDurationType) return;
    setRenewDurationType(type);
    if (basePrice !== "") {
      const val = Number(basePrice);
      if (type === "Days") {
        setBasePrice(Math.round(val / 30));
      } else {
        setBasePrice(val * 30);
      }
    }
  };

  // Form submitting status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [customExpiryDate, setCustomExpiryDate] = useState<string>("");
  const [payLater, setPayLater] = useState<boolean>(false);
  const [dueDate, setDueDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });

  // Fetch all members of this branch
  const fetchAllMembers = useCallback(async () => {
    setLoadingMembers(true);
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('branch', activeBranch)
      .order('full_name', { ascending: true });

    if (data) {
      setAllMembers(data);
    }
    setLoadingMembers(false);
  }, [activeBranch]);

  // Load members on mount and branch changes
  useEffect(() => {
    fetchAllMembers();
  }, [fetchAllMembers]);

  // Auto-select member if query param is present
  useEffect(() => {
    if (memberIdParam && allMembers.length > 0) {
      const matched = allMembers.find(m => m.id === memberIdParam);
      if (matched) {
        setSelectedMember(matched);
      } else {
        // Fallback fetch if not loaded in branch list
        const fetchMemberById = async () => {
          const { data } = await supabase
            .from('members')
            .select('*')
            .eq('id', memberIdParam)
            .maybeSingle();
          if (data) {
            setSelectedMember(data);
          }
        };
        fetchMemberById();
      }
    }
  }, [memberIdParam, allMembers]);

  // Fetch selected member's payments history
  const fetchPaymentsHistory = useCallback(async (memberId: string) => {
    setHistoryLoading(true);
    const { data } = await supabase
      .from('payments')
      .select('*')
      .eq('member_id', memberId)
      .order('paid_at', { ascending: false });
    
    if (data) {
      setPaymentsHistory(data);
    } else {
      setPaymentsHistory([]);
    }
    setHistoryLoading(false);
  }, []);

  // Fetch history and set defaults when a member is selected
  useEffect(() => {
    if (selectedMember) {
      fetchPaymentsHistory(selectedMember.id);
      
      const isUnreservedMember = selectedMember.permanent_id?.includes('U');
      const defaultPrice = (selectedMember.plan_amount && Number(selectedMember.plan_amount) > 0)
        ? Number(selectedMember.plan_amount)
        : (selectedMember.shift === 'Full Day' ? 1000 : 600);
      
      setRenewDurationType(isUnreservedMember ? "Days" : "Months");
      if (isUnreservedMember) {
        setBasePrice(Math.round(defaultPrice / 30));
      } else {
        setBasePrice(defaultPrice);
      }
      setRenewShift(selectedMember.shift || "Full Day");
      setDiscount("");
      setSuccessMsg(null);
      setErrorMsg(null);
      setRenewDuration(1);
      setRenewCustomMonths("");
      setRenewIsCustomDuration(false);
      setRenewDurationDays(30);
      setPayLater(false);
      if (selectedMember.payment_due_date) {
        setDueDate(selectedMember.payment_due_date);
      } else {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setDueDate(tomorrow.toISOString().split('T')[0]);
      }
    }
  }, [selectedMember, fetchPaymentsHistory]);

  // Calculated Pricing values
  const basePriceVal = Number(basePrice) || 0;
  const discountVal = Number(discount) || 0;
  const isUnreserved = selectedMember?.permanent_id?.includes('U');
  
  const finalDurationType = renewDurationType;
  const durationMonths = renewIsCustomDuration ? Math.max(1, parseInt(renewCustomMonths) || 1) : renewDuration;
  const durationDaysVal = Math.max(1, Number(renewDurationDays) || 30);

  const showDurationPicker = purpose === "renewal" || (purpose === "dues" && extendMembershipInDues);

  const calculatedTotal = showDurationPicker
    ? (finalDurationType === "Days"
        ? Math.max(0, (basePriceVal * durationDaysVal) - discountVal)
        : Math.max(0, (basePriceVal * durationMonths) - discountVal))
    : Math.max(0, basePriceVal - discountVal);

  const dueBalance = Math.max(0, calculatedTotal - (Number(amount) || 0));

  // Synchronize extendMembershipInDues when purpose changes
  useEffect(() => {
    if (purpose === "renewal") {
      setExtendMembershipInDues(false);
    } else if (purpose === "dues") {
      setExtendMembershipInDues(true);
    }
  }, [purpose]);

  // Load invoice-based due amount when purpose changes to dues
  useEffect(() => {
    if (!selectedMember) return;
    let active = true;
    
    if (purpose === "dues") {
      if (extendMembershipInDues) {
        const defaultPrice = (selectedMember.plan_amount && Number(selectedMember.plan_amount) > 0)
          ? Number(selectedMember.plan_amount)
          : (selectedMember.shift === 'Full Day' ? 1000 : 600);
          
        if (renewDurationType === "Days") {
          setBasePrice(Math.round(defaultPrice / 30));
        } else {
          setBasePrice(defaultPrice);
        }
      } else {
        const getDuesAmount = async () => {
          const { data } = await supabase
            .from('invoices')
            .select('due_amount')
            .eq('member_id', selectedMember.id)
            .gt('due_amount', 0)
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();
            
          if (!active) return;
          if (data) {
            setBasePrice(data.due_amount);
          } else {
            setBasePrice(0);
          }
        };
        getDuesAmount();
      }
    } else {
      const defaultPrice = (selectedMember.plan_amount && Number(selectedMember.plan_amount) > 0)
        ? Number(selectedMember.plan_amount)
        : (selectedMember.shift === 'Full Day' ? 1000 : 600);
        
      if (renewDurationType === "Days") {
        setBasePrice(Math.round(defaultPrice / 30));
      } else {
        setBasePrice(defaultPrice);
      }
    }
    setDiscount("");

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purpose, selectedMember, extendMembershipInDues]);

  // Auto-sync computed total to Amount Paid
  useEffect(() => {
    setAmount(calculatedTotal);
  }, [calculatedTotal]);

  // Force payLater to false if purpose is dues (unless extending validity)
  useEffect(() => {
    if (purpose === "dues" && !extendMembershipInDues) {
      setPayLater(false);
    }
  }, [purpose, extendMembershipInDues]);

  // Sync customExpiryDate when student, purpose, duration type, or extendMembership changes
  useEffect(() => {
    if (!selectedMember) return;
    const currentEnd = selectedMember.subscription_end_date ? new Date(selectedMember.subscription_end_date) : new Date();
    // If they already expired or don't have an expiry date, we start from today.
    const baseDate = currentEnd < new Date() ? new Date() : new Date(currentEnd);

    if (finalDurationType === "Days") {
      baseDate.setDate(baseDate.getDate() + durationDaysVal);
    } else {
      baseDate.setMonth(baseDate.getMonth() + durationMonths);
    }
    setCustomExpiryDate(baseDate.toISOString().split('T')[0]);
  }, [selectedMember, finalDurationType, durationDaysVal, durationMonths, purpose, extendMembershipInDues]);

  // Sync dueDate to customExpiryDate when customExpiryDate changes (for partial payment setups)
  useEffect(() => {
    if (showDurationPicker && customExpiryDate) {
      setDueDate(customExpiryDate);
    }
  }, [showDurationPicker, customExpiryDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    setIsSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const amountVal = payLater ? 0 : (Number(amount) || 0);
      if (!payLater && amountVal > calculatedTotal) {
        throw new Error(`Amount paid (₹${amountVal}) cannot exceed the total payable amount (₹${calculatedTotal}). To charge less, use a discount instead.`);
      }
      let notesText = notes.trim();

      let finalNewEnd: Date | null = null;
      let durationStr = "";

      const isRenewalAction = purpose === "renewal" || (purpose === "dues" && extendMembershipInDues);

      if (isRenewalAction) {
        if (!customExpiryDate) {
          throw new Error("Please specify a valid expiry date.");
        }
        finalNewEnd = new Date(customExpiryDate);
        if (isNaN(finalNewEnd.getTime())) {
          throw new Error("Invalid expiry date format.");
        }

        // Prevent duplicate payment for already paid subscription period
        if (selectedMember.subscription_end_date) {
          const currentEnd = new Date(selectedMember.subscription_end_date);
          const currentEndZero = new Date(currentEnd.getFullYear(), currentEnd.getMonth(), currentEnd.getDate());
          const finalNewEndZero = new Date(finalNewEnd.getFullYear(), finalNewEnd.getMonth(), finalNewEnd.getDate());
          if (finalNewEndZero <= currentEndZero) {
            throw new Error(`This member's subscription is already active until ${currentEnd.toLocaleDateString()}. The new renewal expiry must be after this date to prevent duplicate payments.`);
          }
        }

        if (finalDurationType === "Days") {
          durationStr = `${durationDaysVal} day(s)`;
        } else {
          durationStr = `${durationMonths} month(s)`;
        }

        if (!notesText) {
          notesText = payLater
            ? `Subscription Renewal (Deferred / Pay Later) — Expiry: ${finalNewEnd.toLocaleDateString()}. Duration: ${durationStr}. Base Plan: ₹${basePriceVal}/${finalDurationType === "Days" ? "day" : "mo"}. Discount: ₹${discountVal}.`
            : `Subscription Renewal — Expiry: ${finalNewEnd.toLocaleDateString()}. Duration: ${durationStr}. Base Plan: ₹${basePriceVal}/${finalDurationType === "Days" ? "day" : "mo"}. Discount: ₹${discountVal}. Amount Paid: ₹${amountVal}`;
        }
      } else {
        if (!notesText) {
          notesText = discountVal > 0
            ? `Dues/Partial Payment — Amount Paid: ₹${amountVal}, Discount: ₹${discountVal}.`
            : `Dues/Partial Payment — Amount Paid: ₹${amountVal}`;
        }
      }

      // 1. Create/Update Invoice & get invoiceId
      let invoiceId: string | null = null;
      const dueBalance = isRenewalAction ? Math.max(0, calculatedTotal - amountVal) : 0;

      if (isRenewalAction) {
        const { data: invoiceData, error: invoiceErr } = await supabase
          .from('invoices')
          .insert([{
            member_id: selectedMember.id,
            total_amount: calculatedTotal,
            paid_amount: amountVal,
            due_amount: dueBalance,
            status: amountVal === 0 ? 'unpaid' : (dueBalance === 0 ? 'paid' : 'partially_paid'),
            due_date: dueBalance > 0 ? dueDate : null
          }])
          .select()
          .single();

        if (invoiceErr) throw new Error(invoiceErr.message);
        if (invoiceData) invoiceId = invoiceData.id;
      } else {
        // For Dues Payment, pay towards the oldest active invoice with pending dues
        const { data: pendingInvoices, error: pendingErr } = await supabase
          .from('invoices')
          .select('*')
          .eq('member_id', selectedMember.id)
          .gt('due_amount', 0)
          .order('created_at', { ascending: true })
          .limit(1);

        if (pendingErr) throw new Error(pendingErr.message);

        if (pendingInvoices && pendingInvoices.length > 0) {
          const invoice = pendingInvoices[0];
          invoiceId = invoice.id;
          const newPaidAmount = Number(invoice.paid_amount) + amountVal;
          // Deduct both the payment and any discount entered
          const newDueAmount = Math.max(0, Number(invoice.due_amount) - amountVal - discountVal);
          const newStatus = newDueAmount === 0 ? 'paid' : 'partially_paid';

          // Update total_amount to reflect discount if any was given
          const newTotalAmount = Math.max(0, Number(invoice.total_amount) - discountVal);

          const { error: invoiceUpdErr } = await supabase
            .from('invoices')
            .update({
              total_amount: newTotalAmount,
              paid_amount: newPaidAmount,
              due_amount: newDueAmount,
              status: newStatus,
              due_date: newDueAmount > 0 ? dueDate : null
            })
            .eq('id', invoiceId);

          if (invoiceUpdErr) throw new Error(invoiceUpdErr.message);
        } else {
          // Fallback if no invoice exists (older legacy members), create a paid/partially paid invoice
          const { data: newInvoice, error: fallbackErr } = await supabase
            .from('invoices')
            .insert([{
              member_id: selectedMember.id,
              total_amount: calculatedTotal,
              paid_amount: amountVal,
              due_amount: dueBalance,
              status: amountVal === 0 ? 'unpaid' : (dueBalance === 0 ? 'paid' : 'partially_paid'),
              due_date: dueBalance > 0 ? dueDate : null
            }])
            .select()
            .single();

          if (fallbackErr) throw new Error(fallbackErr.message);
          if (newInvoice) invoiceId = newInvoice.id;
        }
      }

      // 2. Insert Payment Record (Only if amountVal > 0)
      if (amountVal > 0) {
        const { error: paymentErr } = await supabase.from('payments').insert([{
          member_id: selectedMember.id,
          invoice_id: invoiceId,
          amount: amountVal,
          branch: activeBranch,
          payment_mode: paymentMode,
          paid_at: new Date(paidAtDate).toISOString(),
          notes: notesText
        }]);

        if (paymentErr) throw new Error(paymentErr.message);
      }

      // 3. Fetch remaining due amount for the member across all invoices
      const { data: memberDues } = await supabase
        .from('invoices')
        .select('due_amount')
        .eq('member_id', selectedMember.id);
      
      const totalRemainingDues = memberDues 
        ? memberDues.reduce((sum, inv) => sum + Number(inv.due_amount), 0)
        : 0;

      // 4. Update Member Record
      const memberUpdatePayload: any = {
        pay_later: totalRemainingDues > 0,
        payment_due_date: totalRemainingDues > 0 ? dueDate : null,
        left_with_dues: false,
        loss_amount: 0,
        left_at: null,
        left_reason: null
      };

      if (isRenewalAction) {
        memberUpdatePayload.plan_amount = basePriceVal;
        memberUpdatePayload.shift = renewShift;
        if (finalNewEnd) {
          memberUpdatePayload.subscription_end_date = finalNewEnd.toISOString();
          memberUpdatePayload.is_active = true;
        }
      }

      const { error: memberErr } = await supabase
        .from('members')
        .update(memberUpdatePayload)
        .eq('id', selectedMember.id);

      if (memberErr) throw new Error(memberErr.message);

      logActivity(activeBranch, "payment", `Recorded payment of ₹${amountVal} for ${selectedMember.full_name} (${selectedMember.permanent_id}). Purpose: ${purpose === "renewal" ? "Renewal" : "Dues"}.`);

      setSuccessMsg(purpose === "renewal" 
        ? "Payment recorded & membership activated successfully! Redirecting..." 
        : "Payment recorded successfully! Redirecting..."
      );
      setAmount("");
      setNotes("");
      setDiscount("");
      
      // Refresh local list and selected member
      await fetchAllMembers();

      const { data: refreshedMember } = await supabase
        .from('members')
        .select('*')
        .eq('id', selectedMember.id)
        .single();
      
      if (refreshedMember) {
        setSelectedMember(refreshedMember);
      }
      fetchPaymentsHistory(selectedMember.id);

      // Redirect
      setTimeout(() => {
        const isUnreservedMember = refreshedMember?.permanent_id && refreshedMember.permanent_id.includes('U');
        if (isUnreservedMember) {
          router.push('/dashboard/members');
        } else {
          router.push('/dashboard/seating');
        }
      }, 1500);

    } catch (err: any) {
      setErrorMsg(err.message || "Failed to record payment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Local real-time filtering of pre-loaded students list
  const filteredMembers = allMembers.filter(m => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      m.full_name?.toLowerCase().includes(query) ||
      m.permanent_id?.toLowerCase().includes(query) ||
      m.mobile?.includes(query)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Record Payment Hub</h1>
          <p className="page-subtitle">Configure subscription plan pricing and record payment entries for {branchLabel} Branch</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: All Students List & Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Searchable Students List */}
          <div className="glass-pane-elevated !p-5">
            <h2 className="text-base font-bold text-white font-manrope mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">school</span>
              Students Directory
            </h2>
            <div className="relative mb-4">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, ID, mobile..."
                className="input-premium pl-9 w-full !rounded-xl"
              />
            </div>

            {/* Students List Box */}
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1" data-lenis-prevent>
              {loadingMembers ? (
                <div className="flex items-center justify-center py-8">
                  <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="text-xs text-on-surface-variant italic p-8 text-center bg-white/[0.01] rounded-xl border border-white/[0.04]">
                  No students found
                </div>
              ) : (
                filteredMembers.map(m => {
                  const isSelected = selectedMember?.id === m.id;
                  const isExpired = m.subscription_end_date ? new Date(m.subscription_end_date) < new Date() : true;
                  const statusDotColor = !m.subscription_end_date
                    ? "bg-amber-400"
                    : isExpired ? "bg-red-500" : "bg-emerald-500";
                  
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMember(m)}
                      onDoubleClick={() => {
                        setModalMember(m);
                        setShowDetailsModal(true);
                      }}
                      title="Double click to check full details"
                      className={`w-full flex justify-between items-center p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "bg-blue-500/10 border-blue-500/30 shadow-inner"
                          : "bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.06] hover:border-white/[0.08]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${statusDotColor}`} />
                        <div className="truncate">
                          <div className="text-white font-bold text-xs truncate student-list-item-name">{m.full_name}</div>
                          <div className="text-[10px] text-primary font-mono mt-0.5 student-list-item-id">{m.permanent_id}</div>
                        </div>
                      </div>
                      <span className="text-[9px] text-on-surface-variant shrink-0 select-none student-list-item-hint">
                        Double-click for details
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Student Profile Card */}
          {selectedMember ? (
            <div className="glass-pane-elevated !p-5 relative overflow-hidden group">
              <div className="absolute -left-8 -top-8 w-28 h-28 bg-[#bfc2ff]/10 rounded-[100%] blur-[30px]" />
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center text-[#003178] font-black text-lg shadow-inner">
                    {selectedMember.full_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm tracking-wide">{selectedMember.full_name}</h3>
                    <span className="badge badge-info text-[9px] mt-1 tracking-widest">{selectedMember.permanent_id}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-2">
                  <div className="bg-white/[0.03] p-2.5 rounded-xl border border-white/[0.05]">
                    <div className="text-[9px] text-on-surface-variant uppercase font-bold tracking-wider">Shift</div>
                    <div className="font-bold text-white mt-0.5 truncate">{selectedMember.shift}</div>
                  </div>
                  <div className="bg-white/[0.03] p-2.5 rounded-xl border border-white/[0.05]">
                    <div className="text-[9px] text-on-surface-variant uppercase font-bold tracking-wider">Seat Assigned</div>
                    <div className="font-bold text-white mt-0.5">
                      {selectedMember.permanent_id?.includes('U') ? 'Unreserved' : (selectedMember.seat_no || '—')}
                    </div>
                  </div>
                  <div className="bg-white/[0.03] p-2.5 rounded-xl border border-white/[0.05] col-span-2">
                    <div className="text-[9px] text-on-surface-variant uppercase font-bold tracking-wider">Expiry / Valid Till</div>
                    <div className="font-bold text-white mt-0.5 flex justify-between items-center">
                      <span>
                        {selectedMember.subscription_end_date 
                          ? new Date(selectedMember.subscription_end_date).toLocaleDateString() 
                          : "Pending setup / Unpaid"}
                      </span>
                      {(() => {
                        if (!selectedMember.subscription_end_date) {
                          return <span className="badge badge-warning text-[9px]">Unpaid</span>;
                        }
                        const isExpired = new Date(selectedMember.subscription_end_date) < new Date();
                        return (
                          <span className={`badge ${isExpired ? 'badge-danger' : 'badge-success'} text-[9px]`}>
                            {isExpired ? 'Expired' : 'Active'}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Skip button if navigated from admission page */}
                {memberIdParam && (
                  <button
                    type="button"
                    onClick={() => {
                      const isUnassigned = selectedMember.permanent_id && selectedMember.permanent_id.includes('U');
                      if (isUnassigned) {
                        router.push('/dashboard/members');
                      } else {
                        router.push('/dashboard/seating');
                      }
                    }}
                    className="btn-ghost text-xs w-full py-2.5 mt-4 flex items-center justify-center gap-1.5 border border-dashed border-slate-300 hover:border-slate-400 text-slate-700 font-bold"
                  >
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    Skip Payment & Proceed
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-pane-elevated !p-8 text-center text-on-surface-variant italic text-xs">
              <span className="material-symbols-outlined text-4xl mb-2 text-on-surface-variant/30 block">person</span>
              Select a student to manage pricing & record payments
            </div>
          )}
        </div>

        {/* Center/Right Column: Payment Record Form & Ledger history */}
        <div className="lg:col-span-2 space-y-6">
          {selectedMember && (
            <>
              {/* Payment Recording Form */}
              <div className="glass-pane-elevated !p-6">
                <h2 className="text-base font-bold text-white font-manrope mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#fdac29] text-lg">payments</span>
                  Record Transaction
                </h2>

                {successMsg && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl mb-4 text-xs font-semibold flex items-center gap-1.5 animate-fade-in-fast">
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    {successMsg}
                  </div>
                )}

                {errorMsg && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl mb-4 text-xs font-semibold flex items-center gap-1.5 animate-fade-in-fast">
                    <span className="material-symbols-outlined text-base">error</span>
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-on-surface-variant pl-0.5">Payment Purpose</label>
                      <select
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value as any)}
                        className="input-premium appearance-none w-full"
                      >
                        <option value="renewal">Plan Setup / Subscription Renewal (Full / Partial Payment)</option>
                        <option value="dues">Pay Pending Dues / Partial Payment</option>
                      </select>

                      {purpose === "dues" && (
                        <label className="flex items-center gap-2 mt-2 cursor-pointer group select-none pl-0.5">
                          <input
                            type="checkbox"
                            checked={extendMembershipInDues}
                            onChange={(e) => setExtendMembershipInDues(e.target.checked)}
                            className="w-4 h-4 text-[#1e40af] border-white/10 rounded focus:ring-0 focus:ring-offset-0 bg-[#f8fafc]"
                          />
                          <span className="text-[10px] font-bold text-slate-600 group-hover:text-slate-800 transition-colors">
                            Extend Membership Validity? (Renewal + Partial)
                          </span>
                        </label>
                      )}
                    </div>

                    {/* Amount Paid */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-on-surface-variant pl-0.5">Amount Paid (₹)</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={amount}
                        onChange={(e) => setAmount(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))}
                        className={`input-premium w-full ${!payLater && Number(amount) > calculatedTotal ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                        placeholder="e.g. 1000"
                      />
                      {!payLater && Number(amount) > calculatedTotal && (
                        <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1 animate-fade-in-fast">
                          <span className="material-symbols-outlined text-xs">warning</span>
                          Exceeds total payable amount (₹{calculatedTotal}). Use discount instead.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Shifted Pricing & Payment Details section */}
                  <div className="p-5 bg-white/[0.01] border border-[#fdac29]/20 rounded-2xl space-y-5 animate-scale-in">
                    <div className="flex items-center gap-2 text-[#fdac29] text-[10px] font-bold uppercase tracking-wider">
                      <span className="material-symbols-outlined text-xs">tune</span>
                      {showDurationPicker ? "Pricing & Plan Duration Details" : "Pricing & Settlement Details"}
                    </div>

                    {showDurationPicker && (
                      <>
                        {/* Shift Selector */}
                        <div className="space-y-2">
                          <label className="text-[9px] uppercase font-bold text-on-surface-variant">Shift / Time Slot</label>
                          <select
                            value={renewShift}
                            onChange={(e) => {
                              const newShift = e.target.value;
                              setRenewShift(newShift);
                              const defaultPrice = newShift === 'Full Day' ? 1000 : 600;
                              if (renewDurationType === "Days") {
                                setBasePrice(Math.round(defaultPrice / 30));
                              } else {
                                setBasePrice(defaultPrice);
                              }
                            }}
                            className="input-premium appearance-none w-full !py-2 !text-xs"
                          >
                            <option value="Morning">Morning Shift (₹600)</option>
                            <option value="Evening">Evening Shift (₹600)</option>
                            <option value="Full Day">Full Day Shift (₹1000)</option>
                          </select>
                        </div>

                        {/* Duration Period Type */}
                        <div className="space-y-2">
                          <label className="text-[9px] uppercase font-bold text-on-surface-variant">Duration Period Type</label>
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
                        {finalDurationType === "Months" ? (
                          <div className="space-y-2">
                            <label className="text-[9px] uppercase font-bold text-on-surface-variant block">Membership Duration (Months)</label>
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
                                      ? "bg-[#1e40af] text-white border-[#1e40af]"
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
                                    ? "bg-[#1e40af] text-white border-[#1e40af]"
                                    : "bg-slate-200 hover:bg-slate-300 text-slate-800 border-slate-300"
                                }`}
                              >
                                Custom
                              </button>
                            </div>
                            {renewIsCustomDuration && (
                              <div className="max-w-[150px] mt-1.5 animate-fade-in-fast">
                                <input
                                  type="number"
                                  min="1"
                                  value={renewCustomMonths}
                                  onChange={(e) => setRenewCustomMonths(e.target.value)}
                                  className="input-premium !py-1.5 !text-xs w-full"
                                  placeholder="Enter months..."
                                  required={renewIsCustomDuration}
                                />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <label className="text-[9px] uppercase font-bold text-on-surface-variant block">Membership Duration (Days)</label>
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
                      </>
                    )}

                    {/* Base price & Discount configs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-on-surface-variant block">
                          {showDurationPicker 
                            ? `Base Plan Price (₹/${finalDurationType === "Days" ? "day" : "mo"})`
                            : "Total Dues/Amount (₹)"}
                        </label>
                        <input
                          type="number"
                          min="0"
                          required
                          value={basePrice}
                          onChange={(e) => setBasePrice(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))}
                          className="input-premium !py-1.5 !text-xs w-full"
                          placeholder={showDurationPicker ? "e.g. 1000" : "e.g. 400"}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-on-surface-variant block">Total Discount (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={discount}
                          onChange={(e) => setDiscount(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))}
                          className="input-premium !py-1.5 !text-xs w-full"
                          placeholder="No pre-filled zero"
                        />
                      </div>
                    </div>

                    {/* Expiry and pricing summaries */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs gap-2">
                      <div className="text-on-surface-variant font-medium">
                        {showDurationPicker ? (
                          finalDurationType === "Days" ? (
                            <span>
                              Calculated: ₹{basePriceVal.toLocaleString('en-IN')}/day * {durationDaysVal} day(s) - ₹{discountVal.toLocaleString('en-IN')} (Discount)
                            </span>
                          ) : (
                            <span>
                              Calculated: ₹{basePriceVal.toLocaleString('en-IN')}/mo * {durationMonths} month(s) - ₹{discountVal.toLocaleString('en-IN')} (Discount)
                            </span>
                          )
                        ) : (
                          <span>
                            Settlement: ₹{basePriceVal.toLocaleString('en-IN')} (Dues) - ₹{discountVal.toLocaleString('en-IN')} (Discount)
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-emerald-400">
                        <span>Total Payable: ₹{calculatedTotal.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {/* Pay Later Option Toggle */}
                    {showDurationPicker && (
                      <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <div className="space-y-0.5">
                          <label className="text-xs font-bold text-white block">Pay Later / Defer Payment</label>
                          <span className="text-[10px] text-on-surface-variant">Activate plan validity now, schedule payment manually</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setPayLater(!payLater);
                            if (!payLater) {
                              setAmount(0);
                            } else {
                              setAmount(calculatedTotal);
                            }
                          }}
                          className={`w-11 h-6 rounded-full transition-all relative ${
                            payLater ? "bg-primary shadow-[0_0_10px_rgba(0,49,120,0.3)]" : "bg-slate-300"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                              payLater ? "right-1" : "left-1"
                            }`}
                          />
                        </button>
                      </div>
                    )}

                    {dueBalance > 0 && !payLater && (
                      <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">info</span>
                        <span>Remaining Balance: ₹{dueBalance.toLocaleString('en-IN')} will be recorded as pending dues.</span>
                      </div>
                    )}

                    {(payLater || dueBalance > 0) && (
                      <div className="space-y-1.5 w-full animate-fade-in-fast">
                        <label className="text-[10px] uppercase font-bold text-on-surface-variant block pl-0.5">
                          {dueBalance > 0 ? "Dues Payment Deadline (Due Date)" : "Payment Due Date"}
                        </label>
                        <input
                          type="date"
                          required
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          className="input-premium w-full !py-2.5"
                        />
                      </div>
                    )}

                    {showDurationPicker && (
                      <div className="space-y-1.5 w-full">
                        <label className="text-[10px] uppercase font-bold text-on-surface-variant block pl-0.5">New Validity Expiry Date</label>
                        <input
                          type="date"
                          required
                          value={customExpiryDate}
                          onChange={(e) => setCustomExpiryDate(e.target.value)}
                          className={`input-premium w-full !py-2.5 !text-xs font-semibold ${
                            selectedMember?.subscription_end_date && customExpiryDate && new Date(customExpiryDate) <= new Date(selectedMember.subscription_end_date)
                              ? 'border-red-500 text-red-400 bg-red-500/5'
                              : ''
                          }`}
                        />
                        {selectedMember?.subscription_end_date && customExpiryDate && new Date(customExpiryDate) <= new Date(selectedMember.subscription_end_date) && (
                          <p className="text-[10px] text-red-400 font-bold flex items-center gap-1 mt-1">
                            <span className="material-symbols-outlined text-xs">warning</span>
                            Expiry must be after current subscription end date ({new Date(selectedMember.subscription_end_date).toLocaleDateString()}).
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {!payLater && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Payment Mode */}
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-on-surface-variant pl-0.5">Payment Mode</label>
                        <select
                          value={paymentMode}
                          onChange={(e) => setPaymentMode(e.target.value)}
                          className="input-premium appearance-none w-full"
                        >
                          <option value="Cash">Cash</option>
                          <option value="UPI">UPI</option>
                          <option value="Card">Card</option>
                          <option value="Online">Online</option>
                        </select>
                      </div>

                      {/* Paid At Date */}
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-on-surface-variant pl-0.5">Date Paid</label>
                        <input
                          type="date"
                          required
                          value={paidAtDate}
                          onChange={(e) => setPaidAtDate(e.target.value)}
                          className="input-premium w-full !py-2.5"
                        />
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-on-surface-variant pl-0.5">Notes (Optional)</label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Paid initial admission setup"
                      className="input-premium w-full"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    disabled={isSubmitting || (!payLater && Number(amount) > calculatedTotal)}
                    type="submit"
                    className="w-full btn-primary py-3.5 flex justify-center items-center gap-2 disabled:opacity-50 font-bold"
                  >
                    {isSubmitting ? (
                      <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                    ) : (
                      <span className="material-symbols-outlined text-sm">save_alt</span>
                    )}
                    {isSubmitting ? "Processing..." : payLater ? "Activate Plan (Pay Later)" : "Record Payment & Activate Plan"}
                  </button>
                </form>
              </div>

              {/* Historical Payments Ledger */}
              <div className="glass-pane-elevated !p-6">
                <h2 className="text-base font-bold text-white font-manrope mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-lg">receipt_long</span>
                  Payments Ledger History
                </h2>

                <div className="overflow-x-auto rounded-xl border border-white/[0.04]">
                  <table className="w-full text-left text-xs table-premium">
                    <thead>
                      <tr>
                        <th>Date Paid</th>
                        <th>Amount</th>
                        <th>Mode</th>
                        <th>Transaction details / Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyLoading ? (
                        <tr>
                          <td colSpan={4} className="text-center py-4">
                            <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                          </td>
                        </tr>
                      ) : paymentsHistory.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-4 text-on-surface-variant italic">
                            No transaction history found for this student.
                          </td>
                        </tr>
                      ) : (
                        paymentsHistory.map(p => (
                          <tr key={p.id} className="hover:bg-white/[0.02]">
                            <td className="font-semibold text-white whitespace-nowrap">
                              {new Date(p.paid_at).toLocaleDateString()}
                            </td>
                            <td className="font-bold text-emerald-400">
                              ₹{p.amount?.toLocaleString('en-IN')}
                            </td>
                            <td>
                              <span className="badge badge-info">{p.payment_mode}</span>
                            </td>
                            <td className="max-w-xs truncate text-on-surface-variant" title={p.notes}>
                              {p.notes || "—"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Student Details Popup Modal */}
      <AnimatePresence>
        {showDetailsModal && modalMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetailsModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            
            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="glass-pane-elevated max-w-lg w-full relative z-10 overflow-hidden !rounded-2xl border border-white/[0.08] shadow-2xl p-6 md:p-8"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowDetailsModal(false)}
                className="absolute right-4 top-4 w-8 h-8 rounded-full flex items-center justify-center bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.1] transition-all text-white"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>

              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#003178] to-[#60a5fa] border border-blue-400/20 flex items-center justify-center text-white font-black text-xl shadow-lg">
                    {modalMember.full_name?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white font-manrope">{modalMember.full_name}</h3>
                    <span className="badge badge-info text-[10px] tracking-widest uppercase font-mono mt-1">
                      {modalMember.permanent_id}
                    </span>
                  </div>
                </div>

                <div className="border-t border-white/[0.06] pt-4" />

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Father's Name</div>
                    <div className="text-white font-semibold mt-0.5">{modalMember.father_name || "—"}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Mobile Number</div>
                    <div className="text-white font-semibold mt-0.5">{modalMember.mobile}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Date of Birth</div>
                    <div className="text-white font-semibold mt-0.5">
                      {modalMember.dob ? new Date(modalMember.dob).toLocaleDateString() : "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Gender</div>
                    <div className="text-white font-semibold mt-0.5">{modalMember.gender || "—"}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Shift Assignment</div>
                    <div className="text-white font-semibold mt-0.5">{modalMember.shift}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Seat Number</div>
                    <div className="text-white font-semibold mt-0.5">
                      {modalMember.permanent_id?.includes('U') ? 'Unreserved Category' : (modalMember.seat_no || 'Pending Assignment')}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Residential Address</div>
                    <div className="text-white font-semibold mt-0.5">{modalMember.address || "—"}</div>
                  </div>
                  <div className="col-span-2 bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl flex justify-between items-center mt-2">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Subscription Validity</div>
                      <div className="text-white font-bold mt-0.5">
                        {modalMember.subscription_end_date 
                          ? new Date(modalMember.subscription_end_date).toLocaleDateString() 
                          : "Pending Initial Payment Setup"}
                      </div>
                    </div>
                    {(() => {
                      if (!modalMember.subscription_end_date) {
                        return <span className="badge badge-warning text-[9px]">Unpaid</span>;
                      }
                      const isExpired = new Date(modalMember.subscription_end_date) < new Date();
                      return (
                        <span className={`badge ${isExpired ? 'badge-danger' : 'badge-success'} text-[9px]`}>
                          {isExpired ? 'Expired' : 'Active'}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                <div className="border-t border-white/[0.06] pt-4" />

                {/* Footer Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedMember(modalMember);
                      setShowDetailsModal(false);
                    }}
                    className="flex-1 btn-primary py-2.5 text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">payments</span>
                    Record Payment
                  </button>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function RecordPaymentPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
        <span className="text-sm text-on-surface-variant font-medium">Loading payment portal...</span>
      </div>
    }>
      <RecordPaymentInner />
    </Suspense>
  );
}
