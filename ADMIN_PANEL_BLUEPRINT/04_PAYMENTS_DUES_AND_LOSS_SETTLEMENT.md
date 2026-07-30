# 💳 04. Payments, Dues Recovery & Loss Payment Settlement

This document specifies payment recording, dues recovery, and the **Loss Payment Settlement (Pesa Add Back)** engine.

---

## 1. Record Payment & Renewals (`/dashboard/record-payment`)

- Select member via searchable dropdown.
- Purpose: Subscription Renewal or Dues Recovery.
- Input: Amount Received, Payment Mode (Cash, Online, UPI, Card), Payment Date, Remarks.
- Action:
  1. Inserts payment into `payments` table.
  2. Extends `subscription_end_date` OR reduces `outstanding_dues`.
  3. Generates audit log in `activity_logs`.
  4. Generates instant WhatsApp invoice link.

---

## 2. Loss Payment & Defaulters System (`/dashboard/loss-payment`)

### 2.1 Marking Member as Left with Dues
- Staff selects **Mark Left** on Member Profile.
- Checks **"Left with Unpaid Dues (Loss)"** and enters `loss_amount` (e.g. ₹500).
- System updates member: `is_active = false`, `seat_no = null` (Releases seat), `status = 'LEFT'`, `left_with_dues = true`, `loss_amount = 500`.

### 2.2 Settle / Clear Loss Fee (Pesa Add Back)
- If a left student comes back later and clears their loss fee:
- Staff clicks **"Settle Loss"** on `/dashboard/loss-payment` or Member Profile.
- Form inputs: Amount Received, Payment Mode, Date, Notes, and **Reactivate Student Membership** checkbox.
- **System Execution**:
  1. Inserts record into `payments` table. *(Automatically updates Received Revenue, Cash/Online Revenue, Total Revenue, Today's Activity, and Member Payment History!)*
  2. Calculates `remaining_loss = Math.max(0, loss_amount - amount_paid)`.
  3. Updates `members` table: `loss_amount = remaining_loss`, `left_with_dues = (remaining_loss > 0)`.
  4. If Reactivate checked: Sets `is_active = true`, `status = 'ACTIVE'`, `left_at = null`.
  5. Loss Payments Ledger total loss counter decreases automatically by paid amount.
