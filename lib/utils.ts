import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from "@/lib/supabase"
import { logActivity } from "@/lib/activity"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateInput: any): string {
  if (!dateInput) return '—';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '—';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function ensureDDMMYYYY(str: string | null): string {
  if (!str) return '—';
  const cleaned = str.trim();
  const parts = cleaned.split(/[\-\/]/);
  if (parts.length === 3) {
    const p0 = parts[0];
    const p1 = parts[1];
    const p2 = parts[2];
    
    // Case 1: YYYY-MM-DD
    if (p0.length === 4) {
      const year = p0;
      const month = p1.padStart(2, '0');
      const day = p2.padStart(2, '0');
      return `${day}/${month}/${year}`;
    }
    
    // Case 2: Year at the end
    if (p2.length === 4) {
      const v0 = parseInt(p0, 10);
      const v1 = parseInt(p1, 10);
      
      if (!isNaN(v0) && !isNaN(v1)) {
        // If first part is > 12, it must be the day (e.g. 15/07/2026)
        if (v0 > 12) {
          return `${p0.padStart(2, '0')}/${p1.padStart(2, '0')}/${p2}`;
        }
        
        // If second part is > 12, it must be the day (e.g. 6/22/2026)
        if (v1 > 12) {
          return `${p1.padStart(2, '0')}/${p0.padStart(2, '0')}/${p2}`;
        }
        
        // Ambiguous <= 12: if either lacks zero-padding (e.g., 5/6/2026), it's old code MM/DD/YYYY, swap it
        if (p0.length === 1 || p1.length === 1) {
          return `${p1.padStart(2, '0')}/${p0.padStart(2, '0')}/${p2}`;
        }
      }
      
      return `${p0.padStart(2, '0')}/${p1.padStart(2, '0')}/${p2}`;
    }
  }
  return str;
}

export function formatDatesInText(text: string): string {
  if (!text) return '';
  return text.replace(/\b\d{1,4}[-\/]\d{1,2}[-\/]\d{1,4}\b/g, (match) => {
    return ensureDDMMYYYY(match);
  });
}

/**
 * Calculates subscription expiry date maintaining the same day of the month.
 * Examples:
 * - 15/09/2026 + 1 month => 15/10/2026
 * - 31/08/2026 + 1 month => 30/09/2026 (Sept has 30 days)
 * - 31/01/2026 + 1 month => 28/02/2026 (or 29/02 in leap year)
 * - 30/01/2026 + 1 month => 28/02/2026 (or 29/02 in leap year)
 * - 15/01/2026 + 3 months => 15/04/2026
 */
export function calculateSubscriptionExpiryDate(startDateInput: string | Date, months: number): Date {
  if (!startDateInput) return new Date();
  
  let startYear: number;
  let startMonth: number; // 0-indexed
  let startDay: number;

  if (typeof startDateInput === 'string') {
    const parts = startDateInput.split('T')[0].split(/[\-\/]/);
    if (parts.length === 3 && parts[0].length === 4) {
      startYear = parseInt(parts[0], 10);
      startMonth = parseInt(parts[1], 10) - 1;
      startDay = parseInt(parts[2], 10);
    } else {
      const d = new Date(startDateInput);
      if (isNaN(d.getTime())) return new Date();
      startYear = d.getFullYear();
      startMonth = d.getMonth();
      startDay = d.getDate();
    }
  } else {
    if (isNaN(startDateInput.getTime())) return new Date();
    startYear = startDateInput.getFullYear();
    startMonth = startDateInput.getMonth();
    startDay = startDateInput.getDate();
  }

  // Target Year and Month
  const targetTotalMonths = startMonth + months;
  const targetYear = startYear + Math.floor(targetTotalMonths / 12);
  const targetMonth = ((targetTotalMonths % 12) + 12) % 12;

  // Total days in the target month (day 0 of targetMonth + 1 gives last day of targetMonth)
  const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

  // Target day is same day or capped at the last day of the target month
  const targetDay = Math.min(startDay, daysInTargetMonth);

  return new Date(targetYear, targetMonth, targetDay);
}


export function getMemberStatus(member: any) {
  const today = new Date();
  const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const in3Days = new Date(todayZero.getTime() + 3 * 24 * 60 * 60 * 1000);

  // 1. Left
  if (member.status === 'LEFT' || member.left_at) {
    return {
      type: 'left',
      label: 'Left',
      badgeClass: 'bg-red-500/10 border border-red-500/20 text-red-400 font-bold flex items-center gap-1 text-[11px]'
    };
  }

  const isExpired = member.subscription_end_date && new Date(member.subscription_end_date) < todayZero;
  const isDuesOverdue = member.outstanding_dues > 0 && member.payment_due_date && new Date(member.payment_due_date) < todayZero;

  // 2. Overdue
  if (isExpired || isDuesOverdue) {
    return {
      type: 'overdue',
      label: 'Overdue',
      badgeClass: 'badge badge-danger animate-pulse flex items-center gap-1 font-bold text-[11px]'
    };
  }

  // 3. Pending
  const isNewSetupPending = !member.subscription_end_date;
  const isDuesPending = (member.outstanding_dues > 0 || member.pay_later === true) && (!member.payment_due_date || new Date(member.payment_due_date) >= todayZero);
  if (isNewSetupPending || isDuesPending) {
    return {
      type: 'pending',
      label: isNewSetupPending ? 'Pending Setup' : (member.outstanding_dues > 0 && !member.pay_later ? 'Active (Partial Dues)' : 'Active (Pending)'),
      badgeClass: 'bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center gap-1 font-bold text-[11px]'
    };
  }

  // 4. Inactive
  if (!member.is_active) {
    return {
      type: 'inactive',
      label: 'Inactive',
      badgeClass: 'bg-slate-500/10 border border-slate-500/20 text-slate-400 font-bold flex items-center gap-1 text-[11px]'
    };
  }

  // 5. Active (Unreserved)
  const isUnreserved = !!(member.permanent_id && member.permanent_id.includes('U'));
  if (isUnreserved) {
    return {
      type: 'unreserved',
      label: 'Active (Unreserved)',
      badgeClass: 'bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold flex items-center gap-1 text-[11px]'
    };
  }

  // 6. Active (Unassigned)
  if (!member.seat_no) {
    return {
      type: 'unassigned',
      label: 'Active (Unassigned)',
      badgeClass: 'bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center gap-1 font-bold text-[11px]'
    };
  }

  // 7. Due Soon
  if (member.subscription_end_date) {
    const end = new Date(member.subscription_end_date);
    if (end >= todayZero && end <= in3Days) {
      return {
        type: 'due-soon',
        label: 'Due Soon',
        badgeClass: 'bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center gap-1 font-bold text-[11px]'
      };
    }
  }

  // 8. Active (Paid)
  return {
    type: 'active-paid',
    label: 'Active (Paid)',
    badgeClass: 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-1 font-bold text-[11px]'
  };
}

export async function checkAndReleaseSeats(members: any[], activeBranch: string) {
  const today = new Date();
  const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const fifteenDaysAgo = new Date(todayZero.getTime() - 15 * 24 * 60 * 60 * 1000);

  const updatedMembers = [...members];
  let changed = false;

  for (let i = 0; i < updatedMembers.length; i++) {
    const m = updatedMembers[i];
    if (m.status === 'LEFT' || m.left_at) continue;

    if (m.seat_no) {
      const isSubExpired = m.subscription_end_date && new Date(m.subscription_end_date) < fifteenDaysAgo;
      const isDuesOverdue = m.outstanding_dues > 0 && m.payment_due_date && new Date(m.payment_due_date) < fifteenDaysAgo;
      const isRecentlyUpdated = m.updated_at && (new Date().getTime() - new Date(m.updated_at).getTime()) < 15 * 24 * 60 * 60 * 1000;

      if ((isSubExpired || isDuesOverdue) && !isRecentlyUpdated) {
        const oldSeat = m.seat_no;
        // Update local object immediately
        updatedMembers[i] = {
          ...m,
          previous_seat_no: oldSeat,
          seat_no: null
        };
        changed = true;

        // Update database in background
        supabase.from('members')
          .update({ previous_seat_no: oldSeat, seat_no: null })
          .eq('id', m.id)
          .then(() => {
            const reason = isSubExpired ? 'subscription expired >15 days' : 'dues outstanding >15 days';
            logActivity(activeBranch, "seating", `Auto-released Seat #${oldSeat} for ${m.full_name} (${m.permanent_id}) due to ${reason}.`);
          });
      }
    }
  }
  return { updatedMembers, changed };
}