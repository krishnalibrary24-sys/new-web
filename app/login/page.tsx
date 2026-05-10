"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [staffId, setStaffId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    setTimeout(() => {
      const validCredentials = [
        { id: "ADMIN-01", pass: "admin123", role: "admin" },
        { id: "BENGALI-01", pass: "bengali123", role: "bengali-chowk" },
        { id: "NAMNA-01", pass: "namna123", role: "namnakala" }
      ];

      const user = validCredentials.find(c => c.id === staffId && c.pass === password);

      if (user) {
        localStorage.setItem("krishna_role", user.role);
        localStorage.setItem("krishna_staff_id", user.id);
        router.push("/dashboard");
      } else {
        setError("Invalid Staff ID or Password.");
        setLoading(false);
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#010409]">
      {/* Ambient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-orange-600/[0.15] rounded-full blur-[150px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-amber-500/[0.1] rounded-full blur-[120px] pointer-events-none animate-pulse-glow" style={{ animationDelay: '1.5s' }} />

      {/* Back Link */}
      <Link href="/" className="absolute top-6 left-6 flex items-center gap-2 text-on-surface-variant hover:text-white transition-colors group z-20">
        <span className="material-symbols-outlined text-lg transition-transform group-hover:-translate-x-1">arrow_back</span>
        <span className="font-manrope font-semibold text-sm">Back to Library</span>
      </Link>

      {/* Login Card */}
      <div className="glass-pane-elevated p-8 md:p-10 rounded-3xl w-full max-w-[420px] relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center border border-primary/20 shadow-[0_0_24px_rgba(191,194,255,0.1)]">
            <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>shield_person</span>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-white text-center mb-1 font-manrope tracking-tight">Staff Portal</h1>
        <p className="text-on-surface-variant text-center mb-8 text-sm">Authorized personnel only</p>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl text-center font-medium animate-fade-in-fast">
              <span className="material-symbols-outlined text-sm align-middle mr-1">error</span>
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block pl-1">Staff ID</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-lg">badge</span>
              <input 
                type="text" 
                required
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.15] focus:border-primary/50 rounded-xl px-4 py-3 pl-11 text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all backdrop-blur-md shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
                placeholder="e.g. ADMIN-01"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block pl-1">Password</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-lg">lock</span>
              <input 
                type={showPassword ? "text" : "password"} 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.15] focus:border-primary/50 rounded-xl px-4 py-3 pl-11 pr-11 text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all backdrop-blur-md shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
                placeholder="••••••••"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-on-surface-variant transition-colors"
              >
                <span className="material-symbols-outlined text-lg">{showPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full btn-primary py-3.5 flex justify-center items-center gap-2 disabled:opacity-60 mt-2"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <span className="material-symbols-outlined text-base">login</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/[0.06] text-center">
          <p className="text-xs text-on-surface-variant">
            Need help? Contact the system administrator.
          </p>
        </div>

        {/* Test Credentials */}
        <div className="mt-5 glass-pane-elevated !p-4 border-t-0">
          <h3 className="text-white font-bold mb-3 text-[10px] uppercase tracking-[0.2em] text-center opacity-80">Demo Credentials</h3>
          <div className="grid grid-cols-1 gap-1.5 font-mono text-[11px]">
            {[
              { role: 'Admin', id: 'ADMIN-01', pass: 'admin123' },
              { role: 'Bengali', id: 'BENGALI-01', pass: 'bengali123' },
              { role: 'Namnakala', id: 'NAMNA-01', pass: 'namna123' },
            ].map(cred => (
              <button
                key={cred.id}
                type="button"
                onClick={() => { setStaffId(cred.id); setPassword(cred.pass); }}
                className="flex justify-between items-center px-4 py-2.5 rounded-xl hover:bg-white/[0.08] transition-all text-left border border-white/[0.02] hover:border-white/[0.1] hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)] group"
              >
                <span className="text-on-surface-variant font-medium group-hover:text-white transition-colors uppercase tracking-wider text-[9px]">{cred.role}</span>
                <span className="text-white/60 font-black group-hover:text-primary transition-colors tracking-widest">{cred.id}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
