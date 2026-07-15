"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { useBranch } from "@/components/branch-context";
import { supabase } from "@/lib/supabase";
import { useRouter } from 'next/navigation';

interface ActivityLog {
  id: string;
  branch: string;
  staff_id: string;
  action_type: string;
  details: string;
  created_at: string;
}

export default function ActivitiesPage() {
  const { activeBranch } = useBranch();
  const branchName = activeBranch === 'namnakala' ? 'Namnakala' : 'Bangali Chowk';
  const router = useRouter();

  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const role = localStorage.getItem("krishna_role");
    if (role !== "admin") {
      router.push("/dashboard");
    } else {
      setIsAdmin(true);
    }
    setCheckingAuth(false);
  }, [router]);

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [selectedAction, setSelectedAction] = useState("all");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "yesterday" | "7days" | "30days" | "custom">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // Auto-cleanup: delete activity logs older than 30 days from backend
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      await supabase
        .from('activity_logs')
        .delete()
        .lt('created_at', thirtyDaysAgo.toISOString());

      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('branch', activeBranch)
        .order('created_at', { ascending: false });

      if (error) {
        if (
          error.code === "P0001" || 
          error.message?.includes("does not exist") || 
          error.message?.includes("Could not find the table") ||
          error.message?.includes("relation")
        ) {
          setErrorMsg("schema-missing");
        } else {
          setErrorMsg(error.message);
        }
      } else if (data) {
        setLogs(data);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to fetch logs.");
    } finally {
      setLoading(false);
    }
  }, [activeBranch]);

  const handleDeleteLog = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this activity log from the server?")) return;
    try {
      const { error } = await supabase.from('activity_logs').delete().eq('id', id);
      if (error) throw error;
      setLogs(prev => prev.filter(l => l.id !== id));
    } catch (err: any) {
      alert("Error deleting log: " + err.message);
    }
  };

  const handleClearAllLogs = async () => {
    if (!confirm("WARNING: This will permanently delete ALL activity logs for this branch from the backend server!\n\nAre you sure you want to proceed?")) return;
    const confirmText = prompt("Type 'CLEAR ALL' to confirm deletion of all activity logs:");
    if (confirmText !== "CLEAR ALL") {
      alert("Confirmation failed. History was not cleared.");
      return;
    }
    try {
      setLoading(true);
      const { error } = await supabase.from('activity_logs').delete().eq('branch', activeBranch);
      if (error) throw error;
      setLogs([]);
      alert("All activities successfully erased.");
    } catch (err: any) {
      alert("Error clearing history: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Format Helper
  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return '—';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '—';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Get Action Badge Styles
  const getActionBadge = (actionType: string) => {
    const type = actionType.toLowerCase();
    if (type.includes("admission")) {
      return { label: "Admission", class: "!bg-blue-500/15 !text-blue-700 border border-blue-500/25" };
    }
    if (type.includes("payment")) {
      return { label: "Payment", class: "!bg-emerald-500/22 !text-emerald-700 border border-emerald-500/30" };
    }
    if (type.includes("seating")) {
      return { label: "Seating", class: "!bg-amber-500/25 !text-amber-800 border border-amber-500/30" };
    }
    if (type.includes("expense")) {
      return { label: "Expense", class: "!bg-rose-500/15 !text-rose-700 border border-rose-500/25" };
    }
    if (type.includes("enquiry")) {
      return { label: "Enquiry", class: "!bg-cyan-500/15 !text-cyan-700 border border-cyan-500/25" };
    }
    if (type.includes("suspend") || type.includes("activate") || type.includes("left") || type.includes("renew")) {
      return { label: "Membership", class: "!bg-purple-500/15 !text-purple-700 border border-purple-500/25" };
    }
    return { label: actionType, class: "!bg-slate-500/10 !text-slate-600 border border-slate-500/20" };
  };

  // Filter logs locally based on criteria
  const filteredLogs = logs.filter(log => {
    // 1. Search text filter
    const matchesSearch = 
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.staff_id.toLowerCase().includes(search.toLowerCase()) ||
      log.action_type.toLowerCase().includes(search.toLowerCase());

    // 2. Action category filter
    let matchesAction = true;
    if (selectedAction !== "all") {
      const type = log.action_type.toLowerCase();
      if (selectedAction === "admission") {
        matchesAction = type.includes("admission");
      } else if (selectedAction === "payment") {
        matchesAction = type.includes("payment");
      } else if (selectedAction === "seating") {
        matchesAction = type.includes("seating");
      } else if (selectedAction === "expense") {
        matchesAction = type.includes("expense");
      } else if (selectedAction === "enquiry") {
        matchesAction = type.includes("enquiry");
      } else if (selectedAction === "membership") {
        matchesAction = type.includes("suspend") || type.includes("activate") || type.includes("left") || type.includes("renew");
      }
    }

    // 3. Date & Time period filter
    let matchesDate = true;
    const logDate = new Date(log.created_at);
    logDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dateFilter === "today") {
      matchesDate = logDate.getTime() === today.getTime();
    } else if (dateFilter === "yesterday") {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      matchesDate = logDate.getTime() === yesterday.getTime();
    } else if (dateFilter === "7days") {
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      matchesDate = logDate.getTime() >= sevenDaysAgo.getTime();
    } else if (dateFilter === "30days") {
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      matchesDate = logDate.getTime() >= thirtyDaysAgo.getTime();
    } else if (dateFilter === "custom") {
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        matchesDate = matchesDate && logDate.getTime() >= start.getTime();
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(0, 0, 0, 0);
        matchesDate = matchesDate && logDate.getTime() <= end.getTime();
      }
    }

    return matchesSearch && matchesAction && matchesDate;
  });

  if (checkingAuth) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
        <span className="text-sm text-slate-500 font-medium">Checking authorization...</span>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="page-title">Activities Log</h1>
          <p className="page-subtitle">Track staff operations and database changes in {branchName}</p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <button 
            onClick={fetchLogs}
            disabled={loading}
            className="btn-secondary !py-2 !px-3 flex items-center gap-2 border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-all font-semibold shadow-sm text-xs rounded-xl"
          >
            <span className={`material-symbols-outlined text-sm ${loading ? 'animate-spin' : ''}`}>refresh</span>
            Refresh
          </button>
          <button 
            onClick={handleClearAllLogs}
            disabled={loading || logs.length === 0}
            className="btn-secondary !py-2 !px-3 flex items-center gap-2 border-red-200 text-red-600 bg-white hover:bg-red-50 hover:border-red-300 transition-all font-semibold shadow-sm text-xs rounded-xl"
          >
            <span className="material-symbols-outlined text-sm">delete_sweep</span>
            Clear History
          </button>
        </div>
      </div>

      {/* Schema Missing Warning */}
      {errorMsg === "schema-missing" && (
        <div className="card-premium border-amber-500/20 bg-amber-500/5 text-amber-800 p-4 sm:p-6 flex flex-col md:flex-row gap-4 items-start">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-xl">database</span>
          </div>
          <div className="space-y-2 w-full">
            <h3 className="font-bold text-sm">Database Table Required</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              The Activities page requires the new <strong>activity_logs</strong> table to be added to your Supabase database.
            </p>
            <div className="bg-slate-900 text-slate-200 text-xs font-mono p-3 rounded-lg border border-slate-800 overflow-x-auto whitespace-pre leading-normal mt-2 max-w-full">
{`CREATE TABLE IF NOT EXISTS public.activity_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch      TEXT NOT NULL CHECK (branch IN ('bengali-chowk', 'namnakala')),
  staff_id    TEXT NOT NULL,
  action_type TEXT NOT NULL,
  details     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_logs TO anon, authenticated;
CREATE POLICY "anon_all_activity_logs" ON public.activity_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);`}
            </div>
            <p className="text-[11px] text-slate-500 pt-1">
              💡 Please copy the query above, open the <strong>SQL Editor</strong> in your Supabase dashboard, paste it, and click <strong>Run</strong>. Once completed, refresh this page!
            </p>
          </div>
        </div>
      )}

      {errorMsg && errorMsg !== "schema-missing" && (
        <div className="card-premium border-red-500/20 bg-red-500/5 text-red-700 p-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-lg">error</span>
          <span className="text-xs font-semibold">{errorMsg}</span>
        </div>
      )}

      {errorMsg !== "schema-missing" && (
        <>
          {/* Controls / Filter Panel */}
          <div className="glass-pane-elevated p-4 sm:p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Search Details */}
              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant mb-1.5 uppercase tracking-wider">Search</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
                  <input 
                    type="text" 
                    placeholder="Search logs, staff, ID..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full input-premium !py-2.5 !pl-9 !text-xs"
                  />
                </div>
              </div>

              {/* Action Category Filter */}
              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant mb-1.5 uppercase tracking-wider">Action Type</label>
                <select 
                  value={selectedAction}
                  onChange={e => setSelectedAction(e.target.value)}
                  className="w-full input-premium !py-2.5 !text-xs appearance-none [&>option]:bg-white [&>option]:text-slate-800"
                >
                  <option value="all">All Actions</option>
                  <option value="admission">Admissions</option>
                  <option value="membership">Membership Statuses</option>
                  <option value="payment">Payments & Renewals</option>
                  <option value="seating">Seat Assignments</option>
                  <option value="expense">Expenses</option>
                  <option value="enquiry">Lead Enquiries</option>
                </select>
              </div>

              {/* Date Filter preset */}
              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant mb-1.5 uppercase tracking-wider">Time Period</label>
                <select 
                  value={dateFilter}
                  onChange={e => setDateFilter(e.target.value as any)}
                  className="w-full input-premium !py-2.5 !text-xs appearance-none [&>option]:bg-white [&>option]:text-slate-800"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {/* Stats Summary Card inline */}
              <div className="hidden lg:flex items-center gap-3 bg-slate-50 border border-slate-200/60 p-3 rounded-xl ml-auto min-w-[150px]">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
                  <span className="material-symbols-outlined text-base font-bold">history</span>
                </div>
                <div>
                  <div className="text-[9px] font-black text-slate-500 uppercase leading-none">Filtered Logs</div>
                  <div className="text-base font-black text-slate-800 mt-1 leading-none">{filteredLogs.length}</div>
                </div>
              </div>
            </div>

            {/* Custom Date Inputs if Custom is selected */}
            {dateFilter === "custom" && (
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 max-w-md p-3 bg-slate-50 rounded-xl border border-slate-200/60 animate-scale-in">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Start Date</label>
                  <input 
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-xs focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 mb-1 uppercase tracking-wider">End Date</label>
                  <input 
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-xs focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Timeline View */}
          <div className="glass-pane-elevated !p-0 overflow-hidden flex flex-col">
            {loading ? (
              <div className="p-16 text-center text-on-surface-variant">
                <span className="material-symbols-outlined animate-spin text-3xl mb-2 text-primary">progress_activity</span>
                <div className="text-xs font-semibold">Loading activities...</div>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-16 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-40">history</span>
                <div className="text-xs font-semibold text-slate-500">No matching activities logged.</div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[70vh] overflow-y-auto custom-scrollbar">
                {filteredLogs.map((log) => {
                  const badge = getActionBadge(log.action_type);
                  return (
                    <div key={log.id} className="p-4 hover:bg-slate-50/50 transition-colors flex gap-3 sm:gap-4 items-start group">
                      {/* Timeline Icon / Category Indicator */}
                      <div className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center flex-shrink-0 shadow-sm bg-white">
                        <span className="text-xs font-bold text-slate-400 font-mono">
                          {log.staff_id.charAt(0).toUpperCase()}
                        </span>
                      </div>

                      {/* Log details */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                          <span className={`badge text-[10px] px-2.5 py-1 rounded-md font-bold font-manrope w-fit flex-shrink-0 ${badge.class}`}>
                            {badge.label}
                          </span>
                          <span className="text-sm md:text-[15px] text-slate-900 font-bold leading-snug break-words">
                            {log.details}
                          </span>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px] opacity-75">person</span>
                            Logged by: <strong className="text-slate-700">{log.staff_id}</strong>
                          </span>
                          <span className="hidden sm:inline w-1 h-1 rounded-full bg-slate-300" />
                          <span className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px] opacity-75">calendar_month</span>
                            {formatDate(log.created_at)} at {formatTime(log.created_at)}
                          </span>
                        </div>
                      </div>

                      {/* Delete button (visible on hover) */}
                      <button 
                        onClick={() => handleDeleteLog(log.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg self-center"
                        title="Delete log permanently"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
