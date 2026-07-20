import { supabase } from "@/lib/supabase";

export const defaultTemplates = {
  welcome_msg: `🌟 *Welcome to Krishna Library!* 🌟\n\nDear *{name}*,\n\nA warm welcome to Krishna Library! We are thrilled to have you join our learning community. Your admission has been successfully processed, and your membership is now active. 🎉\n\n🪑 *Shift & Seat Details:*\n📍 *Branch:* {branch}\n🪑 *Seat Number:* {seat}\n🕒 *Shift:* {shift}\n📅 *Membership Valid Till:* {expiry}\n\n💳 *Payment Details:*\n💰 *Total Billed:* ₹{total_amount}\n💵 *Amount Paid:* ₹{paid_amount}\n⚠️ *Outstanding Dues:* ₹{due_amount}\n{due_date_line}\n📈 *Payment Status:* {status}\n\n📄 *Download your Receipt/Invoice here:*\n{invoice_link}\n\nWe are committed to providing you with a quiet, comfortable, and highly productive study environment to help you achieve your goals. If you need any assistance, please feel free to reach out to our support desk.\n\n📖 *"Success is the sum of small efforts, repeated day in and day out."* 💪\n\nBest regards,\n*Krishna Library Management* 🚀`,
  renew_msg: `💳 *Subscription Renewed — Krishna Library* 💳\n\nDear *{name}*,\n\nYour membership subscription at Krishna Library has been successfully renewed! Thank you for your continued association with us.\n\n🪑 *Shift & Seat Details:*\n📍 *Branch:* {branch}\n🪑 *Seat Number:* {seat}\n🕒 *Shift:* {shift}\n📅 *Extended Validity:* Active till {expiry}\n\n💳 *Payment Details:*\n💰 *Total Billed:* ₹{total_amount}\n💵 *Amount Paid:* ₹{paid_amount}\n⚠️ *Outstanding Dues:* ₹{due_amount}\n{due_date_line}\n📈 *Payment Status:* {status}\n\n📄 *Download your Receipt/Invoice here:*\n{invoice_link}\n\nWe wish you the very best in your study sessions and academic goals! Keep up the great work! 📚\n\nBest regards,\n*Krishna Library Management* 🚀`,
  dues_receipt_msg: `🧾 *Dues Settlement Receipt — Krishna Library* 🧾\n\nDear *{name}*,\n\nThis is to confirm that we have successfully received and recorded your payment of *₹{paid_amount}* towards outstanding dues.\n\n🪑 *Membership Details:*\n📍 *Branch:* {branch}\n🪑 *Seat / Shift:* {seat} / {shift}\n📅 *Membership Valid Till:* {expiry}\n\n💳 *Updated Dues Balance:*\n💵 *Dues Paid Now:* ₹{paid_amount}\n⚠️ *Remaining Dues:* ₹{remaining_dues}\n📈 *Updated Invoice Status:* {status}\n\n📄 *Download your Updated Invoice here:*\n{invoice_link}\n\nThank you for keeping your account details up to date. We appreciate your cooperation.\n\nBest regards,\n*Krishna Library Management* 🚀`,
  seat_assigned_msg: `🪑 *Seat Allocation Update — Krishna Library* 🪑\n\nDear *{name}*,\n\nThis is to inform you that your seat assignment at Krishna Library has been successfully updated. 🎉\n\n🪑 *Shift & Seat Details:*\n📍 *Branch:* {branch}\n🪑 *New Seat Number:* Seat {seat}\n🕒 *Shift:* {shift}\n📅 *Membership Valid Till:* {expiry}\n{payment_section}\nWe hope this workspace helps you study comfortably and productively. If you have any questions, please let us know!\n\nBest regards,\n*Krishna Library Management* 🚀`,
  due_soon_msg: `⏰ *Membership Renewal Reminder — Krishna Library* ⏰\n\nDear *{name}*,\n\nThis is a gentle reminder that your membership (ID: {permanent_id}) at Krishna Library is expiring soon on *{expiry}*.\n\nTo ensure you retain your favorite seat and continue enjoying uninterrupted access to our facilities, we kindly request you to renew your subscription.\n\nIf you have already renewed, please ignore this message.\n\nBest Regards,\n*Krishna Library Management* — {branch}`,
  expired_msg: `⚠️ *Membership Expired — Krishna Library* ⚠️\n\nDear *{name}*,\n\nYour Krishna Library membership (ID: {permanent_id}) expired on *{expiry}*.\n\n*Important Note:* If your subscription is not renewed, your allocated seat will be automatically released soon to allow other waiting students to study.\n\nPlease visit the library front desk at the earliest to renew your subscription and secure your seat.\n\nBest Regards,\n*Krishna Library Management* — {branch}`,
  released_msg: `❌ *Seat Released Notification — Krishna Library* ❌\n\nDear *{name}*,\n\nThis is to inform you that your Krishna Library membership (ID: {permanent_id}) expired on *{expiry}*. \n\nSince your subscription has expired without renewal, your seat has been automatically released into the general pool.\n\nPlease visit the library at your earliest convenience to renew your subscription and secure a new seat.\n\nBest Regards,\n*Krishna Library Management* — {branch}`,
  pending_dues_msg: `⏳ *Pending Payment Reminder — Krishna Library* ⏳\n\nDear *{name}*,\n\nThis is a polite reminder regarding your pending payment for Krishna Library. As per your subscription plan, your due date was scheduled for *{due_date}*.\n\nWe kindly request you to clear your pending dues at the earliest to maintain your account in good standing.\n\nThank you for your cooperation and understanding.\n\nBest Regards,\n*Krishna Library Management* — {branch}`,
  overdue_dues_msg: `⚠️ *Overdue Payment Warning — Krishna Library* ⚠️\n\nDear *{name}*,\n\nThis is a firm reminder that your outstanding dues of *₹{due_amount}* (ID: {permanent_id}) are overdue. Your payment due date was *{due_date}*.\n\n*Important Note:* As per library policy, seats with overdue payments are subject to automatic release soon.\n\nPlease clear your outstanding dues at the front desk immediately to secure your seat and avoid interruption.\n\nBest Regards,\n*Krishna Library Management* — {branch}`,
  invoice_share_msg: `🧾 *Official Payment Invoice — {lib_name}* 🧾\n\nDear *{name}*,\n\nHere is your official payment invoice from {lib_name}.\n\n🧾 *Receipt No:* {receipt_no}\n📅 *Date:* {date}\n👤 *Student ID:* {permanent_id}\n🪑 *Seat / Shift:* {seat} / {shift}\n\n💰 *Invoice Breakdown:*\n▪️ *Subtotal:* ₹{subtotal}\n▪️ *Discount:* -₹{discount}\n▪️ *Total Billed:* ₹{total_amount}\n▪️ *Amount Paid:* ₹{paid_amount}\n▪️ *Dues Outstanding:* ₹{due_amount}\n▪️ *Payment Status:* {status}\n\n🔗 *View & Download Digital PDF Invoice:* \n{invoice_link}\n\nThank you for choosing {lib_name}! 📚✨`
};

