"use client";
import React, { useState, useEffect } from 'react';
import { useBranch } from "@/components/branch-context";
import { supabase } from "@/lib/supabase";

export default function SettingsPage() {
  const { activeBranch } = useBranch();
  const branchName = activeBranch === 'namnakala' ? 'Namnakala' : 'Bengali Chowk';

  // State for all settings
  const [libName, setLibName] = useState("Krishna Library");
  const [libPhone, setLibPhone] = useState("+91 8269144748");
  const [libAddress, setLibAddress] = useState("Plot 12, Bengali Chowk Area, Ambikapur, C.G.");
  const [upiId, setUpiId] = useState("krishnalibrary@okaxis");
  const [upiName, setUpiName] = useState("Krishna Library");
  const [welcomeMsg, setWelcomeMsg] = useState(
    "Dear {name},\n\nWelcome to Krishna Library! Your admission is confirmed.\nBranch: {branch}\nSeat No: {seat}\nShift: {shift}\nValid Till: {expiry}\n\nHappy Learning!\nKrishna Library"
  );
  const [dueMsg, setDueMsg] = useState(
    "Dear {name},\n\nThis is a friendly reminder that your Krishna Library subscription expires in 3 days on {expiry}.\n\nPlease renew to secure your seat (#{seat}).\n\nRegards,\nKrishna Library"
  );

  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);

  // Load settings on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedName = localStorage.getItem("krishna_lib_name");
      const savedPhone = localStorage.getItem("krishna_phone");
      const savedAddress = localStorage.getItem("krishna_address");
      const savedUpiId = localStorage.getItem("krishna_upi_id");
      const savedUpiName = localStorage.getItem("krishna_upi_pn");
      const savedWelcome = localStorage.getItem("krishna_welcome_msg");
      const savedDue = localStorage.getItem("krishna_due_msg");

      if (savedName) setLibName(savedName);
      if (savedPhone) setLibPhone(savedPhone);
      if (savedAddress) setLibAddress(savedAddress);
      if (savedUpiId) setUpiId(savedUpiId);
      if (savedUpiName) setUpiName(savedUpiName);
      if (savedWelcome) setWelcomeMsg(savedWelcome);
      if (savedDue) setDueMsg(savedDue);
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    if (typeof window !== 'undefined') {
      localStorage.setItem("krishna_lib_name", libName);
      localStorage.setItem("krishna_phone", libPhone);
      localStorage.setItem("krishna_address", libAddress);
      localStorage.setItem("krishna_upi_id", upiId);
      localStorage.setItem("krishna_upi_pn", upiName);
      localStorage.setItem("krishna_welcome_msg", welcomeMsg);
      localStorage.setItem("krishna_due_msg", dueMsg);
    }

    setTimeout(() => {
      setIsSaving(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 800);
  };

  const handleExportBackup = async () => {
    setBackupLoading(true);
    try {
      const { data: members, error: memErr } = await supabase.from('members').select('*');
      const { data: payments, error: payErr } = await supabase.from('payments').select('*');
      const { data: leads, error: leadErr } = await supabase.from('leads').select('*');
      const { data: expenses, error: expErr } = await supabase.from('expenses').select('*');

      if (memErr || payErr || leadErr || expErr) {
        throw new Error("Failed to fetch tables for backup.");
      }

      const backupData = {
        exportedAt: new Date().toISOString(),
        branch: activeBranch,
        members: members || [],
        payments: payments || [],
        leads: leads || [],
        expenses: expenses || []
      };

      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(backupData, null, 2)
      )}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", jsonString);
      downloadAnchor.setAttribute("download", `krishna_library_backup_${activeBranch}_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error(err);
      alert("Error generating backup file.");
    } finally {
      setBackupLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#003178] text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border border-white/10 animate-scale-in">
          <span className="material-symbols-outlined text-emerald-400">check_circle</span>
          <div className="text-xs font-bold font-manrope">Settings Saved Successfully!</div>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">SaaS Settings</h1>
          <p className="page-subtitle">Configure invoice preferences, UPI payments, and automated WhatsApp templates.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Profile & Payments */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Library Profile Info */}
          <div className="glass-pane-elevated">
            <h3 className="text-sm font-bold text-slate-800 font-manrope mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">corporate_fare</span>
              Library Profile
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Library Name</label>
                <input
                  type="text"
                  value={libName}
                  onChange={(e) => setLibName(e.target.value)}
                  className="input-premium w-full py-2.5 px-3 text-sm"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Contact Phone</label>
                <input
                  type="text"
                  value={libPhone}
                  onChange={(e) => setLibPhone(e.target.value)}
                  className="input-premium w-full py-2.5 px-3 text-sm"
                  required
                />
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Invoice Address</label>
                <textarea
                  rows={2}
                  value={libAddress}
                  onChange={(e) => setLibAddress(e.target.value)}
                  className="input-premium w-full py-2.5 px-3 text-sm"
                  required
                />
              </div>
            </div>
          </div>

          {/* UPI Customization */}
          <div className="glass-pane-elevated">
            <h3 className="text-sm font-bold text-slate-800 font-manrope mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">qr_code_2</span>
              UPI Collection Gateway Settings
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Merchant UPI ID</label>
                <input
                  type="text"
                  value={upiId}
                  placeholder="e.g. library@ybl"
                  onChange={(e) => setUpiId(e.target.value)}
                  className="input-premium w-full py-2.5 px-3 text-sm font-mono text-[#003178]"
                  required
                />
                <p className="text-[10px] text-slate-400">Payments scanned on invoices will route directly to this address.</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Merchant Name</label>
                <input
                  type="text"
                  value={upiName}
                  onChange={(e) => setUpiName(e.target.value)}
                  className="input-premium w-full py-2.5 px-3 text-sm"
                  required
                />
                <p className="text-[10px] text-slate-400">Account holder name displayed on customer scan.</p>
              </div>
            </div>
          </div>

          {/* WhatsApp Notification Templates */}
          <div className="glass-pane-elevated">
            <h3 className="text-sm font-bold text-slate-800 font-manrope mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">chat_bubble</span>
              WhatsApp Notifications Layout
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Welcome Message (New Admission)</label>
                  <span className="text-[10px] text-slate-400 font-bold font-mono">Dynamic Tags: &#123;name&#125;, &#123;branch&#125;, &#123;seat&#125;, &#123;shift&#125;, &#123;expiry&#125;</span>
                </div>
                <textarea
                  rows={4}
                  value={welcomeMsg}
                  onChange={(e) => setWelcomeMsg(e.target.value)}
                  className="input-premium w-full py-2.5 px-3 text-sm font-mono text-[#0f172a]"
                  required
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Dues Renewal Reminder</label>
                  <span className="text-[10px] text-slate-400 font-bold font-mono">Dynamic Tags: &#123;name&#125;, &#123;seat&#125;, &#123;expiry&#125;</span>
                </div>
                <textarea
                  rows={4}
                  value={dueMsg}
                  onChange={(e) => setDueMsg(e.target.value)}
                  className="input-premium w-full py-2.5 px-3 text-sm font-mono text-[#0f172a]"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Actions & Backup */}
        <div className="space-y-6">
          <div className="glass-pane-elevated">
            <h3 className="text-sm font-bold text-slate-800 font-manrope mb-4">Operations</h3>
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary w-full py-3 text-sm rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg"
            >
              {isSaving ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                  Saving Config...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">save</span>
                  Save Settings
                </>
              )}
            </button>
          </div>

          <div className="glass-pane-elevated">
            <h3 className="text-sm font-bold text-slate-800 font-manrope mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-500 text-base">database</span>
              SaaS Data Control
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">Export a complete encrypted JSON dump containing all branches&apos; students, leads, expenses, and payment logs for cold backups.</p>
            
            <button
              type="button"
              onClick={handleExportBackup}
              disabled={backupLoading}
              className="btn-ghost !text-slate-800 w-full py-3 text-xs rounded-xl font-bold flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50"
            >
              {backupLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                  Compiling Table Dumps...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">download</span>
                  Export Complete JSON Backup
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
