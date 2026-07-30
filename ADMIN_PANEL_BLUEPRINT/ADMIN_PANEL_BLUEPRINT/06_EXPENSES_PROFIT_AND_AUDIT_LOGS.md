# ⚙️ 06. Expenses, Net Profit & Activity Audit Logs

This document covers library expense tracking, net profit calculation, and administrative activity auditing.

---

## 1. Expenses Ledger (`/dashboard/expenses`)

- Categories: `Rent`, `Electricity`, `Salary`, `Maintenance`, `WiFi`, `Other`.
- Expense Form: Title, Category, Amount, Payment Mode, Expense Date, Notes, Receipt Image attachment.
- Net Profit Formula:
  `Net Profit = Total Received Revenue (Filtered Month) - Total Expenses (Filtered Month)`

---

## 2. Activity Audit Log (`/dashboard/activities`)

- Real-time audit trail of all staff/admin actions.
- Action Types: `student_admission`, `payment_recorded`, `subscription_renewed`, `student_left`, `loss_settled`, `seat_reassigned`, `student_deleted`, `expense_added`.
- Log Entry: Branch, Action Type, Details text, Performed By, Timestamp.

---

## 3. System Settings & Database Utilities (`/dashboard/settings` & `/dashboard/erase-database`)

- Branch Capacity Config (Update Total Seat Count).
- Default Shift Pricing Config.
- WhatsApp API Template Customizer.
- Database Erase Tool with Password Confirmation.
