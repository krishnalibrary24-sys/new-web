"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { useBranch } from "@/components/branch-context";
import { supabase } from "@/lib/supabase";

export default function DuesPage() {
  const { activeBranch } = useBranch();
  const branchName = activeBranch === 'namnakala' ? 'Namnakala' : 'Bengali Chowk';

  const [dueSoon, setDueSoon] = useState<any[]>([]);
  const [defaulters, setDefaulters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [sortDueSoonBy, setSortDueSoonBy] = useState<'due-date' | 'name-asc'>('due-date');
  const [sortDefaultersBy, setSortDefaultersBy] = useState<'due-date' | 'name-asc'>('due-date');
  const [searchDueSoon, setSearchDueSoon] = useState('');
  const [searchDefaulters, setSearchDefaulters] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const { data } = await supabase
      .from('members')
      .select('*')
      .eq('branch', activeBranch)
      .order('subscription_end_date', { ascending: true });

    if (data) {
      setDueSoon(data.filter(m => {
        if (!m.is_active || !m.subscription_end_date) return false;
        const end = new Date(m.subscription_end_date);
        return end >= now && end <= in3Days;
      }));
      setDefaulters(data.filter(m => !m.is_active));
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

  const sendWhatsApp = (member: any, type: 'reminder' | 'overdue') => {
    const mobile = member.mobile.replace(/[^0-9]/g, '');
    const endDate = new Date(member.subscription_end_date).toLocaleDateString();
    const msg = type === 'reminder'
      ? `Dear ${member.full_name},\n\nThis is a friendly reminder from Krishna Library that your membership (${member.permanent_id}) is expiring on ${endDate}.\n\nPlease renew your subscription to continue enjoying uninterrupted access to your seat.\n\nRegards,\nKrishna Library — ${branchName}`
      : `Dear ${member.full_name},\n\nYour Krishna Library membership (${member.permanent_id}) expired on ${endDate}. Your seat has been temporarily released.\n\nPlease visit the library at the earliest to renew your subscription.\n\nRegards,\nKrishna Library — ${branchName}`;
    window.open(`https://wa.me/${mobile}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const reactivateMember = async (member: any) => {
    setActionId(member.id);
    const newEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('members').update({ is_active: true, subscription_end_date: newEnd }).eq('id', member.id);
    await fetchData();
    setActionId(null);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
      <span className="text-sm text-on-surface-variant font-medium">Loading dues data...</span>
    </div>
  );

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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dues & Defaulters</h1>
          <p className="page-subtitle">Payment lifecycle tracking for {branchName} Branch</p>
        </div>
        <div className="flex gap-3">
          <div className="glass-pane-elevated !p-3 text-center min-w-[100px]">
            <div className="text-xl font-black text-tertiary">{dueSoon.length}</div>
            <div className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Due Soon</div>
          </div>
          <div className="glass-pane-elevated !p-3 text-center min-w-[100px]">
            <div className="text-xl font-black text-red-400">{defaulters.length}</div>
            <div className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Defaulters</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ─── Due Soon Panel ─── */}
        <div className="glass-pane-elevated !p-0 overflow-hidden !border-tertiary/15">
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
          <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
            {dueSoon.length === 0 ? (
              <div className="empty-state !py-12">
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

        {/* ─── Defaulters Panel ─── */}
        <div className="glass-pane-elevated !p-0 overflow-hidden !border-red-500/15">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between gap-3 bg-red-500/[0.03]">
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
          <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
            {defaulters.length === 0 ? (
              <div className="empty-state !py-12">
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
      </div>
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
    <div className={`${bgColor} p-4 rounded-xl border ${borderColor} transition-colors`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="text-white font-semibold text-sm">{member.full_name}</div>
          <div className="text-xs text-primary font-medium mt-0.5">{member.permanent_id}</div>
          <div className="text-xs text-on-surface-variant mt-0.5">{member.mobile} · Seat {member.seat_no || 'N/A'}</div>
        </div>
        <div className="text-right">
          <span className={`badge ${badgeClass}`}>{badgeText}</span>
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
