"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { useBranch } from "@/components/branch-context";
import { supabase } from "@/lib/supabase";
import { logActivity } from "@/lib/activity";
import { formatDate } from "@/lib/utils";

export default function ExpensesPage() {
  const { activeBranch } = useBranch();
  const branchName = activeBranch === 'namnakala' ? 'Namnakala' : 'Bengali Chowk';
  
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [isAdding, setIsAdding] = useState(false);
  const [category, setCategory] = useState('Rent');
  const [customCategory, setCustomCategory] = useState('');
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
    const finalCategory = category === 'Other' ? (customCategory.trim() || 'Other') : category;
    await supabase.from('expenses').insert([{
      branch: activeBranch,
      category: finalCategory,
      amount: parseInt(amount),
      description,
      expense_date: expenseDate
    }]);
    
    logActivity(activeBranch, "expense_added", `Recorded new expense: Category: ${finalCategory}, Amount: ₹${amount}, Details: ${description}`);
    
    setCategory('Rent');
    setCustomCategory('');
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

  const handleExportPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      
      const doc = new jsPDF();
      
      let logoImg: HTMLImageElement | null = null;
      try {
        logoImg = await loadImage('/assets/logo.png');
      } catch (err) {
        console.error("Logo failed to load", err);
      }
      
      const cleanPDFText = (val: any) => {
        if (val === undefined || val === null) return '';
        return String(val)
          .replace(/₹/g, 'Rs. ')
          .replace(/—/g, '-')
          .replace(/–/g, '-');
      };

      // Header Banner
      if (logoImg) {
        doc.addImage(logoImg, 'PNG', 178, 10, 18, 18);
      }
      
      doc.setTextColor(0, 49, 120); // #003178 Krishna Blue
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("KRISHNA LIBRARY", 14, 18);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(71, 85, 105); // Slate 600
      doc.text("EXPENSES & OPERATIONAL COST REPORT", 14, 24);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139); // Slate 500
      const nowStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
      doc.text(`Branch: ${branchName} Branch  |  Generated: ${nowStr}`, 14, 29);
      
      doc.setDrawColor(203, 213, 225); // Slate 300
      doc.setLineWidth(0.5);
      doc.line(14, 33, 196, 33);
      
      // Summary Metrics Row
      doc.setTextColor(51, 65, 85); // Slate 700
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.text("REPORT SUMMARY", 14, 41);
      
      autoTable(doc, {
        startY: 45,
        body: [
          ["Total Outflow Amount", `Rs. ${totalExpenses.toLocaleString('en-IN')}`, "Total Records / Entries", `${filteredAndSorted.length} items`]
        ],
        theme: 'grid',
        bodyStyles: { fontSize: 9.5, textColor: [30, 41, 59] },
        columnStyles: {
          0: { fontStyle: 'bold', fillColor: [254, 242, 242], width: 45 },
          1: { fontStyle: 'bold', textColor: [220, 38, 38], width: 55 },
          2: { fontStyle: 'bold', fillColor: [248, 250, 252], width: 45 },
          3: { width: 45 }
        },
        margin: { left: 14, right: 14 }
      });
      
      const currentY = (doc as any).lastAutoTable.finalY + 10;
      doc.setTextColor(51, 65, 85); // Slate 700
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.text("EXPENSE OUTFLOW DETAILS", 14, currentY);
      
      const tableHeaders = [["S No.", "Date", "Category", "Description", "Outflow Amount"]];
      const tableRows = filteredAndSorted.map((exp, index) => {
        return [
          String(index + 1),
          formatDate(exp.expense_date),
          cleanPDFText(exp.category),
          cleanPDFText(exp.description || 'No description provided'),
          cleanPDFText(`Rs. ${exp.amount?.toLocaleString('en-IN')}`)
        ];
      });
      
      autoTable(doc, {
        startY: currentY + 4,
        head: tableHeaders,
        body: tableRows.length > 0 ? tableRows : [["—", "—", "No records found", "—", "—"]],
        theme: 'striped',
        headStyles: { fillColor: [185, 28, 28], textColor: [255, 255, 255], fontSize: 9.5, fontStyle: 'bold' },
        bodyStyles: { fontSize: 9, textColor: [51, 65, 85] },
        columnStyles: {
          0: { width: 15 },
          1: { width: 35 },
          2: { width: 35 },
          3: { width: 75 },
          4: { fontStyle: 'bold', textColor: [220, 38, 38], width: 30, halign: 'right' }
        },
        margin: { left: 14, right: 14 },
        didDrawPage: (data) => {
          const pageCount = (doc as any).internal.getNumberOfPages();
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184); // Slate 400
          doc.text(
            `Page ${data.pageNumber} of ${pageCount}`,
            14,
            doc.internal.pageSize.height - 10
          );
          doc.text(
            "Confidential - Krishna Library Management System",
            doc.internal.pageSize.width - 90,
            doc.internal.pageSize.height - 10
          );
        }
      });
      
      const fileName = `Expenses_Report_${activeBranch}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      logActivity(activeBranch, "expense_export_pdf", `Exported expenses report to PDF (${filteredAndSorted.length} items)`);
    } catch (error) {
      console.error("Expenses PDF export failed:", error);
      alert("Failed to export PDF. Please check console for details.");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Expenses</h1>
          <p className="page-subtitle">Operational cost tracking for {branchName}</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExportPDF}
            className="btn-ghost px-4 py-2.5 text-sm flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">download</span>
            Export PDF
          </button>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="btn-primary"
          >
            <span className="material-symbols-outlined text-sm">{isAdding ? 'close' : 'add'}</span>
            {isAdding ? 'Cancel' : 'Add Expense'}
          </button>
        </div>
      </div>

      {isAdding && (
        <form onSubmit={handleAddExpense} className="glass-pane-elevated !p-6 animate-scale-in">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Record New Expense</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Category</label>
              <select 
                value={category} 
                onChange={(e) => { setCategory(e.target.value); if (e.target.value !== 'Other') setCustomCategory(''); }}
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
              {category === 'Other' && (
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Type custom category name..."
                  className="w-full input-premium mt-2"
                  autoFocus
                  required
                />
              )}
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
                      {formatDate(exp.expense_date)}
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

const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = url;
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
  });
}
