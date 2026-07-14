"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { useBranch } from "@/components/branch-context";
import { supabase } from "@/lib/supabase";
import { useRouter } from 'next/navigation';
import { getMemberStatus, checkAndReleaseSeats } from "@/lib/utils";
import { logActivity } from "@/lib/activity";
import { getTemplate, parseTemplate, formatWhatsAppNumber } from "@/lib/whatsapp";

export default function DuesPage() {
  const { activeBranch } = useBranch();
  const branchName = activeBranch === 'namnakala' ? 'Namnakala' : 'Bengali Chowk';
  const router = useRouter();

  const [dueSoon, setDueSoon] = useState<any[]>([]);
  const [defaulters, setDefaulters] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  
  const [sortDueSoonBy, setSortDueSoonBy] = useState<'due-date' | 'name-asc'>('due-date');
  const [sortDefaultersBy, setSortDefaultersBy] = useState<'due-date' | 'name-asc'>('due-date');
  const [sortPendingBy, setSortPendingBy] = useState<'due-date' | 'name-asc'>('due-date');
  
  const [searchDueSoon, setSearchDueSoon] = useState('');
  const [searchDefaulters, setSearchDefaulters] = useState('');
  const [searchPending, setSearchPending] = useState('');
  const [duesTab, setDuesTab] = useState<'due-soon' | 'overdue' | 'pending'>('due-soon');

  useEffect(() => {
    let active = true;
    
    async function fetchData() {
      setLoading(true);
      const { data } = await supabase
        .from('members')
        .select('*')
        .eq('branch', activeBranch)
        .order('subscription_end_date', { ascending: true });

      if (!active) return;

      if (data) {
        const { updatedMembers } = await checkAndReleaseSeats(data, activeBranch);
        setDueSoon(updatedMembers.filter(m => {
          const status = getMemberStatus(m);
          return status.type === 'due-soon';
        }));
        setDefaulters(updatedMembers.filter(m => {
          const status = getMemberStatus(m);
          return status.type === 'overdue';
        }));
        setPending(updatedMembers.filter(m => {
          const status = getMemberStatus(m);
          return status.type === 'pending';
        }));
      }
      setLoading(false);
    }

    if (activeBranch) {
      fetchData();
    }

    return () => {
      active = false;
    };
  }, [activeBranch]);

  const getDaysOverdue = (dateStr: string) => {
    if (!dateStr) return 0;
    return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  };

  const getDaysLeft = (dateStr: string) => {
    if (!dateStr) return 0;
    return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  const sendWhatsApp = async (member: any, type: 'reminder' | 'overdue' | 'pending' | 'overdue_dues') => {
    const mobile = formatWhatsAppNumber(member.mobile);
    const endDate = member.subscription_end_date ? new Date(member.subscription_end_date).toLocaleDateString() : 'N/A';
    const dueDate = member.payment_due_date ? new Date(member.payment_due_date).toLocaleDateString() : 'N/A';
    
    let templateStr = "";
    let actionLabel = "";
    if (type === 'reminder') {
      templateStr = await getTemplate('due_soon_msg');
      actionLabel = "expiring soon reminder";
    } else if (type === 'overdue') {
      const daysOverdue = getDaysOverdue(member.subscription_end_date);
      if (daysOverdue > 5) {
        templateStr = await getTemplate('released_msg');
      } else {
        templateStr = await getTemplate('expired_msg');
      }
      actionLabel = "membership expired warning";
    } else if (type === 'pending') {
      templateStr = await getTemplate('pending_dues_msg');
      actionLabel = "pending payment reminder";
    } else if (type === 'overdue_dues') {
      templateStr = await getTemplate('overdue_dues_msg');
      actionLabel = "overdue payment warning";
    }

    const templateVars = {
      name: member.full_name,
      permanent_id: member.permanent_id || '',
      expiry: endDate,
      due_date: dueDate,
      due_amount: String(member.outstanding_dues || 0),
      branch: branchName
    };
    const msg = parseTemplate(templateStr, templateVars);

    logActivity(activeBranch, "payment_chase", `Sent WhatsApp ${actionLabel} to student ${member.full_name} (${member.permanent_id})`);
    window.open(`https://wa.me/${mobile}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
      <span className="text-sm text-on-surface-variant font-medium">Loading dues data...</span>
    </div>
  );

  const sortedDueSoon = [...dueSoon].filter(m => 
    m.full_name.toLowerCase().includes(searchDueSoon.toLowerCase()) || 
    m.permanent_id?.toLowerCase().includes(searchDueSoon.toLowerCase()) ||
    (m.student_no && m.student_no.toLowerCase().includes(searchDueSoon.toLowerCase()))
  ).sort((a, b) => {
    if (sortDueSoonBy === 'name-asc') return a.full_name.localeCompare(b.full_name);
    return new Date(a.subscription_end_date).getTime() - new Date(b.subscription_end_date).getTime();
  });

  const sortedDefaulters = [...defaulters].filter(m => 
    m.full_name.toLowerCase().includes(searchDefaulters.toLowerCase()) || 
    m.permanent_id?.toLowerCase().includes(searchDefaulters.toLowerCase()) ||
    (m.student_no && m.student_no.toLowerCase().includes(searchDefaulters.toLowerCase()))
  ).sort((a, b) => {
    if (sortDefaultersBy === 'name-asc') return a.full_name.localeCompare(b.full_name);
    return new Date(a.subscription_end_date).getTime() - new Date(b.subscription_end_date).getTime();
  });

  const sortedPending = [...pending].filter(m => 
    m.full_name.toLowerCase().includes(searchPending.toLowerCase()) || 
    m.permanent_id?.toLowerCase().includes(searchPending.toLowerCase()) ||
    (m.student_no && m.student_no.toLowerCase().includes(searchPending.toLowerCase()))
  ).sort((a, b) => {
    if (sortPendingBy === 'name-asc') return a.full_name.localeCompare(b.full_name);
    const dateA = a.payment_due_date ? new Date(a.payment_due_date).getTime() : 0;
    const dateB = b.payment_due_date ? new Date(b.payment_due_date).getTime() : 0;
    return dateA - dateB;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dues & Defaulters</h1>
          <p className="page-subtitle">Payment lifecycle tracking and follow-ups for {branchName} Branch</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <div className="glass-pane-elevated !p-3 text-center min-w-[100px]">
            <div className="text-xl font-black text-tertiary">{dueSoon.length}</div>
            <div className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Due Soon</div>
          </div>
          <div className="glass-pane-elevated !p-3 text-center min-w-[100px]">
            <div className="text-xl font-black text-red-400">{defaulters.length}</div>
            <div className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Defaulters</div>
          </div>
          <div className="glass-pane-elevated !p-3 text-center min-w-[100px]">
            <div className="text-xl font-black text-amber-400">{pending.length}</div>
            <div className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Pending Dues</div>
          </div>
        </div>
      </div>

      {/* ─── Mobile Tab Switcher (visible below xl) ─── */}
      <div className="xl:hidden flex gap-1 p-1 bg-white/[0.04] rounded-2xl border border-white/[0.06] mb-4">
        <button
          onClick={() => setDuesTab('due-soon')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            duesTab === 'due-soon'
              ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20 shadow-sm'
              : 'text-on-surface-variant hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <span className="material-symbols-outlined text-sm">schedule</span>
          Due Soon
          {dueSoon.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-black flex items-center justify-center">{dueSoon.length}</span>
          )}
        </button>
        <button
          onClick={() => setDuesTab('overdue')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            duesTab === 'overdue'
              ? 'bg-red-500/15 text-red-400 border border-red-500/20 shadow-sm'
              : 'text-on-surface-variant hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <span className="material-symbols-outlined text-sm">warning</span>
          Overdue
          {defaulters.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-black flex items-center justify-center">{defaulters.length}</span>
          )}
        </button>
        <button
          onClick={() => setDuesTab('pending')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            duesTab === 'pending'
              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20 shadow-sm'
              : 'text-on-surface-variant hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <span className="material-symbols-outlined text-sm">payments</span>
          Pending
          {pending.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black flex items-center justify-center">{pending.length}</span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ─── Due Soon Panel ─── */}
        <div className={`glass-pane-elevated !p-0 overflow-hidden !border-tertiary/15 ${duesTab !== 'due-soon' ? 'hidden xl:block' : ''}`}>
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between gap-3 bg-tertiary/[0.03]">
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
          <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto" data-lenis-prevent="true">
            {dueSoon.length === 0 ? (
              <div className="empty-state !py-12 text-center">
                <span className="material-symbols-outlined text-4xl text-emerald-400/40 mb-3 block">check_circle</span>
                <div className="text-sm font-medium text-emerald-400/70">All clear! No expiring subscriptions.</div>
              </div>
            ) : sortedDueSoon.map(m => (
              <DueMemberCard
                key={m.id}
                member={m}
                type="warning"
                badgeText={`${getDaysLeft(m.subscription_end_date)}d left`}
                badgeClass="bg-orange-500/15 text-orange-400 border border-orange-500/20"
                dateLabel={new Date(m.subscription_end_date).toLocaleDateString()}
                onMessage={() => sendWhatsApp(m, 'reminder')}
                onRenew={() => router.push(`/dashboard/record-payment?memberId=${m.id}`)}
                messageLabel="Send Reminder"
                renewLabel="Renew Now"
                isLoading={actionId === m.id}
              />
            ))}
          </div>
        </div>

        {/* ─── Defaulters Panel ─── */}
        <div className={`glass-pane-elevated !p-0 overflow-hidden !border-red-500/15 ${duesTab !== 'overdue' ? 'hidden xl:block' : ''}`}>
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between gap-3 bg-red-500/[0.03]">
            <div className="flex items-center gap-3">
              <div className="stat-icon stat-icon-danger w-9 h-9">
                <span className="material-symbols-outlined text-base">warning</span>
              </div>
              <div>
                <h2 className="text-base font-bold text-white font-manrope">Overdue Defaulters</h2>
                <p className="text-xs text-on-surface-variant">{defaulters.length} inactive/expired member(s)</p>
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
          <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto" data-lenis-prevent="true">
            {defaulters.length === 0 ? (
              <div className="empty-state !py-12 text-center">
                <span className="material-symbols-outlined text-4xl text-emerald-400/40 mb-3 block">verified</span>
                <div className="text-sm font-medium text-emerald-400/70">No defaulters! All members active.</div>
              </div>
            ) : sortedDefaulters.map(m => {
              const todayVal = new Date();
              const todayZeroVal = new Date(todayVal.getFullYear(), todayVal.getMonth(), todayVal.getDate());
              const isDuesOverdue = m.payment_due_date && new Date(m.payment_due_date) < todayZeroVal;
              const overdueDays = isDuesOverdue 
                ? getDaysOverdue(m.payment_due_date)
                : (m.subscription_end_date ? getDaysOverdue(m.subscription_end_date) : 0);
              
              const badgeLabel = isDuesOverdue
                ? `₹${m.outstanding_dues || 0} Overdue (${overdueDays}d)`
                : (m.subscription_end_date ? `${overdueDays}d overdue` : 'Overdue');
              
              const dateTxt = isDuesOverdue
                ? `Due was: ${new Date(m.payment_due_date).toLocaleDateString()}`
                : (m.subscription_end_date ? `Expired: ${new Date(m.subscription_end_date).toLocaleDateString()}` : 'Expired');

              let seatWarning = null;
              if (m.subscription_end_date) {
                const subDays = getDaysOverdue(m.subscription_end_date);
                if (subDays >= 5) {
                   seatWarning = <span className="text-red-400 font-bold ml-1">· Seat Released</span>;
                } else if (subDays >= 0) {
                   seatWarning = <span className="text-amber-400 font-semibold ml-1">· Releases in {5 - subDays}d</span>;
                }
              }

              return (
                <DueMemberCard
                  key={m.id}
                  member={m}
                  type="danger"
                  badgeText={badgeLabel}
                  badgeClass="bg-red-500/15 text-red-400 border border-red-500/20"
                  dateLabel={dateTxt}
                  seatWarning={seatWarning}
                  onMessage={() => sendWhatsApp(m, isDuesOverdue ? 'overdue_dues' : 'overdue')}
                  onRenew={() => router.push(`/dashboard/record-payment?memberId=${m.id}`)}
                  messageLabel="Chase Up"
                  renewLabel={isDuesOverdue ? "Collect Payment" : "Re-activate"}
                  isLoading={actionId === m.id}
                />
              );
            })}
          </div>
        </div>

        {/* ─── Pending Dues Panel ─── */}
        <div className={`glass-pane-elevated !p-0 overflow-hidden !border-amber-500/15 ${duesTab !== 'pending' ? 'hidden xl:block' : ''}`}>
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between gap-3 bg-amber-500/[0.03]">
            <div className="flex items-center gap-3">
              <div className="stat-icon stat-icon-warning w-9 h-9 bg-amber-500/10 text-amber-500">
                <span className="material-symbols-outlined text-base">payments</span>
              </div>
              <div>
                <h2 className="text-base font-bold text-white font-manrope">Pending Dues</h2>
                <p className="text-xs text-on-surface-variant">{pending.length} member(s) with dues</p>
              </div>
            </div>
            <select 
              value={sortPendingBy}
              onChange={(e) => setSortPendingBy(e.target.value as any)}
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
                value={searchPending}
                onChange={e => setSearchPending(e.target.value)}
                placeholder="Search pending dues..."
                className="w-full bg-white/[0.02] border border-white/[0.06] rounded-lg py-2 pl-9 pr-3 text-sm text-white placeholder:text-on-surface-variant focus:outline-none focus:border-amber-500/40 transition-colors"
              />
            </div>
          </div>
          <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto" data-lenis-prevent="true">
            {pending.length === 0 ? (
              <div className="empty-state !py-12 text-center">
                <span className="material-symbols-outlined text-4xl text-emerald-400/40 mb-3 block">check_circle</span>
                <div className="text-sm font-medium text-emerald-400/70">No pending payments recorded!</div>
              </div>
            ) : sortedPending.map(m => (
              <DueMemberCard
                key={m.id}
                member={m}
                type="pending"
                badgeText={m.outstanding_dues > 0 ? `₹${m.outstanding_dues} Due` : "Pending"}
                badgeClass="bg-amber-500/15 text-amber-400 border border-amber-500/20"
                dateLabel={m.payment_due_date ? `Due: ${new Date(m.payment_due_date).toLocaleDateString()}` : 'No due date'}
                onMessage={() => sendWhatsApp(m, 'pending')}
                onRenew={() => router.push(`/dashboard/record-payment?memberId=${m.id}`)}
                messageLabel="Send Reminder"
                renewLabel="Collect Payment"
                isLoading={actionId === m.id}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DueMemberCard({ member, type, badgeText, badgeClass, dateLabel, seatWarning, onMessage, onRenew, messageLabel, renewLabel, isLoading }: {
  member: any; type: 'warning' | 'danger' | 'pending'; badgeText: string; badgeClass: string;
  dateLabel: string; seatWarning?: React.ReactNode; onMessage: () => void; onRenew: () => void;
  messageLabel: string; renewLabel: string; isLoading: boolean;
}) {
  const borderColor = type === 'warning' ? 'border-tertiary/10 hover:border-tertiary/25' : type === 'danger' ? 'border-red-500/10 hover:border-red-500/25' : 'border-amber-500/10 hover:border-amber-500/25';
  const bgColor = type === 'warning' ? 'bg-tertiary/[0.03]' : type === 'danger' ? 'bg-red-500/[0.03]' : 'bg-amber-500/[0.03]';

  return (
    <div className={`${bgColor} p-4 rounded-xl border ${borderColor} transition-colors`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="text-white font-semibold text-sm">{member.full_name}</div>
          <div className="flex gap-2 items-center mt-0.5">
            <div className="text-xs text-primary font-medium">{member.permanent_id}</div>
            {member.student_no && (
              <span className="badge bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[9px] px-1.5 py-0.5 tracking-widest">
                #{member.student_no}
              </span>
            )}
          </div>
          <div className="text-xs text-on-surface-variant mt-0.5">
            {member.mobile} · Seat {member.seat_no || member.previous_seat_no || 'N/A'} {seatWarning}
          </div>
        </div>
        <div className="text-right">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${badgeClass}`}>{badgeText}</span>
          <div className="text-[10px] text-on-surface-variant mt-1">{dateLabel}</div>
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
          <span className="material-symbols-outlined text-sm">payments</span>
          {renewLabel}
        </button>
      </div>
    </div>
  );
}
