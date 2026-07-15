"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { useBranch } from "@/components/branch-context";
import { supabase } from "@/lib/supabase";
import { useRouter } from 'next/navigation';
import { formatDate } from "@/lib/utils";

export default function InvoicesPage() {
  const { activeBranch } = useBranch();
  const branchName = activeBranch === 'namnakala' ? 'Namnakala' : 'Bengali Chowk';
  const router = useRouter();

  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount-high' | 'amount-low'>('newest');

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('invoices')
      .select('*, member:members!inner(*)')
      .eq('member.branch', activeBranch)
      .order('created_at', { ascending: false });
      
    if (data) {
      setInvoices(data);
    }
    setLoading(false);
  }, [activeBranch]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const filtered = invoices.filter(inv =>
    inv.member?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    inv.member?.permanent_id?.toLowerCase().includes(search.toLowerCase()) ||
    (inv.member?.student_no && inv.member?.student_no.toLowerCase().includes(search.toLowerCase())) ||
    inv.member?.mobile?.includes(search)
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'amount-high') return (b.total_amount || 0) - (a.total_amount || 0);
    if (sortBy === 'amount-low') return (a.total_amount || 0) - (b.total_amount || 0);
    if (sortBy === 'oldest') return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(); // newest
  });

  const totalPaidRevenue = invoices.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0);
  const totalOutstandingDues = invoices.reduce((sum, inv) => sum + (inv.due_amount || 0), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-green-500/15 text-green-700 border border-green-500/20">Paid</span>;
      case 'partially_paid':
        return <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-500/15 text-[#92400e] border border-amber-500/20">Partial</span>;
      case 'unpaid':
        return <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-red-500/15 text-red-700 border border-red-500/20">Unpaid</span>;
      default:
        return <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">Unknown</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title text-[#003178] font-montserrat font-black text-2xl">Invoice Ledger</h1>
          <p className="page-subtitle text-[#434652] text-sm">All billing records for {branchName} Branch</p>
        </div>
        <div className="flex gap-4">
          <div className="glass-pane-elevated !p-3 text-center min-w-[120px] bg-white border border-[#e2e8f0] rounded-xl shadow-sm">
            <div className="text-xl font-black text-emerald-600">₹{totalPaidRevenue.toLocaleString()}</div>
            <div className="text-[9px] text-[#737783] uppercase font-bold tracking-wider">Revenue Collected</div>
          </div>
          <div className="glass-pane-elevated !p-3 text-center min-w-[120px] bg-white border border-[#e2e8f0] rounded-xl shadow-sm">
            <div className="text-xl font-black text-red-600">₹{totalOutstandingDues.toLocaleString()}</div>
            <div className="text-[9px] text-[#737783] uppercase font-bold tracking-wider">Outstanding Dues</div>
          </div>
        </div>
      </div>

      {/* Search & Stats */}
      <div className="relative w-full md:w-85">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search member name, ID, phone..."
          className="input-premium pl-9 w-full border border-slate-200 focus:border-[#003178] focus:ring-1 focus:ring-[#003178] rounded-xl py-2 px-3 text-sm focus:outline-none bg-white"
        />
      </div>

      {/* Table Container */}
      <div className="glass-pane-elevated !p-0 overflow-hidden bg-white border border-[#e2e8f0] rounded-2xl shadow-sm">
        <div className="px-5 py-4 border-b border-[#f1f5f9] bg-slate-50 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Billing History</h2>
            <span className="bg-[#003178]/10 text-[#003178] text-xs font-bold px-2 py-0.5 rounded-full">{filtered.length} Invoices</span>
          </div>
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
            <span className="material-symbols-outlined text-slate-400 text-sm">sort</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-slate-700 text-xs font-semibold focus:outline-none cursor-pointer appearance-none pr-4"
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
              <span className="material-symbols-outlined animate-spin text-4xl text-[#003178]">sync</span>
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                  <th className="px-6 py-3.5">Student / ID</th>
                  <th className="px-6 py-3.5">Date Billed</th>
                  <th className="px-6 py-3.5">Total Amount</th>
                  <th className="px-6 py-3.5">Paid Amount</th>
                  <th className="px-6 py-3.5">Dues Outstanding</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[#434652]">
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium font-lexend">
                      No invoices found matching the criteria.
                    </td>
                  </tr>
                ) : sorted.map(inv => {
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#003178]/5 border border-[#003178]/10 flex items-center justify-center text-[#003178] font-bold text-xs">
                            {inv.member?.full_name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <div className="text-slate-800 font-bold font-montserrat text-sm">{inv.member?.full_name || 'Deleted Student'}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <div className="text-[10px] text-[#003178] font-mono font-medium">{inv.member?.permanent_id || 'N/A'}</div>
                              {inv.member?.student_no && (
                                <span className="text-[9px] bg-purple-500/10 text-purple-600 border border-purple-500/20 px-1.5 py-0.5 rounded tracking-widest font-bold">#{inv.member.student_no}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-lexend text-xs">
                        {formatDate(inv.created_at)}
                      </td>
                      <td className="px-6 py-4 font-bold font-mono text-slate-800 text-xs">
                        ₹{inv.total_amount}
                      </td>
                      <td className="px-6 py-4 font-bold font-mono text-emerald-600 text-xs">
                        ₹{inv.paid_amount}
                      </td>
                      <td className="px-6 py-4 font-bold font-mono text-red-500 text-xs">
                        ₹{inv.due_amount}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(inv.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => window.open(`/invoice?id=${inv.id}`, '_blank')}
                          className="bg-[#003178]/15 hover:bg-[#003178]/25 text-[#003178] text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ml-auto"
                        >
                          <span className="material-symbols-outlined text-sm">receipt</span>
                          Invoice
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
