"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [staffId, setStaffId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staff_id: staffId, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem("krishna_role", data.role);
        localStorage.setItem("krishna_staff_id", data.staff_id);
        router.push("/dashboard");
      } else {
        setError(data.error || "Invalid Staff ID or Password.");
        setLoading(false);
      }
    } catch (err) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-v-surface">

      {/* Login Card */}
      <div className="bg-v-surface-container-lowest p-8 md:p-10 rounded-2xl w-full max-w-[420px] relative z-10 shadow-lg border border-v-outline-variant/20">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-v-primary-fixed flex items-center justify-center">
            <span className="material-symbols-outlined text-v-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>shield_person</span>
          </div>
        </div>
        
        <h1 className="font-v-headline-md text-v-headline-md text-v-on-background text-center mb-1 tracking-tight">Staff Portal</h1>
        <p className="font-v-body-sm text-v-body-sm text-v-on-surface-variant text-center mb-8">Authorized personnel only</p>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="bg-v-error-container text-v-on-error-container text-sm p-3 rounded-xl text-center font-medium animate-fade-in-fast font-v-body-sm flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-sm align-middle">error</span>
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="font-v-label-md text-v-label-md text-v-on-surface-variant uppercase tracking-wider block">Staff ID</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-v-outline text-lg">badge</span>
              <input 
                type="text" 
                required
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                className="w-full bg-v-surface-bright border border-v-outline-variant/50 hover:border-v-primary/50 focus:border-v-primary rounded-xl px-4 py-3 pl-11 text-v-on-background placeholder-v-outline-variant focus:outline-none focus:ring-1 focus:ring-v-primary transition-all font-v-body-sm text-v-body-sm"
                placeholder="Enter your Staff ID"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-v-label-md text-v-label-md text-v-on-surface-variant uppercase tracking-wider block">Password</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-v-outline text-lg">lock</span>
              <input 
                type={showPassword ? "text" : "password"} 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-v-surface-bright border border-v-outline-variant/50 hover:border-v-primary/50 focus:border-v-primary rounded-xl px-4 py-3 pl-11 pr-11 text-v-on-background placeholder-v-outline-variant focus:outline-none focus:ring-1 focus:ring-v-primary transition-all font-v-body-sm text-v-body-sm"
                placeholder="••••••••"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-v-outline hover:text-v-on-surface-variant transition-colors"
              >
                <span className="material-symbols-outlined text-lg">{showPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-v-primary text-v-on-primary py-3.5 rounded-lg font-v-label-lg text-v-label-lg shadow-sm hover:bg-v-primary-container hover:text-v-on-primary-container transition-colors flex justify-center items-center gap-2 disabled:opacity-60 mt-4"
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

        <div className="mt-8 pt-6 border-t border-v-outline-variant/20 text-center">
          <p className="font-v-body-sm text-v-body-sm text-v-on-surface-variant">
            Need help? Contact the system administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