export function formatWhatsAppNumber(mobile: string | undefined | null): string {
  if (!mobile) return '';
  let cleaned = mobile.replace(/[^0-9]/g, '');
  if (cleaned.length === 10) {
    return '91' + cleaned;
  }
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return '91' + cleaned.substring(1);
  }
  return cleaned;
}

export async function getTemplate(key: keyof typeof defaultTemplates): Promise<string> {
  try {
    const { data } = await supabase.from('library_settings').select('value').eq('id', key).maybeSingle();
    if (data && data.value) {
      return data.value;
    }
  } catch (e) {
    console.error("Error fetching template", e);
  }
  return defaultTemplates[key];
}

export function parseTemplate(template: string, vars: Record<string, string>): string {
  let parsed = template;
  console.log('[DEBUG] parseTemplate input vars:', Object.keys(vars));
  for (const [k, v] of Object.entries(vars)) {
    const before = parsed.includes(`{${k}}`);
    parsed = parsed.split(`{${k}}`).join(v ?? '');
    if (before) {
      console.log(`[DEBUG] Replaced {${k}} with "${v}"`);
    }
  }
  // Check for any remaining unreplaced placeholders
  const remaining = parsed.match(/\{[a-z_]+\}/g);
  if (remaining) {
    console.warn('[DEBUG] Unreplaced placeholders:', remaining);
  }
  return parsed;
}
