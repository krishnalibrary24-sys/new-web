"use client";
import React, { useEffect, useState } from 'react';
import { useBranch } from "@/components/branch-context";
import { supabase } from "@/lib/supabase";

interface Lead {
  id: string;
  full_name: string;
  phone: string;
  interest: string;
  created_at: string;
}

export default function EnquiriesPage() {
  const { activeBranch } = useBranch();
  const branchName = activeBranch === 'namnakala' ? 'Namnakala' : 'Bengali Chowk';
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeads() {
      setLoading(true);
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setLeads(data);
      } else if (error) {
        console.error('Error fetching leads:', error);
      }
      setLoading(false);
    }
    fetchLeads();
  }, []);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newLead, setNewLead] = useState({ name: '', phone: '', interest: 'Full Day' });
  const [adding, setAdding] = useState(false);

  const handleAddEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    const { data, error } = await supabase.from('leads').insert([{
      full_name: newLead.name,
      phone: newLead.phone,
      interest: newLead.interest,
      created_at: new Date().toISOString()
    }]).select();
    
    if (!error && data) {
      setLeads([data[0], ...leads]);
      setShowAddModal(false);
      setNewLead({ name: '', phone: '', interest: 'Full Day' });
    }
    setAdding(false);
  };

  const getInterestColor = (interest: string) => {
    switch (interest) {
      case 'Full Day': return 'badge-info';
      case 'Half Day': return 'badge-warning';
      case 'Night Shift': return 'bg-purple-500/15 text-purple-400 border border-purple-500/20';
      default: return 'bg-white/[0.06] text-on-surface-variant border border-white/[0.06]';
    }
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Enquiries</h1>
          <p className="page-subtitle">Lead management · {leads.length} total enquiries</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary px-4 py-2.5 text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-base">add</span>
          Add Enquiry
        </button>
      </div>
      
      <div className="card-premium !p-0 overflow-hidden">
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-white/[0.06] bg-white/[0.02] flex justify-between items-center">
          <h2 className="text-base font-bold text-white font-manrope">Recent Enquiries</h2>
          <span className="badge badge-info">{leads.length} leads</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm table-premium">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Interest</th>
                <th>Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}>
                    <td><div className="skeleton h-5 w-28" /></td>
                    <td><div className="skeleton h-5 w-24" /></td>
                    <td><div className="skeleton h-5 w-16" /></td>
                    <td><div className="skeleton h-5 w-20" /></td>
                    <td><div className="skeleton h-5 w-8 ml-auto" /></td>
                  </tr>
                ))
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      <span className="material-symbols-outlined empty-state-icon">inbox</span>
                      <div className="empty-state-title">No Enquiries Yet</div>
                      <div className="empty-state-desc">Leads from the website enquiry form will appear here.</div>
                    </div>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="group">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/15 flex items-center justify-center text-primary font-bold text-xs">
                          {lead.full_name.charAt(0)}
                        </div>
                        <span className="text-white font-medium">{lead.full_name}</span>
                      </div>
                    </td>
                    <td className="text-on-surface-variant">{lead.phone}</td>
                    <td>
                      <span className={`badge ${getInterestColor(lead.interest)}`}>
                        {lead.interest}
                      </span>
                    </td>
                    <td className="text-on-surface-variant">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                    <td className="text-right">
                      <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <a 
                          href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`} 
                          target="_blank" rel="noreferrer"
                          className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-on-surface-variant hover:text-emerald-400 transition-all"
                        >
                          <span className="material-symbols-outlined text-base">chat</span>
                        </a>
                        <button className="p-1.5 rounded-lg hover:bg-white/[0.04] text-on-surface-variant hover:text-white transition-all">
                          <span className="material-symbols-outlined text-base">more_horiz</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Enquiry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-surface-container-lowest/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-pane-elevated rounded-3xl w-full max-w-md p-6 animate-scale-in border border-white/10 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6 font-manrope">Add New Enquiry</h2>
            <form onSubmit={handleAddEnquiry} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1 block">Full Name</label>
                <input 
                  type="text" 
                  required 
                  value={newLead.name} 
                  onChange={e => setNewLead({...newLead, name: e.target.value})}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary/50 outline-none"
                  placeholder="e.g. John Doe"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1 block">Phone Number</label>
                <input 
                  type="tel" 
                  required 
                  value={newLead.phone} 
                  onChange={e => setNewLead({...newLead, phone: e.target.value})}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary/50 outline-none"
                  placeholder="+91..."
                />
              </div>
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1 block">Interest</label>
                <select 
                  value={newLead.interest} 
                  onChange={e => setNewLead({...newLead, interest: e.target.value})}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary/50 outline-none appearance-none"
                >
                  <option value="Full Day" className="bg-[#060e20]">Full Day</option>
                  <option value="Half Day" className="bg-[#060e20]">Half Day</option>
                  <option value="Night Shift" className="bg-[#060e20]">Night Shift</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 btn-ghost py-3 rounded-xl font-bold text-sm">Cancel</button>
                <button type="submit" disabled={adding} className="flex-1 btn-primary py-3 rounded-xl font-bold text-sm disabled:opacity-50">
                  {adding ? 'Saving...' : 'Save Enquiry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
