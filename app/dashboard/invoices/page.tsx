"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { useBranch } from "@/components/branch-context";
import { supabase } from "@/lib/supabase";
import { useRouter } from 'next/navigation';

export default function InvoicesPage() {
  const { activeBranch } = useBranch();
  const branchName = activeBranch === 'namnakala' ? 'Namnakala' : 'Bangali Chowk';
  const router = useRouter();

  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount-high' | 'amount-low'>('newest');

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('invoices')
      .select('*, member:members(*)')
      .order('created_at', { ascending: false });

    if (data) {
      // Filter by activeBranch since members are branch-specific
      const branchInvoices = data.filter(inv => inv.member && inv.member.branch === activeBranch);
      setInvoices(branchInvoices);
    }
    setLoading(false);
  }, [activeBranch]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const filtered = invoices.filter(inv =>
    inv.member?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    inv.member?.permanent_id?.toLowerCase().includes(search.toLowerCase()) ||
    inv.member?.mobile?.includes(search)
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'amount-high') return Number(b.total_amount || 0) - Number(a.total_amount || 0);
    if (sortBy === 'amount-low') return Number(a.total_amount || 0) - Number(b.total_amount || 0);
    if (sortBy === 'oldest') return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(); // newest
  });

  const totalPaidRevenue = invoices
    .reduce((sum, inv) => sum + Number(inv.paid_amount || 0), 0);

  const totalOutstandingDues = invoices
    .reduce((sum, inv) => sum + Number(inv.due_amount || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoice Ledger</h1>
          <p className="page-subtitle">All billing and installment records for {branchName} Branch</p>
        </div>
        <div className="flex gap-4">
          <div className="glass-pane-elevated !p-3 text-center min-w-[120px] border-emerald-500/20">
            <div className="text-xl font-black text-emerald-400">₹{totalPaidRevenue.toLocaleString('en-IN')}</div>
            <div className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">Total Revenue Paid</div>
          </div>
          <div className="glass-pane-elevated !p-3 text-center min-w-[120px] border-[#fdac29]/20">
            <div className="text-xl font-black text-[#fdac29]">₹{totalOutstandingDues.toLocaleString('en-IN')}</div>
            <div className="text-[10px] text-[#fdac29] uppercase font-bold tracking-wider">Outstanding Dues</div>
          </div>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="flex justify-between items-center gap-4 flex-wrap">
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
      </div>

      {/* Table */}
      <div className="glass-pane-elevated !p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between flex-wrap gap-4 bg-white/[0.01]">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">All Transaction Invoices</h2>
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
              <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
            </div>
          ) : (
            <table className="w-full text-left text-xs table-premium">
              <thead>
                <tr>
                  <th>Date Billed</th>
                  <th>Member</th>
                  <th>Subscription Plan</th>
                  <th>Billing (Total / Paid / Due)</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-on-surface-variant italic">
                      No invoice records found.
                    </td>
                  </tr>
                ) : sorted.map(inv => {
                  const statusBadgeClass = inv.status === 'paid'
                    ? 'badge-success'
                    : inv.status === 'partially_paid'
                    ? 'badge-warning'
                    : 'badge-danger';

                  return (
                    <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="font-semibold text-white">
                        {new Date(inv.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-surface-container-highest border border-white/10 flex items-center justify-center text-primary font-bold text-sm">
                            {inv.member?.full_name?.charAt(0)}
                          </div>
                          <div>
                            <div className="text-white font-bold">{inv.member?.full_name}</div>
                            <div className="text-xs text-primary font-mono mt-0.5">{inv.member?.permanent_id}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="text-white font-bold">{inv.member?.shift}</div>
                        <div className="text-[10px] text-on-surface-variant mt-0.5">Seat {inv.member?.seat_no || '—'}</div>
                      </td>
                      <td>
                        <div className="space-y-0.5">
                          <div>Total: <span className="text-white font-bold">₹{inv.total_amount}</span></div>
                          <div className="text-emerald-400">Paid: <span className="font-bold">₹{inv.paid_amount}</span></div>
                          {Number(inv.due_amount) > 0 && (
                            <div className="text-orange-400">Due: <span className="font-bold">₹{inv.due_amount}</span></div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${statusBadgeClass} uppercase text-[9px] tracking-wider py-1 px-2`}>
                          {inv.status === 'partially_paid' ? 'Partial' : inv.status}
                        </span>
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => window.open(`/invoice?id=${inv.id}`, '_blank')}
                          className="bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold px-3 py-2 rounded-lg transition-colors inline-flex items-center gap-1.5"
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
