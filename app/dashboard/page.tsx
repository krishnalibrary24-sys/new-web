"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useBranch } from "@/components/branch-context";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function DashboardPage() {
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();
  const { activeBranch } = useBranch();

  useEffect(() => {
    const savedRole = localStorage.getItem("krishna_role");
    if (!savedRole) {
      router.push("/login");
    } else {
      setRole(savedRole);
    }
  }, [router]);

  if (!role) return null;

  const isAdmin = role === "admin";

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {isAdmin ? "Dashboard" : "Command Center"}
          </h1>
          <p className="page-subtitle">
            {isAdmin 
              ? "Monitor all branches and revenue streams." 
              : "Manage daily operations, seating, and student lifecycle."}
          </p>
        </div>
        <div className="flex gap-3">
          <button className="btn-ghost px-4 py-2.5 text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-base">download</span>
            Export
          </button>
          {!isAdmin && (
            <Link href="/dashboard/admission" className="btn-primary px-4 py-2.5 text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-base">person_add</span>
              New Admission
            </Link>
          )}
        </div>
      </div>

      {isAdmin ? <AdminDashboard activeBranch={activeBranch} /> : <OfficeDashboard branch={activeBranch} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ADMIN DASHBOARD
   ═══════════════════════════════════════════════════════════ */
function AdminDashboard({ activeBranch }: { activeBranch: string }) {
  const branchName = activeBranch === 'namnakala' ? 'Namnakala' : 'Bangali Chowk';

  const [stats, setStats] = useState({
    totalRevenue: '—', receivedRevenue: '—', upcomingRevenue: '—', members: '—', occupancy: 0,
    bcRevenue: 0, nmRevenue: 0, totalSeats: 274,
    fullDayPct: 0, halfDayPct: 0, fullDayCount: 0, halfDayCount: 0,
    lossPayments: '—', leftMembers: '—'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAdminStats() {
      setLoading(true);
      try {
        const { data: members } = await supabase
          .from('members')
          .select('branch, is_active, plan_amount, subscription_end_date, pay_later, left_with_dues, loss_amount')
          .eq('branch', activeBranch);
        
        if (members) {
          const active = members.filter(m => m.is_active && !m.left_with_dues);
          
          // Received: active members who have actually paid (not pay later)
          const receivedRevenueVal = active.filter(m => !m.pay_later).reduce((sum, m) => sum + (m.plan_amount || 0), 0);
          
          // Upcoming: normal inactive/overdue members (excluding those who permanently left) AND active pay_later outstanding dues
          const overdue = members.filter(m => !m.is_active && !m.left_with_dues);
          const payLaterDues = active.filter(m => m.pay_later).reduce((sum, m) => sum + (m.plan_amount || 0), 0);
          const upcomingRevenueVal = overdue.reduce((sum, m) => sum + (m.plan_amount || 0), 0) + payLaterDues;
          
          const totalRevenueVal = receivedRevenueVal + upcomingRevenueVal;

          // Loss Payments and Left Members count
          const lossMembers = members.filter(m => m.left_with_dues);
          const lossRevenueVal = lossMembers.reduce((sum, m) => sum + (m.loss_amount || 0), 0);
          const leftMembersCount = lossMembers.length;

          // Branch-wise Active Revenues
          const { data: bcData } = await supabase.from('members').select('plan_amount').eq('branch', 'bengali-chowk').eq('is_active', true).eq('pay_later', false);
          const { data: nmData } = await supabase.from('members').select('plan_amount').eq('branch', 'namnakala').eq('is_active', true).eq('pay_later', false);

          const bcRevenue = bcData?.reduce((sum, m) => sum + (m.plan_amount || 0), 0) || 0;
          const nmRevenue = nmData?.reduce((sum, m) => sum + (m.plan_amount || 0), 0) || 0;

          const fullDayCount = active.filter(m => m.plan_amount >= 1000).length;
          const halfDayCount = active.filter(m => m.plan_amount && m.plan_amount < 1000).length;
          const totalActive = active.length || 1; // Prevent div by 0

          setStats({
            totalRevenue: `₹${totalRevenueVal.toLocaleString('en-IN')}`,
            receivedRevenue: `₹${receivedRevenueVal.toLocaleString('en-IN')}`,
            upcomingRevenue: `₹${upcomingRevenueVal.toLocaleString('en-IN')}`,
            members: active.length.toString(),
            occupancy: Math.round((active.length / (activeBranch === 'bengali-chowk' ? 153 : 121)) * 100),
            bcRevenue,
            nmRevenue,
            totalSeats: 274,
            fullDayCount,
            halfDayCount,
            fullDayPct: Math.round((fullDayCount / totalActive) * 100),
            halfDayPct: Math.round((halfDayCount / totalActive) * 100),
            lossPayments: `₹${lossRevenueVal.toLocaleString('en-IN')}`,
            leftMembers: leftMembersCount.toString()
          });
        }
      } catch (err) {
        console.error("Stats fetch error:", err);
      }
      setLoading(false);
    }
    fetchAdminStats();
  }, [activeBranch]);

  return (
    <div className="space-y-6 animate-fade-in-fast">
      {/* ─── Stat Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        <StatCard
          icon="account_balance" iconClass="stat-icon-primary" label={`Total Revenue`}
          value={loading ? null : stats.totalRevenue}
        />
        <StatCard
          icon="payments" iconClass="stat-icon-success" label={`Received`}
          value={loading ? null : stats.receivedRevenue}
        />
        <StatCard
          icon="pending_actions" iconClass="stat-icon-warning" label={`Upcoming`}
          value={loading ? null : stats.upcomingRevenue}
        />
        <StatCard
          icon="money_off" iconClass="stat-icon-danger" label={`Loss Payment`}
          value={loading ? null : stats.lossPayments}
        />
        <StatCard
          icon="directions_run" iconClass="stat-icon-warning" label={`Left Members`}
          value={loading ? null : stats.leftMembers}
        />
        <StatCard
          icon="group" iconClass="stat-icon-primary" label={`Active`}
          value={loading ? null : stats.members}
        />
        <StatCard
          icon="speed" iconClass="stat-icon-warning" label={`Occupancy`}
          value={loading ? null : `${stats.occupancy}%`}
          progressValue={stats.occupancy}
        />
      </div>

      {/* ─── Charts Row ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Split */}
        <div className="glass-pane-elevated">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-bold text-slate-800 font-manrope">Branch Revenue Split</h3>
            <button className="text-primary text-xs font-semibold hover:underline">View Details →</button>
          </div>
          <div className="space-y-5">
            <BranchBar name="Bangali Chowk" color="bg-primary" value={stats.bcRevenue} total={stats.bcRevenue + stats.nmRevenue} isCurrency={true} />
            <BranchBar name="Namnakala" color="bg-tertiary" value={stats.nmRevenue} total={stats.bcRevenue + stats.nmRevenue} isCurrency={true} />
          </div>
        </div>

        {/* Subscription Breakdown */}
        <div className="glass-pane-elevated flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-bold text-slate-800 font-manrope">Subscription Types</h3>
          </div>
          <div className="flex items-center justify-center gap-10 flex-1">
            <div className="relative w-28 h-28">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90 drop-shadow-md">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f97316" strokeWidth="3" strokeDasharray={`${stats.fullDayPct} ${100 - stats.fullDayPct}`} strokeLinecap="round" className="transition-all duration-700 drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f59e0b" strokeWidth="3" strokeDasharray={`${stats.halfDayPct} ${100 - stats.halfDayPct}`} strokeDashoffset={`-${stats.fullDayPct}`} strokeLinecap="round" className="transition-all duration-700 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-black text-slate-800">{loading ? '...' : '100%'}</span>
                <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Active</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-sm bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                <div>
                  <div className="text-slate-800 font-semibold text-sm">Full Day</div>
                  <div className="text-xs text-slate-500">{loading ? '...' : `${stats.fullDayPct}% (${stats.fullDayCount} students)`}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-sm bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                <div>
                  <div className="text-slate-800 font-semibold text-sm">Half Day</div>
                  <div className="text-xs text-slate-500">{loading ? '...' : `${stats.halfDayPct}% (${stats.halfDayCount} students)`}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Quick Actions ─── */}
      <div className="glass-pane-elevated">
        <h3 className="text-base font-bold text-slate-800 font-manrope mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickAction href="/dashboard/admission" icon="person_add" label="New Admission" color="text-primary" />
          <QuickAction href="/dashboard/members" icon="school" label="Student Directory" color="text-tertiary" />
          <QuickAction href="/dashboard/dues" icon="account_balance_wallet" label="Dues Tracker" color="text-red-400" />
          <QuickAction href="/dashboard/seating" icon="grid_view" label="Seat Map" color="text-emerald-400" />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   OFFICE DASHBOARD
   ═══════════════════════════════════════════════════════════ */
function OfficeDashboard({ branch }: { branch: string }) {
  const branchName = branch === "namnakala" ? "Namnakala" : "Bangali Chowk";
  
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dueSoon, setDueSoon] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    const fetchLiveMembers = async () => {
      setLoading(true);
      
      // Auto-eviction of expired members
      try {
        const { data: expired } = await supabase
          .from('members')
          .select('id, seat_no')
          .eq('branch', branch)
          .eq('is_active', true)
          .lt('subscription_end_date', new Date().toISOString());

        if (expired && expired.length > 0) {
          for (const m of expired) {
            await supabase
              .from('members')
              .update({ 
                is_active: false, 
                previous_seat_no: m.seat_no, 
                seat_no: null 
              })
              .eq('id', m.id);
          }
        }
      } catch (err) {
        console.error("Auto-eviction failed", err);
      }

      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('branch', branch)
        .order('created_at', { ascending: false });
      
      if (data) {
        const now = new Date();
        const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
        
        const dueSoonCount = data.filter(m => {
          if (!m.is_active || !m.subscription_end_date) return false;
          const end = new Date(m.subscription_end_date);
          return end >= now && end <= in3Days;
        }).length;

        const defaulterCount = data.filter(m => !m.is_active).length;
        const activeMembers = data.filter(m => m.is_active);
        
        setDueSoon(dueSoonCount);
        setOverdueCount(defaulterCount);
        setActiveCount(activeMembers.length);
        setMembers(activeMembers.slice(0, 10));
      } else if (error) {
        console.error("Error fetching members:", error);
      }
      setLoading(false);
    };

    fetchLiveMembers();
  }, [branch]);

  return (
    <div className="space-y-6">
      {/* ─── Stat Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="group" iconClass="stat-icon-primary" label="Active Members" value={loading ? null : activeCount.toString()} />
        <StatCard icon="event_upcoming" iconClass="stat-icon-warning" label="Due in 3 Days" value={loading ? null : dueSoon.toString()} />
        <StatCard 
          icon="warning" iconClass="stat-icon-danger" label="Overdue / Inactive" 
          value={loading ? null : overdueCount.toString()} 
          badge={overdueCount > 0 ? "Action Required" : undefined} badgeClass="badge-danger"
        />
        <StatCard icon="event_seat" iconClass="stat-icon-success" label="Available Seats" value={loading ? null : ((branch === 'bengali-chowk' ? 153 : 121) - activeCount).toString()} />
      </div>

      {/* ─── Quick Actions ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickAction href="/dashboard/admission" icon="person_add" label="New Admission" color="text-primary" />
        <QuickAction href="/dashboard/dues" icon="event_upcoming" label="Due Tracker" color="text-tertiary" />
        <QuickAction href="/dashboard/dues" icon="warning" label="Defaulters" color="text-red-400" />
        <QuickAction href="/dashboard/seating" icon="grid_view" label="Seat Map" color="text-emerald-400" />
      </div>

      {/* ─── Active Members Table ─── */}
      <div className="glass-pane-elevated !p-0 overflow-hidden flex flex-col" style={{ height: 'clamp(400px, 50vh, 600px)' }}>
        <div className="px-6 py-4 border-b border-white/[0.06] flex flex-col md:flex-row justify-between items-center gap-3 bg-white/[0.02]">
          <h3 className="text-base font-bold text-white font-manrope">Active Members — {branchName}</h3>
          <div className="relative w-full md:w-56">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-sm">search</span>
            <input 
              type="text" 
              placeholder="Search..." 
              className="input-premium !py-2 !pl-9 !pr-4 !text-sm !rounded-lg"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm whitespace-nowrap table-premium">
            <thead className="sticky top-0 z-10">
              <tr>
                <th>ID</th>
                <th>Details</th>
                <th>Assignment</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td><div className="skeleton h-5 w-20" /></td>
                    <td><div className="skeleton h-5 w-32" /></td>
                    <td><div className="skeleton h-5 w-16" /></td>
                    <td><div className="skeleton h-5 w-14" /></td>
                    <td><div className="skeleton h-5 w-8 ml-auto" /></td>
                  </tr>
                ))
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      <span className="material-symbols-outlined empty-state-icon">group_off</span>
                      <div className="empty-state-title">No Active Members</div>
                      <div className="empty-state-desc">No active bookings found for this branch.</div>
                    </div>
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="cursor-pointer group">
                    <td>
                      <span className="badge badge-info">{member.permanent_id}</span>
                    </td>
                    <td>
                      <div className="text-white font-semibold">{member.full_name}</div>
                      <div className="text-xs text-on-surface-variant mt-0.5">{member.mobile}</div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-md bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/20">
                          {member.seat_no || '—'}
                        </span>
                        <span className="text-white/70 text-xs">{member.shift}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${member.is_active ? 'badge-success' : 'badge-danger'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${member.is_active ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        {member.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-right">
                      <button className="text-on-surface-variant hover:text-white p-1.5 rounded-lg hover:bg-white/[0.04] opacity-0 group-hover:opacity-100 transition-all">
                        <span className="material-symbols-outlined text-base">more_horiz</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   REUSABLE COMPONENTS
   ═══════════════════════════════════════════════════════════ */

function StatCard({ icon, iconClass, label, value, trend, trendUp, badge, badgeClass, progressValue }: {
  icon: string; iconClass: string; label: string; value: string | null;
  trend?: string; trendUp?: boolean; badge?: string; badgeClass?: string; progressValue?: number;
}) {
  return (
    <div className="glass-pane-elevated relative overflow-hidden flex flex-col items-center text-center !p-6 group">
      {/* Edge Ovals / Ambient Light */}
      <div className="absolute -left-8 -top-8 w-32 h-32 rounded-[100%] blur-[40px] opacity-20 group-hover:opacity-40 transition-opacity" style={{ background: iconClass.includes('primary') ? '#bfc2ff' : iconClass.includes('danger') ? '#ff5540' : iconClass.includes('warning') ? '#e9c400' : '#4ade80' }} />
      <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-[100%] blur-[40px] opacity-10 group-hover:opacity-30 transition-opacity" style={{ background: iconClass.includes('primary') ? '#bfc2ff' : iconClass.includes('danger') ? '#ff5540' : iconClass.includes('warning') ? '#e9c400' : '#4ade80' }} />
      
      <div className="relative z-10 flex flex-col items-center w-full">
        {/* Top Badges (floating right) */}
        <div className="absolute -right-2 -top-2 flex gap-2">
          {trend && (
            <span className={`badge ${trendUp ? 'badge-success' : 'badge-danger'}`}>
              <span className="material-symbols-outlined text-[10px]">{trendUp ? 'trending_up' : 'trending_down'}</span>
              {trend}
            </span>
          )}
          {badge && <span className={`badge ${badgeClass}`}>{badge}</span>}
        </div>

        <div className={`stat-icon ${iconClass} shadow-[0_0_15px_rgba(255,255,255,0.1)] mb-4 !w-12 !h-12 flex items-center justify-center`}>
          <span className="material-symbols-outlined text-2xl drop-shadow-md">{icon}</span>
        </div>
        
        <p className="text-on-surface-variant text-[11px] font-bold uppercase tracking-[0.15em] mb-1.5 opacity-80">{label}</p>
        
        {value === null ? (
          <div className="skeleton h-10 w-24 mt-1 rounded-lg" />
        ) : (
          <h3 className="text-4xl font-black text-white tracking-tighter drop-shadow-lg">{value}</h3>
        )}

        {progressValue !== undefined && (
          <div className="progress-bar mt-6 w-full !bg-white/[0.04] border border-white/[0.05] !h-1.5 rounded-full overflow-hidden">
            <div className="h-full shadow-[0_0_10px_currentColor] relative rounded-full" style={{ width: `${Math.min(progressValue, 100)}%`, background: iconClass.includes('primary') ? '#bfc2ff' : iconClass.includes('danger') ? '#ff5540' : iconClass.includes('warning') ? '#e9c400' : '#4ade80', color: iconClass.includes('primary') ? '#bfc2ff' : iconClass.includes('danger') ? '#ff5540' : iconClass.includes('warning') ? '#e9c400' : '#4ade80' }}>
              <div className="absolute inset-0 bg-white/40 w-full h-full" style={{ clipPath: 'polygon(0 0, 100% 0, 80% 100%, 0% 100%)' }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BranchBar({ name, color, value, total, isCurrency }: { name: string; color: string; value: number; total: number; isCurrency?: boolean }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="group">
      <div className="flex justify-between items-center text-sm mb-2.5">
        <span className="font-semibold text-slate-800 flex items-center gap-2.5">
          <span className={`w-2.5 h-2.5 rounded-sm ${color} shadow-sm`} />
          {name}
        </span>
        <span className="font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 text-xs">
          {isCurrency ? `₹${value.toLocaleString('en-IN')}` : `${value}/${total} seats`}
        </span>
      </div>
      <div className="h-2.5 bg-slate-100 border border-slate-200 rounded-full overflow-hidden">
        <div className={`h-full ${color} shadow-sm relative transition-all duration-1000`} style={{ width: `${pct}%` }}>
           <div className="absolute inset-0 bg-white/20 w-full h-full" style={{ clipPath: 'polygon(0 0, 100% 0, 80% 100%, 0% 100%)' }} />
        </div>
      </div>
    </div>
  );
}

function QuickAction({ href, icon, label, color }: { href: string; icon: string; label: string; color: string }) {
  return (
    <Link href={href} className="glass-pane-elevated quick-action-card !p-5 hover:!bg-slate-50 text-center transition-all hover:-translate-y-1 hover:shadow-lg group cursor-pointer flex flex-col items-center justify-center gap-3">
      <span className={`material-symbols-outlined text-3xl block ${color} group-hover:scale-110 group-hover:-translate-y-1 transition-all`}>{icon}</span>
      <div className="text-slate-700 font-bold text-xs tracking-wider uppercase">{label}</div>
    </Link>
  );
}
