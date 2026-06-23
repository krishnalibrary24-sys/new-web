import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from "@/lib/supabase"
import { logActivity } from "@/lib/activity"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
  const fiveDaysAgo = new Date(todayZero.getTime() - 5 * 24 * 60 * 60 * 1000);

  const updatedMembers = [...members];
  let changed = false;

  for (let i = 0; i < updatedMembers.length; i++) {
    const m = updatedMembers[i];
    if (m.status === 'LEFT' || m.left_at) continue;

    if (m.seat_no) {
      const isSubExpired = m.subscription_end_date && new Date(m.subscription_end_date) < fiveDaysAgo;
      const isDuesOverdue = m.outstanding_dues > 0 && m.payment_due_date && new Date(m.payment_due_date) < fiveDaysAgo;

      if (isSubExpired || isDuesOverdue) {
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
            const reason = isSubExpired ? 'subscription expired >5 days' : 'dues outstanding >5 days';
            logActivity(activeBranch, "seating", `Auto-released Seat #${oldSeat} for ${m.full_name} (${m.permanent_id}) due to ${reason}.`);
          });
      }
    }
  }
  return { updatedMembers, changed };
}