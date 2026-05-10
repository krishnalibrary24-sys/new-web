"use client";
import React from 'react';
import { useBranch } from "@/components/branch-context";

export default function ExpensesPage() {
  const { activeBranch } = useBranch();
  const branchName = activeBranch === 'namnakala' ? 'Namnakala' : 'Bengali Chowk';
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Expenses</h1>
          <p className="page-subtitle">Operational cost tracking for {branchName}</p>
        </div>
      </div>
      
      <div className="card-premium flex flex-col items-center justify-center" style={{ minHeight: '50vh' }}>
        <div className="w-16 h-16 rounded-2xl stat-icon-warning flex items-center justify-center mb-5">
          <span className="material-symbols-outlined text-3xl">construction</span>
        </div>
        <h2 className="text-lg font-bold text-white mb-2 font-manrope">Module Coming Soon</h2>
        <p className="text-sm text-on-surface-variant text-center max-w-sm mb-6">
          The Expense Tracking module is being developed and will be available in the next update.
        </p>
        <div className="flex gap-3">
          <div className="badge badge-info">
            <span className="material-symbols-outlined text-xs">schedule</span>
            In Development
          </div>
        </div>
      </div>
    </div>
  );
}
