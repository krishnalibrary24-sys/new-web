"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useBranch } from "@/components/branch-context";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { createPortal } from "react-dom";
import { checkAndReleaseSeats, formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();
  const { activeBranch } = useBranch();

  useEffect(() => {
    const savedRole = localStorage.getItem("krishna_role");
    if (!savedRole) {
      router.push("/login-kl-staff2244");
    } else {
      setRole(savedRole);
    }
  }, [router]);

  if (!role) return null;

  const isAdmin = role === "admin";

  const handleExportPDF = () => {
    window.dispatchEvent(new Event('export-dashboard-pdf'));
  };

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
          {isAdmin && (
            <button onClick={handleExportPDF} className="btn-ghost px-4 py-2.5 text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-base">download</span>
              Export
            </button>
          )}
          {!isAdmin && (
            <Link href="/dashboard/admission" className="btn-primary px-4 py-2.5 text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-base">person_add</span>
              New Admission
            </Link>
          )}
        </div>
      </div>

      <div id="admin-dashboard-content">
        {isAdmin ? <AdminDashboard activeBranch={activeBranch} /> : <OfficeDashboard branch={activeBranch} />}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ADMIN DASHBOARD
   ═══════════════════════════════════════════════════════════ */


function AdminDashboard({ activeBranch }: { activeBranch: string }) {
  const branchName = activeBranch === 'namnakala' ? 'Namnakala' : 'Bangali Chowk';
  const router = useRouter();

  const [stats, setStats] = useState({
    totalRevenue: '—', receivedRevenue: '—', upcomingRevenue: '—', members: '—', occupancy: 0,
    bcRevenue: 0, nmRevenue: 0, totalSeats: 274,
    fullDayPct: 0, halfDayPct: 0, fullDayCount: 0, halfDayCount: 0,
    lossPayments: '—', leftMembers: '—',
    cashRevenue: '—', onlineRevenue: '—'
  });
  const [todayStats, setTodayStats] = useState({
    cash: 0,
    online: 0,
    total: 0,
    newMembers: [] as any[],
    todayPayments: [] as any[]
  });
  const [loading, setLoading] = useState(true);

  // Month and custom selector states
  const todayDate = new Date();
  const currentMonthValue = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthValue);

  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const today = new Date();
    // Default to 1st of current month
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return firstDay.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const getMonthOptions = () => {
    const options = [{ label: "All Time", value: "all" }];
    const today = new Date();
    // 12 months in past to 3 months in future
    for (let i = -12; i <= 3; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      options.push({ label, value });
    }
    options.push({ label: "Custom Range", value: "custom" });
    return options;
  };

  // Raw members & payments for detailed click inspection
  const [rawMembers, setRawMembers] = useState<any[]>([]);
  const [rawPayments, setRawPayments] = useState<any[]>([]);
  const [inspectCategory, setInspectCategory] = useState<string | null>(null);
  const [inspectSearch, setInspectSearch] = useState("");
  const [inspectSort, setInspectSort] = useState("latest-payment");

  useEffect(() => {
    let active = true;
    async function fetchAdminStats() {
      setLoading(true);
      try {
        const [membersRes, paymentsRes, bcRes, nmRes] = await Promise.all([
          supabase
            .from('members')
            .select('id, created_at, permanent_id, full_name, father_name, mobile, shift, branch, seat_no, is_active, plan_amount, subscription_end_date, left_with_dues, loss_amount, left_at, pay_later, payment_due_date, left_reason, outstanding_dues, payment_status')
            .eq('branch', activeBranch),
          supabase
            .from('payments')
            .select('member_id, amount, paid_at, payment_mode, invoice_id, notes')
            .eq('branch', activeBranch),
          supabase
            .from('payments')
            .select('amount, paid_at')
            .eq('branch', 'bengali-chowk'),
          supabase
            .from('payments')
            .select('amount, paid_at')
            .eq('branch', 'namnakala')
        ]);

        if (!active) return;

        let members = membersRes.data;
        const payments = paymentsRes.data;

        if (members) {
          const { updatedMembers } = await checkAndReleaseSeats(members, activeBranch);
          members = updatedMembers;
          setRawMembers(members);
          setRawPayments(payments || []);
          const today = new Date();
          today.setHours(0,0,0,0);

          // Determine date ranges
          let startDate: Date | null = null;
          let endDate: Date | null = null;
          let lossStartDate: Date | null = null;
          let lossEndDate: Date | null = null;

          const isFiltered = selectedMonth !== "all";
          
          if (selectedMonth === "custom") {
            startDate = new Date(customStartDate);
            endDate = new Date(customEndDate);
            endDate.setHours(23, 59, 59, 999);
            
            const targetYear = endDate.getFullYear();
            lossStartDate = new Date(targetYear, 0, 1);
            lossEndDate = new Date(targetYear, 11, 31, 23, 59, 59, 999);
          } else if (selectedMonth !== "all") {
            const [y, m] = selectedMonth.split('-').map(Number);
            startDate = new Date(y, m - 1, 1);
            endDate = new Date(y, m, 0, 23, 59, 59, 999);
            
            lossStartDate = new Date(y, 0, 1);
            lossEndDate = new Date(y, 11, 31, 23, 59, 59, 999);
          }

          // Active members who have not left
          const activeMembers = members.filter(m => m.is_active && !m.left_at);

          // Calculate Total Received
          let receivedRevenueVal = 0;
          let cashRevenueVal = 0;
          let onlineRevenueVal = 0;
          
          (payments || []).forEach(p => {
             const amt = Number(p.amount || 0);
             const paidDate = p.paid_at ? new Date(p.paid_at) : null;
             const matchesMonth = !isFiltered || (paidDate && paidDate >= startDate! && paidDate <= endDate!);
             
             if (matchesMonth) {
               receivedRevenueVal += amt;
               if (p.payment_mode === 'Cash') {
                 cashRevenueVal += amt;
               } else {
                 onlineRevenueVal += amt;
               }
             }
          });

          // Calculate Pending & Expected from Active/Non-Left Members
          let pendingDuesVal = 0;
          let overdueExpectedVal = 0;

          const nonLeftMembers = members.filter(m => !m.left_at);

          nonLeftMembers.forEach(m => {
            let memberDues = 0;
            if (m.pay_later) {
              memberDues = Number(m.outstanding_dues || m.plan_amount || 0);
            } else {
              memberDues = Number(m.outstanding_dues || 0);
            }

            // Check if the due date falls before the end of selected month/period (carry forward)
            let isDueBeforeEnd = false;
            if (!isFiltered) {
              isDueBeforeEnd = true;
            } else {
              if (m.payment_due_date) {
                const dueDate = new Date(m.payment_due_date);
                isDueBeforeEnd = dueDate <= endDate!;
              } else {
                const createdDate = m.created_at ? new Date(m.created_at) : null;
                isDueBeforeEnd = !!(createdDate && createdDate <= endDate!);
              }
            }

            if (isDueBeforeEnd) {
              pendingDuesVal += memberDues;
            }

            // Expected renewal if expired
            if (m.subscription_end_date) {
              const endDateObj = new Date(m.subscription_end_date);
              const isExpired = endDateObj < today;
              
              let matchesRenewalRange = false;
              if (!isFiltered) {
                matchesRenewalRange = isExpired;
              } else {
                matchesRenewalRange = endDateObj >= startDate! && endDateObj <= endDate!;
              }
              
              if (matchesRenewalRange) {
                if (m.pay_later) {
                  // Already counted under pendingDuesVal
                } else if (isExpired && memberDues === 0) {
                  overdueExpectedVal += (m.plan_amount || 0);
                }
              }
            }
          });

          // Upcoming Revenue = Pending Dues + Expected renewal of expired/inactive members
          const upcomingRevenueVal = pendingDuesVal + overdueExpectedVal;
          const totalRevenueVal = receivedRevenueVal + upcomingRevenueVal;

          // Loss Payments and Left Members count
          // Only show/count members marked as left with dues AND outstanding loss amount > 0 within the year of endDate
          const lossMembers = members.filter(m => {
            if (!m.left_with_dues || !m.left_at || !(m.loss_amount || 0)) return false;
            if (!isFiltered) return true;
            const leftDate = new Date(m.left_at);
            return leftDate >= lossStartDate! && leftDate <= lossEndDate!;
          });
          const lossRevenueVal = lossMembers.reduce((sum, m) => sum + (m.loss_amount || 0), 0);
          const leftMembersCount = lossMembers.length;

          // Branch-wise Received Revenues
          const bcData = bcRes.data || [];
          const nmData = nmRes.data || [];

          const bcRevenue = bcData.reduce((sum, p) => {
             const amt = Number(p.amount || 0);
             const paidDate = p.paid_at ? new Date(p.paid_at) : null;
             const matchesMonth = !isFiltered || (paidDate && paidDate >= startDate! && paidDate <= endDate!);
             return matchesMonth ? sum + amt : sum;
          }, 0);
          const nmRevenue = nmData.reduce((sum, p) => {
             const amt = Number(p.amount || 0);
             const paidDate = p.paid_at ? new Date(p.paid_at) : null;
             const matchesMonth = !isFiltered || (paidDate && paidDate >= startDate! && paidDate <= endDate!);
             return matchesMonth ? sum + amt : sum;
          }, 0);

          const fullDayCount = activeMembers.filter(m => m.plan_amount >= 1000).length;
          const halfDayCount = activeMembers.filter(m => m.plan_amount && m.plan_amount < 1000).length;
          const totalActive = activeMembers.length || 1; // Prevent div by 0

          // Calculate Today's Activity (Resets Everyday)
          const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
          const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

          let todayCashVal = 0;
          let todayOnlineVal = 0;
          const todayPaymentsList: any[] = [];
          (payments || []).forEach(p => {
            if (!p.paid_at) return;
            const paidDate = new Date(p.paid_at);
            if (paidDate >= startOfToday && paidDate <= endOfToday) {
              const amt = Number(p.amount || 0);
              if (p.payment_mode === 'Cash') {
                todayCashVal += amt;
              } else {
                todayOnlineVal += amt;
              }
              // Find matching member
              const matchedMember = (members || []).find(m => m.id === p.member_id);
              todayPaymentsList.push({
                ...p,
                memberName: matchedMember ? matchedMember.full_name : 'Unknown Student',
                permanentId: matchedMember ? matchedMember.permanent_id : 'N/A'
              });
            }
          });

          const todayNewMembersList = (members || []).filter(m => {
            if (!m.created_at) return false;
            const createdDate = new Date(m.created_at);
            return createdDate >= startOfToday && createdDate <= endOfToday;
          });

          setTodayStats({
            cash: todayCashVal,
            online: todayOnlineVal,
            total: todayCashVal + todayOnlineVal,
            newMembers: todayNewMembersList,
            todayPayments: todayPaymentsList
          });

          setStats({
            totalRevenue: `₹${totalRevenueVal.toLocaleString('en-IN')}`,
            receivedRevenue: `₹${receivedRevenueVal.toLocaleString('en-IN')}`,
            upcomingRevenue: `₹${upcomingRevenueVal.toLocaleString('en-IN')}`,
            members: activeMembers.length.toString(),
            occupancy: Math.round((activeMembers.length / (activeBranch === 'bengali-chowk' ? 153 : 121)) * 100),
            bcRevenue,
            nmRevenue,
            totalSeats: 274,
            fullDayCount,
            halfDayCount,
            fullDayPct: Math.round((fullDayCount / totalActive) * 100),
            halfDayPct: Math.round((halfDayCount / totalActive) * 100),
            lossPayments: `₹${lossRevenueVal.toLocaleString('en-IN')}`,
            leftMembers: leftMembersCount.toString(),
            cashRevenue: `₹${cashRevenueVal.toLocaleString('en-IN')}`,
            onlineRevenue: `₹${onlineRevenueVal.toLocaleString('en-IN')}`
          });
        }
      } catch (err) {
        console.error("Stats fetch error:", err);
      }
      setLoading(false);
    }
    fetchAdminStats();
    return () => {
      active = false;
    };
  }, [activeBranch, selectedMonth, customStartDate, customEndDate]);

  useEffect(() => {
    const handleExport = async () => {
      try {
        const { jsPDF } = await import('jspdf');
        const { default: autoTable } = await import('jspdf-autotable');
        
        const doc = new jsPDF();
        
        // Month Formatting
        let displayPeriod = "All Time";
        if (selectedMonth === "custom") {
          displayPeriod = `${formatDate(customStartDate)} to ${formatDate(customEndDate)}`;
        } else if (selectedMonth !== "all") {
          const [y, m] = selectedMonth.split('-');
          const d = new Date(parseInt(y), parseInt(m) - 1, 1);
          displayPeriod = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        }
        
        // Header Banner Style
        doc.setFillColor(0, 49, 120); // #003178
        doc.rect(0, 0, 210, 35, 'F');
        
        // Title
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.text("KRISHNA LIBRARY", 14, 18);
        
        // Subtitle
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(226, 232, 240);
        
        doc.text(`Dashboard Report - ${branchName} Branch  |  Period: ${displayPeriod}`, 14, 25);
        
        // Generation Info (Date & Time)
        const nowStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        doc.text(`Generated: ${nowStr}`, 130, 25);
        
        // Financial Table
        autoTable(doc, {
          startY: 45,
          head: [["Financial Overview", "Amount"]],
          body: [
            ["Total Revenue", stats.totalRevenue.replace('₹', 'Rs. ')],
            ["Total Received", stats.receivedRevenue.replace('₹', 'Rs. ')],
            ["Cash Collection", stats.cashRevenue.replace('₹', 'Rs. ')],
            ["Online Collection", stats.onlineRevenue.replace('₹', 'Rs. ')],
            ["Upcoming / Pending Dues", stats.upcomingRevenue.replace('₹', 'Rs. ')],
            ["Loss Payments (Defaulters)", stats.lossPayments.replace('₹', 'Rs. ')]
          ],
          theme: 'grid',
          headStyles: { fillColor: [0, 49, 120], textColor: [255, 255, 255], fontSize: 11, fontStyle: 'bold' },
          bodyStyles: { fontSize: 10, textColor: [30, 41, 59] },
          columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right', fontStyle: 'bold', textColor: [21, 128, 61] } },
          alternateRowStyles: { fillColor: [248, 250, 252] }
        });

        // Operational Table
        autoTable(doc, {
          startY: (doc as any).lastAutoTable.finalY + 15,
          head: [["Operational Metrics", "Count / Value"]],
          body: [
            ["Active Members", stats.members],
            ["Current Occupancy", `${stats.occupancy}%`],
            ["Full Day Students", `${stats.fullDayCount} (${stats.fullDayPct}%)`],
            ["Half Day Students", `${stats.halfDayCount} (${stats.halfDayPct}%)`],
            ["Total Left Members (Defaulters)", stats.leftMembers]
          ],
          theme: 'grid',
          headStyles: { fillColor: [234, 88, 12], textColor: [255, 255, 255], fontSize: 11, fontStyle: 'bold' },
          bodyStyles: { fontSize: 10, textColor: [30, 41, 59] },
          columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right', fontStyle: 'bold' } },
          alternateRowStyles: { fillColor: [255, 247, 237] }
        });
        
        // Detailed Revenue Table
        const today = new Date();
        today.setHours(0,0,0,0);
        const isFiltered = selectedMonth !== "all";
        
        let startDate: Date | null = null;
        let endDate: Date | null = null;
        if (selectedMonth === "custom") {
          startDate = new Date(customStartDate);
          endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999);
        } else if (isFiltered) {
          const [y, m] = selectedMonth.split('-').map(Number);
          startDate = new Date(y, m - 1, 1);
          endDate = new Date(y, m, 0, 23, 59, 59, 999);
        }

        const filteredPayments = (rawPayments || []).filter(p => {
          if (!isFiltered) return true;
          const paidDate = p.paid_at ? new Date(p.paid_at) : null;
          return !!(paidDate && paidDate >= startDate! && paidDate <= endDate!);
        });

        const revenueBody = filteredPayments.map(p => {
           const member = rawMembers.find(m => m.id === p.member_id);
           return [
             member?.permanent_id || "N/A",
             member ? member.full_name : "Unknown",
             `Rs. ${p.amount}`,
             p.payment_mode || "Cash",
             p.paid_at ? formatDate(p.paid_at) : "N/A"
           ];
        });

        if (revenueBody.length > 0) {
          autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 15,
            head: [["Member ID", "Member Name", "Received Amount", "Payment Mode", "Date"]],
            body: revenueBody,
            theme: 'grid',
            headStyles: { fillColor: [21, 128, 61], textColor: [255, 255, 255], fontSize: 10, fontStyle: 'bold' },
            bodyStyles: { fontSize: 9, textColor: [30, 41, 59] },
            alternateRowStyles: { fillColor: [240, 253, 244] }
          });
        }

        // Detailed Upcoming Table
        const upcomingBody = rawMembers.filter(m => !m.left_at).map(m => {
          let upcoming = 0;
          let isDueBeforeEnd = false;
          if (!isFiltered) {
            isDueBeforeEnd = true;
          } else {
            if (m.payment_due_date) {
              const dueDate = new Date(m.payment_due_date);
              isDueBeforeEnd = dueDate <= endDate!;
            } else {
              const createdDate = m.created_at ? new Date(m.created_at) : null;
              isDueBeforeEnd = !!(createdDate && createdDate <= endDate!);
            }
          }

          if (isDueBeforeEnd) {
            upcoming = Number(m.pay_later ? (m.outstanding_dues || m.plan_amount || 0) : (m.outstanding_dues || 0));
          }

          if (m.subscription_end_date) {
            const endDateObj = new Date(m.subscription_end_date);
            const isExpired = endDateObj < today;
            const matchesRenewalRange = !isFiltered || (endDateObj >= startDate! && endDateObj <= endDate!);
            if (matchesRenewalRange && isExpired && !m.pay_later && upcoming === 0) {
              upcoming = m.plan_amount || 0;
            }
          }

          return { id: m.permanent_id, name: m.full_name, phone: m.phone || "N/A", upcoming };
        }).filter(m => m.upcoming > 0).map(m => [
          m.id || "N/A",
          m.name,
          `Rs. ${m.upcoming}`,
          m.phone
        ]);

        if (upcomingBody.length > 0) {
          autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 15,
            head: [["Member ID", "Upcoming / Pending Member", "Due Amount", "Phone"]],
            body: upcomingBody,
            theme: 'grid',
            headStyles: { fillColor: [245, 158, 11], textColor: [255, 255, 255], fontSize: 10, fontStyle: 'bold' },
            bodyStyles: { fontSize: 9, textColor: [30, 41, 59] },
            alternateRowStyles: { fillColor: [255, 251, 235] }
          });
        }
        
        // Footer Note
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text("Note: Values shown represent the selected billing period filter.", 14, (doc as any).lastAutoTable.finalY + 15);

        const fileName = `Dashboard_Report_${activeBranch}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
      } catch (err) {
        console.error("PDF generation failed:", err);
        alert("Failed to export dashboard data. Please check console for details.");
      }
    };

    window.addEventListener('export-dashboard-pdf', handleExport);
    return () => window.removeEventListener('export-dashboard-pdf', handleExport as EventListener);
  }, [stats, activeBranch, branchName, selectedMonth, customStartDate, customEndDate, rawMembers, rawPayments]);

  const getInspectData = () => {
    if (!inspectCategory) return [];
    const today = new Date();
    today.setHours(0,0,0,0);

    const isFiltered = selectedMonth !== "all";
    let startDate: Date | null = null;
    let endDate: Date | null = null;
    let lossStartDate: Date | null = null;
    let lossEndDate: Date | null = null;

    if (selectedMonth === "custom") {
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
      endDate.setHours(23, 59, 59, 999);
      
      const targetYear = endDate.getFullYear();
      lossStartDate = new Date(targetYear, 0, 1);
      lossEndDate = new Date(targetYear, 11, 31, 23, 59, 59, 999);
    } else if (isFiltered) {
      const [y, m] = selectedMonth.split('-').map(Number);
      startDate = new Date(y, m - 1, 1);
      endDate = new Date(y, m, 0, 23, 59, 59, 999);
      
      lossStartDate = new Date(y, 0, 1);
      lossEndDate = new Date(y, 11, 31, 23, 59, 59, 999);
    }

    const getLatestDate = (m: any) => {
        const mPayments = rawPayments.filter(p => p.member_id === m.id);
        if (mPayments && mPayments.length > 0) {
            const sortedPayments = [...mPayments].sort((a, b) => {
              const tA = a.paid_at ? new Date(a.paid_at).getTime() : 0;
              const tB = b.paid_at ? new Date(b.paid_at).getTime() : 0;
              return (isNaN(tB) ? 0 : tB) - (isNaN(tA) ? 0 : tA);
            });
            return sortedPayments[0].paid_at;
        }
        return m.payment_due_date || m.subscription_end_date || m.created_at || new Date(0).toISOString();
    };

    let filtered: any[] = [];

    if (inspectCategory === "Total Revenue") {
      filtered = rawMembers.map(m => {
        const isExpired = m.subscription_end_date && new Date(m.subscription_end_date) < today;
        const mPayments = rawPayments.filter(p => {
          if (p.member_id !== m.id) return false;
          if (!isFiltered) return true;
          const paidDate = p.paid_at ? new Date(p.paid_at) : null;
          return !!(paidDate && paidDate >= startDate! && paidDate <= endDate!);
        });
        const paidThisMonth = mPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
        
        let pending = 0;
        let isDueBeforeEnd = false;
        if (!isFiltered) {
          isDueBeforeEnd = true;
          if (m.pay_later) {
            pending = m.outstanding_dues || m.plan_amount || 0;
          } else {
            pending = m.outstanding_dues || 0;
          }
          if (isExpired && pending === 0) {
            pending = m.plan_amount || 0;
          }
        } else {
          // Check if due date falls before the end of selected month/period (carry forward)
          if (m.payment_due_date) {
            const dueDate = new Date(m.payment_due_date);
            isDueBeforeEnd = dueDate <= endDate!;
          } else {
            const createdDate = m.created_at ? new Date(m.created_at) : null;
            isDueBeforeEnd = !!(createdDate && createdDate <= endDate!);
          }
          if (isDueBeforeEnd) {
            if (m.pay_later) {
              pending = m.outstanding_dues || m.plan_amount || 0;
            } else {
              pending = m.outstanding_dues || 0;
            }
          }
          if (m.subscription_end_date) {
            const endDateObj = new Date(m.subscription_end_date);
            const matchesRenewalRange = endDateObj >= startDate! && endDateObj <= endDate!;
            if (matchesRenewalRange && !m.pay_later && pending === 0 && endDateObj < today) {
              pending = m.plan_amount || 0;
            }
          }
        }

        return {
          ...m,
          inspectLabel: m.left_at 
            ? `Paid: ₹${paidThisMonth} | Left Member` 
            : `Paid: ₹${paidThisMonth} | Upcoming/Dues: ₹${pending}`,
          inspectSub: m.left_at ? `Left Member · Shift: ${m.shift}` : m.shift,
          inspectSortVal: paidThisMonth + pending
        };
      }).filter(m => m.inspectSortVal > 0);
    } else if (inspectCategory === "Received") {
      filtered = rawMembers.map(m => {
        const mPayments = rawPayments.filter(p => {
          if (p.member_id !== m.id) return false;
          if (!isFiltered) return true;
          const paidDate = p.paid_at ? new Date(p.paid_at) : null;
          return !!(paidDate && paidDate >= startDate! && paidDate <= endDate!);
        });
        const paid = mPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
        return { ...m, paid };
      }).filter(m => m.paid > 0).map(m => ({
        ...m,
        inspectLabel: `Received: ₹${m.paid.toLocaleString('en-IN')}`,
        inspectSub: m.left_at
          ? `Left Member (Plan: ₹${m.plan_amount || 0})`
          : `Plan Amount: ₹${m.plan_amount || 0}`,
        inspectSortVal: m.paid
      }));
    } else if (inspectCategory === "Upcoming") {
      filtered = rawMembers.filter(m => !m.left_at).map(m => {
        let upcoming = 0;
        let reason = "";

        let isDueBeforeEnd = false;
        if (!isFiltered) {
          isDueBeforeEnd = true;
        } else {
          if (m.payment_due_date) {
            const dueDate = new Date(m.payment_due_date);
            isDueBeforeEnd = dueDate <= endDate!;
          } else {
            const createdDate = m.created_at ? new Date(m.created_at) : null;
            isDueBeforeEnd = !!(createdDate && createdDate <= endDate!);
          }
        }

        if (isDueBeforeEnd) {
          if (m.pay_later) {
            upcoming = Number(m.outstanding_dues || m.plan_amount || 0);
            reason = "Pay Later (Deferred)";
          } else {
            upcoming = Number(m.outstanding_dues || 0);
            if (upcoming > 0) {
              reason = `Partial Payment Dues (Due: ${m.payment_due_date ? formatDate(m.payment_due_date) : 'N/A'})`;
            }
          }
        }

        if (m.subscription_end_date) {
          const endDateObj = new Date(m.subscription_end_date);
          const isExpired = endDateObj < today;
          const matchesRenewalRange = !isFiltered || (endDateObj >= startDate! && endDateObj <= endDate!);
          if (matchesRenewalRange && isExpired && !m.pay_later && upcoming === 0) {
            upcoming = m.plan_amount || 0;
            reason = `Subscription Expired on ${formatDate(m.subscription_end_date)}`;
          }
        }

        return { ...m, upcoming, reason };
      }).filter(m => m.upcoming > 0).map(m => ({
        ...m,
        inspectLabel: `Upcoming: ₹${m.upcoming.toLocaleString('en-IN')}`,
        inspectSub: m.reason,
        inspectSortVal: m.upcoming
      }));
    } else if (inspectCategory === "Loss Payment" || inspectCategory === "Left Members") {
      filtered = rawMembers.filter(m => {
        if (!m.left_with_dues || !m.left_at || !(m.loss_amount || 0)) return false;
        if (!isFiltered) return true;
        const leftDate = new Date(m.left_at);
        return leftDate >= lossStartDate! && leftDate <= lossEndDate!;
      }).map(m => ({
        ...m,
        inspectLabel: `Loss Amount: ₹${m.loss_amount}`,
        inspectSub: `Left: ${formatDate(m.left_at)} · Reason: ${m.left_reason || 'N/A'}`,
        inspectSortVal: m.loss_amount
      }));
    } else if (inspectCategory === "Active") {
      filtered = rawMembers.filter(m => m.is_active && !m.left_at).map(m => ({
        ...m,
        inspectLabel: `Seat: ${m.seat_no || 'Unassigned'} · Shift: ${m.shift}`,
        inspectSub: m.subscription_end_date ? `Expiry: ${formatDate(m.subscription_end_date)}` : 'No Expiry',
        inspectSortVal: m.full_name
      }));
    } else if (inspectCategory === "Occupancy") {
      filtered = rawMembers.filter(m => m.is_active && !m.left_at && m.seat_no).map(m => ({
        ...m,
        inspectLabel: `Seat: ${m.seat_no} · Shift: ${m.shift}`,
        inspectSub: `Plan Amount: ₹${m.plan_amount}`,
        inspectSortVal: m.seat_no ? parseInt(m.seat_no) || 999 : 999
      }));
    } else if (inspectCategory === "Cash Revenue") {
      filtered = rawMembers.map(m => {
        const mPayments = rawPayments.filter(p => {
          if (p.member_id !== m.id) return false;
          if (!isFiltered) return true;
          const paidDate = p.paid_at ? new Date(p.paid_at) : null;
          return !!(paidDate && paidDate >= startDate! && paidDate <= endDate!);
        });
        const paidCash = mPayments.filter(p => p.payment_mode === 'Cash').reduce((sum, p) => sum + Number(p.amount || 0), 0);
        return { ...m, paidCash };
      }).filter(m => m.paidCash > 0).map(m => ({
        ...m,
        inspectLabel: `Cash Received: ₹${m.paidCash.toLocaleString('en-IN')}`,
        inspectSub: m.left_at
          ? `Left Member`
          : m.payment_status === 'PENDING' ? `⚠️ Pending (Dues: ₹${m.outstanding_dues || 0})` : `✅ Full Payment`,
        inspectSortVal: m.paidCash
      }));
    } else if (inspectCategory === "Online Revenue") {
      filtered = rawMembers.map(m => {
        const mPayments = rawPayments.filter(p => {
          if (p.member_id !== m.id) return false;
          if (!isFiltered) return true;
          const paidDate = p.paid_at ? new Date(p.paid_at) : null;
          return !!(paidDate && paidDate >= startDate! && paidDate <= endDate!);
        });
        const paidOnline = mPayments.filter(p => p.payment_mode !== 'Cash').reduce((sum, p) => sum + Number(p.amount || 0), 0);
        return { ...m, paidOnline };
      }).filter(m => m.paidOnline > 0).map(m => ({
        ...m,
        inspectLabel: `Online Received: ₹${m.paidOnline.toLocaleString('en-IN')}`,
        inspectSub: m.left_at
          ? `Left Member`
          : m.payment_status === 'PENDING' ? `⚠️ Pending (Dues: ₹${m.outstanding_dues || 0})` : `✅ Full Payment`,
        inspectSortVal: m.paidOnline
      }));
    }

    return filtered.filter(m => 
      m.full_name.toLowerCase().includes(inspectSearch.toLowerCase()) ||
      m.permanent_id?.toLowerCase().includes(inspectSearch.toLowerCase()) ||
      m.mobile?.includes(inspectSearch)
    ).map(m => ({
        ...m,
        inspectDate: getLatestDate(m)
    })).sort((a,b) => {
        const timeA = a.inspectDate ? new Date(a.inspectDate).getTime() : 0;
        const timeB = b.inspectDate ? new Date(b.inspectDate).getTime() : 0;
        const validTimeA = isNaN(timeA) ? 0 : timeA;
        const validTimeB = isNaN(timeB) ? 0 : timeB;

        if (inspectSort === 'oldest-payment') {
            return validTimeA - validTimeB;
        } else if (inspectSort === 'amount-high') {
            const valA = typeof a.inspectSortVal === 'number' ? a.inspectSortVal : parseFloat(a.inspectSortVal) || 0;
            const valB = typeof b.inspectSortVal === 'number' ? b.inspectSortVal : parseFloat(b.inspectSortVal) || 0;
            return valB - valA;
        } else if (inspectSort === 'amount-low') {
            const valA = typeof a.inspectSortVal === 'number' ? a.inspectSortVal : parseFloat(a.inspectSortVal) || 0;
            const valB = typeof b.inspectSortVal === 'number' ? b.inspectSortVal : parseFloat(b.inspectSortVal) || 0;
            return valA - valB;
        }
        // default: latest-payment
        return validTimeB - validTimeA;
    });
  };

  return (
    <div className="space-y-6 animate-fade-in-fast">
      {/* ─── Month Filter Dropdown ─── */}
      <div className="glass-pane-elevated flex justify-between items-center gap-4 flex-wrap !border-slate-200/60 !bg-white/80 !py-3.5 !px-5 shadow-sm rounded-2xl relative z-20 !overflow-visible">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-lg">calendar_month</span>
          </div>
          <div>
            <div className="text-slate-800 font-bold text-sm font-manrope">Billing Period Filter</div>
            <div className="text-[10px] text-slate-500">Filter collections and expected renewals month-wise</div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {selectedMonth === "custom" && (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl p-1.5 px-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-500 uppercase font-bold">From</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-transparent border-none text-slate-800 font-semibold text-xs focus:outline-none focus:ring-0 cursor-pointer [color-scheme:light]"
                />
              </div>
              <div className="w-[1px] h-4 bg-slate-200" />
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-500 uppercase font-bold">To</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-transparent border-none text-slate-800 font-semibold text-xs focus:outline-none focus:ring-0 cursor-pointer [color-scheme:light]"
                />
              </div>
            </div>
          )}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="bg-white border border-slate-200/80 text-slate-800 font-bold text-xs rounded-xl py-2.5 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer min-w-[170px] flex items-center justify-between gap-2 shadow-sm hover:bg-slate-50 transition-all"
            >
              <span>{getMonthOptions().find(opt => opt.value === selectedMonth)?.label || selectedMonth}</span>
              <span className="material-symbols-outlined text-[16px] text-slate-500 transition-transform duration-200" style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }}>keyboard_arrow_down</span>
            </button>

            {isDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 w-[180px] bg-white border border-slate-200/80 rounded-xl py-1.5 shadow-xl z-50 max-h-[250px] overflow-y-auto backdrop-blur-md scrollbar-thin scrollbar-thumb-slate-200">
                  {getMonthOptions().map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setSelectedMonth(opt.value);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-semibold hover:bg-primary/10 hover:text-primary transition-all ${
                        selectedMonth === opt.value ? 'bg-primary/5 text-primary border-l-2 border-primary pl-3' : 'text-slate-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ─── Stat Cards ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <StatCard
          icon="account_balance" iconClass="stat-icon-primary" label={`Total Revenue`}
          value={loading ? null : stats.totalRevenue}
          onClick={() => { setInspectCategory("Total Revenue"); setInspectSearch(""); }}
        />
        <StatCard
          icon="payments" iconClass="stat-icon-success" label={`Received`}
          value={loading ? null : stats.receivedRevenue}
          onClick={() => { setInspectCategory("Received"); setInspectSearch(""); }}
        />
        <StatCard
          icon="local_atm" iconClass="stat-icon-success" label={`Cash Revenue`}
          value={loading ? null : stats.cashRevenue}
          onClick={() => { setInspectCategory("Cash Revenue"); setInspectSearch(""); }}
        />
        <StatCard
          icon="contactless" iconClass="stat-icon-primary" label={`Online Revenue`}
          value={loading ? null : stats.onlineRevenue}
          onClick={() => { setInspectCategory("Online Revenue"); setInspectSearch(""); }}
        />
        <StatCard
          icon="pending_actions" iconClass="stat-icon-warning" label={`Upcoming`}
          value={loading ? null : stats.upcomingRevenue}
          onClick={() => { setInspectCategory("Upcoming"); setInspectSearch(""); }}
        />
        <StatCard
          icon="money_off" iconClass="stat-icon-danger" label={`Loss Payment`}
          value={loading ? null : stats.lossPayments}
          onClick={() => { setInspectCategory("Loss Payment"); setInspectSearch(""); }}
        />
        <StatCard
          icon="directions_run" iconClass="stat-icon-warning" label={`Left Members`}
          value={loading ? null : stats.leftMembers}
          onClick={() => { setInspectCategory("Left Members"); setInspectSearch(""); }}
        />
        <StatCard
          icon="group" iconClass="stat-icon-primary" label={`Active`}
          value={loading ? null : stats.members}
          onClick={() => { setInspectCategory("Active"); setInspectSearch(""); }}
        />
        <StatCard
          icon="speed" iconClass="stat-icon-warning" label={`Occupancy`}
          value={loading ? null : `${stats.occupancy}%`}
          progressValue={stats.occupancy}
          onClick={() => { setInspectCategory("Occupancy"); setInspectSearch(""); }}
        />
      </div>

      {/* ─── Today's Activity Section (Admin Only) ─── */}
      <div className="glass-pane-elevated !p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-white/[0.06] pb-4">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
            <span className="material-symbols-outlined text-lg animate-pulse">bolt</span>
          </div>
          <div>
            <h3 className="text-base font-black text-slate-800 font-manrope">Today's Activity</h3>
            <p className="text-[10px] text-slate-500 font-semibold">Real-time daily operations (Resets everyday)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Collections Donut Chart */}
          <div className="bg-white/[0.02] border border-white/[0.04] p-5 rounded-2xl flex flex-col md:flex-row items-center justify-around gap-6">
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Today's Collections</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <div>
                    <span className="text-xs font-semibold text-slate-500">Cash Collection</span>
                    <div className="text-sm font-black text-slate-800">₹{todayStats.cash.toLocaleString('en-IN')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                  <div>
                    <span className="text-xs font-semibold text-slate-500">Online Collection</span>
                    <div className="text-sm font-black text-slate-800">₹{todayStats.online.toLocaleString('en-IN')}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Circular Donut Chart */}
            <div className="relative w-36 h-36 flex-shrink-0">
              {todayStats.total > 0 ? (
                <>
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    {/* Background Circle */}
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(0,0,0,0.03)" strokeWidth="3.5" />
                    {/* Cash Segment */}
                    <circle 
                      cx="18" 
                      cy="18" 
                      r="15.9" 
                      fill="none" 
                      stroke="#10b981" 
                      strokeWidth="3.5" 
                      strokeDasharray={`${Math.round((todayStats.cash / todayStats.total) * 100)} ${100 - Math.round((todayStats.cash / todayStats.total) * 100)}`} 
                      strokeLinecap="round" 
                      className="transition-all duration-700 drop-shadow-[0_0_4px_rgba(16,185,129,0.3)]" 
                    />
                    {/* Online Segment */}
                    <circle 
                      cx="18" 
                      cy="18" 
                      r="15.9" 
                      fill="none" 
                      stroke="#6366f1" 
                      strokeWidth="3.5" 
                      strokeDasharray={`${Math.round((todayStats.online / todayStats.total) * 100)} ${100 - Math.round((todayStats.online / todayStats.total) * 100)}`} 
                      strokeDashoffset={`-${Math.round((todayStats.cash / todayStats.total) * 100)}`} 
                      strokeLinecap="round" 
                      className="transition-all duration-700 drop-shadow-[0_0_4px_rgba(99,102,241,0.3)]" 
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total</span>
                    <span className="text-base font-black text-slate-800">₹{todayStats.total.toLocaleString('en-IN')}</span>
                  </div>
                </>
              ) : (
                <div className="w-full h-full rounded-full border-4 border-dashed border-slate-200 flex flex-col items-center justify-center p-2 text-center">
                  <span className="material-symbols-outlined text-slate-300 text-lg">payments</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mt-1">No Collection</span>
                </div>
              )}
            </div>
          </div>

          {/* Today's New Members */}
          <div className="bg-white/[0.02] border border-white/[0.04] p-5 rounded-2xl flex flex-col h-full min-h-[160px]">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-manrope">Today's New Members</h4>
              <span className="badge badge-primary text-[10px] font-black px-2 py-0.5 shadow-sm">
                {todayStats.newMembers.length} New
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto max-h-[120px] pr-1 space-y-2 custom-scrollbar" data-lenis-prevent="true">
              {todayStats.newMembers.length > 0 ? (
                todayStats.newMembers.map((member) => (
                  <div 
                    key={member.id} 
                    onClick={() => router.push(`/dashboard/members?search=${member.permanent_id}`)}
                    className="flex justify-between items-center p-2.5 rounded-xl bg-white/40 border border-slate-100 hover:border-slate-200 hover:bg-white/80 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-[#003178] font-black text-xs">
                        {member.full_name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 group-hover:text-primary transition-colors">{member.full_name}</div>
                        <span className="text-[9px] text-[#003178] font-semibold">{member.permanent_id}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="badge badge-info text-[9px] tracking-wide uppercase">{member.shift}</span>
                      <div className="text-[8px] text-slate-400 font-medium mt-0.5">{member.branch === 'namnakala' ? 'Namnakala' : 'Bengali Chowk'}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-4">
                  <span className="material-symbols-outlined text-slate-300 text-xl">group_add</span>
                  <p className="text-xs text-slate-400 font-semibold mt-1">No new members registered today</p>
                </div>
              )}
            </div>
          </div>

          {/* Today's Payments by Member */}
          <div className="bg-white/[0.02] border border-white/[0.04] p-5 rounded-2xl flex flex-col h-full min-h-[160px]">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-manrope">Today's Payments</h4>
              <span className="badge badge-success text-[10px] font-black px-2 py-0.5 shadow-sm">
                {todayStats.todayPayments.length} Paid
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto max-h-[120px] pr-1 space-y-2 custom-scrollbar" data-lenis-prevent="true">
              {todayStats.todayPayments.length > 0 ? (
                todayStats.todayPayments.map((pay) => (
                  <div 
                    key={pay.id || `${pay.member_id}-${pay.paid_at}-${pay.amount}`}
                    onClick={() => router.push(`/dashboard/members?search=${pay.permanentId}`)}
                    className="flex justify-between items-center p-2.5 rounded-xl bg-white/40 border border-slate-100 hover:border-slate-200 hover:bg-white/80 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 font-black text-xs">
                        {pay.memberName.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 group-hover:text-primary transition-colors">{pay.memberName}</div>
                        <span className="text-[9px] text-[#003178] font-semibold">{pay.permanentId}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-emerald-600">₹{pay.amount.toLocaleString('en-IN')}</div>
                      <span className="badge bg-slate-100 text-slate-600 text-[8px] tracking-wide uppercase px-1.5 py-0.5 mt-0.5 rounded-md inline-block">
                        {pay.payment_mode || 'Cash'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-4">
                  <span className="material-symbols-outlined text-slate-300 text-xl">payments</span>
                  <p className="text-xs text-slate-400 font-semibold mt-1">No payments received today</p>
                </div>
              )}
            </div>
          </div>
        </div>
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

      {/* ═══ Stats Drilldown Modal ═══ */}
      {inspectCategory && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 shadow-2xl rounded-2xl w-full max-w-2xl overflow-hidden animate-scale-in p-6 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-base font-black font-manrope text-slate-800 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#003178] text-xl">analytics</span>
                  Revenue Drilldown: {inspectCategory}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Active list of matching students in {branchName} branch. Click any student to manage.
                </p>
              </div>
              <button 
                onClick={() => {
                  setInspectCategory(null);
                  setInspectSearch("");
                }}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                <input
                  type="text"
                  placeholder="Search by student name, permanent ID, or phone number..."
                  value={inspectSearch}
                  onChange={(e) => setInspectSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <select 
                value={inspectSort} 
                onChange={(e) => setInspectSort(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-medium appearance-none bg-[url('data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3e%3cpath stroke=%27%23475569%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3e%3c/svg%3e')] bg-[position:right_0.5rem_center] bg-no-repeat bg-[size:1rem_1rem] pr-8"
              >
                <option value="latest-payment">Latest Payment</option>
                <option value="oldest-payment">Oldest Payment</option>
                <option value="amount-high">Highest Amount</option>
                <option value="amount-low">Lowest Amount</option>
              </select>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 border border-slate-100 rounded-xl p-2 bg-slate-50/50" data-lenis-prevent="true">
              {getInspectData().length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs font-semibold">
                  No matching student records found.
                </div>
              ) : getInspectData().map((m: any) => (
                <div 
                  key={m.id}
                  onClick={() => {
                    setInspectCategory(null);
                    setInspectSearch("");
                    router.push(`/dashboard/members?search=${m.permanent_id}`);
                  }}
                  className="bg-white hover:bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all p-3.5 rounded-xl shadow-sm flex justify-between items-center cursor-pointer group"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                      {m.full_name}
                      <span className="font-mono text-[10px] text-[#003178] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">{m.permanent_id}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Mobile: {m.mobile} · Seat {m.seat_no || 'Unassigned'} ({m.shift})
                      <span className="ml-2 font-medium text-slate-400">· {formatDate(m.inspectDate)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-700">{m.inspectLabel}</div>
                    <div className="text-[9px] text-slate-400 mt-1 font-medium">{m.inspectSub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   OFFICE DASHBOARD
   ═══════════════════════════════════════════════════════════ */
function OfficeDashboard({ branch }: { branch: string }) {
  const branchName = branch === "namnakala" ? "Namnakala" : "Bangali Chowk";
  const router = useRouter();
  
  const [members, setMembers] = useState<any[]>([]);
  const [rawMembers, setRawMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dueSoon, setDueSoon] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);

  // Stats drilldown state
  const [inspectCategory, setInspectCategory] = useState<string | null>(null);
  const [inspectSearch, setInspectSearch] = useState("");

  useEffect(() => {
    const fetchLiveMembers = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('branch', branch)
        .order('created_at', { ascending: false });
      
      if (data) {
        const { updatedMembers } = await checkAndReleaseSeats(data, branch);
        setRawMembers(updatedMembers);
        const today = new Date();
        const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const in3Days = new Date(todayZero.getTime() + 3 * 24 * 60 * 60 * 1000);
        
        const dueSoonCount = updatedMembers.filter(m => {
          if (!m.is_active || !m.subscription_end_date) return false;
          const end = new Date(m.subscription_end_date);
          return end >= todayZero && end <= in3Days;
        }).length;

        const defaulterCount = updatedMembers.filter(m => !m.is_active || (m.is_active && m.subscription_end_date && new Date(m.subscription_end_date) < todayZero)).length;
        const activeMembers = updatedMembers.filter(m => m.is_active && !(m.subscription_end_date && new Date(m.subscription_end_date) < todayZero));
        
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

  const getInspectData = () => {
    if (!inspectCategory) return [];
    const today = new Date();
    today.setHours(0,0,0,0);
    const in3Days = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);

    let filtered: any[] = [];

    if (inspectCategory === "Active Members") {
      filtered = rawMembers.filter(m => m.is_active && !(m.subscription_end_date && new Date(m.subscription_end_date) < today)).map(m => ({
        ...m,
        inspectLabel: `Seat: ${m.seat_no || 'Unassigned'}`,
        inspectSub: m.subscription_end_date ? `Expiry: ${formatDate(m.subscription_end_date)}` : 'No Expiry'
      }));
    } else if (inspectCategory === "Due in 3 Days") {
      filtered = rawMembers.filter(m => {
        if (!m.is_active || !m.subscription_end_date) return false;
        const end = new Date(m.subscription_end_date);
        return end >= today && end <= in3Days;
      }).map(m => ({
        ...m,
        inspectLabel: `Due in ${Math.ceil((new Date(m.subscription_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days`,
        inspectSub: `Expires: ${formatDate(m.subscription_end_date)}`
      }));
    } else if (inspectCategory === "Overdue / Inactive") {
      filtered = rawMembers.filter(m => !m.is_active || (m.is_active && m.subscription_end_date && new Date(m.subscription_end_date) < today)).map(m => {
        const isExpired = m.subscription_end_date && new Date(m.subscription_end_date) < today;
        return {
          ...m,
          inspectLabel: isExpired ? "Expired" : "Inactive",
          inspectSub: m.subscription_end_date ? `Was Valid Till: ${formatDate(m.subscription_end_date)}` : 'No booking details'
        };
      });
    } else if (inspectCategory === "Available Seats") {
      const totalSeats = branch === 'bengali-chowk' ? 153 : 121;
      const occupiedSeats = new Set(rawMembers.filter(m => m.is_active && m.seat_no).map(m => m.seat_no.toString()));
      const available: any[] = [];
      for (let i = 1; i <= totalSeats; i++) {
        if (!occupiedSeats.has(i.toString())) {
          available.push({
            id: `seat-${i}`,
            full_name: `Seat No. ${i}`,
            permanent_id: "AVAILABLE",
            mobile: "N/A",
            seat_no: i.toString(),
            shift: "Available for allotment",
            inspectLabel: "Unoccupied",
            inspectSub: "Ready to assign"
          });
        }
      }
      filtered = available;
    }

    return filtered.filter(m => 
      m.full_name.toLowerCase().includes(inspectSearch.toLowerCase()) ||
      m.permanent_id?.toLowerCase().includes(inspectSearch.toLowerCase()) ||
      m.mobile?.includes(inspectSearch)
    );
  };

  return (
    <div className="space-y-6">
      {/* ─── Stat Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="group" iconClass="stat-icon-primary" label="Active Members" value={loading ? null : activeCount.toString()} onClick={() => { setInspectCategory("Active Members"); setInspectSearch(""); }} />
        <StatCard icon="event_upcoming" iconClass="stat-icon-warning" label="Due in 3 Days" value={loading ? null : dueSoon.toString()} onClick={() => { setInspectCategory("Due in 3 Days"); setInspectSearch(""); }} />
        <StatCard 
          icon="warning" iconClass="stat-icon-danger" label="Overdue / Inactive" 
          value={loading ? null : overdueCount.toString()} 
          badge={overdueCount > 0 ? "Action Required" : undefined} badgeClass="badge-danger"
          onClick={() => { setInspectCategory("Overdue / Inactive"); setInspectSearch(""); }}
        />
        <StatCard icon="event_seat" iconClass="stat-icon-success" label="Available Seats" value={loading ? null : ((branch === 'bengali-chowk' ? 153 : 121) - activeCount).toString()} onClick={() => { setInspectCategory("Available Seats"); setInspectSearch(""); }} />
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
        
        <div className="flex-1 overflow-auto" data-lenis-prevent="true">
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
                  <tr key={member.id} className="cursor-pointer group" onClick={() => router.push(`/dashboard/members?search=${member.permanent_id}`)}>
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

      {/* ═══ Office Stats Drilldown Modal ═══ */}
      {inspectCategory && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 shadow-2xl rounded-2xl w-full max-w-2xl overflow-hidden animate-scale-in p-6 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-base font-black font-manrope text-slate-800 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#003178] text-xl">analytics</span>
                  Overview Drilldown: {inspectCategory}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Active list of matching students in {branchName} branch. Click any student to manage.
                </p>
              </div>
              <button 
                onClick={() => {
                  setInspectCategory(null);
                  setInspectSearch("");
                }}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div className="relative mb-4">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
              <input
                type="text"
                placeholder="Search by student name, permanent ID, or phone number..."
                value={inspectSearch}
                onChange={(e) => setInspectSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 border border-slate-100 rounded-xl p-2 bg-slate-50/50" data-lenis-prevent="true">
              {getInspectData().length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs font-semibold">
                  No matching student records found.
                </div>
              ) : getInspectData().map((m: any) => (
                <div 
                  key={m.id}
                  onClick={() => {
                    setInspectCategory(null);
                    setInspectSearch("");
                    if (m.permanent_id !== "AVAILABLE") {
                      router.push(`/dashboard/members?search=${m.permanent_id}`);
                    }
                  }}
                  className={`bg-white hover:bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all p-3.5 rounded-xl shadow-sm flex justify-between items-center ${m.permanent_id !== "AVAILABLE" ? 'cursor-pointer' : 'cursor-default'} group`}
                >
                  <div>
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                      {m.full_name}
                      {m.permanent_id !== "AVAILABLE" && (
                        <span className="font-mono text-[10px] text-[#003178] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">{m.permanent_id}</span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Mobile: {m.mobile} · Seat {m.seat_no || 'Unassigned'} ({m.shift})
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-700">{m.inspectLabel}</div>
                    <div className="text-[9px] text-slate-400 mt-1 font-medium">{m.inspectSub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   REUSABLE COMPONENTS
   ═══════════════════════════════════════════════════════════ */

function StatCard({ icon, iconClass, label, value, trend, trendUp, badge, badgeClass, progressValue, onClick }: {
  icon: string; iconClass: string; label: string; value: string | null;
  trend?: string; trendUp?: boolean; badge?: string; badgeClass?: string; progressValue?: number;
  onClick?: () => void;
}) {
  return (
    <div onClick={onClick} className={`glass-pane-elevated relative overflow-hidden flex flex-col items-center text-center !p-4 sm:!p-6 group ${onClick ? 'cursor-pointer hover:border-[#bfc2ff]/50 hover:shadow-lg transition-all duration-300' : ''}`}>
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
          <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tighter drop-shadow-lg truncate max-w-full">{value}</h3>
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
