# 🤖 Master AI Prompt for Mindspace Library Admin Integration

Copy the prompt below and paste it into ChatGPT, Claude, or Gemini to automatically generate and integrate the Admin Panel into your **Mindspace Library** website.

---

```text
You are an expert full-stack Web Developer specializing in Next.js (App Router), React, Tailwind CSS, and Supabase (PostgreSQL).

Your task is to build and integrate a complete, feature-rich Library Management Admin Dashboard specifically customized for "Mindspace Library".

### 🌟 1. System Requirements & Pages to Build
Build a fully functional `/dashboard` layout for Mindspace Library with side navigation, top branch selector, glassmorphism theme, and the following sub-routes:

1. `/dashboard` - Core Overview & Financial Metrics Dashboard
   - Header: "Mindspace Library - Management Dashboard"
   - Cards for Total Revenue, Received Revenue (Cash vs Online), Upcoming Dues, Defaulters Loss Amount, Active Members Count, Available Seats, and Occupancy %
   - Today's Activity Widget (Resets daily at 00:00): Today's Cash & Online Collections, Today's New Members, and Today's Payments Feed.
   - Billing Period Filter (Month-by-month dropdown e.g. July 2026).

2. `/dashboard/members` - Students Directory & Management
   - Filter Tabs: All, Active (Paid), Pending Dues, Overdue, Due Soon, Unreserved Seats, Left.
   - Search by Name, Student Permanent ID (Mindspace Library ID prefix e.g. MSL-101), Phone, Seat, or Shift.
   - View Switcher: Grid Tiles vs Compact Data Table.
   - Member Profile Drawer with Payment History, Inline Subscription Renewal (Monthly/Daily), Mark Left (Seat release with optional Loss conversion), Settle Loss Fee, Edit Profile, Delete, and PDF Export.

3. `/dashboard/admission` - New Admission Registration Form (Mindspace Library)
   - Student Personal Details (Name, Permanent ID auto-gen e.g. MSL-101, Father Name, Mobile, DOB, Gender, Address, Aadhar, Target Exam).
   - Shift Selector (Full Day ₹1000/mo, Morning ₹600/mo, Afternoon, Evening, Night) with Shift Overlap validation.
   - Interactive Seat Allocation (Select seat from Mindspace seat map or assign unreserved).
   - Plan Pricing, Discount, Joining Date, Duration (Months/Days), Expiry Date calculation.
   - Payment Status (Paid / Pay Later with Due Date).
   - Post-Registration: Instant Mindspace Library WhatsApp Welcome/Invoice link generator & PDF Receipt Print.

4. `/dashboard/record-payment` - Record Payment & Renewal Manager
   - Searchable Member Selector.
   - Purposes: Subscription Renewal vs Collect Dues.
   - Payment Mode (Cash, Online, UPI, Card), Payment Date, Remarks.
   - Instant WhatsApp Invoice Link & Complete Transaction Ledger table.

5. `/dashboard/seating` - Interactive Visual Seat Map
   - Grid layout of Mindspace Library seat tiles (e.g. Seats 1 to 150).
   - Color coded by status (Available Green, Full Day Blue, Shift Yellow/Purple, Overdue Amber, Maintenance Gray).
   - Seat Click Drawer: Shows occupied student details, shift, expiry date, and quick actions (Reassign, Renew, View Profile).
   - 15-day Overdue Grace Period: Seats are held for 15 days post-expiry before auto-releasing.

6. `/dashboard/loss-payment` - Defaulters Loss Payments Ledger
   - Tracks Mindspace Library members who left without paying (`left_with_dues = true`, `loss_amount > 0`).
   - Settle Loss Fee Action: Collect payment from left student in full or partial.
   - When Loss Payment is collected: Inserts into payments table (automatically updating Received Revenue, Cash/Online Revenue, Today's Activity, and Member Payment History), updates loss_amount, and optionally reactivates student.
   - Export PDF Defaulters Report.

7. `/dashboard/dues` - Dues & Overdue Tracker
   - List of pending dues and overdue subscriptions with WhatsApp due reminder buttons.

8. `/dashboard/invoices` - Invoices Ledger & Thermal Print Receipts
   - Mindspace Library Invoice list with status (PAID, PENDING, OVERDUE) and print generator (`/invoice?id=...`).

9. `/dashboard/expenses` - Library Expenses Ledger
   - Track Rent, Electricity, Salaries, WiFi, Maintenance.
   - Net Profit calculation (`Received Revenue - Total Expenses`).

10. `/dashboard/activities` - Audit Trail Log
    - Logs all admin actions (Admissions, Renewals, Seat Changes, Mark Left, Settle Loss, Deletions).

---

### 🗄️ 2. Database Schema (PostgreSQL / Supabase)

Create the following tables in Supabase:
- `branches` (id, code, name, total_capacity, address)
- `members` (id, permanent_id, student_no, full_name, father_name, mobile, dob, gender, address, aadhar_no, targeting_exam, branch, shift, seat_no, previous_seat_no, is_active, status, payment_status, joining_date, subscription_end_date, plan_amount, outstanding_dues, due_date, left_at, left_reason, left_with_dues, loss_amount, created_at, updated_at)
- `payments` (id, member_id, invoice_id, amount, branch, payment_mode, paid_at, notes, created_at)
- `expenses` (id, branch, title, category, amount, payment_mode, expense_date, receipt_url, notes, created_at)
- `activity_logs` (id, branch, action_type, details, performed_by, created_at)

Seed default branch:
```sql
INSERT INTO branches (code, name, total_capacity) 
VALUES ('mindspace_main', 'Mindspace Library Main Branch', 150)
ON CONFLICT (code) DO NOTHING;
```

---

### 🎨 3. UI Theme & Design Guidelines
- Modern Glassmorphism theme with Mindspace Library branding.
- Primary font: Manrope (Headings), Inter/Outfit (Body).
- Responsive layout with collapsible sidebar and mobile topbar.
- Strict data filtering by active branch (`.eq('branch', activeBranch)`).
```
