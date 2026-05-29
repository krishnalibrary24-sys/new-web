"use client";
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useBranch } from "@/components/branch-context";
import { supabase } from "@/lib/supabase";

export default function SeatingPage() {
  const { activeBranch } = useBranch();
  const branchName = activeBranch === 'namnakala' ? 'Namnakala' : 'Bangali Chowk';
  const seats = activeBranch === 'namnakala' ? 121 : 153;

  
  const [seatMap, setSeatMap] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [unassignedMembers, setUnassignedMembers] = useState<any[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [modalSearch, setModalSearch] = useState("");

  const occupiedCount = Object.keys(seatMap).length;
  const availableCount = seats - occupiedCount;

  // Real-time seat map statistics
  const assignedTotalMembers = Object.values(seatMap).reduce((sum, occupants) => sum + occupants.length, 0);
  const totalMembers = assignedTotalMembers + unassignedMembers.length;
  const morningShiftMembers = Object.values(seatMap).reduce((sum, occupants) => 
    sum + occupants.filter(m => m.shift === 'Morning').length, 0
  );
  const eveningShiftMembers = Object.values(seatMap).reduce((sum, occupants) => 
    sum + occupants.filter(m => m.shift === 'Evening').length, 0
  );
  const fullDayShiftMembers = Object.values(seatMap).reduce((sum, occupants) => 
    sum + occupants.filter(m => m.shift === 'Full Day').length, 0
  );

  useEffect(() => {
    const fetchSeats = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('members')
        .select('id, seat_no, shift, is_active, full_name, permanent_id')
        .eq('branch', activeBranch)
        .eq('is_active', true);
      
      if (data) {
        const map: Record<string, any[]> = {};
        const unassigned: any[] = [];
        data.forEach(m => {
          if (m.seat_no) {
            if (!map[m.seat_no]) map[m.seat_no] = [];
            map[m.seat_no].push(m);
          } else {
            unassigned.push(m);
          }
        });
        setSeatMap(map);
        setUnassignedMembers(unassigned);
      }
      setLoading(false);
    };

    fetchSeats();
  }, [activeBranch]);

  const handleAssignSeat = async (memberId: string) => {
    if (!selectedSeat) return;
    setIsAssigning(true);
    await supabase.from('members').update({ seat_no: selectedSeat }).eq('id', memberId);
    
    const member = unassignedMembers.find(m => m.id === memberId);
    if (member) {
      // 1. Remove from unassigned list
      setUnassignedMembers(prev => prev.filter(m => m.id !== memberId));
      
      // 2. Add to seatMap (ensuring no duplicate entries)
      setSeatMap(prev => {
        const current = prev[selectedSeat] || [];
        const filteredCurrent = current.filter(m => m.id !== memberId);
        return { ...prev, [selectedSeat]: [...filteredCurrent, { ...member, seat_no: selectedSeat }] };
      });
    }
    setIsAssigning(false);
  };

  const handleUnassignSeat = async (memberId: string, seatNo: string) => {
    setIsAssigning(true);
    await supabase.from('members').update({ seat_no: null }).eq('id', memberId);
    
    const currentOccupants = seatMap[seatNo] || [];
    const member = currentOccupants.find(m => m.id === memberId);
    
    if (member) {
      // 1. Add to unassigned list (filtering beforehand to avoid double entries)
      setUnassignedMembers(prev => {
        const filtered = prev.filter(m => m.id !== memberId);
        return [...filtered, { ...member, seat_no: null }];
      });
    }

    // 2. Remove from seatMap
    setSeatMap(prev => {
      const current = prev[seatNo] || [];
      const updated = current.filter(m => m.id !== memberId);
      if (updated.length === 0) {
        const newMap = { ...prev };
        delete newMap[seatNo];
        return newMap;
      }
      return { ...prev, [seatNo]: updated };
    });
    
    setIsAssigning(false);
  };

  const getSeatStyle = (seatId: string) => {
    const occupants = seatMap[seatId] || [];
    if (occupants.length === 0) return { bg: 'bg-red-500/10 border-red-500/20 hover:bg-red-500/20', dot: '' };
    if (occupants.length === 2) {
      return { 
        bg: 'border-purple-500/30 hover:scale-105', 
        dot: 'multishift', 
        style: {
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.35) 50%, rgba(168, 85, 247, 0.35) 50%)'
        }
      };
    }
    const shift = occupants[0].shift;
    if (shift === 'Full Day') return { bg: 'bg-emerald-500/20 border-emerald-500/20', dot: 'bg-emerald-400' };
    if (shift === 'Morning') return { bg: 'bg-amber-500/20 border-amber-500/20', dot: 'bg-amber-400' };
    if (shift === 'Evening') return { bg: 'bg-purple-500/20 border-purple-500/20', dot: 'bg-purple-400' };
    return { bg: 'bg-white/[0.04] border-white/[0.08]', dot: '' };
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Seat Map</h1>
          <p className="page-subtitle">{branchName} Branch · {seats} Total Capacity</p>
        </div>
        {unassignedMembers.length > 0 && (
          <div className="card-premium !py-2 !px-4 flex items-center gap-2 border-orange-500/20 text-orange-500 bg-orange-500/5">
            <span className="material-symbols-outlined text-sm animate-pulse">info</span>
            <span className="text-xs font-bold font-manrope">{unassignedMembers.length} Student{unassignedMembers.length > 1 ? 's' : ''} Awaiting Seats</span>
          </div>
        )}
      </div>

      {/* 📊 Seating Dynamic Stats Tiles Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Total Members (Assigned + Unassigned) */}
        <div className="card-premium !p-4 flex items-center gap-3 bg-primary/[0.02]">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">groups</span>
          </div>
          <div>
            <div className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider leading-none">Total Members</div>
            <div className="text-lg font-black text-slate-800 mt-1.5 leading-none">{totalMembers}</div>
          </div>
        </div>

        {/* Occupied Cabins */}
        <div className="card-premium !p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">event_seat</span>
          </div>
          <div>
            <div className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider leading-none">Occupied Seats</div>
            <div className="text-lg font-black text-slate-800 mt-1.5 leading-none">{occupiedCount}</div>
          </div>
        </div>

        {/* Available Cabins */}
        <div className="card-premium !p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">chair_alt</span>
          </div>
          <div>
            <div className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider leading-none">Available Seats</div>
            <div className="text-lg font-black text-slate-800 mt-1.5 leading-none">{availableCount}</div>
          </div>
        </div>

        {/* Assigned Members (Total) */}
        <div className="card-premium !p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">group</span>
          </div>
          <div>
            <div className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider leading-none">Assigned Total</div>
            <div className="text-lg font-black text-slate-800 mt-1.5 leading-none">{assignedTotalMembers}</div>
          </div>
        </div>

        {/* Morning Shift Assigned Members */}
        <div className="card-premium !p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">light_mode</span>
          </div>
          <div>
            <div className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider leading-none">Morning Shift</div>
            <div className="text-lg font-black text-slate-800 mt-1.5 leading-none">{morningShiftMembers}</div>
          </div>
        </div>

        {/* Evening Shift Assigned Members */}
        <div className="card-premium !p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">dark_mode</span>
          </div>
          <div>
            <div className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider leading-none">Evening Shift</div>
            <div className="text-lg font-black text-slate-800 mt-1.5 leading-none">{eveningShiftMembers}</div>
          </div>
        </div>

        {/* Full Day Assigned Members */}
        <div className="card-premium !p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">wb_sunny</span>
          </div>
          <div>
            <div className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider leading-none">Full Day Shift</div>
            <div className="text-lg font-black text-slate-800 mt-1.5 leading-none">{fullDayShiftMembers}</div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs font-medium text-on-surface-variant bg-white/[0.02] border border-white/[0.06] p-3 px-4 rounded-xl">
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500/30 rounded border border-red-500/20" />Available</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500/30 rounded border border-emerald-500/20" />Full Day</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-amber-500/30 rounded border border-amber-500/20" />Morning</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-purple-500/30 rounded border border-purple-500/20" />Evening</div>
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded border border-purple-500/20" 
            style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.35) 50%, rgba(168, 85, 247, 0.35) 50%)' }} 
          />
          Shared / Multishift
        </div>
      </div>
      
      {/* Seat Grid */}
      <div className="card-premium overflow-x-auto relative">
        {loading && (
          <div className="absolute inset-0 z-10 bg-surface/60 backdrop-blur-sm flex items-center justify-center rounded-2xl">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined animate-spin text-2xl text-primary">progress_activity</span>
              <span className="text-sm font-medium text-on-surface-variant">Loading seat data...</span>
            </div>
          </div>
        )}
        <div className="grid grid-cols-10 md:grid-cols-12 lg:grid-cols-15 gap-2 min-w-[600px]">
          {[...Array(seats)].map((_, i) => {
            const seatId = (i + 1).toString();
            const style = getSeatStyle(seatId);
            const occupants = seatMap[seatId] || [];
            const isSelected = selectedSeat === seatId;
            
            return (
              <button
                key={i}
                onClick={() => setSelectedSeat(seatId)}
                style={style.style}
                className={`aspect-square ${style.bg} rounded-lg border flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 ${
                  isSelected ? 'ring-2 ring-primary ring-offset-1 ring-offset-surface scale-105' : ''
                }`}
                title={occupants.length > 0 ? `${seatId}: ${occupants.map(o => o.full_name).join(', ')}` : `Seat ${seatId} — Available`}
              >
                <span className="text-[10px] font-bold text-white/50">{seatId}</span>
                {style.dot === 'multishift' ? (
                  <div className="flex gap-0.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_4px_#f59e0b]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_4px_#a855f7]" />
                  </div>
                ) : (
                  style.dot && <span className={`w-1.5 h-1.5 rounded-full ${style.dot} mt-0.5`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══ Seat Management Modal (SaaS Redesign) ═══ */}
      {selectedSeat && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setSelectedSeat(null)}>
          <div className="bg-white border border-slate-200 shadow-2xl rounded-2xl w-full max-w-lg overflow-hidden animate-scale-in flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-xl font-v-display font-bold text-slate-900 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
                    <span className="material-symbols-outlined text-lg">event_seat</span>
                  </div>
                  Seat #{selectedSeat}
                </h2>
                <p className="text-xs font-v-body-sm text-slate-500 mt-1 ml-10">Manage assignment for this slot</p>
              </div>
              <button onClick={() => setSelectedSeat(null)} className="text-slate-400 hover:bg-slate-100 hover:text-slate-700 p-2 rounded-xl transition-all">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            
            {/* Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-white">
              {seatMap[selectedSeat] && seatMap[selectedSeat].length > 0 ? (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-[11px] font-v-label-md font-bold text-blue-700 uppercase tracking-widest mb-3">Current Occupants</h4>
                    <div className="space-y-3">
                      {seatMap[selectedSeat].map(member => (
                        <div key={member.id} className="bg-white p-4 rounded-xl flex justify-between items-center border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-sm shadow-inner">
                              {member.full_name.charAt(0)}
                            </div>
                            <div>
                              <div className="text-slate-900 font-bold text-sm font-v-body-md">{member.full_name}</div>
                              <div className="text-xs text-slate-500 font-v-body-sm mt-0.5 flex items-center gap-1.5">
                                <span className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 font-mono text-[10px]">{member.permanent_id}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300" />
                                <span className="text-blue-700 font-semibold">{member.shift}</span>
                              </div>
                            </div>
                          </div>
                          <button 
                            disabled={isAssigning}
                            onClick={() => handleUnassignSeat(member.id, selectedSeat)}
                            className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white p-2.5 rounded-xl disabled:opacity-50 transition-colors shadow-sm"
                            title="Remove from seat"
                          >
                            {isAssigning ? <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> : <span className="material-symbols-outlined text-sm">person_remove</span>}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Partial occupancy — show compatible members */}
                  {seatMap[selectedSeat].length === 1 && seatMap[selectedSeat][0].shift !== 'Full Day' && (
                    <div className="pt-5 border-t border-slate-100">
                      <h4 className="text-[11px] font-v-label-md font-bold text-orange-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500" />
                        Available Slot: {seatMap[selectedSeat][0].shift === 'Morning' ? 'Evening' : 'Morning'}
                      </h4>
                      
                      {/* Search for partial slot */}
                      <div className="relative mb-3">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                        <input 
                          type="text" 
                          placeholder="Search compatible students..."
                          value={modalSearch}
                          onChange={(e) => setModalSearch(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-sm font-v-body-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all shadow-sm"
                        />
                      </div>

                      <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                        {(() => {
                          const compatible = unassignedMembers.filter(m => m.shift === (seatMap[selectedSeat][0].shift === 'Morning' ? 'Evening' : 'Morning'));
                          const filtered = compatible.filter(m => m.full_name.toLowerCase().includes(modalSearch.toLowerCase()) || m.permanent_id.toLowerCase().includes(modalSearch.toLowerCase()));
                          
                          if (compatible.length === 0) return <div className="text-xs text-slate-500 italic p-4 bg-slate-50 rounded-xl text-center border border-slate-100">No compatible members available for this slot.</div>;
                          if (filtered.length === 0) return <div className="text-xs text-slate-500 italic p-4 bg-slate-50 rounded-xl text-center border border-slate-100">No matches found for &quot;{modalSearch}&quot;.</div>;
                          
                          return filtered.map(m => (
                            <div key={m.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50 transition-all group">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">{m.full_name.charAt(0)}</div>
                                <div>
                                  <div className="text-slate-900 font-semibold text-xs font-v-body-md">{m.full_name}</div>
                                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">{m.permanent_id}</div>
                                </div>
                              </div>
                              <button disabled={isAssigning} onClick={() => { setModalSearch(""); handleAssignSeat(m.id); }} className="bg-white text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm disabled:opacity-50 hover:bg-blue-700 hover:text-white transition-all">Assign</button>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col">
                  <h3 className="text-[11px] font-v-label-md font-bold text-blue-700 uppercase tracking-widest mb-3">Assign a Member</h3>
                  
                  {unassignedMembers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-2xl border border-slate-100 my-auto">
                      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-3xl">task_alt</span>
                      </div>
                      <div className="text-sm font-bold text-slate-900 font-v-display">All Caught Up!</div>
                      <div className="text-xs text-slate-500 mt-1 text-center font-v-body-sm">Every active member has been assigned a seat.</div>
                    </div>
                  ) : (
                    <>
                      {/* Search Bar */}
                      <div className="relative mb-4">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">search</span>
                        <input 
                          type="text" 
                          placeholder="Search unassigned students by name or ID..."
                          value={modalSearch}
                          onChange={(e) => setModalSearch(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-v-body-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all shadow-sm"
                        />
                        {modalSearch && (
                          <button onClick={() => setModalSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        )}
                      </div>

                      {/* List */}
                      <div className="space-y-2 overflow-y-auto custom-scrollbar pr-1 flex-1 min-h-[250px]">
                        {(() => {
                          const filtered = unassignedMembers.filter(m => m.full_name.toLowerCase().includes(modalSearch.toLowerCase()) || m.permanent_id.toLowerCase().includes(modalSearch.toLowerCase()));
                          
                          if (filtered.length === 0) {
                            return (
                              <div className="flex flex-col items-center justify-center py-10 text-center">
                                <span className="material-symbols-outlined text-3xl text-slate-300 mb-2">search_off</span>
                                <div className="text-sm font-bold text-slate-600">No matches found</div>
                                <div className="text-xs text-slate-400 font-v-body-sm mt-1">Try a different name or ID.</div>
                              </div>
                            );
                          }

                          return filtered.map(m => (
                            <div key={m.id} className="flex justify-between items-center bg-white p-3.5 rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50 transition-all group shadow-sm hover:shadow">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm border border-slate-200 shadow-inner group-hover:bg-blue-700 group-hover:text-white transition-colors">
                                  {m.full_name.charAt(0)}
                                </div>
                                <div>
                                  <div className="text-slate-900 font-bold text-sm font-v-body-md group-hover:text-blue-700 transition-colors">{m.full_name}</div>
                                  <div className="text-[11px] text-slate-500 font-v-body-sm mt-0.5 flex items-center gap-1.5">
                                    <span className="font-mono text-slate-400">{m.permanent_id}</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                                    <span className="font-semibold text-red-600">{m.shift}</span>
                                  </div>
                                </div>
                              </div>
                              <button 
                                disabled={isAssigning}
                                onClick={() => { setModalSearch(""); handleAssignSeat(m.id); }}
                                className="bg-white text-blue-700 px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-50 border border-blue-200 hover:bg-blue-700 hover:text-white hover:shadow-md transition-all flex items-center gap-1"
                              >
                                Assign <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                              </button>
                            </div>
                          ));
                        })()}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
