"use client";
import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function InvoiceContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  
  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchMember = async () => {
      const { data } = await supabase.from('members').select('*').eq('id', id).single();
      if (data) setMember(data);
      setLoading(false);
      
      // Auto-print after slight delay for rendering
      if (data) {
        setTimeout(() => {
          window.print();
        }, 500);
      }
    };
    fetchMember();
  }, [id]);

  if (loading) return <div className="p-10 text-center text-white">Loading Invoice...</div>;
  if (!member) return <div className="p-10 text-center text-error">Invoice Data Not Found</div>;

  return (
    <div className="bg-white text-black min-h-screen p-8 md:p-16 max-w-4xl mx-auto font-sans" id="printable-invoice">
      <div className="border-2 border-black p-8 relative">
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-6">
          <div className="flex flex-col gap-4">
            <img 
              src="https://lh3.googleusercontent.com/aida/ADBb0ujXoAabGgq_q5aD16vZVFO1dgjI6KHFawizn5CaSBr1Q4u1ndoQh_smcAWKy_Og8fAYAzUm3nrDf4Kav7NnXXU6oM4_eK7Yn5uhMwZJt7Jprzxd34IvO7Io5OQQ_IKNFXhc3iRP-4lBoqyRGm2EGrAppk3qKec6pSK0k7iYFFhkNI-zyD_u8G2FLDoKOMTNLanKCIbgeblj4m1grlnlN2PUht0fWs2krs_3QXPbfBT8een4Er7Pu6uMnasijmhmYe-I-BglUyU0Sw" 
              alt="Krishna Library Logo" 
              className="h-24 w-auto object-contain"
            />
            <div>
              <p className="text-gray-600 font-bold uppercase text-sm tracking-widest">{member.branch.replace('-', ' ')} Branch</p>
              <div className="mt-2 text-sm text-gray-700">
                <p>123 Education Hub, Main Road</p>
                <p>City Center, State 497001</p>
                <p>Phone: +91 99999-88888</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold uppercase text-gray-400 mb-2">Invoice / Receipt</h2>
            <div className="bg-gray-100 p-3 rounded text-left inline-block border border-gray-300">
              <p className="text-xs uppercase text-gray-500 font-bold mb-1">Receipt No.</p>
              <p className="font-bold font-mono">REC-{Math.floor(Math.random() * 90000) + 10000}</p>
              <p className="text-xs uppercase text-gray-500 font-bold mb-1 mt-2">Date</p>
              <p className="font-bold">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-xs font-bold uppercase text-gray-500 mb-2 border-b border-gray-200 pb-1">Billed To</h3>
            <p className="font-bold text-xl">{member.full_name}</p>
            <p className="text-sm text-gray-600 mt-1">ID: <span className="font-mono font-bold text-blue-900">{member.permanent_id}</span></p>
            <p className="text-sm text-gray-600 mt-1">Phone: {member.mobile}</p>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase text-gray-500 mb-2 border-b border-gray-200 pb-1">Subscription Details</h3>
            <p className="text-sm mb-1"><span className="text-gray-500 w-24 inline-block">Shift:</span> <span className="font-bold">{member.shift}</span></p>
            <p className="text-sm mb-1"><span className="text-gray-500 w-24 inline-block">Seat No:</span> <span className="font-bold">{member.seat_no || 'Unassigned'}</span></p>
            <p className="text-sm"><span className="text-gray-500 w-24 inline-block">Valid Till:</span> <span className="font-bold text-green-700">{new Date(member.subscription_end_date).toLocaleDateString()}</span></p>
          </div>
        </div>

        {/* Table */}
        <table className="w-full mb-8">
          <thead className="bg-blue-900 text-white">
            <tr>
              <th className="py-3 px-4 text-left uppercase text-xs tracking-wider">Description</th>
              <th className="py-3 px-4 text-center uppercase text-xs tracking-wider">Term</th>
              <th className="py-3 px-4 text-right uppercase text-xs tracking-wider">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-200">
              <td className="py-4 px-4">
                <p className="font-bold">Library Membership Renewal</p>
                <p className="text-xs text-gray-500 mt-1">Includes high-speed Wi-Fi, AC seating, and locker access.</p>
              </td>
              <td className="py-4 px-4 text-center">30 Days</td>
              <td className="py-4 px-4 text-right font-bold font-mono">₹{member.plan_amount}.00</td>
            </tr>
          </tbody>
        </table>

        {/* Total */}
        <div className="flex justify-end mb-16">
          <div className="w-64">
            <div className="flex justify-between py-2 border-b border-gray-200 text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-mono">₹{member.plan_amount}.00</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200 text-sm">
              <span className="text-gray-500">Tax (0%)</span>
              <span className="font-mono">₹0.00</span>
            </div>
            <div className="flex justify-between py-3 border-b-4 border-blue-900 text-xl font-black mt-2">
              <span>TOTAL</span>
              <span className="text-blue-900 font-mono">₹{member.plan_amount}.00</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 border-t border-gray-200 pt-4">
          <p className="font-bold text-gray-600 mb-1">Thank you for studying with Krishna Library!</p>
          <p>This is a computer-generated receipt and requires no physical signature.</p>
        </div>

        {/* Watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[150px] font-black text-gray-100 opacity-50 -z-10 transform -rotate-45 pointer-events-none uppercase tracking-widest">
          PAID
        </div>
      </div>
      
      {/* Print styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          #printable-invoice, #printable-invoice * { visibility: visible; }
          #printable-invoice { position: absolute; left: 0; top: 0; width: 100%; }
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
