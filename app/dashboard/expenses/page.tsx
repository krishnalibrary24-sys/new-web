"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { useBranch } from "@/components/branch-context";
import { supabase } from "@/lib/supabase";
import { logActivity } from "@/lib/activity";

export default function ExpensesPage() {
  const { activeBranch } = useBranch();
  const branchName = activeBranch === 'namnakala' ? 'Namnakala' : 'Bengali Chowk';
  
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [isAdding, setIsAdding] = useState(false);
  const [category, setCategory] = useState('Rent');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);
  
  // Search & Sort
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount-high' | 'amount-low'>('newest');

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    // Note: This relies on the 'expenses' table existing in Supabase.
    // If it fails, we catch and return empty array.
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('branch', activeBranch)
      .order('expense_date', { ascending: false });
      
    if (data) setExpenses(data);
    setLoading(false);
  }, [activeBranch]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    
    setSubmitting(true);
    await supabase.from('expenses').insert([{
      branch: activeBranch,
      category,
      amount: parseInt(amount),
      description,
      expense_date: expenseDate
    }]);
    
    logActivity(activeBranch, "expense_added", `Recorded new expense: Category: ${category}, Amount: ₹${amount}, Details: ${description}`);
    
    setCategory('Rent');
    setAmount('');
    setDescription('');
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setIsAdding(false);
    setSubmitting(false);
    
    fetchExpenses();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this expense?")) {
      const exp = expenses.find(e => e.id === id);
      await supabase.from('expenses').delete().eq('id', id);
      if (exp) {
        logActivity(activeBranch, "expense_delete", `Deleted expense: Category: ${exp.category}, Amount: ₹${exp.amount}`);
      }
      fetchExpenses();
    }
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Filter and Sort
  const filteredAndSorted = expenses
    .filter(e => 
      e.category.toLowerCase().includes(search.toLowerCase()) || 
      (e.description && e.description.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime();
      if (sortBy === 'oldest') return new Date(a.expense_date).getTime() - new Date(b.expense_date).getTime();
      if (sortBy === 'amount-high') return b.amount - a.amount;
      if (sortBy === 'amount-low') return a.amount - b.amount;
      return 0;
    });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Expenses</h1>
          <p className="page-subtitle">Operational cost tracking for {branchName}</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="btn-primary"
        >
          <span className="material-symbols-outlined text-sm">{isAdding ? 'close' : 'add'}</span>
          {isAdding ? 'Cancel' : 'Add Expense'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddExpense} className="glass-pane-elevated !p-6 animate-scale-in">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Record New Expense</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Category</label>
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                className="w-full input-premium appearance-none [&>option]:bg-white [&>option]:text-slate-800"
              >
                <option>Rent</option>
                <option>Electricity</option>
                <option>Internet</option>
                <option>Maintenance</option>
                <option>Cleaning</option>
                <option>Marketing</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Amount (₹)</label>
              <input 
                type="number" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 5000"
                required
                className="w-full input-premium"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Date</label>
              <input 
                type="date" 
                value={expenseDate} 
                onChange={(e) => setExpenseDate(e.target.value)}
                required
                className="w-full input-premium"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Description</label>
              <input 
                type="text" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional details"
                className="w-full input-premium"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button 
              type="submit" 
              disabled={submitting}
              className="bg-primary text-on-primary font-semibold px-6 py-2.5 rounded-xl flex items-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {submitting ? <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> : <span className="material-symbols-outlined text-sm">save</span>}
              Save Expense
            </button>
          </div>
        </form>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-pane-elevated flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">account_balance_wallet</span>
          </div>
          <div>
            <div className="text-xs text-on-surface-variant uppercase font-bold tracking-wider mb-1">Total Expenses</div>
            <div className="text-2xl font-black text-slate-800">₹{totalExpenses.toLocaleString()}</div>
          </div>
        </div>
        <div className="glass-pane-elevated flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">receipt_long</span>
          </div>
          <div>
            <div className="text-xs text-on-surface-variant uppercase font-bold tracking-wider mb-1">Total Entries</div>
            <div className="text-2xl font-black text-slate-800">{expenses.length}</div>
          </div>
        </div>
      </div>

      {/* Data Table Area */}
      <div className="glass-pane-elevated !p-0 overflow-hidden flex flex-col">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-white/[0.06] flex flex-col md:flex-row gap-4 justify-between bg-white/[0.02]">
          <div className="relative w-full md:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
            <input 
              type="text" 
              placeholder="Search expenses..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-premium !py-2 !pl-9 !pr-4 !text-sm !rounded-lg w-full"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-on-surface-variant text-sm">sort</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-slate-700 text-xs font-semibold focus:outline-none pr-3 cursor-pointer appearance-none [&>option]:bg-white [&>option]:text-slate-800"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="amount-high">Amount (High to Low)</option>
              <option value="amount-low">Amount (Low to High)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-on-surface-variant">
              <span className="material-symbols-outlined animate-spin text-3xl mb-2 text-primary">progress_activity</span>
              <div>Loading expenses...</div>
            </div>
          ) : filteredAndSorted.length === 0 ? (
            <div className="p-12 text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl mb-2 opacity-50">receipt_long</span>
              <div>No expenses found.</div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/[0.06] text-xs uppercase tracking-wider text-on-surface-variant">
                  <th className="p-4 font-semibold">Date</th>
                  <th className="p-4 font-semibold">Category</th>
                  <th className="p-4 font-semibold">Description</th>
                  <th className="p-4 font-semibold text-right">Amount</th>
                  <th className="p-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredAndSorted.map((exp) => (
                  <tr key={exp.id} className="border-b border-white/[0.06] hover:bg-white/[0.02] transition-colors group">
                    <td className="p-4 text-on-surface-variant whitespace-nowrap">
                      {new Date(exp.expense_date).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span className="badge badge-info bg-blue-500/10 text-blue-400 border border-blue-500/20">{exp.category}</span>
                    </td>
                    <td className="p-4 text-white max-w-xs truncate">
                      {exp.description || <span className="text-on-surface-variant italic">No description</span>}
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-red-400">
                      ₹{exp.amount}
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => handleDelete(exp.id)}
                        className="text-on-surface-variant hover:text-red-400 hover:bg-red-400/10 p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete expense"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
