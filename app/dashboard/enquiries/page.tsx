"use client";
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useBranch } from "@/components/branch-context";
import { supabase } from "@/lib/supabase";
import { logActivity } from "@/lib/activity";

interface Lead {
  id: string;
  full_name: string;
  phone: string;
  interest: string;
  branch: string | null;
  notes: string | null;
  created_at: string;
}

const parseNotes = (notesStr: string | null) => {
  let address = 'N/A';
  let email = 'N/A';
  if (notesStr) {
    if (notesStr.includes('Address:') || notesStr.includes('Email:')) {
      const parts = notesStr.split('|');
      const addrPart = parts.find(p => p.includes('Address:'));
      const emailPart = parts.find(p => p.includes('Email:'));
      if (addrPart) {
        address = addrPart.replace('Address:', '').trim();
      }
      if (emailPart) {
        email = emailPart.replace('Email:', '').trim();
      }
    } else {
      email = notesStr.trim();
    }
  }
  return { address, email };
};

export default function EnquiriesPage() {
  const { activeBranch } = useBranch();
  const branchName = activeBranch === 'namnakala' ? 'Namnakala' : 'Bengali Chowk';
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name-asc' | 'name-desc'>('newest');

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
  const [newLead, setNewLead] = useState({ name: '', phone: '', interest: 'Full Day', branch: 'bengali-chowk', address: '' });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (showAddModal) {
      setNewLead(prev => ({ ...prev, branch: activeBranch, address: '' }));
    }
  }, [showAddModal, activeBranch]);

  const handleAddEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    const { data, error } = await supabase.from('leads').insert([{
      full_name: newLead.name,
      phone: newLead.phone,
      interest: newLead.interest,
      branch: newLead.branch,
      notes: `Address: ${newLead.address || 'None'} | Email: None`,
      created_at: new Date().toISOString()
    }]).select();
    
    if (!error && data) {
      logActivity(activeBranch, "enquiry_added", `Added new enquiry lead: ${newLead.name} (Phone: ${newLead.phone}, Interest: ${newLead.interest})`);
      setLeads([data[0], ...leads]);
      setShowAddModal(false);
      setNewLead({ name: '', phone: '', interest: 'Full Day', branch: activeBranch, address: '' });
    }
    setAdding(false);
  };

  const handleDeleteLead = async (id: string) => {
    if (confirm("Are you sure you want to delete this enquiry?")) {
      const lead = leads.find(l => l.id === id);
      await supabase.from('leads').delete().eq('id', id);
      if (lead) {
        logActivity(activeBranch, "enquiry_delete", `Deleted enquiry lead: ${lead.full_name} (${lead.phone})`);
      }
      setLeads(leads.filter(l => l.id !== id));
    }
  };

  const getInterestColor = (interest: string) => {
    switch (interest) {
      case 'Full Day': return 'badge-info';
      case 'Half Day': return 'badge-warning';
      case 'Night Shift': return 'bg-blue-500/15 text-blue-400 border border-blue-500/20';
      default: return 'bg-white/[0.06] text-on-surface-variant border border-white/[0.06]';
    }
  };

  const sortedLeads = [...leads].sort((a, b) => {
    if (sortBy === 'name-asc') return a.full_name.localeCompare(b.full_name);
    if (sortBy === 'name-desc') return b.full_name.localeCompare(a.full_name);
    if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime(); // newest
  });

  const filteredLeads = sortedLeads.filter(lead => !lead.branch || lead.branch === activeBranch);
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Enquiries</h1>
          <p className="page-subtitle">Lead management · {filteredLeads.length} active enquiries</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary px-4 py-2.5 text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-base">add</span>
          Add Enquiry
        </button>
      </div>
      
      <div className="card-premium !p-0 overflow-hidden">
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-white/[0.06] bg-white/[0.02] flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-white font-manrope">Recent Enquiries</h2>
            <span className="badge badge-info">{filteredLeads.length} leads</span>
          </div>
          <div className="flex items-center gap-2 bg-white/[0.02] px-2 py-1.5 rounded-xl border border-white/[0.04]">
            <span className="material-symbols-outlined text-on-surface-variant text-sm pl-1">sort</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-slate-800 text-xs font-bold focus:outline-none pr-6 pl-1 cursor-pointer appearance-none bg-[url('data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3e%3cpath stroke=%27%23475569%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3e%3c/svg%3e')] bg-[position:right_0.25rem_center] bg-no-repeat bg-[size:1rem_1rem]"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm table-premium">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Branch</th>
                <th>Address</th>
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
                    <td><div className="skeleton h-5 w-24" /></td>
                    <td><div className="skeleton h-5 w-16" /></td>
                    <td><div className="skeleton h-5 w-20" /></td>
                    <td><div className="skeleton h-5 w-8 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <span className="material-symbols-outlined empty-state-icon">inbox</span>
                      <div className="empty-state-title">No Enquiries Yet</div>
                      <div className="empty-state-desc">Leads from the website enquiry form will appear here.</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="group">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/15 flex items-center justify-center text-primary font-bold text-xs">
                          {lead.full_name.charAt(0)}
                        </div>
                        <div>
                          <span className="text-white font-medium block">{lead.full_name}</span>
                          {parseNotes(lead.notes).email !== 'N/A' && parseNotes(lead.notes).email !== 'None' && (
                            <span className="text-[10px] text-on-surface-variant block mt-0.5">{parseNotes(lead.notes).email}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="text-on-surface-variant">{lead.phone}</td>
                    <td>
                      <span className={`badge ${lead.branch === 'namnakala' ? 'badge-info' : 'bg-purple-500/15 text-purple-400 border border-purple-500/20'}`}>
                        {lead.branch === 'namnakala' ? 'Namnakala' : 'Bengali Chowk'}
                      </span>
                    </td>
                    <td className="text-on-surface-variant max-w-[180px] truncate" title={parseNotes(lead.notes).address}>
                      {parseNotes(lead.notes).address}
                    </td>
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
                          href={`/dashboard/admission?name=${encodeURIComponent(lead.full_name)}&mobile=${encodeURIComponent(lead.phone)}&shift=${encodeURIComponent(lead.interest === 'Half Day' ? 'Morning' : (lead.interest === 'Night Shift' ? 'Evening' : lead.interest))}&address=${encodeURIComponent(parseNotes(lead.notes).address)}`}
                          className="p-1.5 rounded-lg hover:bg-primary/10 text-on-surface-variant hover:text-primary transition-all"
                          title="Convert to Admission"
                        >
                          <span className="material-symbols-outlined text-base">person_add</span>
                        </a>
                        <a 
                          href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${lead.full_name}, thank you for your enquiry at Krishna Library! How can we assist you today?`)}`} 
                          target="_blank" rel="noreferrer"
                          className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-on-surface-variant hover:text-emerald-400 transition-all"
                          title="Message on WhatsApp"
                        >
                          <span className="material-symbols-outlined text-base">chat</span>
                        </a>
                        <button 
                          onClick={() => handleDeleteLead(lead.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-on-surface-variant hover:text-red-400 transition-all"
                          title="Delete Enquiry"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
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
      {showAddModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
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
                  className="input-premium"
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
                  className="input-premium"
                  placeholder="+91..."
                />
              </div>
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1 block">Branch</label>
                <select 
                  value={newLead.branch} 
                  onChange={e => setNewLead({...newLead, branch: e.target.value})}
                  className="input-premium appearance-none bg-[url('data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3e%3cpath stroke=%27%23475569%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3e%3c/svg%3e')] bg-[position:right_0.75rem_center] bg-no-repeat bg-[size:1.25rem_1.25rem] pr-10 text-slate-800 font-medium"
                >
                  <option value="bengali-chowk" className="text-slate-800">Bangali Chowk</option>
                  <option value="namnakala" className="text-slate-800">Namnakala</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1 block">Address</label>
                <input 
                  type="text" 
                  value={newLead.address} 
                  onChange={e => setNewLead({...newLead, address: e.target.value})}
                  className="input-premium"
                  placeholder="Enter local area or address"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1 block">Interest</label>
                <select 
                  value={newLead.interest} 
                  onChange={e => setNewLead({...newLead, interest: e.target.value})}
                  className="input-premium appearance-none bg-[url('data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3e%3cpath stroke=%27%23475569%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3e%3c/svg%3e')] bg-[position:right_0.75rem_center] bg-no-repeat bg-[size:1.25rem_1.25rem] pr-10 text-slate-800 font-medium"
                >
                  <option value="Full Day" className="text-slate-800">Full Day</option>
                  <option value="Half Day" className="text-slate-800">Half Day</option>
                  <option value="Night Shift" className="text-slate-800">Night Shift</option>
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
        </div>,
        document.body
      )}
    </div>
  );
}
