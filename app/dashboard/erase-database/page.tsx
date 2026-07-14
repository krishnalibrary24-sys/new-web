"use client";
import React, { useState, useEffect } from 'react';
import { useBranch } from "@/components/branch-context";
import { supabase } from "@/lib/supabase";
import { useRouter } from 'next/navigation';
import { logActivity } from "@/lib/activity";
import { getMemberStatus } from "@/lib/utils";
import { createPortal } from "react-dom";

interface Student {
  id: string;
  permanent_id: string;
  full_name: string;
  father_name: string;
  mobile: string;
  branch: string;
  seat_no: string;
  shift: string;
  is_active: boolean;
}

export default function EraseDatabasePage() {
  const { activeBranch } = useBranch();
  const branchName = activeBranch === 'namnakala' ? 'Namnakala' : 'Bangali Chowk';
  const router = useRouter();

  // Authentication Check
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Search & Individual Erase states
  const [searchQuery, setSearchQuery] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [searching, setSearching] = useState(false);
  const [targetStudent, setTargetStudent] = useState<Student | null>(null);
  const [studentConfirmText, setStudentConfirmText] = useState("");

  // Table Wipe states
  const [showWipeModal, setShowWipeModal] = useState(false);
  const [wipeType, setWipeType] = useState<"students" | "left_students" | "leads" | "expenses" | "logs" | "full" | null>(null);
  const [wipeConfirmText, setWipeConfirmText] = useState("");
  const [wiping, setWiping] = useState(false);

  // Global Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const role = localStorage.getItem("krishna_role");
    if (role !== "admin") {
      router.push("/dashboard");
    } else {
      setIsAdmin(true);
    }
    setCheckingAuth(false);
  }, [router]);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Search students
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .eq("branch", activeBranch)
        .or(`full_name.ilike.%${searchQuery}%,permanent_id.ilike.%${searchQuery}%,mobile.ilike.%${searchQuery}%`)
        .order("full_name", { ascending: true });

      if (error) throw error;
      setStudents(data || []);
      if (!data || data.length === 0) {
        showToast("No students found matching your query.", "error");
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to search students.", "error");
    } finally {
      setSearching(false);
    }
  };

  // Delete a specific student
  const executeEraseStudent = async () => {
    if (!targetStudent) return;
    if (studentConfirmText !== targetStudent.permanent_id) {
      showToast("Confirmation ID does not match.", "error");
      return;
    }

    try {
      setWiping(true);
      
      // Perform database deletion
      const { error } = await supabase
        .from("members")
        .delete()
        .eq("id", targetStudent.id);

      if (error) throw error;

      // Log action to activity logs
      await logActivity(
        activeBranch,
        "database_erase_student",
        `Permanently erased student record: ${targetStudent.full_name} (${targetStudent.permanent_id})`
      );

      showToast(`Successfully erased student ${targetStudent.full_name} from database.`);
      setStudents(prev => prev.filter(s => s.id !== targetStudent.id));
      setTargetStudent(null);
      setStudentConfirmText("");
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to delete student.", "error");
    } finally {
      setWiping(false);
    }
  };

  // Perform bulk data wipes
  const executeBulkErase = async () => {
    if (!wipeType) return;
    const requiredConfirmation = wipeType === "full" ? "WIPE ALL DATA" : "ERASE TABLE";
    if (wipeConfirmText !== requiredConfirmation) {
      showToast("Confirmation phrase is incorrect.", "error");
      return;
    }

    setWiping(true);
    try {
      if (wipeType === "left_students") {
        // Fetch all members in the current branch
        const { data: allMembers, error: fetchErr } = await supabase
          .from("members")
          .select("id, status, left_at")
          .eq("branch", activeBranch);

        if (fetchErr) throw fetchErr;

        const leftMemberIds = (allMembers || [])
          .filter(m => m.status === 'LEFT' || m.left_at)
          .map(m => m.id);

        if (leftMemberIds.length === 0) {
          showToast("No left students found to erase.", "error");
          setShowWipeModal(false);
          setWipeConfirmText("");
          return;
        }

        // 1. Delete associated payments
        const { error: payErr } = await supabase
          .from("payments")
          .delete()
          .in("member_id", leftMemberIds);
        if (payErr) throw payErr;

        // 2. Delete associated invoices
        const { error: invErr } = await supabase
          .from("invoices")
          .delete()
          .in("member_id", leftMemberIds);
        if (invErr) throw invErr;

        // 3. Delete members
        const { error: memErr } = await supabase
          .from("members")
          .delete()
          .in("id", leftMemberIds);
        if (memErr) throw memErr;

        // Log action to activity logs
        await logActivity(
          activeBranch,
          "database_bulk_wipe",
          `Permanently erased all ${leftMemberIds.length} left students and their billing/payment records in ${branchName}`
        );

        showToast(`Successfully erased all ${leftMemberIds.length} left students from database.`);
      }
      else if (wipeType === "students" || wipeType === "full") {
        // Cascade handles invoices and payments, but we erase invoices/payments manually first to be safe
        const { error: payErr } = await supabase.from("payments").delete().eq("branch", activeBranch);
        if (payErr) throw payErr;

        // Erase invoices
        // Since invoices are linked to members, we filter by member_id branch
        const { data: memberIds } = await supabase.from("members").select("id").eq("branch", activeBranch);
        if (memberIds && memberIds.length > 0) {
          const ids = memberIds.map(m => m.id);
          const { error: invErr } = await supabase.from("invoices").delete().in("member_id", ids);
          if (invErr) throw invErr;
        }

        // Erase members
        const { error: memErr } = await supabase.from("members").delete().eq("branch", activeBranch);
        if (memErr) throw memErr;
      }

      if (wipeType === "leads" || wipeType === "full") {
        const { error: leadErr } = await supabase.from("leads").delete().eq("branch", activeBranch);
        if (leadErr) throw leadErr;
      }

      if (wipeType === "expenses" || wipeType === "full") {
        const { error: expErr } = await supabase.from("expenses").delete().eq("branch", activeBranch);
        if (expErr) throw expErr;
      }

      if (wipeType === "logs" || wipeType === "full") {
        // Purge activity logs
        const { error: logErr } = await supabase.from("activity_logs").delete().eq("branch", activeBranch);
        if (logErr) throw logErr;
      }

      // Log wipe action (if log table is not erased, or general warning)
      if (wipeType !== "logs" && wipeType !== "full") {
        await logActivity(
          activeBranch,
          "database_bulk_wipe",
          `Executed bulk database table wipe for category: ${wipeType} in ${branchName}`
        );
      }

      showToast(`Database purge complete for category: ${wipeType}.`);
      setStudents([]);
      setSearchQuery("");
      setShowWipeModal(false);
      setWipeConfirmText("");
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to erase database records.", "error");
    } finally {
      setWiping(false);
    }
  };

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
    <div className="space-y-8 animate-fade-in relative pb-10">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border animate-scale-in ${
          toast.type === "success" 
            ? "bg-emerald-600 text-white border-emerald-500/20" 
            : "bg-red-600 text-white border-red-500/20"
        }`}>
          <span className="material-symbols-outlined">
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          <div className="text-xs font-bold font-manrope">{toast.message}</div>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="page-title text-red-600 dark:text-red-500 flex items-center gap-2">
            <span className="material-symbols-outlined text-2xl">delete_sweep</span>
            Database Eraser
          </h1>
          <p className="page-subtitle text-slate-500">
            Highly destructive operations. Permanently remove student profiles, enquiries, expenses, or wipe the branch database in {branchName}.
          </p>
        </div>
        <span className="badge bg-red-500/10 text-red-500 border border-red-500/20 text-xs py-1.5 px-3 uppercase tracking-wider font-bold">
          Admin Only Section
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Individual Search & Destroy */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-pane-elevated border-red-500/10">
            <h3 className="text-sm font-bold text-slate-800 font-manrope mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-red-500 text-base">person_remove</span>
              Search & Erase Individual Student
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Search a specific student by Name, permanent ID, or Mobile number to erase them completely along with their billing and payment records.
            </p>

            <form onSubmit={handleSearch} className="flex gap-2 mb-6">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                <input
                  type="text"
                  placeholder="Type Name, Permanent ID (e.g. #KL26B001), or Mobile number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-v-body-sm text-slate-900 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={searching}
                className="bg-slate-900 text-white font-bold text-xs py-2 px-5 rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {searching ? (
                  <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-sm">search</span>
                )}
                Search
              </button>
            </form>

            {/* Students list */}
            {students.length > 0 && (
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-inner">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500">
                      <th className="p-3">Student Info</th>
                      <th className="p-3">ID / Mobile</th>
                      <th className="p-3">Seat / Shift</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map((student) => {
                      const status = getMemberStatus(student);
                      return (
                        <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-3 font-semibold text-slate-800">
                            {student.full_name}
                            <span className="block text-[10px] text-slate-400 font-normal mt-0.5">Father: {student.father_name || "N/A"}</span>
                          </td>
                          <td className="p-3 font-mono">
                            <span className="text-[#003178] font-bold">{student.permanent_id}</span>
                            <span className="block text-[10px] text-slate-500 font-normal mt-0.5">{student.mobile}</span>
                          </td>
                          <td className="p-3">
                            <span className="text-slate-700">Seat {student.seat_no || "Unassigned"}</span>
                            <span className="block text-[10px] text-primary font-bold mt-0.5">{student.shift}</span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] ${status.badgeClass}`}>
                              {status.label}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => {
                                setTargetStudent(student);
                                setStudentConfirmText("");
                              }}
                              className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white transition-all text-[11px] font-bold py-1.5 px-3 rounded-lg flex items-center gap-1.5 ml-auto"
                            >
                              <span className="material-symbols-outlined text-sm">delete_forever</span>
                              Erase Record
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Table and Database Wipes */}
        <div className="space-y-6">
          <div className="glass-pane-elevated border-red-500/10">
            <h3 className="text-sm font-bold text-slate-800 font-manrope mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-red-500 text-base">warning</span>
              Destructive Bulk Operations
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Wipe specific tables or clear the entire database for the current branch {branchName}. These actions are final and irreversible.
            </p>

            <div className="space-y-4">
              {/* Wipe members */}
              <div className="bg-red-50/30 border border-red-100 rounded-xl p-4 flex flex-col justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-red-800 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base">group</span>
                    Wipe All Students & Payments
                  </h4>
                  <p className="text-[10px] text-slate-600 mt-1">
                    Deletes all student profiles, payments, and invoices in {branchName}. Seat map assignments will reset.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setWipeType("students");
                    setWipeConfirmText("");
                    setShowWipeModal(true);
                  }}
                  className="bg-white hover:bg-red-600 text-red-600 hover:text-white border border-red-200 transition-all text-xs font-bold py-2 rounded-lg text-center"
                >
                  Erase Students Table
                </button>
              </div>

              {/* Erase Left Students */}
              <div className="bg-orange-50/30 border border-orange-100 rounded-xl p-4 flex flex-col justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-orange-800 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base">person_remove</span>
                    Erase Left Students Only
                  </h4>
                  <p className="text-[10px] text-slate-600 mt-1">
                    Permanently deletes all student profiles, payments, and invoices for students who have left the library in {branchName}.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setWipeType("left_students");
                    setWipeConfirmText("");
                    setShowWipeModal(true);
                  }}
                  className="bg-white hover:bg-orange-600 text-orange-600 hover:text-white border border-orange-200 transition-all text-xs font-bold py-2 rounded-lg text-center"
                >
                  Erase Left Students
                </button>
              </div>

              {/* Wipe Leads */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base">contact_mail</span>
                    Wipe Enquiries / Leads
                  </h4>
                  <p className="text-[10px] text-slate-600 mt-1">
                    Permanently deletes all customer lead enquiries and follow-ups in {branchName}.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setWipeType("leads");
                    setWipeConfirmText("");
                    setShowWipeModal(true);
                  }}
                  className="bg-white hover:bg-red-600 text-red-600 hover:text-white border border-slate-200 transition-all text-xs font-bold py-2 rounded-lg text-center"
                >
                  Erase Enquiries Table
                </button>
              </div>

              {/* Wipe Expenses */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base">trending_up</span>
                    Wipe Library Expenses
                  </h4>
                  <p className="text-[10px] text-slate-600 mt-1">
                    Permanently deletes all Recorded library expenditure items in {branchName}.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setWipeType("expenses");
                    setWipeConfirmText("");
                    setShowWipeModal(true);
                  }}
                  className="bg-white hover:bg-red-600 text-red-600 hover:text-white border border-slate-200 transition-all text-xs font-bold py-2 rounded-lg text-center"
                >
                  Erase Expenses Table
                </button>
              </div>

              {/* Wipe Logs */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base">history</span>
                    Clear All Activity Logs
                  </h4>
                  <p className="text-[10px] text-slate-600 mt-1">
                    Permanently deletes all operation history logs in {branchName}.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setWipeType("logs");
                    setWipeConfirmText("");
                    setShowWipeModal(true);
                  }}
                  className="bg-white hover:bg-red-600 text-red-600 hover:text-white border border-slate-200 transition-all text-xs font-bold py-2 rounded-lg text-center"
                >
                  Purge Activity Logs
                </button>
              </div>

              {/* Full Database Wipe */}
              <div className="bg-red-600 text-white rounded-xl p-4 flex flex-col justify-between gap-3 shadow-lg shadow-red-500/20">
                <div>
                  <div style={{ color: '#ffffff' }} className="text-xs font-black flex items-center gap-1.5">
                    <span style={{ color: '#ffffff' }} className="material-symbols-outlined text-base font-black">warning</span>
                    FULL DATABASE WIPE
                  </div>
                  <div style={{ color: '#fee2e2' }} className="text-[10px] mt-1 leading-relaxed">
                    Completely erases all students, payments, invoices, expenses, enquiries, and activity logs for {branchName}. Restores the database to blank state.
                  </div>
                </div>
                <button
                  onClick={() => {
                    setWipeType("full");
                    setWipeConfirmText("");
                    setShowWipeModal(true);
                  }}
                  className="bg-white hover:bg-slate-100 text-red-700 transition-all text-xs font-bold py-2.5 rounded-lg text-center shadow"
                >
                  EXECUTE FULL DB WIPE
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Confirm Erase Student Modal ═══ */}
      {targetStudent && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 dashboard-light-theme text-slate-800">
          <div className="bg-white border border-slate-200 shadow-2xl rounded-2xl w-full max-w-md overflow-hidden animate-scale-in p-6">
            <div className="flex items-center gap-3 mb-4 text-red-600">
              <span className="material-symbols-outlined text-2xl font-bold">person_remove</span>
              <h3 className="text-base font-black font-manrope">Confirm Student Erasure</h3>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              You are about to permanently erase <strong className="text-slate-800">{targetStudent.full_name}</strong> from the database.
              This will cascade and delete all associated payments, billing invoices, and seat map allocations.
              <br/><br/>
              <span className="text-red-600 font-bold">This action cannot be undone.</span>
            </p>

            <div className="space-y-2 mb-6 bg-slate-50 border border-slate-200 rounded-xl p-4">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Type student Permanent ID to confirm: <strong className="text-slate-700">{targetStudent.permanent_id}</strong>
              </label>
              <input
                type="text"
                value={studentConfirmText}
                onChange={(e) => setStudentConfirmText(e.target.value)}
                placeholder="Type ID here..."
                className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-xs font-mono !text-slate-800 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                disabled={wiping}
                onClick={() => setTargetStudent(null)}
                className="btn-secondary py-2 px-4 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                disabled={wiping || studentConfirmText !== targetStudent.permanent_id}
                onClick={executeEraseStudent}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2 px-4 rounded-lg flex items-center gap-1.5 disabled:opacity-50 shadow"
              >
                {wiping ? (
                  <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-sm">delete_forever</span>
                )}
                Erase Permanently
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ═══ Confirm Table Wipe Modal ═══ */}
      {showWipeModal && wipeType && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 dashboard-light-theme text-slate-800">
          <div className="bg-white border border-slate-200 shadow-2xl rounded-2xl w-full max-w-md overflow-hidden animate-scale-in p-6">
            <div className="flex items-center gap-3 mb-4 text-red-600">
              <span className="material-symbols-outlined text-2xl font-black">warning</span>
              <h3 className="text-base font-black font-manrope">Confirm Destructive Wipe</h3>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              You are executing a bulk erase operation:{" "}
              <strong className="text-slate-800">
                {wipeType === "students" && "Wipe All Students & Payments"}
                {wipeType === "left_students" && "Erase Left Students Only"}
                {wipeType === "leads" && "Wipe Enquiries / Leads"}
                {wipeType === "expenses" && "Wipe Library Expenses"}
                {wipeType === "logs" && "Clear All Activity Logs"}
                {wipeType === "full" && "FULL DATABASE WIPE"}
              </strong>.
              <br/><br/>
              All records matching this category in <strong className="text-slate-800">{branchName}</strong> will be erased from the Supabase backend.
              <br/><br/>
              <span className="text-red-600 font-bold">This operation is destructive and cannot be recovered!</span>
            </p>

            <div className="space-y-2 mb-6 bg-slate-50 border border-slate-200 rounded-xl p-4">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Type confirmation phrase:{" "}
                <strong className="text-slate-700 font-mono">
                  {wipeType === "full" ? "WIPE ALL DATA" : "ERASE TABLE"}
                </strong>
              </label>
              <input
                type="text"
                value={wipeConfirmText}
                onChange={(e) => setWipeConfirmText(e.target.value)}
                placeholder="Type confirmation phrase here..."
                className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-xs font-semibold !text-slate-800 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                disabled={wiping}
                onClick={() => setShowWipeModal(false)}
                className="btn-secondary py-2 px-4 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                disabled={wiping || wipeConfirmText !== (wipeType === "full" ? "WIPE ALL DATA" : "ERASE TABLE")}
                onClick={executeBulkErase}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2 px-4 rounded-lg flex items-center gap-1.5 disabled:opacity-50 shadow"
              >
                {wiping ? (
                  <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-sm">delete_forever</span>
                )}
                Erase All Records
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
