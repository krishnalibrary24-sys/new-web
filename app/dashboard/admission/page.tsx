"use client";
import React, { useState, useEffect } from 'react';
import { useBranch } from "@/components/branch-context";
import { supabase } from "@/lib/supabase";

export default function AdmissionPage() {
  const { activeBranch } = useBranch();
  const branchName = activeBranch === 'namnakala' ? 'Namnakala' : 'Bengali Chowk';
  
  const [mobile, setMobile] = useState("");
  const [fullName, setFullName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [shift, setShift] = useState("Full Day");
  
  const [recordFound, setRecordFound] = useState(false);
  const [permanentId, setPermanentId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const checkExistingMember = async (phone: string) => {
      const { data } = await supabase.from('members').select('*').eq('mobile', phone).maybeSingle();
      if (data) {
        setFullName(data.full_name || "");
        setFatherName(data.father_name || "");
        setDob(data.dob ? data.dob.split('T')[0] : "");
        setGender(data.gender || "");
        setAddress(data.address || "");
        setPermanentId(data.permanent_id || "");
        setRecordFound(true);
      } else {
        setRecordFound(false);
        setPermanentId("");
      }
    };

    if (mobile.replace(/[^0-9]/g, '').length >= 10) {
      checkExistingMember(mobile);
    } else {
      setRecordFound(false);
    }
  }, [mobile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      let finalId = permanentId;
      
      if (!recordFound) {
        const branchCode = activeBranch === 'namnakala' ? 'N' : 'B';
        const prefix = `#KL26${branchCode}`;

        const { data: allIds } = await supabase
          .from('members')
          .select('permanent_id')
          .like('permanent_id', `${prefix}%`);
          
        let maxSeq = 0;
        if (allIds && allIds.length > 0) {
          allIds.forEach(record => {
            if (record.permanent_id) {
              const suffix = record.permanent_id.replace(prefix, '');
              const num = parseInt(suffix);
              if (!isNaN(num) && num > maxSeq) maxSeq = num;
            }
          });
        }
        const seq = maxSeq + 1;
        finalId = `${prefix}${seq.toString().padStart(3, '0')}`;
        setPermanentId(finalId);
      }

      const payload = {
        permanent_id: finalId,
        full_name: fullName,
        father_name: fatherName,
        dob: dob || null,
        gender: gender,
        mobile: mobile,
        address: address,
        branch: activeBranch,
        seat_no: null,
        shift: shift,
        plan_amount: shift === 'Full Day' ? 1000 : 600,
        is_active: true,
        subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      if (recordFound && permanentId) {
        const { error: updErr } = await supabase.from('members').update(payload).eq('permanent_id', permanentId);
        if (updErr) throw new Error(updErr.message);
      } else {
        const { error: insErr } = await supabase.from('members').insert([payload]);
        if (insErr) throw new Error(insErr.message);
      }
      
      setSuccess(true);
      setErrorMsg(null);
      setTimeout(() => {
        setSuccess(false);
        setMobile(""); setFullName(""); setFatherName(""); setDob(""); setGender(""); setAddress("");
      }, 3000);

    } catch (err: any) {
      setErrorMsg(err.message || "An unknown database error occurred.");
      setSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const planAmount = shift === 'Full Day' ? '₹1,000' : '₹600';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Admission Portal</h1>
          <p className="page-subtitle">Register new members for {branchName} Branch</p>
        </div>
        {recordFound && (
          <span className="badge badge-success text-xs py-1.5 px-3">
            <span className="material-symbols-outlined text-sm">verified</span>
            Existing Record Found
          </span>
        )}
      </div>
      
      <div className="glass-pane-elevated !p-0 max-w-4xl mx-auto overflow-hidden">
        {/* Form Header */}
        <div className="px-6 md:px-8 py-5 border-b border-white/[0.06] bg-white/[0.02] flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-white font-manrope">Member Registration</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">Fill in the details below to register a new member</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-on-surface-variant">Plan Amount</div>
            <div className="text-lg font-bold text-primary">{planAmount}<span className="text-xs text-on-surface-variant font-normal">/mo</span></div>
          </div>
        </div>
        
        <div className="p-6 md:p-8">
          {/* Status Messages */}
          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl mb-6 text-center font-medium flex items-center justify-center gap-2 animate-fade-in-fast">
              <span className="material-symbols-outlined text-lg">check_circle</span>
              Admission Successful! Member ID: <span className="font-bold">{permanentId}</span>
            </div>
          )}

          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-center font-medium flex items-center justify-center gap-2 animate-fade-in-fast">
              <span className="material-symbols-outlined text-lg">error</span>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Identity Section */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-primary text-base">badge</span>
                <h3 className="text-xs font-bold text-primary uppercase tracking-widest">Identity Details</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField label="Mobile Number" icon="phone" required>
                  <input 
                    type="tel" required value={mobile} onChange={(e) => setMobile(e.target.value)}
                    className={`input-premium !pl-11 ${recordFound ? 'input-success' : ''}`}
                    placeholder="+91 00000 00000" 
                  />
                </FormField>
                <FormField label="Full Name" required>
                  <input required type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="input-premium" placeholder="e.g. Rahul Sharma" />
                </FormField>
                <FormField label="Father's Name">
                  <input type="text" value={fatherName} onChange={(e) => setFatherName(e.target.value)} className="input-premium" placeholder="Required for records" />
                </FormField>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Date of Birth">
                    <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="input-premium" />
                  </FormField>
                  <FormField label="Gender">
                    <select value={gender} onChange={(e) => setGender(e.target.value)} className="input-premium appearance-none">
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </FormField>
                </div>
                <div className="md:col-span-2">
                  <FormField label="Address">
                    <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="input-premium" placeholder="Full residential address" />
                  </FormField>
                </div>
              </div>
            </div>

            {/* Shift Section */}
            <div className="space-y-5 pt-6 border-t border-white/[0.06]">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-tertiary text-base">schedule</span>
                <h3 className="text-xs font-bold text-tertiary uppercase tracking-widest">Shift Assignment</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { value: 'Full Day', label: 'Full Day', time: '7 AM – 10 PM', price: '₹1,000' },
                  { value: 'Morning', label: 'Morning', time: '7 AM – 3 PM', price: '₹600' },
                  { value: 'Evening', label: 'Evening', time: '3 PM – 10 PM', price: '₹600' },
                ].map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setShift(option.value)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      shift === option.value
                        ? 'bg-primary/10 border-primary/30 shadow-[0_0_16px_rgba(191,194,255,0.08)]'
                        : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1]'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-sm font-bold ${shift === option.value ? 'text-primary' : 'text-white'}`}>{option.label}</span>
                      <span className={`text-xs font-bold ${shift === option.value ? 'text-primary' : 'text-on-surface-variant'}`}>{option.price}</span>
                    </div>
                    <span className="text-xs text-on-surface-variant">{option.time}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-start gap-2 text-xs text-on-surface-variant bg-white/[0.02] border border-white/[0.04] rounded-lg p-3">
                <span className="material-symbols-outlined text-sm text-tertiary mt-0.5">info</span>
                <span>Seat allotment is handled from the Seat Map module after admission.</span>
              </div>
            </div>

            {/* Documents Section */}
            <div className="space-y-5 pt-6 border-t border-white/[0.06]">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-secondary text-base">upload_file</span>
                <h3 className="text-xs font-bold text-secondary uppercase tracking-widest">Documents (Optional)</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-dashed border-white/10 rounded-xl p-5 text-center hover:bg-white/[0.02] hover:border-white/20 cursor-pointer transition-all group">
                  <span className="material-symbols-outlined text-2xl text-on-surface-variant/50 mb-2 group-hover:text-on-surface-variant transition-colors">add_a_photo</span>
                  <div className="text-xs text-white/60 font-medium group-hover:text-white/80 transition-colors">Upload Profile Photo</div>
                </div>
                <div className="border border-dashed border-white/10 rounded-xl p-5 text-center hover:bg-white/[0.02] hover:border-white/20 cursor-pointer transition-all group">
                  <span className="material-symbols-outlined text-2xl text-on-surface-variant/50 mb-2 group-hover:text-on-surface-variant transition-colors">id_card</span>
                  <div className="text-xs text-white/60 font-medium group-hover:text-white/80 transition-colors">Upload ID Proof</div>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button disabled={isSubmitting} type="submit" className="w-full btn-primary py-4 mt-4 flex justify-center items-center gap-2 disabled:opacity-50">
              {isSubmitting ? <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span> : null}
              {isSubmitting ? "Processing..." : recordFound ? "Re-Activate & Update Member" : "Complete Admission"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, icon, required, children }: { label: string; icon?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block pl-0.5">
        {label} {required && <span className="text-red-400/60">*</span>}
      </label>
      <div className="relative">
        {icon && <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-lg">{icon}</span>}
        {children}
      </div>
    </div>
  );
}
