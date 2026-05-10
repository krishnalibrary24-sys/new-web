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

  const totalRevenue = members
    .filter(m => m.is_active)
    .reduce((sum, m) => sum + (m.plan_amount || 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-manrope text-white mb-2">Invoice Ledger</h1>
          <p className="text-on-surface-variant">All billing records for {branchName} Branch</p>
        </div>
        <div className="flex gap-4">
          <div className="glass-pane px-5 py-3 rounded-2xl border border-primary/20 text-center">
            <div className="text-2xl font-black text-primary">₹{totalRevenue.toLocaleString()}</div>
            <div className="text-xs text-on-surface-variant uppercase font-bold tracking-wider">Monthly Revenue</div>
          </div>
          <div className="glass-pane px-5 py-3 rounded-2xl border border-white/10 text-center">
            <div className="text-2xl font-black text-white">{members.filter(m => m.is_active).length}</div>
            <div className="text-xs text-on-surface-variant uppercase font-bold tracking-wider">Active Members</div>
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
          className="w-full bg-surface-container border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-primary/50"
        />
      </div>

      {/* Table */}
      <div className="glass-pane rounded-3xl border border-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/5 bg-surface-container-low/50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">All Transactions</h2>
          <span className="text-xs text-on-surface-variant">{filtered.length} records</span>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span>
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-surface-container text-on-surface-variant text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-4">Member</th>
                  <th className="px-6 py-4">Plan</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Valid Till</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-on-surface-variant font-semibold">
                      No records found.
                    </td>
                  </tr>
                ) : filtered.map(m => {
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
