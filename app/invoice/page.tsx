"use client";
import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function InvoiceContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  
  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Settings loaded from localStorage
  const [libName, setLibName] = useState("Krishna Library");
  const [libPhone, setLibPhone] = useState("+91 8269144748");
  const [libAddress, setLibAddress] = useState("Plot 12, Bengali Chowk Area, Ambikapur, C.G.");
  const [upiId, setUpiId] = useState("krishnalibrary@okaxis");
  const [upiName, setUpiName] = useState("Krishna Library");

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedName = localStorage.getItem("krishna_lib_name");
      const savedPhone = localStorage.getItem("krishna_phone");
      const savedAddress = localStorage.getItem("krishna_address");
      const savedUpiId = localStorage.getItem("krishna_upi_id");
      const savedUpiName = localStorage.getItem("krishna_upi_pn");

      if (savedName) setLibName(savedName);
      if (savedPhone) setLibPhone(savedPhone);
      if (savedAddress) setLibAddress(savedAddress);
      if (savedUpiId) setUpiId(savedUpiId);
      if (savedUpiName) setUpiName(savedUpiName);
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    const fetchMember = async () => {
      const { data } = await supabase.from('members').select('*').eq('id', id).single();
      if (data) {
        setMember(data);
      }
      setLoading(false);
    };
    fetchMember();
  }, [id]);

  // Deterministic stable receipt number based on member ID
  const receiptNo = React.useMemo(() => {
    if (!member) return "";
    let hash = 0;
    for (let i = 0; i < member.id.length; i++) {
      hash = member.id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const code = Math.abs(hash % 90000) + 10000;
    return `REC-${code}`;
  }, [member]);

  // Construct stable payment UPI URL
  const upiUrl = React.useMemo(() => {
    if (!member) return "";
    const finalAmount = Math.max(0, (member.plan_amount || 0) - (member.discount || 0));
    return `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${finalAmount}&cu=INR&tn=${encodeURIComponent(`Renewal ${receiptNo}`)}`;
  }, [member, upiId, upiName, receiptNo]);

  if (loading) return <div className="p-10 text-center text-white">Loading Invoice...</div>;
  if (!member) return <div className="p-10 text-center text-error">Invoice Data Not Found</div>;

  return (
    <div className="bg-white text-black min-h-screen p-8 md:p-16 max-w-4xl mx-auto font-sans">
      <div className="flex justify-center gap-4 mb-6 print:hidden">
        <button 
          onClick={() => window.print()}
          className="bg-[#0D47A1] text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-transform hover:scale-105 shadow-md animate-fade-in"
        >
          <span className="material-symbols-outlined">print</span>
          Print Invoice
        </button>
        <a 
          href={`https://wa.me/${member.mobile.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${member.full_name}, here is your latest invoice for ${libName}. You can view it here: ${typeof window !== 'undefined' ? window.location.href : ''}`)}`}
          target="_blank" rel="noreferrer"
          className="bg-[#10b981] hover:bg-[#059669] text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-105 shadow-md animate-fade-in"
        >
          <span className="material-symbols-outlined">chat</span>
          Send via WhatsApp
        </a>
      </div>
      
      <div className="border border-[#c3c6d4] shadow-xl p-10 relative bg-white mx-auto overflow-hidden animate-scale-in" id="printable-invoice">
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-[#0D47A1]"></div>

        {/* Header */}
        <div className="flex justify-between items-center border-b border-[#e2e0fc] pb-8 mb-8 mt-2">
          <div className="flex items-center gap-6">
            <img 
              src="/assets/logo.png" 
              alt={`${libName} Logo`} 
              className="h-20 w-auto object-contain"
            />
            <div>
              <h1 className="text-2xl font-montserrat font-bold text-[#1a1a2e] tracking-tight uppercase">{libName}</h1>
              <p className="text-[#0D47A1] font-bold uppercase text-xs tracking-widest mt-1">{member.branch.replace('-', ' ')} Branch</p>
              <div className="mt-2 text-xs text-[#434652] font-lexend leading-relaxed">
                <p>{libAddress}</p>
                <p>Phone: {libPhone}</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-montserrat font-bold uppercase text-[#e2e0fc] mb-2 tracking-widest">Invoice</h2>
            <div className="bg-[#f5f7ff] p-4 rounded-lg text-left inline-block border border-[#e2e0fc]">
              <p className="text-[10px] uppercase text-[#737783] font-montserrat font-bold mb-1 tracking-wider">Receipt No.</p>
              <p className="font-bold font-lexend text-[#1a1a2e]">{receiptNo}</p>
              <p className="text-[10px] uppercase text-[#737783] font-montserrat font-bold mb-1 mt-3 tracking-wider">Date</p>
              <p className="font-bold font-lexend text-[#1a1a2e]">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div className="grid grid-cols-2 gap-12 mb-10">
          <div>
            <h3 className="text-[11px] font-montserrat font-bold uppercase text-[#737783] mb-3 border-b border-[#efecff] pb-2 tracking-widest">Billed To</h3>
            <p className="font-montserrat font-bold text-xl text-[#1a1a2e]">{member.full_name}</p>
            <p className="text-sm text-[#434652] mt-2 font-lexend">Library ID: <span className="font-mono font-bold text-[#0D47A1] bg-[#f5f7ff] px-2 py-0.5 rounded">{member.permanent_id}</span></p>
            <p className="text-sm text-[#434652] mt-1 font-lexend">Phone: {member.mobile}</p>
          </div>
          <div>
            <h3 className="text-[11px] font-montserrat font-bold uppercase text-[#737783] mb-3 border-b border-[#efecff] pb-2 tracking-widest">Subscription Details</h3>
            <p className="text-sm mb-1.5 font-lexend"><span className="text-[#737783] w-24 inline-block font-medium">Shift:</span> <span className="font-bold text-[#1a1a2e]">{member.shift}</span></p>
            <p className="text-sm mb-1.5 font-lexend"><span className="text-[#737783] w-24 inline-block font-medium">Seat No:</span> <span className="font-bold text-[#1a1a2e]">{member.seat_no || 'Unassigned'}</span></p>
            <p className="text-sm mb-1.5 font-lexend"><span className="text-[#737783] w-24 inline-block font-medium">Joining Date:</span> <span className="font-bold text-[#1a1a2e]">{member.joining_date ? new Date(member.joining_date).toLocaleDateString() : 'N/A'}</span></p>
            <p className="text-sm font-lexend"><span className="text-[#737783] w-24 inline-block font-medium">Valid Till:</span> <span className="font-bold text-[#0D47A1]">{new Date(member.subscription_end_date).toLocaleDateString()}</span></p>
          </div>
        </div>

        {/* Table */}
        <table className="w-full mb-10 overflow-hidden rounded-xl border border-[#e2e0fc]">
          <thead className="bg-[#0D47A1] text-white">
            <tr>
              <th className="py-4 px-6 text-left uppercase text-[11px] font-montserrat font-bold tracking-widest">Description</th>
              <th className="py-4 px-6 text-center uppercase text-[11px] font-montserrat font-bold tracking-widest border-l border-white/20">Term</th>
              <th className="py-4 px-6 text-right uppercase text-[11px] font-montserrat font-bold tracking-widest border-l border-white/20">Amount</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            <tr className="border-b border-[#e2e0fc]">
              <td className="py-5 px-6">
                <p className="font-montserrat font-bold text-[#1a1a2e]">Library Membership Renewal</p>
                <p className="text-xs text-[#737783] mt-1 font-lexend leading-relaxed">Includes high-speed Wi-Fi, premium AC seating, and digital resources access.</p>
              </td>
              <td className="py-5 px-6 text-center font-lexend text-[#1a1a2e] font-medium border-l border-[#e2e0fc]">30 Days</td>
              <td className="py-5 px-6 text-right font-bold font-mono text-[#1a1a2e] text-lg border-l border-[#e2e0fc]">₹{member.plan_amount}.00</td>
            </tr>
          </tbody>
        </table>

        {/* Total & UPI Scan-to-Pay section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 items-start">
          {/* UPI Scan to Pay Gateway */}
          <div className="bg-white p-5 rounded-xl border border-[#e2e0fc] flex items-center gap-4">
            <div className="bg-slate-50 p-2 rounded-lg border border-[#e2e0fc] flex-shrink-0">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(upiUrl)}`}
                alt="Scan to Pay via UPI"
                className="w-24 h-24 object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-1 text-[10px] font-montserrat font-extrabold uppercase text-[#0D47A1] tracking-wider mb-1">
                <span className="material-symbols-outlined text-sm">qr_code_2</span>
                Scan & Pay UPI
              </div>
              <p className="text-[11px] font-bold text-[#1a1a2e] mb-1">Scan to Complete Payment</p>
              <p className="text-[9px] text-[#434652] leading-relaxed mb-2">Compatible with GPay, PhonePe, Paytm, BHIM & all banking apps.</p>
              <div className="bg-[#f5f7ff] border border-[#e2e0fc] px-2 py-1 rounded font-mono text-[9px] text-[#1a1a2e] font-semibold flex items-center justify-between">
                <span>{upiId}</span>
              </div>
            </div>
          </div>

          {/* TOTAL Section */}
          <div className="bg-[#f5f7ff] p-6 rounded-xl border border-[#e2e0fc]">
            <div className="flex justify-between py-2 border-b border-[#e2e0fc] text-sm font-lexend">
              <span className="text-[#434652]">Subtotal (Plan Price)</span>
              <span className="font-mono font-medium">₹{member.plan_amount || 0}.00</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#e2e0fc] text-sm font-lexend text-red-600">
              <span className="text-[#434652]">Discount</span>
              <span className="font-mono font-medium">-₹{member.discount || 0}.00</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#e2e0fc] text-sm font-lexend">
              <span className="text-[#434652]">Tax (0%)</span>
              <span className="font-mono font-medium">₹0.00</span>
            </div>
            <div className="flex justify-between items-center pt-4 mt-2">
              <span className="font-montserrat font-bold tracking-widest text-[#1a1a2e]">TOTAL PAID</span>
              <span className="text-[#0D47A1] font-mono font-black text-2xl">₹{Math.max(0, (member.plan_amount || 0) - (member.discount || 0))}.00</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-[#737783] border-t border-[#e2e0fc] pt-6 pb-2 font-lexend">
          <p className="font-bold text-[#1a1a2e] mb-1">Thank you for being a part of {libName}!</p>
          <p>This is a computer-generated receipt and requires no physical signature.</p>
        </div>

        {/* Watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[120px] font-montserrat font-black text-[#f5f7ff] opacity-60 -z-10 transform -rotate-12 pointer-events-none uppercase tracking-widest">
          PAID
        </div>
      </div>
      
      {/* Print styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @page { size: A4; margin: 0; }
        @media print {
          body * { visibility: hidden; }
          #printable-invoice, #printable-invoice * { visibility: visible; }
          #printable-invoice { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 210mm; 
            min-height: 297mm;
            padding: 20mm !important; 
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .print\\:hidden { display: none !important; }
        }
      `}} />
    </div>
  );
}

export default function InvoicePage() {
  return (
    <Suspense fallback={<div className="p-10 text-white">Loading...</div>}>
      <InvoiceContent />
    </Suspense>
  );
}
