"use client";
import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { useBranch } from "@/components/branch-context";
import { supabase } from "@/lib/supabase";
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { logActivity } from "@/lib/activity";
import { getTemplate, parseTemplate, formatWhatsAppNumber } from "@/lib/whatsapp";
import { getMemberStatus } from "@/lib/utils";

function RecordPaymentInner() {
  const { activeBranch } = useBranch();
  const branchLabel = activeBranch === 'namnakala' ? 'Namnakala' : 'Bengali Chowk';
  const searchParams = useSearchParams();
  const router = useRouter();
  const memberIdParam = searchParams.get('memberId');

  // WhatsApp Notification Confirmation Modal State
  const [whatsappModal, setWhatsappModal] = useState<{
    show: boolean;
    phone: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  } | null>(null);

  // Search & Student List States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'overdue' | 'due-soon'>('all');
  const [allMembers, setAllMembers] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Student Details Modal States
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [modalMember, setModalMember] = useState<any | null>(null);

  // Payments Ledger State
  const [paymentsHistory, setPaymentsHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");

  // Payment Form States
  const [purpose, setPurpose] = useState<"dues" | "renewal" | "collect_dues">("renewal");
  const [amount, setAmount] = useState<number | "">("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [paidAtDate, setPaidAtDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState("");
  const [shift, setShift] = useState<string>("Morning");

  // Pricing & Duration configuration states (shifted from admission)
  const [basePrice, setBasePrice] = useState<number | "">(1000);
  const [discount, setDiscount] = useState<number | "">("");
  const [renewDuration, setRenewDuration] = useState<number>(1);
  const [renewCustomMonths, setRenewCustomMonths] = useState<string>("");
  const [renewIsCustomDuration, setRenewIsCustomDuration] = useState<boolean>(false);
  const [renewDurationType, setRenewDurationType] = useState<"Months" | "Days">("Months");
  const [renewDurationDays, setRenewDurationDays] = useState<number | "">(30);

  // Auto-scale price on switching duration type
  const handleDurationTypeChange = (type: "Months" | "Days") => {
    if (type === renewDurationType) return;
    setRenewDurationType(type);
    const defaultMonthly = shift === 'Full Day' ? 1000 : 600;
    if (type === "Days") {
      setBasePrice(Math.round(defaultMonthly / 30));
    } else {
      setBasePrice(defaultMonthly);
    }
  };

  // Form submitting status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [joiningDate, setJoiningDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
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
      const matched = allMembers.find(m => m.id === memberIdParam && m.branch === activeBranch);
      if (matched) {
        setSelectedMember(matched);
      } else {
        // Fallback fetch if not loaded in branch list
        const fetchMemberById = async () => {
          const { data } = await supabase
            .from('members')
            .select('*')
            .eq('id', memberIdParam)
            .eq('branch', activeBranch)
            .maybeSingle();
          if (data) {
            setSelectedMember(data);
          }
        };
        fetchMemberById();
      }
    }
  }, [memberIdParam, allMembers, activeBranch]);

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

      let defaultPrice = selectedMember.plan_amount || (selectedMember.shift === 'Full Day' ? 1000 : 600);
      // Auto-heal: if plan_amount was stored as a daily rate (less than 100), convert it to monthly
      if (defaultPrice > 0 && defaultPrice < 100) {
        defaultPrice = defaultPrice * 30;
      }
      setRenewDurationType("Months");
      setBasePrice(defaultPrice);
      setShift(selectedMember.shift || "Morning");
      setDiscount("");
      setSuccessMsg(null);
      setErrorMsg(null);
      setRenewDuration(1);
      setRenewCustomMonths("");
      setRenewIsCustomDuration(false);
      setRenewDurationDays(30);
      setPayLater(false);
      if ((selectedMember.outstanding_dues || 0) > 0 && selectedMember.subscription_end_date) {
        setPurpose("collect_dues");
      } else {
        setPurpose("renewal");
      }
      if (selectedMember.payment_due_date) {
        setDueDate(selectedMember.payment_due_date);
      } else {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setDueDate(tomorrow.toISOString().split('T')[0]);
      }

      // Calculate intelligent joining date (Subscription Start)
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const todayStr = `${yyyy}-${mm}-${dd}`;
      
      let startDateStr = todayStr;
      if (selectedMember.subscription_end_date && purpose === "renewal") {
        const endD = new Date(selectedMember.subscription_end_date);
        endD.setDate(endD.getDate() + 1); // Start the day after it expires
        
        const todayZero = new Date(today);
        todayZero.setHours(0,0,0,0);
        
        const diffDays = (todayZero.getTime() - endD.getTime()) / (1000 * 3600 * 24);
        
        // If the calculated start date is in the future, or within the last 7 days (grace period),
        // we do a continuous extension. Otherwise, if they've been gone a long time, default to today.
        if (diffDays <= 7) {
          startDateStr = endD.toISOString().split('T')[0];
        }
      }
      
      setJoiningDate(startDateStr);
    }
  }, [selectedMember, fetchPaymentsHistory]);

  // Calculated Pricing values
  const basePriceVal = Number(basePrice) || 0;
  const discountVal = Number(discount) || 0;
  const isUnreserved = selectedMember?.permanent_id?.includes('U');

  const finalDurationType = renewDurationType;
  const durationMonths = renewIsCustomDuration ? Math.max(1, parseInt(renewCustomMonths) || 1) : renewDuration;
  const durationDaysVal = Math.max(1, Number(renewDurationDays) || 30);

  const calculatedTotal = (purpose === "renewal" || purpose === "dues")
    ? (finalDurationType === "Days"
      ? Math.max(0, (basePriceVal * durationDaysVal) - discountVal)
      : Math.max(0, (basePriceVal * durationMonths) - discountVal))
    : (purpose === "collect_dues" ? (selectedMember?.outstanding_dues || 0) : 0);

  // Auto-sync computed total to Amount Paid
  useEffect(() => {
    if (purpose === "renewal") {
      setAmount(calculatedTotal);
    } else if (purpose === "collect_dues") {
      setAmount(selectedMember?.outstanding_dues || 0);
    } else {
      if (payLater) {
        setAmount(0);
      } else {
        // Default to half of calculatedTotal for dues/partial payment
        setAmount(Math.round(calculatedTotal / 2));
      }
    }
  }, [calculatedTotal, purpose, payLater, selectedMember]);

  // Force payLater to false if purpose is renewal or collect_dues
  useEffect(() => {
    if (purpose === "renewal" || purpose === "collect_dues") {
      setPayLater(false);
    }
  }, [purpose]);

  // Sync customExpiryDate when student, purpose, duration type, or joiningDate changes
  useEffect(() => {
    if (!selectedMember) return;
    if (purpose === "collect_dues") {
      setCustomExpiryDate(selectedMember.subscription_end_date ? selectedMember.subscription_end_date.split('T')[0] : "");
      return;
    }
    if (!joiningDate) return;
    const baseDate = new Date(joiningDate);
    if (isNaN(baseDate.getTime())) return;

    if (finalDurationType === "Days") {
      baseDate.setDate(baseDate.getDate() + durationDaysVal - 1);
    } else {
      // 1M = 30 days, so (durationMonths * 30) - 1
      baseDate.setDate(baseDate.getDate() + (durationMonths * 30) - 1);
    }
    setCustomExpiryDate(baseDate.toISOString().split('T')[0]);
  }, [selectedMember, finalDurationType, durationDaysVal, durationMonths, purpose, joiningDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    setIsSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const amountVal = payLater ? 0 : (Number(amount) || 0);
      const isDuesCollection = purpose === "collect_dues";

      if (isDuesCollection) {
        if (amountVal <= 0) {
          throw new Error("Please enter a valid payment amount to clear dues.");
        }
        if (amountVal > (selectedMember.outstanding_dues || 0)) {
          throw new Error(`Payment amount cannot exceed outstanding dues of ₹${selectedMember.outstanding_dues}`);
        }
      } else {
        if (purpose === "dues" && !payLater && amountVal === 0) {
          throw new Error("Please enable the 'Pay Later' toggle to record a deferred payment with 0 amount.");
        }
      }

      let notesText = notes.trim();
      let finalNewEnd: Date | null = null;
      if (!isDuesCollection) {
        if (!customExpiryDate) {
          throw new Error("Please specify a valid expiry date.");
        }
        finalNewEnd = new Date(customExpiryDate);
        if (isNaN(finalNewEnd.getTime())) {
          throw new Error("Invalid expiry date format.");
        }
      }

      let durationStr = "";
      if (finalDurationType === "Days") {
        durationStr = `${durationDaysVal} day(s)`;
      } else {
        durationStr = `${durationMonths} month(s)`;
      }

      if (isDuesCollection) {
        const remainingDues = Math.max(0, (selectedMember.outstanding_dues || 0) - amountVal);
        if (!notesText) {
          notesText = `Dues Collection Payment — Paid: ₹${amountVal}, Remaining Dues: ₹${remainingDues}`;
        }
      } else if (purpose === "renewal") {
        if (!notesText) {
          notesText = `Subscription Renewal — Joining: ${new Date(joiningDate).toLocaleDateString()}, Expiry: ${finalNewEnd!.toLocaleDateString()}. Duration: ${durationStr}. Base Plan: ₹${basePriceVal}/${finalDurationType === "Days" ? "day" : "mo"}. Discount: ₹${discountVal}. Amount Paid: ₹${amountVal}`;
        }
      } else {
        // Dues / Partial Payment / Pay Later
        if (!notesText) {
          notesText = payLater
            ? `Subscription Renewal (Deferred / Pay Later) — Joining: ${new Date(joiningDate).toLocaleDateString()}, Expiry: ${finalNewEnd!.toLocaleDateString()}. Duration: ${durationStr}. Base Plan: ₹${basePriceVal}/${finalDurationType === "Days" ? "day" : "mo"}. Discount: ₹${discountVal}. Due Date: ${new Date(dueDate).toLocaleDateString()}`
            : `Subscription Renewal (Partial Payment) — Joining: ${new Date(joiningDate).toLocaleDateString()}, Expiry: ${finalNewEnd!.toLocaleDateString()}. Duration: ${durationStr}. Base Plan: ₹${basePriceVal}/${finalDurationType === "Days" ? "day" : "mo"}. Discount: ₹${discountVal}. Amount Paid: ₹${amountVal}, Dues: ₹${calculatedTotal - amountVal}. Due Date: ${new Date(dueDate).toLocaleDateString()}`;
        }
      }

      // 1. Create or Update Invoice
      let invoiceIdToLink = null;
      if (isDuesCollection) {
        // Find oldest unpaid invoice for this member
        const { data: unpaidInvs } = await supabase
          .from('invoices')
          .select('*')
          .eq('member_id', selectedMember.id)
          .neq('status', 'paid')
          .order('created_at', { ascending: true })
          .limit(1);

        if (unpaidInvs && unpaidInvs.length > 0) {
          const targetInv = unpaidInvs[0];
          invoiceIdToLink = targetInv.id;
          
          const newPaidAmount = targetInv.paid_amount + amountVal;
          const newDueAmount = Math.max(0, targetInv.total_amount - newPaidAmount);
          const newStatus = newDueAmount === 0 ? 'paid' : 'partially_paid';

          const { error: updInvErr } = await supabase
            .from('invoices')
            .update({
              paid_amount: newPaidAmount,
              due_amount: newDueAmount,
              status: newStatus,
              due_date: newDueAmount > 0 ? targetInv.due_date : null
            })
            .eq('id', targetInv.id);
            
          if (updInvErr) throw new Error("Failed to update invoice: " + updInvErr.message);
        } else {
          // Fallback legacy setup
          const totalAmt = selectedMember.outstanding_dues || amountVal;
          const dueAmt = Math.max(0, totalAmt - amountVal);
          const { data: newInv, error: newInvErr } = await supabase
            .from('invoices')
            .insert([{
              member_id: selectedMember.id,
              total_amount: totalAmt,
              paid_amount: amountVal,
              due_amount: dueAmt,
              status: dueAmt === 0 ? 'paid' : 'partially_paid',
              due_date: selectedMember.payment_due_date || null
            }])
            .select()
            .single();

          if (newInvErr) throw new Error("Failed to create backup invoice: " + newInvErr.message);
          if (newInv) {
            invoiceIdToLink = newInv.id;
          }
        }
      } else {
        // Create new invoice for renewal / partial payment / pay later
        const totalAmt = calculatedTotal;
        const paidAmt = payLater ? 0 : amountVal;
        const dueAmt = payLater ? totalAmt : (totalAmt - amountVal);
        const statusVal = payLater ? 'unpaid' : (dueAmt === 0 ? 'paid' : 'partially_paid');

        const { data: newInv, error: newInvErr } = await supabase
          .from('invoices')
          .insert([{
            member_id: selectedMember.id,
            total_amount: totalAmt,
            paid_amount: paidAmt,
            due_amount: dueAmt,
            status: statusVal,
            due_date: (payLater || dueAmt > 0) ? dueDate : null
          }])
          .select()
          .single();

        if (newInvErr) throw new Error("Invoice creation failed: " + newInvErr.message);
        if (newInv) {
          invoiceIdToLink = newInv.id;
        }
      }

      // 2. Insert Payment Record (linked to invoice)
      const { error: paymentErr } = await supabase.from('payments').insert([{
        member_id: selectedMember.id,
        invoice_id: invoiceIdToLink,
        amount: amountVal,
        branch: activeBranch,
        payment_mode: payLater ? "Cash" : paymentMode,
        paid_at: new Date(paidAtDate).toISOString(),
        notes: notesText
      }]);

      if (paymentErr) throw new Error(paymentErr.message);

      // 2. Update Member Record
      let memberUpdatePayload: any = {};
      const remainingDues = isDuesCollection
        ? Math.max(0, (selectedMember.outstanding_dues || 0) - amountVal)
        : 0;

      if (isDuesCollection) {
        memberUpdatePayload = {
          outstanding_dues: remainingDues,
          pay_later: remainingDues > 0 ? selectedMember.pay_later : false,
          payment_due_date: remainingDues > 0 ? selectedMember.payment_due_date : null,
          left_with_dues: remainingDues > 0,
          payment_status: remainingDues > 0 ? 'PENDING' : 'PAID',
        };
        // Activate member if they were INACTIVE waiting for initial payment setup
        if (selectedMember.status === 'INACTIVE') {
          memberUpdatePayload.is_active = true;
          memberUpdatePayload.status = 'ACTIVE';
        }
      } else {
        const hasDues = payLater || (amountVal < calculatedTotal);
        memberUpdatePayload = {
          plan_amount: renewDurationType === "Days" ? (basePriceVal * 30) : basePriceVal, // Update plan configuration
          pay_later: payLater,
          payment_due_date: hasDues ? dueDate : null,
          left_with_dues: hasDues,
          loss_amount: 0,
          left_at: null,
          left_reason: null,
          joining_date: (selectedMember.status === 'LEFT' || selectedMember.left_at) ? joiningDate : (selectedMember.joining_date || joiningDate),
          discount: discountVal,
          shift: shift,
          subscription_end_date: finalNewEnd!.toISOString(),
          is_active: true,
          status: 'ACTIVE',
          payment_status: hasDues ? 'PENDING' : 'PAID',
          outstanding_dues: hasDues ? (payLater ? calculatedTotal : (calculatedTotal - amountVal)) : 0
        };
      }

      const { error: memberErr } = await supabase
        .from('members')
        .update(memberUpdatePayload)
        .eq('id', selectedMember.id);

      if (memberErr) throw new Error(memberErr.message);

      // 3. Log Activity
      const studentRef = `${selectedMember.permanent_id}${selectedMember.student_no ? ` [#${selectedMember.student_no}]` : ''}`;
      const logDetails = isDuesCollection
        ? `Recorded dues payment of ₹${amountVal} for ${selectedMember.full_name} (${studentRef}). Remaining dues: ₹${remainingDues}.`
        : (purpose === "renewal"
          ? `Recorded full payment of ₹${amountVal} for ${selectedMember.full_name} (${studentRef}). Expiry: ${finalNewEnd!.toLocaleDateString()}.`
          : (payLater
            ? `Deferred payment (Pay Later) set up for ${selectedMember.full_name} (${studentRef}). Due: ${new Date(dueDate).toLocaleDateString()}, Expiry: ${finalNewEnd!.toLocaleDateString()}.`
            : `Recorded partial payment of ₹${amountVal} (Dues: ₹${calculatedTotal - amountVal}) for ${selectedMember.full_name} (${studentRef}). Due: ${new Date(dueDate).toLocaleDateString()}, Expiry: ${finalNewEnd!.toLocaleDateString()}.`
          )
        );

      logActivity(activeBranch, "payment_recorded", logDetails);

      setSuccessMsg(isDuesCollection
        ? "Dues payment recorded successfully!"
        : (purpose === "renewal"
          ? "Payment recorded & membership activated successfully!"
          : "Subscription & Dues setup recorded successfully!"
        )
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

      // 4. Fetch updated invoice details to build WhatsApp notification
      let targetInvoice: any = null;
      if (invoiceIdToLink) {
        const { data: invData } = await supabase
          .from('invoices')
          .select('*')
          .eq('id', invoiceIdToLink)
          .maybeSingle();
        targetInvoice = invData;
      }

      // Redirect or show WhatsApp confirmation modal
      if (refreshedMember) {
        const isNewAdmission = !!memberIdParam;
        const isReserved = refreshedMember.permanent_id && !refreshedMember.permanent_id.includes('U');

        if (targetInvoice) {
          const mobileClean = formatWhatsAppNumber(refreshedMember.mobile);
          const branchLabel = refreshedMember.branch === 'namnakala' ? 'Namnakala' : 'Bengali Chowk';
          const seatText = refreshedMember.seat_no || 'Unreserved (No seat allotted)';
          const expiryDate = refreshedMember.subscription_end_date ? new Date(refreshedMember.subscription_end_date).toLocaleDateString('en-IN') : 'N/A';
          const statusText = targetInvoice.status === 'paid' ? '✅ FULLY PAID' : targetInvoice.status === 'partially_paid' ? '⚠️ PARTIALLY PAID (Dues Pending)' : '❌ UNPAID';
          
          let dueDateLine = "";
          if (targetInvoice.due_amount > 0 && targetInvoice.due_date) {
            dueDateLine = `📅 *Payment Due Date:* ${new Date(targetInvoice.due_date).toLocaleDateString('en-IN')}\n`;
          }

          // Count payments to detect if it is a new admission (first payment ever) or a renewal
          const { count: paymentCount } = await supabase
            .from('payments')
            .select('*', { count: 'exact', head: true })
            .eq('member_id', refreshedMember.id);
          
          const isFirstPayment = (paymentCount || 0) <= 1;

          let templateStr = "";
          const templateVars: Record<string, string> = {
            name: refreshedMember.full_name || '',
            branch: branchLabel,
            seat: seatText,
            shift: refreshedMember.shift || '',
            expiry: expiryDate,
            total_amount: String(targetInvoice.total_amount ?? 0),
            paid_amount: isDuesCollection ? String(amountVal) : String(targetInvoice.paid_amount ?? 0),
            due_amount: String(targetInvoice.due_amount ?? 0),
            remaining_dues: String(remainingDues ?? 0),
            due_date_line: dueDateLine || '',
            status: statusText || '',
            invoice_link: targetInvoice.id ? `${window.location.origin}/invoice?id=${targetInvoice.id}` : 'Link Unavailable'
          };
          console.log('[DEBUG] Template Vars:', templateVars);

          if (isDuesCollection) {
            templateStr = await getTemplate('dues_receipt_msg');
          } else if (isFirstPayment) {
            templateStr = await getTemplate('welcome_msg');
          } else {
            templateStr = await getTemplate('renew_msg');
          }
          
          const consolidatedMsg = parseTemplate(templateStr, templateVars);

          // Determine where to go after modal
          const redirectAfter = (isNewAdmission && isReserved) ? '/dashboard/seating' : (isNewAdmission ? '/dashboard/members' : null);

          setWhatsappModal({
            show: true,
            phone: mobileClean,
            message: consolidatedMsg,
            onConfirm: () => {
              window.open(`https://wa.me/${mobileClean}?text=${encodeURIComponent(consolidatedMsg)}`, '_blank');
              setWhatsappModal(null);
              if (redirectAfter) {
                router.push(redirectAfter);
              }
            },
            onCancel: () => {
              setWhatsappModal(null);
              if (redirectAfter) {
                router.push(redirectAfter);
              }
            }
          });
        } else {
          // No invoice — fallback redirect for reserved new admissions
          if (isNewAdmission && isReserved) {
            setTimeout(() => {
              router.push('/dashboard/seating');
            }, 1000);
          }
        }
      }

    } catch (err: any) {
      setErrorMsg(err.message || "Failed to record payment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Local real-time filtering of pre-loaded students list
  const filteredMembers = allMembers.filter(m => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || (
      m.full_name?.toLowerCase().includes(query) ||
      m.permanent_id?.toLowerCase().includes(query) ||
      (m.student_no && m.student_no.toLowerCase().includes(query)) ||
      m.mobile?.includes(query)
    );

    const today = new Date();
    const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const in3Days = new Date(todayZero.getTime() + 3 * 24 * 60 * 60 * 1000);

    const statusInfo = getMemberStatus(m);
    let matchesFilter = false;
    if (statusInfo.type === 'left') {
      matchesFilter = false;
    } else if (filterStatus === 'all') {
      matchesFilter = true;
    } else if (filterStatus === 'pending') {
      matchesFilter = statusInfo.type === 'pending';
    } else if (filterStatus === 'overdue') {
      matchesFilter = statusInfo.type === 'overdue';
    } else if (filterStatus === 'due-soon') {
      matchesFilter = statusInfo.type === 'due-soon';
    }
    return matchesSearch && matchesFilter;
  });

  const handleDeletePayment = async (payment: any) => {
    if (!confirm(`Are you sure you want to permanently delete this payment of ₹${payment.amount}?\n\nThis will remove the transaction, adjust the student's dues back, and void the linked invoice if applicable.`)) return;
    
    try {
      setIsSubmitting(true);
      let duesAdjustment = 0;
  
      if (payment.invoice_id) {
        const { data: inv } = await supabase.from('invoices').select('*').eq('id', payment.invoice_id).single();
        if (inv) {
          if (inv.paid_amount <= payment.amount) {
             await supabase.from('invoices').delete().eq('id', inv.id);
             const invTime = new Date(inv.created_at).getTime();
             const payTime = new Date(payment.created_at || payment.paid_at).getTime();
             const isSameTransaction = Math.abs(invTime - payTime) < 60000;
             if (isSameTransaction) {
               duesAdjustment = -inv.due_amount;
             } else {
               duesAdjustment = payment.amount;
             }
          } else {
             const newPaid = inv.paid_amount - payment.amount;
             const newDue = inv.due_amount + payment.amount;
             const newStatus = newDue > 0 ? 'partially_paid' : 'paid';
             await supabase.from('invoices').update({
               paid_amount: newPaid,
               due_amount: newDue,
               status: newStatus
             }).eq('id', inv.id);
             duesAdjustment = payment.amount;
          }
        } else {
          duesAdjustment = payment.amount;
        }
      } else {
        duesAdjustment = payment.amount;
      }
  
      if (selectedMember) {
        const newDues = Math.max(0, (selectedMember.outstanding_dues || 0) + duesAdjustment);
        const memberUpdate: any = {
          outstanding_dues: newDues,
          payment_status: newDues > 0 ? 'PENDING' : 'PAID',
          left_with_dues: newDues > 0 ? selectedMember.left_with_dues : false,
        };
        if (newDues > 0) memberUpdate.pay_later = true;
        await supabase.from('members').update(memberUpdate).eq('id', selectedMember.id);
        setSelectedMember({ ...selectedMember, ...memberUpdate });
        setMembers(prev => prev.map(m => m.id === selectedMember.id ? { ...m, ...memberUpdate } : m));
      }
  
      await supabase.from('payments').delete().eq('id', payment.id);
      logActivity(activeBranch, "payment_deleted", `Deleted payment of ₹${payment.amount} for ${selectedMember?.full_name}.`);
      if (selectedMember) {
        fetchPaymentsHistory(selectedMember.id);
      }
  
    } catch (err: any) {
      alert("Failed to delete payment: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <div className="relative mb-3">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, ID, mobile..."
                className="input-premium pl-9 w-full !rounded-xl"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-1.5 mb-4 border-b border-white/[0.04] pb-3">
              {[
                { key: 'all', label: 'All' },
                { key: 'pending', label: 'Pending' },
                { key: 'overdue', label: 'Overdue' },
                { key: 'due-soon', label: 'Due Soon' }
              ].map(t => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setFilterStatus(t.key as any)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${filterStatus === t.key
                      ? (t.key === 'overdue' ? 'bg-red-500/15 text-red-400 border-red-500/30 shadow-sm' :
                        t.key === 'due-soon' ? 'bg-orange-500/15 text-orange-400 border-orange-500/30 shadow-sm' :
                          t.key === 'pending' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-sm' :
                            'bg-primary/15 text-primary border-primary/20 shadow-sm')
                      : 'bg-white/[0.02] text-on-surface-variant border-white/[0.04] hover:bg-white/[0.04]'
                    }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Students List Box */}
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1" data-lenis-prevent="true">
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

                  const statusInfo = getMemberStatus(m);
                  let statusText = statusInfo.label;
                  let statusDotColor = "bg-emerald-500";
                  if (statusInfo.type === 'overdue') {
                    statusDotColor = "bg-red-500";
                  } else if (statusInfo.type === 'due-soon') {
                    statusDotColor = "bg-orange-500";
                  } else if (statusInfo.type === 'pending') {
                    statusDotColor = "bg-amber-400";
                  } else if (statusInfo.type === 'inactive') {
                    statusDotColor = "bg-slate-400";
                  } else if (statusInfo.type === 'left') {
                    statusDotColor = "bg-red-700";
                  }

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
                      className={`w-full flex justify-between items-center p-3 rounded-xl border text-left transition-all ${isSelected
                          ? "bg-blue-500/10 border-blue-500/30 shadow-inner"
                          : "bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.06] hover:border-white/[0.08]"
                        }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${statusDotColor}`} />
                        <div className="truncate">
                          <div className="flex items-center gap-1.5">
                            <span className="text-white font-bold text-xs truncate student-list-item-name">{m.full_name}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${statusText === 'Overdue' ? 'bg-red-500/15 text-red-400 border border-red-500/20' :
                                statusText === 'Due Soon' ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20' :
                                  statusText === 'Pending' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' :
                                    'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                              }`}>
                              {statusText}
                            </span>
                          </div>
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
                    <div className="flex gap-2">
                      <span className="badge badge-info text-[9px] mt-1 tracking-widest">{selectedMember.permanent_id}</span>
                      {selectedMember.student_no && (
                        <span className="badge bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[9px] mt-1 tracking-widest">
                          #{selectedMember.student_no}
                        </span>
                      )}
                    </div>
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
                  {selectedMember.outstanding_dues > 0 && (
                    <div className="bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 col-span-2">
                      <div className="text-[9px] text-amber-400 uppercase font-bold tracking-wider">Outstanding Dues</div>
                      <div className="font-black text-amber-300 mt-0.5 flex justify-between items-center text-sm">
                        <span>₹{selectedMember.outstanding_dues}</span>
                        <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider animate-pulse">Payment Pending</span>
                      </div>
                    </div>
                  )}
                  <div className="bg-white/[0.03] p-2.5 rounded-xl border border-white/[0.05] col-span-2">
                    <div className="text-[9px] text-on-surface-variant uppercase font-bold tracking-wider">Expiry / Valid Till</div>
                    <div className="font-bold text-white mt-0.5 flex justify-between items-center">
                      <span>
                        {selectedMember.subscription_end_date
                          ? new Date(selectedMember.subscription_end_date).toLocaleDateString()
                          : "Pending setup / Unpaid"}
                      </span>
                      {(() => {
                        const statusInfo = getMemberStatus(selectedMember);
                        return (
                          <span className={`${statusInfo.badgeClass} text-[9px]`}>
                            {statusInfo.label}
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
                  {selectedMember && (selectedMember.outstanding_dues || 0) > 0 && selectedMember.subscription_end_date && purpose !== "collect_dues" && (
                    <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3.5 rounded-xl text-xs font-semibold flex items-start gap-2.5 animate-fade-in-fast">
                      <span className="material-symbols-outlined text-base mt-0.5 shrink-0">warning</span>
                      <div>
                        <span className="font-bold">Outstanding Dues Warning:</span> This student has an active outstanding balance of <span className="underline">₹{selectedMember.outstanding_dues}</span>. Please settle these dues first or select <span className="font-bold">"Collect / Clear Outstanding Dues"</span> from the dropdown below to collect them.
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Purpose Select */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-on-surface-variant pl-0.5">Payment Purpose</label>
                      <select
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value as any)}
                        className="input-premium appearance-none w-full"
                      >
                        <option value="renewal">Plan Setup / Subscription Renewal (Full Pay)</option>
                        <option value="dues">Dues / Partial Payment / Pay Later</option>
                        {selectedMember && (selectedMember.outstanding_dues || 0) > 0 && (
                          <option value="collect_dues">Collect / Clear Outstanding Dues (₹{selectedMember.outstanding_dues})</option>
                        )}
                      </select>
                    </div>

                    {/* Shift Selector */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-on-surface-variant pl-0.5">Shift / Time Slot</label>
                      <select
                        value={shift}
                        onChange={(e) => {
                          const newShift = e.target.value;
                          setShift(newShift);
                          // Auto update basePrice to default for new shift
                          const defaultPrice = newShift === 'Full Day' ? 1000 : 600;
                          const isDays = renewDurationType === "Days";
                          setBasePrice(isDays ? Math.round(defaultPrice / 30) : defaultPrice);
                        }}
                        className="input-premium appearance-none w-full"
                      >
                        <option value="Morning">Morning Shift (₹600)</option>
                        <option value="Evening">Evening Shift (₹600)</option>
                        <option value="Full Day">Full Day Shift (₹1000)</option>
                      </select>
                    </div>

                    {/* Amount Paid */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-on-surface-variant pl-0.5">Amount Paid (₹)</label>
                      <input
                        type="number"
                        min="0"
                        required
                        disabled={purpose === "renewal" || payLater}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))}
                        className={`input-premium w-full ${purpose === "renewal" || payLater ? "opacity-60 cursor-not-allowed" : ""}`}
                        placeholder="e.g. 1000"
                      />
                      {purpose === "dues" && !payLater && (Number(amount) === 0 || amount === "") && (
                        <div className="text-[10px] text-amber-400 font-semibold pl-0.5 pt-0.5 animate-fade-in-fast flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">warning</span>
                          Enable 'Pay Later' to defer payment.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Shifted Pricing & Payment Details section */}
                  {(purpose === "renewal" || purpose === "dues") && (
                    <div className="p-5 bg-white/[0.01] border border-amber-200 rounded-2xl space-y-5 animate-scale-in">
                      <div className="flex items-center gap-2 text-amber-700 text-[10px] font-bold uppercase tracking-wider">
                        <span className="material-symbols-outlined text-xs">tune</span>
                        Pricing & Plan Duration Details
                      </div>

                      {/* Duration period type picker */}
                      <div className="space-y-2">
                        <label className="text-[9px] uppercase font-bold text-on-surface-variant">Duration Period Type</label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleDurationTypeChange("Months")}
                            className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all border ${renewDurationType === "Months"
                                ? "bg-[#003178] text-white border-[#003178]"
                                : "bg-slate-200 hover:bg-slate-300 text-slate-800 border-slate-300"
                              }`}
                          >
                            Months System
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDurationTypeChange("Days")}
                            className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all border ${renewDurationType === "Days"
                                ? "bg-[#003178] text-white border-[#003178]"
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
                                className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all border ${!renewIsCustomDuration && renewDuration === m
                                    ? "bg-[#003178] text-white border-[#003178]"
                                    : "bg-slate-200 hover:bg-slate-300 text-slate-800 border-slate-300"
                                  }`}
                              >
                                {m}M
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => setRenewIsCustomDuration(true)}
                              className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all border ${renewIsCustomDuration
                                  ? "bg-[#003178] text-white border-[#003178]"
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

                      {/* Base price & Discount configs */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold text-on-surface-variant block">
                            Base Plan Price (₹/{finalDurationType === "Days" ? "day" : "mo"})
                          </label>
                          <input
                            type="number"
                            min="0"
                            required
                            value={basePrice}
                            onChange={(e) => setBasePrice(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))}
                            className="input-premium !py-1.5 !text-xs w-full"
                            placeholder="e.g. 1000"
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
                          {finalDurationType === "Days" ? (
                            <span>
                              Calculated: ₹{basePriceVal.toLocaleString('en-IN')}/day * {durationDaysVal} day(s) - ₹{discountVal.toLocaleString('en-IN')} (Discount)
                            </span>
                          ) : (
                            <span>
                              Calculated: ₹{basePriceVal.toLocaleString('en-IN')}/mo * {durationMonths} month(s) - ₹{discountVal.toLocaleString('en-IN')} (Discount)
                            </span>
                          )}
                        </div>
                        <div className="font-bold text-emerald-400">
                          <span>Total Payable: ₹{calculatedTotal.toLocaleString('en-IN')}</span>
                        </div>
                      </div>

                      {/* Pay Later Option Toggle */}
                      {purpose === "dues" && (
                        <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                          <div className="space-y-0.5">
                            <label className="text-xs font-bold text-white block">Pay Later / Defer Payment</label>
                            <span className="text-[10px] text-on-surface-variant">Activate plan validity now, schedule payment manually</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPayLater(!payLater)}
                            className={`w-11 h-6 rounded-full transition-all relative ${payLater ? "bg-primary shadow-[0_0_10px_rgba(0,49,120,0.3)]" : "bg-slate-300"
                              }`}
                          >
                            <div
                              className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${payLater ? "right-1" : "left-1"
                                }`}
                            />
                          </button>
                        </div>
                      )}

                      {purpose === "dues" && (payLater || (Number(amount) || 0) < calculatedTotal) && (
                        <div className="space-y-1.5 w-full animate-fade-in-fast">
                          <label className="text-[10px] uppercase font-bold text-on-surface-variant block pl-0.5">Payment Due Date</label>
                          <input
                            type="date"
                            required
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="input-premium w-full !py-2.5"
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5 w-full">
                          <label className="text-[10px] uppercase font-bold text-on-surface-variant block pl-0.5">Joining Date / Start</label>
                          <input
                            type="date"
                            required
                            value={joiningDate}
                            onChange={(e) => setJoiningDate(e.target.value)}
                            className="input-premium w-full !py-2.5 !text-xs font-semibold"
                          />
                        </div>

                        <div className="space-y-1.5 w-full">
                          <label className="text-[10px] uppercase font-bold text-on-surface-variant block pl-0.5">New Validity Expiry Date</label>
                          <input
                            type="date"
                            required
                            value={customExpiryDate}
                            onChange={(e) => setCustomExpiryDate(e.target.value)}
                            className="input-premium w-full !py-2.5 !text-xs font-semibold"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {purpose === "collect_dues" && selectedMember && (
                    <div className="p-5 bg-white/[0.01] border border-emerald-500/20 rounded-2xl space-y-4 animate-scale-in">
                      <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                        <span className="material-symbols-outlined text-xs">info</span>
                        Dues Settlement Details
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="bg-white/[0.02] p-3 rounded-xl border border-white/[0.04]">
                          <div className="text-[9px] text-on-surface-variant uppercase font-bold tracking-wider">Total Dues Outstanding</div>
                          <div className="font-bold text-white mt-0.5">₹{(selectedMember.outstanding_dues || 0).toLocaleString('en-IN')}</div>
                        </div>
                        <div className="bg-white/[0.02] p-3 rounded-xl border border-white/[0.04]">
                          <div className="text-[9px] text-on-surface-variant uppercase font-bold tracking-wider">Remaining Dues After Payment</div>
                          <div className="font-bold text-emerald-400 mt-0.5">
                            ₹{Math.max(0, (selectedMember.outstanding_dues || 0) - (Number(amount) || 0)).toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

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
                    disabled={isSubmitting}
                    type="submit"
                    className="w-full btn-primary py-3.5 flex justify-center items-center gap-2 disabled:opacity-50 font-bold"
                  >
                    {isSubmitting ? (
                      <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                    ) : (
                      <span className="material-symbols-outlined text-sm">save_alt</span>
                    )}
                    {isSubmitting ? "Processing..." : purpose === "collect_dues" ? "Record Dues Payment" : payLater ? "Activate Plan (Pay Later)" : "Record Payment & Activate Plan"}
                  </button>
                </form>
              </div>

              {/* Historical Payments Ledger */}
              <div className="glass-pane-elevated !p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-base font-bold text-white font-manrope flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-lg">receipt_long</span>
                    Payments Ledger History
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-on-surface-variant">Sort By</span>
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as any)}
                      className="bg-white/[0.04] border border-white/[0.08] hover:border-primary/50 text-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary font-manrope font-semibold"
                    >
                      <option value="latest" className="bg-slate-900 text-white">Latest First</option>
                      <option value="oldest" className="bg-slate-900 text-white">Oldest First</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-white/[0.04]">
                  <table className="w-full text-left text-xs table-premium">
                    <thead>
                      <tr>
                        <th>Date Paid</th>
                        <th>Amount</th>
                        <th>Mode</th>
                        <th>Transaction details / Notes</th>
                        <th className="text-right">Actions</th>
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
                        (() => {
                          const sorted = [...paymentsHistory].sort((a, b) => {
                            const dateA = new Date(a.paid_at || a.created_at).getTime();
                            const dateB = new Date(b.paid_at || b.created_at).getTime();
                            if (dateA !== dateB) {
                              return sortOrder === "latest" ? dateB - dateA : dateA - dateB;
                            }
                            const timeA = new Date(a.created_at || 0).getTime();
                            const timeB = new Date(b.created_at || 0).getTime();
                            if (timeA !== timeB) {
                              return sortOrder === "latest" ? timeB - timeA : timeA - timeB;
                            }
                            const idA = String(a.id || "");
                            const idB = String(b.id || "");
                            return sortOrder === "latest" ? idB.localeCompare(idA) : idA.localeCompare(idB);
                          });
                          return sorted.map(p => (
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
                              <td className="text-right">
                                <button 
                                  onClick={() => handleDeletePayment(p)}
                                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors group"
                                  title="Delete Payment"
                                >
                                  <span className="material-symbols-outlined text-[16px]">delete</span>
                                </button>
                              </td>
                            </tr>
                          ));
                        })()
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
