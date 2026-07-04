"use client";
import React, { useEffect, useState, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getTemplate, parseTemplate, formatWhatsAppNumber } from '@/lib/whatsapp';

function parseInvoiceNotes(notes: string) {
  const info = {
    joiningDate: null as string | null,
    expiryDate: null as string | null,
    duration: "30 Days",
    basePrice: 0,
    discount: 0,
    isDays: false
  };

  if (!notes) return info;

  // Try to parse Joining date
  const joinMatch = notes.match(/Joining:\s*([0-9\-\/]+)/i);
  if (joinMatch) info.joiningDate = joinMatch[1];

  // Try to parse Expiry date
  const expiryMatch = notes.match(/Expiry:\s*([0-9\-\/]+)/i);
  if (expiryMatch) info.expiryDate = expiryMatch[1];

  // Try to parse Duration
  const durationMatch = notes.match(/Duration:\s*([^.]+)/i);
  if (durationMatch) info.duration = durationMatch[1].trim();

  // Try to parse Base Price / Plan Price
  const baseMatch = notes.match(/Base\s*(Price|Plan):\s*₹?([0-9]+)/i);
  if (baseMatch) info.basePrice = parseInt(baseMatch[2]);

  // Try to parse Discount
  const discountMatch = notes.match(/Discount:\s*₹?([0-9]+)/i);
  if (discountMatch) info.discount = parseInt(discountMatch[2]);

  return info;
}

function InvoiceContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  
  const [member, setMember] = useState<any>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Settings loaded from localStorage
  const [libName, setLibName] = useState("Krishna Library");
  const [libPhone, setLibPhone] = useState("+91 8269144748");
  const [libAddress, setLibAddress] = useState("Plot 12, Bengali Chowk Area, Ambikapur, C.G.");
  const [upiId, setUpiId] = useState("Q056780176@ybl");
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

  const [invoiceShareTemplate, setInvoiceShareTemplate] = useState("");

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      setLoading(true);
      
      // Fetch the WhatsApp template
      const template = await getTemplate('invoice_share_msg');
      setInvoiceShareTemplate(template);

      // 1. Try to fetch invoice record first
      const { data: invData } = await supabase
        .from('invoices')
        .select('*, member:members(*)')
        .eq('id', id)
        .single();

      if (invData) {
        setInvoice(invData);
        setMember(invData.member);
        
        // Fetch payments associated with this invoice
        const { data: payData } = await supabase
          .from('payments')
          .select('*')
          .eq('invoice_id', invData.id)
          .order('paid_at', { ascending: true });
          
        if (payData) {
          setPayments(payData);
        }
      } else {
        // 2. Fallback: Try to fetch member directly (legacy or direct link)
        const { data: memData } = await supabase
          .from('members')
          .select('*')
          .eq('id', id)
          .single();

        if (memData) {
          setMember(memData);
          // Create mock invoice
          const mockInv = {
            id: null,
            member_id: memData.id,
            total_amount: memData.plan_amount || 0,
            paid_amount: (memData.plan_amount || 0) - (memData.outstanding_dues || 0),
            due_amount: memData.outstanding_dues || 0,
            status: memData.outstanding_dues > 0 ? (memData.outstanding_dues === memData.plan_amount ? 'unpaid' : 'partially_paid') : 'paid',
            due_date: memData.payment_due_date || null,
            created_at: memData.updated_at || new Date().toISOString()
          };
          setInvoice(mockInv);

          // Fetch all payments for this member (recent ones)
          const { data: payData } = await supabase
            .from('payments')
            .select('*')
            .eq('member_id', memData.id)
            .order('paid_at', { ascending: false })
            .limit(1);

          if (payData) {
            setPayments(payData);
          }
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  // Deterministic stable receipt number based on key ID
  const receiptNo = useMemo(() => {
    if (!invoice || !member) return "";
    const key = invoice.id || member.id;
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = key.charCodeAt(i) + ((hash << 5) - hash);
    }
    const code = Math.abs(hash % 90000) + 10000;
    const branchCode = member.branch === 'namnakala' ? 'N' : 'B';
    return `REC-${branchCode}-${code}`;
  }, [invoice, member]);

  // Parse notes to extract transactional metadata
  const parsedInfo = useMemo(() => {
    const setupPayment = payments.find(p => p.notes && (p.notes.includes("Renewal") || p.notes.includes("Partial")));
    const notesToParse = setupPayment ? setupPayment.notes : (payments[0]?.notes || "");
    return parseInvoiceNotes(notesToParse);
  }, [payments]);

  // Calculate pricing breakdown
  const discountAmount = useMemo(() => parsedInfo.discount || member?.discount || 0, [parsedInfo, member]);
  const subtotalAmount = useMemo(() => parsedInfo.basePrice || (invoice?.total_amount || 0) + discountAmount, [parsedInfo, invoice, discountAmount]);

  // Construct stable payment UPI URL for remaining dues
  const upiUrl = useMemo(() => {
    if (!invoice) return "";
    const finalAmount = invoice.due_amount || 0;
    return `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${finalAmount}&cu=INR&tn=${encodeURIComponent(`Dues Payment ${receiptNo}`)}`;
  }, [invoice, upiId, upiName, receiptNo]);

  // Download PDF Client-Side using html2pdf
  const downloadPDF = () => {
    const element = document.getElementById('printable-invoice');
    if (!element || !member) return;
    
    const opt = {
      margin: 10,
      filename: `${member.full_name.replace(/\s+/g, '_')}_Invoice_${receiptNo}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2.5, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.onload = () => {
      // @ts-ignore
      window.html2pdf().from(element).set(opt).save();
    };
    document.body.appendChild(script);
  };

  // WhatsApp Pre-filled message link
  const shareMessage = useMemo(() => {
    if (!member || !invoice || !invoiceShareTemplate) return "";
    const link = typeof window !== 'undefined' ? `${window.location.origin}/invoice?id=${id || member.id}` : '';
    const statusTxt = invoice.status === 'paid' ? '✅ FULLY PAID' : invoice.status === 'partially_paid' ? '⚠️ PARTIALLY PAID (Dues Pending)' : '❌ UNPAID';
    
    const templateVars = {
      name: member.full_name,
      lib_name: libName,
      receipt_no: receiptNo,
      date: new Date(invoice.created_at).toLocaleDateString(),
      permanent_id: member.permanent_id || 'N/A',
      seat: member.permanent_id && member.permanent_id.includes('U') ? 'Unreserved' : `Seat ${member.seat_no || 'Unassigned'}`,
      shift: member.shift || 'N/A',
      subtotal: subtotalAmount.toString(),
      discount: discountAmount.toString(),
      total_amount: invoice.total_amount.toString(),
      paid_amount: invoice.paid_amount.toString(),
      due_amount: invoice.due_amount.toString(),
      status: statusTxt,
      invoice_link: link
    };

    return parseTemplate(invoiceShareTemplate, templateVars);
  }, [member, invoice, receiptNo, subtotalAmount, discountAmount, libName, id, invoiceShareTemplate]);

  if (loading) return <div className="p-10 text-center text-slate-400">Loading Invoice...</div>;
  if (!member || !invoice) return <div className="p-10 text-center text-red-500">Invoice Data Not Found</div>;

  const displayJoiningDate = parsedInfo.joiningDate || (member.joining_date ? new Date(member.joining_date).toLocaleDateString() : 'N/A');
  const displayExpiryDate = parsedInfo.expiryDate || (member.subscription_end_date ? new Date(member.subscription_end_date).toLocaleDateString() : 'N/A');

  return (
    <div className="bg-slate-900 text-slate-100 min-h-screen p-4 md:p-12 font-sans">
      {/* Action Buttons Bar */}
      <div className="flex justify-center gap-4 mb-8 print:hidden flex-wrap animate-fade-in">
        <button 
          onClick={() => window.print()}
          className="bg-[#003178] hover:bg-[#003178]/95 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-transform hover:scale-[1.02] shadow-md cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg">print</span>
          Print Invoice
        </button>
        <button 
          onClick={downloadPDF}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-transform hover:scale-[1.02] shadow-md cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg">download</span>
          Download PDF
        </button>
        <a 
          href={`https://wa.me/${formatWhatsAppNumber(member.mobile)}?text=${encodeURIComponent(shareMessage)}`}
          target="_blank" rel="noreferrer"
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-[1.02] shadow-md"
        >
          <span className="material-symbols-outlined text-lg">send</span>
          Share to WhatsApp
        </a>
      </div>
      
      {/* Printable Invoice Page */}
      <div 
        className="border border-[#c3c6d4] shadow-2xl p-6 md:p-12 relative bg-white text-slate-800 mx-auto overflow-hidden rounded-2xl max-w-4xl" 
        id="printable-invoice"
      >
        {/* Top Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-[#003178]"></div>
 
        {/* Header Section - Clean & Print-Optimized (No background gradients) */}
        <div className="flex justify-between items-center border-b-2 border-slate-100 pb-6 mb-8 mt-2 flex-wrap gap-6">
          <div className="flex items-center gap-5">
            <img 
              src="/assets/logo.png" 
              alt="Krishna Library Logo" 
              className="h-20 w-auto object-contain flex-shrink-0"
              onError={(e:any) => { e.target.style.display='none'; }}
            />
            <div>
              <h1 className="text-2xl font-montserrat font-black text-[#003178] tracking-tight uppercase leading-none">{libName}</h1>
              <p className="text-[#0D47A1] font-black uppercase text-[10px] tracking-widest mt-1.5">{member.branch ? `${member.branch.replace('-', ' ')} Branch` : 'Namnakala Branch'}</p>
              <div className="mt-2 text-xs text-[#434652] font-lexend leading-relaxed">
                <p>{member.branch === 'namnakala' ? 'Infront of Manjusha Academy, Namnakala' : 'Infront of Aastha Hospital, Bengali Chowk'}</p>
                <p>Phone: {libPhone}</p>
              </div>
            </div>
          </div>
          <div className="text-right min-w-[160px]">
            <h2 className="text-2xl font-montserrat font-black uppercase text-[#003178] mb-2 tracking-widest leading-none">Receipt</h2>
            <div className="bg-[#f8fafc] p-3.5 rounded-xl text-left border border-slate-100 w-full">
              <div className="text-[9px] font-lexend text-slate-500 font-bold uppercase tracking-wider mb-0.5">Receipt No</div>
              <div className="font-lexend font-bold text-sm text-[#003178] mb-2">{receiptNo}</div>
              <div className="text-[9px] font-lexend text-slate-500 font-bold uppercase tracking-wider mb-0.5">Date</div>
              <div className="font-lexend font-bold text-xs text-slate-700">{new Date(invoice.created_at).toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        {/* Customer & Subscription Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-[10px] font-montserrat font-black uppercase text-[#737783] mb-2.5 border-b border-[#efecff] pb-1.5 tracking-wider">Billed To</h3>
            <p className="font-montserrat font-black text-base text-[#1a1a2e]">{member.full_name}</p>
            <p className="text-xs text-[#434652] mt-1.5 font-lexend">Library ID: <span className="font-mono font-bold text-[#003178] bg-[#f5f7ff] px-2 py-0.5 rounded">{member.permanent_id}</span></p>
            {member.student_no && (
              <div className="mt-2.5 inline-flex items-center gap-1.5 bg-[#f5f3ff] border border-[#ddd6fe] text-[#6d28d9] px-2.5 py-1 rounded-lg">
                <span className="material-symbols-outlined text-[13px]">badge</span>
                <span className="text-[10px] font-montserrat font-bold uppercase tracking-wider">Allotment No:</span>
                <span className="font-mono font-black text-xs">#{member.student_no}</span>
              </div>
            )}
            <p className="text-xs text-[#434652] mt-1 font-lexend">Phone: {member.mobile}</p>
          </div>
          <div>
            <h3 className="text-[10px] font-montserrat font-black uppercase text-[#737783] mb-2.5 border-b border-[#efecff] pb-1.5 tracking-wider">Subscription details</h3>
            <p className="text-xs mb-1 font-lexend"><span className="text-[#737783] w-24 inline-block font-medium">Shift:</span> <span className="font-bold text-[#1a1a2e]">{member.shift}</span></p>
            <p className="text-xs mb-1 font-lexend"><span className="text-[#737783] w-24 inline-block font-medium">Seat No:</span> <span className="font-bold text-[#1a1a2e]">{member.permanent_id && member.permanent_id.includes('U') ? 'Unreserved' : (member.seat_no || 'Unassigned')}</span></p>
            <p className="text-xs mb-1 font-lexend"><span className="text-[#737783] w-24 inline-block font-medium">Join Date:</span> <span className="font-bold text-[#1a1a2e]">{displayJoiningDate}</span></p>
            <p className="text-xs font-lexend"><span className="text-[#737783] w-24 inline-block font-medium">Valid Till:</span> <span className="font-bold text-[#003178]">{displayExpiryDate}</span></p>
          </div>
        </div>

        {/* Pricing Breakdown Table */}
        <table className="w-full mb-8 overflow-hidden rounded-xl border border-[#e2e0fc]">
          <thead className="bg-[#003178] text-white">
            <tr>
              <th className="py-3 px-4 text-left uppercase text-[10px] font-montserrat font-bold tracking-wider">Description</th>
              <th className="py-3 px-4 text-center uppercase text-[10px] font-montserrat font-bold tracking-wider border-l border-white/10 w-24">Term</th>
              <th className="py-3 px-4 text-right uppercase text-[10px] font-montserrat font-bold tracking-wider border-l border-white/10 w-32">Amount</th>
            </tr>
          </thead>
          <tbody className="bg-white text-xs">
            <tr className="border-b border-[#e2e0fc]">
              <td className="py-4 px-4">
                <p className="font-montserrat font-bold text-[#1a1a2e]">Library Membership Renewal</p>
                <p className="text-[10px] text-[#737783] mt-0.5 font-lexend leading-normal">High speed Wi-Fi, premium AC seating study room access.</p>
              </td>
              <td className="py-4 px-4 text-center font-lexend text-[#1a1a2e] font-medium border-l border-[#e2e0fc]">{parsedInfo.duration}</td>
              <td className="py-4 px-4 text-right font-bold font-mono text-[#1a1a2e] border-l border-[#e2e0fc]">₹{subtotalAmount}.00</td>
            </tr>
          </tbody>
        </table>

        {/* Repayment and Installments History */}
        {payments.length > 0 && (
          <div className="mb-8">
            <h4 className="text-[10px] font-montserrat font-black uppercase text-[#737783] mb-2.5 border-b border-[#efecff] pb-1.5 tracking-wider">Transaction Payment Timeline</h4>
            <div className="space-y-2">
              {payments.map((p, idx) => (
                <div key={p.id} className="flex justify-between items-center text-xs bg-[#f8fafc] border border-[#e2e8f0] px-4 py-2.5 rounded-xl font-lexend">
                  <div>
                    <span className="font-bold text-[#1a1a2e]">Installment #{idx + 1} ({p.payment_mode})</span>
                    <span className="text-[#64748b] text-[10px] ml-2">on {new Date(p.paid_at).toLocaleDateString()} at {new Date(p.paid_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    {p.notes && (
                      <p className="text-[10px] text-[#64748b] mt-0.5 italic">{p.notes.split('—')[1] || p.notes}</p>
                    )}
                  </div>
                  <span className="font-bold font-mono text-[#003178] text-sm">₹{p.amount}.00</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* UPI Gateway & Final Totals Block */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start mb-8">
          {/* UPI Scan to Pay Gateway */}
          {invoice.due_amount > 0 ? (
            <div className="bg-white p-4 rounded-xl border border-[#e2e0fc] flex items-center gap-3.5 shadow-sm">
              <div className="bg-slate-50 p-1.5 rounded-lg border border-[#e2e0fc] flex-shrink-0">
                <img
                  src="/assets/upi qr.png"
                  alt="Scan to Pay UPI"
                  className="w-28 h-28 object-contain"
                  onError={(e:any) => { e.target.style.display='none'; }}
                />
              </div>
              <div>
                <div className="flex items-center gap-1 text-[9px] font-montserrat font-black uppercase text-[#003178] tracking-wider mb-0.5">
                  <span className="material-symbols-outlined text-sm">qr_code_2</span>
                  Scan & Pay UPI
                </div>
                <p className="text-[10px] font-bold text-[#1a1a2e] mb-0.5">Scan to Clear Due Amount</p>
                <p className="text-[8px] text-[#434652] leading-normal mb-1.5">Compatible with BHIM, Google Pay, PhonePe, Paytm, etc.</p>
                <div className="bg-[#f5f7ff] border border-[#e2e0fc] px-2 py-0.5 rounded font-mono text-[9px] text-[#1a1a2e] font-semibold text-center select-all">
                  {upiId}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-500/5 p-5 rounded-xl border border-emerald-500/15 flex items-center justify-center gap-3 h-full shadow-sm">
              <span className="material-symbols-outlined text-emerald-600 text-3xl">verified</span>
              <div>
                <h4 className="font-montserrat font-black text-emerald-800 uppercase text-xs tracking-wider">Fully Settled</h4>
                <p className="text-[10px] text-emerald-700 font-lexend mt-0.5">All dues for this subscription have been fully cleared.</p>
              </div>
            </div>
          )}

          {/* TOTAL Billing Box */}
          <div className="bg-[#f5f7ff] p-5 rounded-xl border border-[#e2e0fc] text-xs shadow-sm">
            <div className="flex justify-between py-1.5 border-b border-[#e2e0fc] font-lexend">
              <span className="text-[#434652]">Subtotal (Plan Price)</span>
              <span className="font-mono font-medium">₹{subtotalAmount}.00</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between py-1.5 border-b border-[#e2e0fc] font-lexend text-red-600">
                <span className="text-[#434652]">Discount</span>
                <span className="font-mono font-medium">-₹{discountAmount}.00</span>
              </div>
            )}
            <div className="flex justify-between py-1.5 border-b border-[#e2e0fc] font-lexend">
              <span className="text-[#434652]">Total Billing</span>
              <span className="font-mono font-bold text-[#1a1a2e]">₹{invoice.total_amount}.00</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#e2e0fc] font-lexend text-emerald-600">
              <span className="text-[#434652]">Amount Paid</span>
              <span className="font-mono font-bold">₹{invoice.paid_amount}.00</span>
            </div>
            {invoice.due_amount > 0 && (
              <div className="flex justify-between py-1.5 border-b border-[#e2e0fc] font-lexend text-red-600 bg-red-500/5 px-2 rounded-lg mt-1">
                <span className="font-black uppercase text-[10px] tracking-wider">Balance Due</span>
                <span className="font-mono font-black text-sm">₹{invoice.due_amount}.00</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-3 mt-1.5">
              <span className="font-montserrat font-black tracking-widest text-[#1a1a2e] uppercase text-[10px]">Grand Total</span>
              <span className="text-[#003178] font-mono font-black text-xl">₹{invoice.total_amount}.00</span>
            </div>
          </div>
        </div>

        {/* Footer & Signature Disclaimer */}
        <div className="text-center text-[10px] text-[#737783] border-t border-[#e2e0fc] pt-5 pb-1 font-lexend">
          <p className="font-bold text-[#1a1a2e] mb-0.5">Thank you for studying at {libName}!</p>
          <p>This is an official computer-generated receipt requiring no physical signature.</p>
        </div>

        {/* Diagonal Status Watermark */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[100px] font-montserrat font-black opacity-[0.03] -z-10 transform -rotate-12 pointer-events-none uppercase tracking-widest select-none ${
          invoice.status === 'paid' ? 'text-emerald-600' : invoice.status === 'partially_paid' ? 'text-amber-500' : 'text-red-500'
        }`}>
          {invoice.status === 'partially_paid' ? 'PARTIAL' : invoice.status}
        </div>
      </div>
      
      {/* Print Specific CSS Styles */}
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
            border-radius: 0 !important;
          }
          .print\\:hidden { display: none !important; }
        }
      `}} />
    </div>
  );
}

export default function InvoicePage() {
  return (
    <Suspense fallback={<div className="p-10 text-white text-center">Loading Content Pipeline...</div>}>
      <InvoiceContent />
    </Suspense>
  );
}
