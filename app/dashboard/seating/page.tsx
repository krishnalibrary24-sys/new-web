"use client";
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useBranch } from "@/components/branch-context";
import { supabase } from "@/lib/supabase";

export default function SeatingPage() {
  const { activeBranch } = useBranch();
  const seats = activeBranch === 'namnakala' ? 120 : 153;
  const branchName = activeBranch === 'namnakala' ? 'Namnakala' : 'Bengali Chowk';
  
  const [seatMap, setSeatMap] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [unassignedMembers, setUnassignedMembers] = useState<any[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  const occupiedCount = Object.keys(seatMap).length;
  const availableCount = seats - occupiedCount;

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
      setSeatMap(prev => {
        const current = prev[selectedSeat] || [];
        return { ...prev, [selectedSeat]: [...current, { ...member, seat_no: selectedSeat }] };
      });
      setUnassignedMembers(prev => prev.filter(m => m.id !== memberId));
    }
    setIsAssigning(false);
  };

  const handleUnassignSeat = async (memberId: string, seatNo: string) => {
    setIsAssigning(true);
    await supabase.from('members').update({ seat_no: null }).eq('id', memberId);
    
    setSeatMap(prev => {
      const current = prev[seatNo] || [];
      const updated = current.filter(m => m.id !== memberId);
      const member = current.find(m => m.id === memberId);
      if (member) {
        setUnassignedMembers(unass => [...unass, { ...member, seat_no: null }]);
      }
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
    if (occupants.length === 2) return { bg: 'bg-gradient-to-br from-amber-500/30 to-purple-500/30 border-amber-500/20', dot: 'bg-amber-400' };
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
          <p className="page-subtitle">{branchName} Branch · {seats} Total Seats</p>
        </div>
        <div className="flex gap-3">
          <div className="card-premium !p-3 text-center min-w-[90px]">
            <div className="text-lg font-black text-emerald-400">{occupiedCount}</div>
            <div className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Occupied</div>
          </div>
          <div className="card-premium !p-3 text-center min-w-[90px]">
            <div className="text-lg font-black text-red-400">{availableCount}</div>
            <div className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Available</div>
          </div>
          {unassignedMembers.length > 0 && (
            <div className="card-premium !p-3 text-center min-w-[90px] !border-tertiary/20">
              <div className="text-lg font-black text-tertiary">{unassignedMembers.length}</div>
              <div className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Unassigned</div>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs font-medium text-on-surface-variant bg-white/[0.02] border border-white/[0.06] p-3 px-4 rounded-xl">
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500/30 rounded border border-red-500/20" />Available</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500/30 rounded border border-emerald-500/20" />Full Day</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-amber-500/30 rounded border border-amber-500/20" />Morning</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-purple-500/30 rounded border border-purple-500/20" />Evening</div>
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
                className={`aspect-square ${style.bg} rounded-lg border flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 ${
                  isSelected ? 'ring-2 ring-primary ring-offset-1 ring-offset-surface scale-105' : ''
                }`}
                title={occupants.length > 0 ? `${seatId}: ${occupants.map(o => o.full_name).join(', ')}` : `Seat ${seatId} — Available`}
              >
                <span className="text-[10px] font-bold text-white/50">{seatId}</span>
                {style.dot && <span className={`w-1.5 h-1.5 rounded-full ${style.dot} mt-0.5`} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══ Seat Management Modal ═══ */}
      {selectedSeat && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] bg-surface-container-lowest/80 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setSelectedSeat(null)}>
          <div className="glass-pane-elevated rounded-2xl w-full max-w-md overflow-hidden animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-white/[0.06] flex justify-between items-center bg-white/[0.02]">
              <h2 className="text-base font-bold text-white font-manrope flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">event_seat</span>
                Seat #{selectedSeat}
              </h2>
              <button onClick={() => setSelectedSeat(null)} className="text-on-surface-variant hover:text-white p-1.5 rounded-lg hover:bg-white/[0.04] transition-all">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            
            <div className="p-5">
              {seatMap[selectedSeat] && seatMap[selectedSeat].length > 0 ? (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Current Occupants</h4>
                  {seatMap[selectedSeat].map(member => (
                    <div key={member.id} className="bg-white/[0.03] p-3.5 rounded-xl flex justify-between items-center border border-white/[0.06]">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm border border-primary/15">
                          {member.full_name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-white font-semibold text-sm">{member.full_name}</div>
                          <div className="text-xs text-on-surface-variant">{member.permanent_id} · <span className="text-primary font-medium">{member.shift}</span></div>
                        </div>
                      </div>
                      <button 
                        disabled={isAssigning}
                        onClick={() => handleUnassignSeat(member.id, selectedSeat)}
                        className="btn-danger !p-2 !rounded-lg disabled:opacity-50"
                        title="Remove from seat"
                      >
                        {isAssigning ? <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> : <span className="material-symbols-outlined text-sm">person_remove</span>}
                      </button>
                    </div>
                  ))}

                  {/* Partial occupancy — show compatible members */}
                  {seatMap[selectedSeat].length === 1 && seatMap[selectedSeat][0].shift !== 'Full Day' && (
                    <div className="mt-4 pt-4 border-t border-white/[0.06]">
                      <h4 className="text-xs font-bold text-tertiary mb-2 uppercase tracking-widest">
                        Available Slot: {seatMap[selectedSeat][0].shift === 'Morning' ? 'Evening' : 'Morning'}
                      </h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {unassignedMembers.filter(m => m.shift === (seatMap[selectedSeat][0].shift === 'Morning' ? 'Evening' : 'Morning')).length === 0 ? (
                          <div className="text-xs text-on-surface-variant italic p-3 bg-white/[0.02] rounded-lg text-center">No compatible members available.</div>
                        ) : (
                          unassignedMembers.filter(m => m.shift === (seatMap[selectedSeat][0].shift === 'Morning' ? 'Evening' : 'Morning')).map(m => (
                            <div key={m.id} className="flex justify-between items-center bg-white/[0.02] p-2.5 rounded-lg border border-white/[0.04] hover:bg-white/[0.04] transition-colors group">
                              <div>
                                <div className="text-white font-semibold text-xs">{m.full_name}</div>
                                <div className="text-[10px] text-on-surface-variant">{m.shift}</div>
                              </div>
                              <button disabled={isAssigning} onClick={() => handleAssignSeat(m.id)} className="bg-primary/15 text-primary px-2.5 py-1 rounded-lg text-xs font-semibold disabled:opacity-50 hover:bg-primary hover:text-on-primary transition-all border border-primary/20">Assign</button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <h3 className="text-xs font-bold text-on-surface-variant mb-3 uppercase tracking-widest">Assign a Member</h3>
                  {unassignedMembers.length === 0 ? (
                    <div className="empty-state !py-8">
                      <span className="material-symbols-outlined text-3xl text-on-surface-variant/30 mb-2">check_circle</span>
                      <div className="text-sm text-on-surface-variant">All members have seats assigned.</div>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {unassignedMembers.map(m => (
                        <div key={m.id} className="flex justify-between items-center bg-white/[0.02] p-3 rounded-xl border border-white/[0.04] hover:bg-white/[0.04] transition-colors group">
                          <div>
                            <div className="text-white font-semibold text-sm">{m.full_name}</div>
                            <div className="text-xs text-on-surface-variant">{m.permanent_id} · {m.shift}</div>
                          </div>
                          <button 
                            disabled={isAssigning}
                            onClick={() => handleAssignSeat(m.id)}
                            className="bg-primary/15 text-primary group-hover:bg-primary group-hover:text-on-primary transition-all px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50 border border-primary/20 group-hover:border-primary"
                          >
                            Assign
                          </button>
                        </div>
                      ))}
                    </div>
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
