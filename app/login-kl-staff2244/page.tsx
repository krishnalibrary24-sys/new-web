"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [staffId, setStaffId] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [deviceToken, setDeviceToken] = useState("");
  const [countdown, setCountdown] = useState(0);
  const router = useRouter();

  useEffect(() => {
    // Generate or fetch device token
    let token = localStorage.getItem("krishna_device_token");
    if (!token) {
      token = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
      localStorage.setItem("krishna_device_token", token);
    }
    setDeviceToken(token);
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          staff_id: staffId, 
          password,
          device_token: deviceToken,
          device_name: navigator.userAgent
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Credentials matched, OTP sent
        setStep(2);
        setCountdown(30);
      } else {
        setError(data.error || "Invalid Staff ID or Password.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          staff_id: staffId, 
          device_token: deviceToken,
          otp
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem("krishna_role", data.role);
        localStorage.setItem("krishna_staff_id", staffId);
        router.push("/dashboard");
      } else {
        setError(data.error || "Invalid OTP code.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          staff_id: staffId, 
          password,
          device_token: deviceToken,
          device_name: navigator.userAgent
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setCountdown(30);
      } else {
        setError(data.error || "Failed to resend OTP.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4 font-manrope">
      {/* Outer Wrapper Grid Preserved */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">     
        <div className="px-8 pt-10 pb-8 sm:px-10">
          
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-[#003178] flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                {step === 1 ? 'shield_person' : 'mark_email_read'}
              </span>
            </div>
          </div>
          
          <h1 className="text-2xl font-black text-gray-900 text-center mb-1 tracking-tight">
            {step === 1 ? 'Staff Portal' : 'Security Verification'}
          </h1>
          <p className="text-sm font-medium text-gray-500 text-center mb-8">
            {step === 1 ? 'Authorized personnel only' : '2-Step Authentication'}
          </p>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl text-center font-bold mb-6 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-sm align-middle">error</span>
              {error}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleLoginSubmit} className="space-y-5 animate-fade-in">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Staff ID</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg">badge</span>
                  <input 
                    type="text" 
                    required
                    value={staffId}
                    onChange={(e) => setStaffId(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 hover:border-[#003178]/50 focus:border-[#003178] rounded-xl px-4 py-3 pl-11 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#003178] transition-all text-sm font-medium"
                    placeholder="Enter your Staff ID"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Password</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg">lock</span>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 hover:border-[#003178]/50 focus:border-[#003178] rounded-xl px-4 py-3 pl-11 pr-11 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#003178] transition-all text-sm font-medium"
                    placeholder="••••••••"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading || !deviceToken}
                className="w-full bg-[#003178] text-white py-3.5 rounded-xl font-bold text-sm shadow-md hover:bg-[#002255] transition-colors flex justify-center items-center gap-2 disabled:opacity-60 mt-4"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <span className="material-symbols-outlined text-base">login</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-6 animate-fade-in">
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex gap-3 items-start">
                <span className="material-symbols-outlined text-blue-600 shrink-0">info</span>
                <div>
                  <p className="text-xs text-blue-800 font-medium leading-relaxed">
                    A 6-digit verification code has been sent to the master email address.
                  </p>
                  <p className="text-xs font-bold text-blue-900 mt-1">krishnalibrary24@gmail.com</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block text-center">Enter 6-Digit Code</label>
                <input 
                  type="text" 
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full bg-gray-50 border border-gray-200 hover:border-[#003178]/50 focus:border-[#003178] rounded-xl px-4 py-4 text-center text-2xl tracking-[0.5em] text-gray-900 font-mono placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#003178]/20 transition-all font-bold"
                  placeholder="------"
                />
              </div>

              <button 
                type="submit" 
                disabled={loading || otp.length !== 6}
                className="w-full bg-[#003178] text-white py-3.5 rounded-xl font-bold text-sm shadow-md hover:bg-[#002255] transition-colors flex justify-center items-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                    <span>Confirming...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Identity 🛡️</span>
                    <span className="material-symbols-outlined text-base">verified_user</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={countdown > 0 || loading}
                  className="text-xs font-bold text-gray-500 hover:text-[#003178] transition-colors disabled:opacity-50 disabled:hover:text-gray-500"
                >
                  {countdown > 0 ? `Resend code in ${countdown}s` : "Didn't receive a code? Resend"}
                </button>
              </div>
            </form>
          )}

        </div>
        
        <div className="bg-gray-50 border-t border-gray-100 px-8 py-4 text-center">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Krishna Library Secure Login
          </p>
        </div>
      </div>
    </div>
  );
}
