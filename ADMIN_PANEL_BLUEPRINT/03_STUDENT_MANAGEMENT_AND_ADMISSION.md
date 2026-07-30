# 👨‍🎓 03. Student Directory & New Admission Module

This document outlines student status calculations, directory controls, and registration workflows.

---

## 1. Student Status Calculation Engine (`getMemberStatus`)

Evaluates student state in real-time:

- **LEFT**: `status == 'LEFT'` OR `left_at IS NOT NULL`.
- **PENDING**: `outstanding_dues > 0` AND `is_active == true`.
- **OVERDUE**: `subscription_end_date < CURRENT_DATE` AND `is_active == true` (15-day grace period active).
- **DUE SOON**: `subscription_end_date` is within the next 3 days.
- **UNRESERVED / UNASSIGNED**: Active member with `seat_no IS NULL`.
- **ACTIVE (PAID)**: Active subscription, dues = 0, seat assigned.

---

## 2. Student Directory Controls (`/dashboard/members`)

- **Tabs**: All, Active, Pending, Overdue, Due Soon, Unreserved, Left.
- **View Switcher**: Grid Tile Cards vs Data Table List.
- **Instant Search**: Search by Name, Student Permanent ID (e.g. `KLB-101`), Phone, Shift, or Seat No.
- **Member Profile Modal**:
  - Full details, seating & shift info.
  - Complete Payment History ledger table.
  - Actions: Inline Renewal, Mark Left (Seat release), Settle Loss Fee, Edit Profile, Delete, PDF Print Card.

---

## 3. New Admission Form (`/dashboard/admission`)

1. **Student Information**: Name, Auto-generated Permanent ID (`KLB-101`), Father Name, Phone, DOB, Gender, Address, Aadhar, Target Exam.
2. **Shift & Seat Allocation**: Shift (`Full Day` ₹1000/mo, `Morning` ₹600/mo, `Afternoon`, `Evening`, `Night`). Seat selection from Seat Map or unassigned. Shift overlap validation.
3. **Billing Setup**: Base price, discount, joining date, plan duration (Months/Days), auto-calculated expiry date.
4. **Payment**: Paid vs Pay Later (with due date).
5. **Post-Registration**: WhatsApp Welcome/Invoice link generator & PDF Receipt Print.
