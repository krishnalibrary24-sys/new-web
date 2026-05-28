"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { useBranch } from "@/components/branch-context";
import { supabase } from "@/lib/supabase";
import { useRouter } from 'next/navigation';

export default function InvoicesPage() {
  const { activeBranch } = useBranch();
  const branchName = activeBranch === 'namnakala' ? 'Namnakala' : 'Bengali Chowk';
  const router = useRouter();

  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount-high' | 'amount-low'>('newest');

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

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const filtered = members.filter(m =>
    m.full_name.toLowerCase().includes(search.toLowerCase()) ||
    m.permanent_id?.toLowerCase().includes(search.toLowerCase()) ||
    m.mobile?.includes(search)
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'amount-high') return (b.plan_amount || 0) - (a.plan_amount || 0);
    if (sortBy === 'amount-low') return (a.plan_amount || 0) - (b.plan_amount || 0);
    if (sortBy === 'oldest') return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(); // newest
  });

  const totalRevenue = members
    .filter(m => m.is_active)
    .reduce((sum, m) => sum + (m.plan_amount || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoice Ledger</h1>
          <p className="page-subtitle">All billing records for {branchName} Branch</p>
        </div>
        <div className="flex gap-4">
          <div className="glass-pane-elevated !p-3 text-center min-w-[120px]">
            <div className="text-xl font-black text-[#003178]">₹{totalRevenue.toLocaleString()}</div>
            <div className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Monthly Revenue</div>
          </div>
          <div className="glass-pane-elevated !p-3 text-center min-w-[120px]">
            <div className="text-xl font-black text-[#0d47a1]">{members.filter(m => m.is_active).length}</div>
            <div className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Active Members</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full md:w-80">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name, ID, phone..."
          className="input-premium pl-9 w-full"
        />
      </div>

      {/* Table */}
      <div className="glass-pane-elevated !p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-[#f1f5f9] bg-white flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">All Transactions</h2>
            <span className="badge badge-info">{filtered.length} records</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 px-2 py-1.5 rounded-xl border border-slate-200">
            <span className="material-symbols-outlined text-slate-500 text-sm pl-1">sort</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-slate-700 text-xs font-semibold focus:outline-none pr-3 cursor-pointer appearance-none [&>option]:bg-white [&>option]:text-slate-800"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="amount-high">Amount (High-Low)</option>
              <option value="amount-low">Amount (Low-High)</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span>
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr>
                  <th className="px-6 py-4">Member</th>
                  <th className="px-6 py-4">Plan</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Valid Till</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-on-surface-variant font-semibold">
                      No records found.
                    </td>
                  </tr>
                ) : sorted.map(m => {
                  const isExpired = !m.is_active;
                  const daysLeft = m.subscription_end_date
                    ? Math.ceil((new Date(m.subscription_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                    : null;

                  return (
                    <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-surface-container-highest border border-white/10 flex items-center justify-center text-primary font-bold text-sm">
                            {m.full_name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-white font-bold">{m.full_name}</div>
                            <div className="text-xs text-primary font-mono">{m.permanent_id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white font-semibold">{m.shift}</div>
                        <div className="text-xs text-on-surface-variant">Seat {m.seat_no || '—'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white font-bold">₹{m.plan_amount}</span>
                        <span className="text-xs text-on-surface-variant">/mo</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white text-sm">
                          {m.subscription_end_date ? new Date(m.subscription_end_date).toLocaleDateString() : '—'}
                        </div>
                        {daysLeft !== null && !isExpired && (
                          <div className={`text-xs font-bold mt-0.5 ${daysLeft <= 3 ? 'text-tertiary' : 'text-on-surface-variant'}`}>
                            {daysLeft}d remaining
                          </div>
                        )}
                        {isExpired && (
                          <div className="text-xs font-bold mt-0.5 text-error">Expired</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${m.is_active ? 'bg-green-500/20 text-green-400' : 'bg-error/20 text-error'}`}>
                          {m.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => window.open(`/invoice?id=${m.id}`, '_blank')}
                          className="bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold px-3 py-2 rounded-lg transition-colors flex items-center gap-1 ml-auto"
                        >
                          <span className="material-symbols-outlined text-sm">print</span>
                          Print
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
