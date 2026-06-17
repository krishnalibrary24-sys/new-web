"use client";
import React, { useState, useEffect } from 'react';
import { useBranch } from "@/components/branch-context";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from 'next/navigation';
import { logActivity } from "@/lib/activity";

export default function AdmissionPage() {
  const { activeBranch } = useBranch();
  const branchName = activeBranch === 'namnakala' ? 'Namnakala' : 'Bangali Chowk';
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const [existingMemberState, setExistingMemberState] = useState<any | null>(null);
  
  const [mobile, setMobile] = useState("");
  const [fullName, setFullName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [shift, setShift] = useState("Full Day");
  const [isReserved, setIsReserved] = useState<boolean>(true);
  
  // No pricing or payment states here anymore
  const [recordFound, setRecordFound] = useState(false);
  const [permanentId, setPermanentId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showRecordPopup, setShowRecordPopup] = useState(false);

  useEffect(() => {
    if (editId) return; // Do not overwrite if editing an existing record
    const urlName = searchParams.get('name');
    const urlMobile = searchParams.get('mobile');
    const urlShift = searchParams.get('shift');
    const urlAddress = searchParams.get('address');
    
    if (urlName) setFullName(urlName);
    if (urlMobile) {
      // Clean up mobile to just digits if it comes with +91 or spaces
      const cleanMobile = urlMobile.replace(/[^0-9]/g, '').slice(-10);
      setMobile(cleanMobile);
    }
    if (urlShift) setShift(urlShift);
    if (urlAddress && urlAddress !== 'N/A' && urlAddress !== 'None') setAddress(urlAddress);
  }, [searchParams, editId]);

  useEffect(() => {
    const fetchMemberToEdit = async () => {
      if (!editId) return;
      const { data } = await supabase.from('members').select('*').eq('id', editId).eq('branch', activeBranch).maybeSingle();
      if (data) {
        setMobile(data.mobile || "");
        setFullName(data.full_name || "");
        setFatherName(data.father_name || "");
        setDob(data.dob ? data.dob.split('T')[0] : "");
        setGender(data.gender || "");
        setAddress(data.address || "");
        setShift(data.shift || "Full Day");
        setIsReserved(!data.permanent_id?.includes('U'));
        setPermanentId(data.permanent_id || "");
        setRecordFound(true);
        setExistingMemberState(data);
      }
    };
    fetchMemberToEdit();
  }, [editId, activeBranch]);

  useEffect(() => {
    if (editId) return;
    
    const checkExistingMember = async (phone: string) => {
      const { data } = await supabase
        .from('members')
        .select('*')
        .eq('mobile', phone)
        .eq('branch', activeBranch)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        setFullName(data.full_name || "");
        setFatherName(data.father_name || "");
        setDob(data.dob ? data.dob.split('T')[0] : "");
        setGender(data.gender || "");
        setAddress(data.address || "");
        setPermanentId(data.permanent_id || "");
        setIsReserved(!data.permanent_id?.includes('U'));
        setRecordFound(true);
        setShowRecordPopup(true);
      } else {
        setRecordFound(false);
        setPermanentId("");
        setShowRecordPopup(false);
      }
    };

    if (mobile.replace(/[^0-9]/g, '').length >= 10) {
      checkExistingMember(mobile);
    } else {
      setRecordFound(false);
    }
  }, [mobile, editId, activeBranch]);

  const handleClearForm = () => {
    setMobile("");
    setFullName("");
    setFatherName("");
    setDob("");
    setGender("");
    setAddress("");
    setShift("Full Day");
    setIsReserved(true);
    setRecordFound(false);
    setPermanentId("");
    setExistingMemberState(null);
    setShowRecordPopup(false);
    setErrorMsg(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      let finalId = permanentId;
      const branchCode = activeBranch === 'namnakala' ? 'N' : 'B';
      const prefix = isReserved ? `#KL26${branchCode}` : `#KL26${branchCode}U`;
      
      const needsNewPermanentId = !recordFound || (existingMemberState && (existingMemberState.permanent_id.includes('U') !== !isReserved));
      
      if (needsNewPermanentId) {
        const { data: allIds } = await supabase
          .from('members')
          .select('permanent_id')
          .like('permanent_id', `#KL26${branchCode}%`);
          
        let maxSeq = 0;
        if (allIds && allIds.length > 0) {
          allIds.forEach(record => {
            if (record.permanent_id) {
              if (isReserved) {
                // Must not contain 'U'
                if (!record.permanent_id.includes('U') && record.permanent_id.startsWith(prefix)) {
                  const suffix = record.permanent_id.replace(prefix, '');
                  const num = parseInt(suffix);
                  if (!isNaN(num) && num > maxSeq) maxSeq = num;
                }
              } else {
                // Must start with prefix (which contains 'U')
                if (record.permanent_id.startsWith(prefix)) {
                  const suffix = record.permanent_id.replace(prefix, '');
                  const num = parseInt(suffix);
                  if (!isNaN(num) && num > maxSeq) maxSeq = num;
                }
              }
            }
          });
        }
        const seq = maxSeq + 1;
        finalId = `${prefix}${seq.toString().padStart(3, '0')}`;
        setPermanentId(finalId);
      }

      // Default plan amount based on shift
      const basePriceVal = shift === 'Full Day' ? 1000 : 600;

      let seatToAllot = null;
      let prevSeatVal = null;

      if (isReserved && recordFound && permanentId) {
        const { data: currentMember } = await supabase
          .from('members')
          .select('seat_no, previous_seat_no')
          .eq('permanent_id', permanentId)
          .eq('branch', activeBranch)
          .maybeSingle();

        if (currentMember) {
          seatToAllot = currentMember.seat_no || null;
          prevSeatVal = currentMember.previous_seat_no || null;

          if (!seatToAllot && prevSeatVal) {
            const { data: occupant } = await supabase
              .from('members')
              .select('id')
              .eq('branch', activeBranch)
              .eq('shift', shift)
              .eq('seat_no', prevSeatVal)
              .eq('is_active', true)
              .maybeSingle();

            if (!occupant) {
              seatToAllot = prevSeatVal;
              prevSeatVal = null;
            }
          }
        }
      }

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const payload: any = {
        full_name: fullName,
        father_name: fatherName,
        dob: dob || null,
        gender: gender,
        mobile: mobile,
        address: address,
        shift: shift,
        plan_amount: basePriceVal,
      };

      if (!existingMemberState) {
        payload.permanent_id = finalId;
        payload.branch = activeBranch;
        payload.seat_no = seatToAllot;
        payload.previous_seat_no = prevSeatVal;
        payload.is_active = false; // Inactive pending initial payment
        payload.subscription_end_date = null; // Set during payment setup
        payload.pay_later = true; // Default to pay later with immediate due date
        payload.payment_due_date = tomorrowStr; // Due date is tomorrow
        payload.status = 'INACTIVE';
        payload.payment_status = 'PENDING';
        payload.outstanding_dues = basePriceVal;
      } else {
        // For existing member edits, check if seat category transitioned
        if (existingMemberState.permanent_id !== finalId) {
          payload.permanent_id = finalId;
        }
        const categoryChanged = existingMemberState.permanent_id.includes('U') !== !isReserved;
        if (categoryChanged) {
          payload.seat_no = null;
        }
      }

      let memberId = "";
      if (existingMemberState) {
        const { data: updatedMember, error: updErr } = await supabase.from('members').update(payload).eq('id', existingMemberState.id).select().single();
        if (updErr) throw new Error(updErr.message);
        if (updatedMember) {
          memberId = updatedMember.id;
          logActivity(activeBranch, "admission_update", `Updated profile details for existing member: ${fullName} (${existingMemberState.permanent_id})`);
        }
      } else if (recordFound && permanentId) {
        const { data: updatedMember, error: updErr } = await supabase.from('members').update(payload).eq('permanent_id', permanentId).eq('branch', activeBranch).select().single();
        if (updErr) throw new Error(updErr.message);
        if (updatedMember) {
          memberId = updatedMember.id;
          logActivity(activeBranch, "admission_reactivate", `Re-activated and updated profile for member: ${fullName} (${permanentId})`);
        }
      } else {
        const { data: insertedMember, error: insErr } = await supabase.from('members').insert([payload]).select().single();
        if (insErr) throw new Error(insErr.message);
        if (insertedMember) {
          memberId = insertedMember.id;
          logActivity(activeBranch, "admission_create", `Registered new student: ${fullName} (${finalId})`);
        }
      }

      setSuccess(true);
      setErrorMsg(null);

      // Reset profile states
      setMobile(""); setFullName(""); setFatherName(""); setDob(""); setGender(""); setAddress("");

      if (!existingMemberState) {
        if (memberId) {
          router.push(`/dashboard/record-payment?memberId=${memberId}`);
        }
      } else {
        // If it was an edit of an existing member, redirect back to the members dashboard directory
        router.push(`/dashboard/members`);
      }

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
          <h1 className="page-title flex items-center gap-4">
            Admission Portal
            <button 
              onClick={handleClearForm}
              type="button"
              className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-md bg-slate-500/10 text-slate-400 hover:bg-slate-500/20 transition-all border border-slate-500/10 cursor-pointer"
              title="Clear all fields"
            >
              <span className="material-symbols-outlined text-[14px]">refresh</span>
              Clear Form
            </button>
          </h1>
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
            <div className="text-xs text-on-surface-variant">Step 1 of 2</div>
            <div className="text-sm font-bold text-primary">Profile Info</div>
          </div>
        </div>
        
        <div className="p-6 md:p-8">
          {/* Status Messages */}
          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl mb-6 text-center font-medium flex items-center justify-center gap-2 animate-fade-in-fast">
              <span className="material-symbols-outlined text-lg">check_circle</span>
              Admission Successful! Redirecting to Payment Setup...
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

            {/* Seat Category Selection */}
            <div className="space-y-5 pt-6 border-t border-white/[0.06]">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-primary text-base">event_seat</span>
                <h3 className="text-xs font-bold text-primary uppercase tracking-widest">Seat Category</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  className={`flex items-center gap-3 border p-4 rounded-xl transition-all cursor-pointer select-none ${
                    isReserved 
                      ? 'bg-blue-500/10 border-blue-500/30' 
                      : 'bg-slate-200 hover:bg-slate-300 border-slate-300'
                  }`}
                  onClick={() => setIsReserved(true)}
                >
                  <input
                    type="radio"
                    checked={isReserved}
                    onChange={() => setIsReserved(true)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-5 h-5 text-[#003178] focus:ring-[#003178] border-slate-300 cursor-pointer"
                  />
                  <div>
                    <span className="text-sm font-bold text-slate-800 block">Reserved Slot</span>
                    <span className="text-[10px] text-slate-500">Dedicated desk allocated via Seat Map</span>
                  </div>
                </div>

                <div 
                  className={`flex items-center gap-3 border p-4 rounded-xl transition-all cursor-pointer select-none ${
                    !isReserved 
                      ? 'bg-blue-500/10 border-blue-500/30' 
                      : 'bg-slate-200 hover:bg-slate-300 border-slate-300'
                  }`}
                  onClick={() => setIsReserved(false)}
                >
                  <input
                    type="radio"
                    checked={!isReserved}
                    onChange={() => setIsReserved(false)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-5 h-5 text-[#003178] focus:ring-[#003178] border-slate-300 cursor-pointer"
                  />
                  <div>
                    <span className="text-sm font-bold text-slate-800 block">Unreserved Slot</span>
                    <span className="text-[10px] text-slate-500">General admission (No seat allotted)</span>
                  </div>
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
                {(activeBranch === 'namnakala' ? [
                  { value: 'Full Day', label: 'Full Day', time: '7:30 AM – 9:30 PM', price: '₹1,000' },
                  { value: 'Morning', label: 'Morning', time: '7:30 AM – 2:30 PM', price: '₹600' },
                  { value: 'Evening', label: 'Evening', time: '2:30 PM – 9:30 PM', price: '₹600' },
                ] : [
                  { value: 'Full Day', label: 'Full Day', time: '7 AM – 10 PM', price: '₹1,000' },
                  { value: 'Morning', label: 'Morning', time: '7 AM – 3 PM', price: '₹600' },
                  { value: 'Evening', label: 'Evening', time: '3 PM – 10 PM', price: '₹600' },
                ]).map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setShift(option.value)}
                    className={`relative p-[2px] rounded-xl text-left transition-all group ${
                      shift === option.value
                        ? 'bg-gradient-to-r from-[#003178] to-[#60a5fa] shadow-lg shadow-blue-500/20'
                        : 'bg-slate-200 hover:bg-slate-300'
                    }`}
                  >
                    <div className={`p-4 rounded-[10px] h-full w-full ${shift === option.value ? 'bg-[#f5f7ff]' : 'bg-white group-hover:bg-slate-50'}`}>
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-sm font-bold ${shift === option.value ? 'text-[#003178]' : 'text-slate-800'}`}>{option.label}</span>
                        <span className={`text-xs font-bold ${shift === option.value ? 'text-[#003178]' : 'text-slate-600'}`}>{option.price}</span>
                      </div>
                      <span className={`text-xs ${shift === option.value ? 'text-[#003178]/70' : 'text-slate-500'}`}>{option.time}</span>
                    </div>
                  </button>
                ))}
              </div>
              {isReserved ? (
                <div className="flex items-start gap-2 text-xs text-on-surface-variant bg-white/[0.02] border border-white/[0.04] rounded-lg p-3">
                  <span className="material-symbols-outlined text-sm text-tertiary mt-0.5">info</span>
                  <span>Seat allotment is handled from the Seat Map module after admission.</span>
                </div>
              ) : (
                <div className="flex items-start gap-2 text-xs text-on-surface-variant bg-white/[0.02] border border-white/[0.04] rounded-lg p-3">
                  <span className="material-symbols-outlined text-sm text-emerald-400 mt-0.5">check_circle</span>
                  <span>Unreserved Student: General admission slot. No seat allotment required.</span>
                </div>
              )}
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

      {/* Record Found Popup */}
      {showRecordPopup && (
        <div className="fixed bottom-6 right-6 glass-pane-elevated !p-4 !rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[#003178]/20 z-50 animate-fade-in max-w-sm">
          <div className="flex items-start gap-3">
            <div className="bg-gradient-to-br from-[#003178] to-[#60a5fa] p-2 rounded-full text-white shadow-md flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">contact_page</span>
            </div>
            <div>
              <h4 className="font-bold text-slate-800 font-manrope text-sm">Existing Member Found</h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                A member with this mobile number already exists in our records ({permanentId}). Is this the same person?
              </p>
              <div className="flex gap-2 mt-3">
                <button 
                  type="button"
                  onClick={() => setShowRecordPopup(false)}
                  className="px-3 py-1.5 bg-gradient-to-r from-[#003178] to-[#60a5fa] text-white text-xs font-bold rounded-lg hover:shadow-lg hover:shadow-blue-500/20 transition-all"
                >
                  Yes, Update
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setShowRecordPopup(false);
                    setRecordFound(false);
                    setPermanentId("");
                  }}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-200 transition-all border border-slate-200"
                >
                  No, New ID
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
