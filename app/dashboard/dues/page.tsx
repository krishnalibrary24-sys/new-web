"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { useBranch } from "@/components/branch-context";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from 'framer-motion';
import { getLibrarySetting } from "@/lib/settings";

export default function DuesPage() {
  const { activeBranch } = useBranch();
  const branchName = activeBranch === 'namnakala' ? 'Namnakala' : 'Bangali Chowk';

  const [invoiceDues, setInvoiceDues] = useState<any[]>([]);
  const [dueSoon, setDueSoon] = useState<any[]>([]);
  const [defaulters, setDefaulters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  // Active Tab State
  const [activeTab, setActiveTab] = useState<'pending-invoices' | 'due-soon' | 'defaulters'>('pending-invoices');

  // Search & Sorting States
  const [searchInvoice, setSearchInvoice] = useState('');
  const [searchDueSoon, setSearchDueSoon] = useState('');
  const [searchDefaulters, setSearchDefaulters] = useState('');
  const [sortInvoiceBy, setSortInvoiceBy] = useState<'due-date' | 'amount-desc' | 'name-asc'>('due-date');
  const [sortDueSoonBy, setSortDueSoonBy] = useState<'due-date' | 'name-asc'>('due-date');
  const [sortDefaultersBy, setSortDefaultersBy] = useState<'due-date' | 'name-asc'>('due-date');

  // Collect Due Modal States
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [collectAmount, setCollectAmount] = useState<number | "">("");
  const [collectMode, setCollectMode] = useState("Cash");
  const [collectDate, setCollectDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [collectNotes, setCollectNotes] = useState("");
  const [collectSubmitting, setCollectSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // 1. Fetch expiring soon and defaulters members
    const { data: membersData } = await supabase
      .from('members')
      .select('*')
      .eq('branch', activeBranch)
      .order('subscription_end_date', { ascending: true });

    if (membersData) {
      setDueSoon(membersData.filter(m => {
        if (!m.is_active || !m.subscription_end_date) return false;
        const end = new Date(m.subscription_end_date);
        return end >= now && end <= in3Days;
      }));
      setDefaulters(membersData.filter(m => !m.is_active || (m.is_active && m.subscription_end_date && new Date(m.subscription_end_date) < now)));
    }

    // 2. Fetch invoice dues
    const { data: invoicesData } = await supabase
      .from('invoices')
      .select('*, member:members(*)')
      .gt('due_amount', 0)
      .order('due_date', { ascending: true });

    if (invoicesData) {
      const branchDues = invoicesData.filter(inv => inv.member && inv.member.branch === activeBranch);
      setInvoiceDues(branchDues);
    }

    setLoading(false);
  }, [activeBranch]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getDaysOverdue = (dateStr: string) => {
    return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  };

  const getDaysLeft = (dateStr: string) => {
    return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  // Trigger dues payment
  const openCollectModal = (invoice: any) => {
    setSelectedInvoice(invoice);
    setCollectAmount(invoice.due_amount);
    setCollectMode("Cash");
    setCollectDate(new Date().toISOString().split('T')[0]);
    setCollectNotes("");
    setModalError(null);
    setShowCollectModal(true);
  };

  const handleCollectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setCollectSubmitting(true);
    setModalError(null);

    try {
      const amt = Number(collectAmount) || 0;
      if (amt <= 0) {
        throw new Error("Amount must be greater than zero.");
      }
      if (amt > Number(selectedInvoice.due_amount)) {
        throw new Error(`Amount cannot exceed the pending due of ₹${selectedInvoice.due_amount}`);
      }

      const newPaidAmount = Number(selectedInvoice.paid_amount) + amt;
      const newDueAmount = Math.max(0, Number(selectedInvoice.due_amount) - amt);
      const newStatus = newDueAmount === 0 ? 'paid' : 'partially_paid';

      // 1. Update Invoice record
      const { error: invoiceErr } = await supabase
        .from('invoices')
        .update({
          paid_amount: newPaidAmount,
          due_amount: newDueAmount,
          status: newStatus
        })
        .eq('id', selectedInvoice.id);

      if (invoiceErr) throw new Error(invoiceErr.message);

      // 2. Insert Payment record
      const { error: paymentErr } = await supabase
        .from('payments')
        .insert([{
          member_id: selectedInvoice.member_id,
          invoice_id: selectedInvoice.id,
          amount: amt,
          branch: activeBranch,
          payment_mode: collectMode,
          paid_at: new Date(collectDate).toISOString(),
          notes: collectNotes.trim() || `Dues payment of ₹${amt} received.`
        }]);

      if (paymentErr) throw new Error(paymentErr.message);

      // 3. Fetch remaining due amount for the member across all invoices
      const { data: memberDues } = await supabase
        .from('invoices')
        .select('due_amount')
        .eq('member_id', selectedInvoice.member_id);
      
      const totalRemainingDues = memberDues 
        ? memberDues.reduce((sum, inv) => sum + Number(inv.due_amount), 0)
        : 0;

      // 4. Update Member's pay_later & payment_due_date flags
      const { error: memberErr } = await supabase
        .from('members')
        .update({
          pay_later: totalRemainingDues > 0,
          payment_due_date: totalRemainingDues > 0 ? selectedInvoice.due_date : null
        })
        .eq('id', selectedInvoice.member_id);

      if (memberErr) throw new Error(memberErr.message);

      // Refresh data & close modal
      await fetchData();
      setShowCollectModal(false);
      setSelectedInvoice(null);
      setCollectAmount("");
      setCollectNotes("");
    } catch (err: any) {
      setModalError(err.message || "Something went wrong.");
    } finally {
      setCollectSubmitting(false);
    }
  };

  const sendWhatsApp = async (member: any, type: 'reminder' | 'overdue' | 'invoice-dues', extraData?: any) => {
    const mobile = member.mobile.replace(/[^0-9]/g, '');
    let msg = "";
    
    if (type === 'reminder') {
      const endDate = new Date(member.subscription_end_date).toLocaleDateString();
      const template = await getLibrarySetting(
        "due_soon_msg",
        "Dear {name},\n\nThis is a friendly reminder that your Krishna Library subscription expires in 3 days on {expiry}.\n\nPlease renew to secure your seat (#{seat}).\n\nRegards,\nKrishna Library"
      );
      msg = template
        .replace(/{name}/g, member.full_name)
        .replace(/{seat}/g, member.seat_no || 'Unassigned')
        .replace(/{expiry}/g, endDate);
    } else if (type === 'overdue') {
      const endDate = new Date(member.subscription_end_date).toLocaleDateString();
      const template = await getLibrarySetting(
        "overdue_msg",
        "Dear {name},\n\nYour payment of {amount} is overdue since {due_date}. Please clear your dues immediately to avoid seat cancellation.\n\nRegards,\nKrishna Library"
      );
      msg = template
        .replace(/{name}/g, member.full_name)
        .replace(/{amount}/g, `₹${member.plan_amount || '600'}`)
        .replace(/{due_date}/g, endDate);
    } else if (type === 'invoice-dues') {
      const dueAmt = extraData?.due_amount || '0';
      const dueDateStr = extraData?.due_date ? new Date(extraData.due_date).toLocaleDateString() : 'Immediate';
      const template = await getLibrarySetting(
        "invoice_msg",
        "Dear {name},\n\nYour invoice of {amount} has been generated. Due date: {due_date}.\n\nThank you for choosing Krishna Library."
      );
      msg = template
        .replace(/{name}/g, member.full_name)
        .replace(/{amount}/g, `₹${dueAmt}`)
        .replace(/{due_date}/g, dueDateStr);
    }

    window.open(`https://wa.me/${mobile}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const reactivateMember = async (member: any) => {
    setActionId(member.id);
    const newEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    
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

    await supabase.from('members').update({ 
      is_active: true, 
      subscription_end_date: newEnd,
      seat_no: seatToAllot,
      previous_seat_no: prevSeatVal
    }).eq('id', member.id);
    
    await fetchData();
    setActionId(null);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
      <span className="text-sm text-on-surface-variant font-medium">Loading dues dashboard...</span>
    </div>
  );

  // Sorting and Filtering Logics
  const sortedInvoiceDues = [...invoiceDues].filter(inv => 
    inv.member?.full_name.toLowerCase().includes(searchInvoice.toLowerCase()) || 
    inv.member?.permanent_id?.toLowerCase().includes(searchInvoice.toLowerCase())
  ).sort((a, b) => {
    if (sortInvoiceBy === 'name-asc') return a.member?.full_name.localeCompare(b.member?.full_name);
    if (sortInvoiceBy === 'amount-desc') return Number(b.due_amount) - Number(a.due_amount);
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  });

  const sortedDueSoon = [...dueSoon].filter(m => 
    m.full_name.toLowerCase().includes(searchDueSoon.toLowerCase()) || 
    m.permanent_id?.toLowerCase().includes(searchDueSoon.toLowerCase())
  ).sort((a, b) => {
    if (sortDueSoonBy === 'name-asc') return a.full_name.localeCompare(b.full_name);
    return new Date(a.subscription_end_date).getTime() - new Date(b.subscription_end_date).getTime();
  });

  const sortedDefaulters = [...defaulters].filter(m => 
    m.full_name.toLowerCase().includes(searchDefaulters.toLowerCase()) || 
    m.permanent_id?.toLowerCase().includes(searchDefaulters.toLowerCase())
  ).sort((a, b) => {
    if (sortDefaultersBy === 'name-asc') return a.full_name.localeCompare(b.full_name);
    return new Date(a.subscription_end_date).getTime() - new Date(b.subscription_end_date).getTime();
  });

  const getInvoiceStatus = (dueDateStr: string | null) => {
    if (!dueDateStr) return { label: 'Pending', colorClass: 'bg-amber-500/10 border-amber-500/20 text-amber-400' };
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueDate = new Date(dueDateStr);
    const dueDateZero = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    
    if (dueDateZero < today) {
      return { label: 'Overdue', colorClass: 'bg-red-500/10 border border-red-500/20 text-red-400' };
    }
    
    const diffTime = dueDateZero.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 3) {
      return { label: 'Due Soon', colorClass: 'bg-orange-500/10 border border-orange-500/20 text-orange-400' };
    }
    
    return { label: 'Pending', colorClass: 'bg-[#fdac29]/10 border border-[#fdac29]/20 text-[#fdac29]' };
  };

  const overdueInvoicesCount = invoiceDues.filter(inv => {
    if (!inv.due_date) return false;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dDate = new Date(inv.due_date);
    return new Date(dDate.getFullYear(), dDate.getMonth(), dDate.getDate()) < today;
  }).length;

  const dueSoonInvoicesCount = invoiceDues.filter(inv => {
    if (!inv.due_date) return false;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dDate = new Date(inv.due_date);
    const dDateZero = new Date(dDate.getFullYear(), dDate.getMonth(), dDate.getDate());
    if (dDateZero < today) return false;
    const diffTime = dDateZero.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3;
  }).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dues & Defaulters</h1>
          <p className="page-subtitle">Installments and subscription lifecycle tracking for {branchName} Branch</p>
        </div>
        <div className="flex gap-3">
          <div className="glass-pane-elevated !p-3 text-center min-w-[120px] border-[#fdac29]/20 flex flex-col justify-center items-center">
            <div className="text-xl font-black text-[#fdac29]">{invoiceDues.length}</div>
            <div className="text-[10px] text-[#fdac29] uppercase font-bold tracking-wider">Pending Dues</div>
            {(overdueInvoicesCount > 0 || dueSoonInvoicesCount > 0) && (
              <div className="text-[8px] font-bold mt-1 flex gap-1.5 justify-center">
                {overdueInvoicesCount > 0 && <span className="text-red-400 bg-red-500/10 px-1 rounded">{overdueInvoicesCount} Overdue</span>}
                {dueSoonInvoicesCount > 0 && <span className="text-orange-400 bg-orange-500/10 px-1 rounded">{dueSoonInvoicesCount} Soon</span>}
              </div>
            )}
          </div>
          <div className="glass-pane-elevated !p-3 text-center min-w-[100px] border-tertiary/20 flex flex-col justify-center items-center">
            <div className="text-xl font-black text-tertiary">{dueSoon.length}</div>
            <div className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Due Soon</div>
          </div>
          <div className="glass-pane-elevated !p-3 text-center min-w-[100px] border-red-500/20 flex flex-col justify-center items-center">
            <div className="text-xl font-black text-red-400">{defaulters.length}</div>
            <div className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Defaulters</div>
          </div>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-white/[0.06] gap-2">
        <button
          onClick={() => setActiveTab('pending-invoices')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'pending-invoices'
              ? 'border-[#fdac29] text-[#fdac29]'
              : 'border-transparent text-on-surface-variant hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-base">payments</span>
          Pending Dues ({invoiceDues.length})
        </button>
        <button
          onClick={() => setActiveTab('due-soon')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'due-soon'
              ? 'border-tertiary text-tertiary'
              : 'border-transparent text-on-surface-variant hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-base">schedule</span>
          Expiring Soon ({dueSoon.length})
        </button>
        <button
          onClick={() => setActiveTab('defaulters')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'defaulters'
              ? 'border-red-500 text-red-400'
              : 'border-transparent text-on-surface-variant hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-base">warning</span>
          Defaulters ({defaulters.length})
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {/* Tab 1: Pending Invoices */}
        {activeTab === 'pending-invoices' && (
          <div className="glass-pane-elevated !p-0 overflow-hidden !border-[#fdac29]/15">
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between gap-3 bg-[#fdac29]/[0.02]">
              <div className="flex items-center gap-3">
                <div className="stat-icon w-9 h-9 bg-[#fdac29]/10 border border-[#fdac29]/20 flex items-center justify-center rounded-xl">
                  <span className="material-symbols-outlined text-base text-[#fdac29]">payments</span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-white font-manrope">Pending Dues & Installments</h2>
                  <p className="text-xs text-on-surface-variant">{invoiceDues.length} invoice(s) awaiting payments</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 px-2 py-1.5 rounded-xl border border-slate-200">
                <span className="material-symbols-outlined text-slate-500 text-sm pl-1">sort</span>
                <select 
                  value={sortInvoiceBy}
                  onChange={(e) => setSortInvoiceBy(e.target.value as any)}
                  className="bg-transparent text-slate-700 text-xs font-semibold focus:outline-none pr-3 cursor-pointer appearance-none [&>option]:bg-white [&>option]:text-slate-800"
                >
                  <option value="due-date">Due Date</option>
                  <option value="amount-desc">Dues (High-Low)</option>
                  <option value="name-asc">Name (A-Z)</option>
                </select>
              </div>
            </div>
            <div className="px-5 py-3 border-b border-white/[0.06] bg-black/10">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
                <input
                  type="text"
                  value={searchInvoice}
                  onChange={e => setSearchInvoice(e.target.value)}
                  placeholder="Search by student name or ID..."
                  className="w-full bg-white/[0.02] border border-white/[0.06] rounded-lg py-2 pl-9 pr-3 text-sm text-white placeholder:text-on-surface-variant focus:outline-none focus:border-[#fdac29]/40 transition-colors"
                />
              </div>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[550px] overflow-y-auto pr-2" data-lenis-prevent>
              {invoiceDues.length === 0 ? (
                <div className="col-span-2 empty-state !py-12">
                  <span className="material-symbols-outlined text-4xl text-emerald-400/40 mb-3">check_circle</span>
                  <div className="text-sm font-medium text-emerald-400/70">All dues cleared! No pending installments.</div>
                </div>
              ) : sortedInvoiceDues.map(inv => (
                <div key={inv.id} className="bg-white/[0.02] p-4 rounded-xl border border-[#fdac29]/10 hover:border-[#fdac29]/25 transition-all flex flex-col justify-between gap-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-white font-bold text-sm">{inv.member?.full_name}</div>
                      <div className="text-xs text-primary font-bold mt-0.5">{inv.member?.permanent_id}</div>
                      <div className="text-xs text-on-surface-variant mt-1.5 flex flex-col gap-0.5">
                        <span>📞 {inv.member?.mobile}</span>
                        <span>🪑 Seat: {inv.member?.seat_no || 'N/A'} · {inv.member?.shift}</span>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1.5">
                      <span className="badge badge-warning text-[10px] tracking-wider uppercase font-bold py-1 px-2.5">
                        ₹{inv.due_amount?.toLocaleString('en-IN')} Due
                      </span>
                      {(() => {
                        const status = getInvoiceStatus(inv.due_date);
                        return (
                          <span className={`text-[9px] uppercase font-black tracking-wider px-2 py-0.5 rounded ${status.colorClass}`}>
                            {status.label}
                          </span>
                        );
                      })()}
                      <div className="text-[10px] text-on-surface-variant mt-0.5">
                        Deadline: {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : 'Immediate'}
                      </div>
                    </div>
                  </div>

                  {/* Summary Bar */}
                  <div className="bg-white/[0.02] border border-white/[0.04] p-2.5 rounded-lg flex justify-between text-xs">
                    <div>Total Fee: <span className="text-white font-bold">₹{inv.total_amount}</span></div>
                    <div>Paid: <span className="text-emerald-400 font-bold">₹{inv.paid_amount}</span></div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => sendWhatsApp(inv.member, 'invoice-dues', inv)}
                      className="flex-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 border border-emerald-500/15 hover:border-emerald-500"
                    >
                      <span className="material-symbols-outlined text-sm">send</span>
                      Send Reminder
                    </button>
                    <button
                      onClick={() => openCollectModal(inv)}
                      className="flex-1 bg-primary/10 text-primary hover:bg-primary hover:text-on-primary transition-all text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 border border-primary/15 hover:border-primary"
                    >
                      <span className="material-symbols-outlined text-sm">payments</span>
                      Collect Dues
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Expiring Soon */}
        {activeTab === 'due-soon' && (
          <div className="glass-pane-elevated !p-0 overflow-hidden !border-tertiary/15 animate-fade-in-fast">
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between gap-3 bg-tertiary/[0.02]">
              <div className="flex items-center gap-3">
                <div className="stat-icon stat-icon-warning w-9 h-9">
                  <span className="material-symbols-outlined text-base">schedule</span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-white font-manrope">Expiring Soon</h2>
                  <p className="text-xs text-on-surface-variant">{dueSoon.length} member(s) due within 3 days</p>
                </div>
              </div>
              <select 
                value={sortDueSoonBy}
                onChange={(e) => setSortDueSoonBy(e.target.value as any)}
                className="bg-transparent text-slate-700 text-xs font-semibold focus:outline-none pr-3 cursor-pointer appearance-none [&>option]:bg-white [&>option]:text-slate-800"
              >
                <option value="due-date">Due Date</option>
                <option value="name-asc">Name (A-Z)</option>
              </select>
            </div>
            <div className="px-5 py-3 border-b border-white/[0.06] bg-black/10">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
                <input
                  type="text"
                  value={searchDueSoon}
                  onChange={e => setSearchDueSoon(e.target.value)}
                  placeholder="Search expiring members..."
                  className="w-full bg-white/[0.02] border border-white/[0.06] rounded-lg py-2 pl-9 pr-3 text-sm text-white placeholder:text-on-surface-variant focus:outline-none focus:border-tertiary/40 transition-colors"
                />
              </div>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[550px] overflow-y-auto pr-2" data-lenis-prevent>
              {dueSoon.length === 0 ? (
                <div className="col-span-2 empty-state !py-12">
                  <span className="material-symbols-outlined text-4xl text-emerald-400/40 mb-3">check_circle</span>
                  <div className="text-sm font-medium text-emerald-400/70">All clear! No expiring subscriptions.</div>
                </div>
              ) : sortedDueSoon.map(m => (
                <DueMemberCard
                  key={m.id}
                  member={m}
                  type="warning"
                  badgeText={`${getDaysLeft(m.subscription_end_date)}d left`}
                  badgeClass="badge-warning"
                  dateLabel={new Date(m.subscription_end_date).toLocaleDateString()}
                  onMessage={() => sendWhatsApp(m, 'reminder')}
                  onRenew={() => reactivateMember(m)}
                  messageLabel="Send Reminder"
                  renewLabel="Renew Now"
                  isLoading={actionId === m.id}
                />
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Defaulters */}
        {activeTab === 'defaulters' && (
          <div className="glass-pane-elevated !p-0 overflow-hidden !border-red-500/15 animate-fade-in-fast">
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between gap-3 bg-red-500/[0.02]">
              <div className="flex items-center gap-3">
                <div className="stat-icon stat-icon-danger w-9 h-9">
                  <span className="material-symbols-outlined text-base">warning</span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-white font-manrope">Overdue Defaulters</h2>
                  <p className="text-xs text-on-surface-variant">{defaulters.length} inactive member(s)</p>
                </div>
              </div>
              <select 
                value={sortDefaultersBy}
                onChange={(e) => setSortDefaultersBy(e.target.value as any)}
                className="bg-transparent text-slate-700 text-xs font-semibold focus:outline-none pr-3 cursor-pointer appearance-none [&>option]:bg-white [&>option]:text-slate-800"
              >
                <option value="due-date">Due Date</option>
                <option value="name-asc">Name (A-Z)</option>
              </select>
            </div>
            <div className="px-5 py-3 border-b border-white/[0.06] bg-black/10">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
                <input
                  type="text"
                  value={searchDefaulters}
                  onChange={e => setSearchDefaulters(e.target.value)}
                  placeholder="Search defaulters..."
                  className="w-full bg-white/[0.02] border border-white/[0.06] rounded-lg py-2 pl-9 pr-3 text-sm text-white placeholder:text-on-surface-variant focus:outline-none focus:border-red-500/40 transition-colors"
                />
              </div>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[550px] overflow-y-auto pr-2" data-lenis-prevent>
              {defaulters.length === 0 ? (
                <div className="col-span-2 empty-state !py-12">
                  <span className="material-symbols-outlined text-4xl text-emerald-400/40 mb-3">verified</span>
                  <div className="text-sm font-medium text-emerald-400/70">No defaulters! All members active.</div>
                </div>
              ) : sortedDefaulters.map(m => (
                <DueMemberCard
                  key={m.id}
                  member={m}
                  type="danger"
                  badgeText={`${getDaysOverdue(m.subscription_end_date)}d overdue`}
                  badgeClass="badge-danger"
                  dateLabel={`Expired: ${new Date(m.subscription_end_date).toLocaleDateString()}`}
                  onMessage={() => sendWhatsApp(m, 'overdue')}
                  onRenew={() => reactivateMember(m)}
                  messageLabel="Chase Up"
                  renewLabel="Re-activate"
                  isLoading={actionId === m.id}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Collect Due Modal */}
      <AnimatePresence>
        {showCollectModal && selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCollectModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="glass-pane-elevated max-w-md w-full relative z-10 overflow-hidden !rounded-2xl border border-[#fdac29]/20 shadow-2xl p-6"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowCollectModal(false)}
                className="absolute right-4 top-4 w-8 h-8 rounded-full flex items-center justify-center bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.1] transition-all text-white"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>

              <form onSubmit={handleCollectSubmit} className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#fdac29]/15 border border-[#fdac29]/20 flex items-center justify-center rounded-xl">
                    <span className="material-symbols-outlined text-lg text-[#fdac29]">payments</span>
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white font-manrope">Collect Pending Dues</h3>
                    <p className="text-xs text-on-surface-variant">{selectedInvoice.member?.full_name}</p>
                  </div>
                </div>

                <div className="border-t border-white/[0.06] pt-3" />

                {modalError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs font-semibold flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">error</span>
                    {modalError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl text-xs">
                  <div>
                    <span className="text-on-surface-variant block">Total Due Balance</span>
                    <span className="text-white font-bold text-sm">₹{selectedInvoice.due_amount}</span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant block">Total Paid So Far</span>
                    <span className="text-emerald-400 font-bold text-sm">₹{selectedInvoice.paid_amount}</span>
                  </div>
                </div>

                {/* Amount to Collect */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-on-surface-variant pl-0.5">Amount Received Now (₹)</label>
                  <input
                    type="number"
                    min="1"
                    max={selectedInvoice.due_amount}
                    required
                    value={collectAmount}
                    onChange={(e) => setCollectAmount(e.target.value === "" ? "" : Math.min(Number(selectedInvoice.due_amount), Math.max(1, Number(e.target.value))))}
                    className="input-premium w-full"
                    placeholder="e.g. 500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Payment Mode */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-on-surface-variant pl-0.5">Payment Mode</label>
                    <select
                      value={collectMode}
                      onChange={(e) => setCollectMode(e.target.value)}
                      className="input-premium appearance-none w-full"
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Card">Card</option>
                      <option value="Online">Online</option>
                    </select>
                  </div>

                  {/* Date */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-on-surface-variant pl-0.5">Date Paid</label>
                    <input
                      type="date"
                      required
                      value={collectDate}
                      onChange={(e) => setCollectDate(e.target.value)}
                      className="input-premium w-full"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-on-surface-variant pl-0.5">Receipt Notes / Transaction Details</label>
                  <input
                    type="text"
                    value={collectNotes}
                    onChange={(e) => setCollectNotes(e.target.value)}
                    placeholder="e.g. Cleared remaining admission fees"
                    className="input-premium w-full"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    disabled={collectSubmitting}
                    type="submit"
                    className="flex-1 btn-primary py-3 text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    {collectSubmitting && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
                    {collectSubmitting ? "Processing..." : "Confirm & Save Payment"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCollectModal(false)}
                    className="px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DueMemberCard({ member, type, badgeText, badgeClass, dateLabel, onMessage, onRenew, messageLabel, renewLabel, isLoading }: {
  member: any; type: 'warning' | 'danger'; badgeText: string; badgeClass: string;
  dateLabel: string; onMessage: () => void; onRenew: () => void;
  messageLabel: string; renewLabel: string; isLoading: boolean;
}) {
  const borderColor = type === 'warning' ? 'border-tertiary/10 hover:border-tertiary/25' : 'border-red-500/10 hover:border-red-500/25';
  const bgColor = type === 'warning' ? 'bg-tertiary/[0.03]' : 'bg-red-500/[0.03]';

  return (
    <div className={`${bgColor} p-4 rounded-xl border ${borderColor} transition-colors flex flex-col justify-between gap-4`}>
      <div className="flex justify-between items-start">
        <div>
          <div className="text-white font-semibold text-sm">{member.full_name}</div>
          <div className="text-xs text-primary font-medium mt-0.5">{member.permanent_id}</div>
          <div className="text-xs text-on-surface-variant mt-1.5">📞 {member.mobile} · Seat {member.seat_no || 'N/A'}</div>
        </div>
        <div className="text-right">
          <span className={`badge ${badgeClass}`}>{badgeText}</span>
          <div className="text-[10px] text-on-surface-variant mt-1.5">{dateLabel}</div>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onMessage}
          className="flex-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all text-xs font-semibold py-2 rounded-lg flex items-center justify-center gap-1.5 border border-emerald-500/15 hover:border-emerald-500"
        >
          <span className="material-symbols-outlined text-sm">send</span>
          {messageLabel}
        </button>
        <button
          disabled={isLoading}
          onClick={onRenew}
          className="flex-1 bg-primary/10 text-primary hover:bg-primary hover:text-on-primary transition-all text-xs font-semibold py-2 rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-50 border border-primary/15 hover:border-primary"
        >
          {isLoading
            ? <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
            : <span className="material-symbols-outlined text-sm">autorenew</span>
          }
          {renewLabel}
        </button>
      </div>
    </div>
  );
}
