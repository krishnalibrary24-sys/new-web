# 📊 02. Dashboard Metrics & Revenue Algorithms

This document details all formulas, logic, and widget specs for `/dashboard`.

---

## 1. Top Cards Calculations

All metrics recalculate whenever the **Billing Period Filter** (e.g. July 2026) or **Active Branch** changes.

### 1.1 Received Revenue (Collected Cash & Online)
- **Formula**: `Received Revenue = Cash Revenue + Online Revenue`
- **Cash Revenue**: Sum of `payments.amount` where `payment_mode == 'Cash'` within the selected billing month.
- **Online Revenue**: Sum of `payments.amount` where `payment_mode IN ('Online', 'UPI', 'Card')` within the selected billing month.

### 1.2 Upcoming Dues / Expected Renewals
- **Formula**: Sum of `plan_amount` for active members whose `subscription_end_date` falls in the selected month and have not paid yet.

### 1.3 Total Revenue
- **Formula**: `Total Revenue = Received Revenue + Upcoming Dues`

### 1.4 Defaulter Loss Payments Metric
- **Formula**: Sum of `loss_amount` for all members where `left_with_dues == true` AND `loss_amount > 0`.

### 1.5 Active Members Count
- **Formula**: Members count where `is_active == true AND left_at IS NULL`.
- *Must be identical on both Admin & Office dashboards.*

### 1.6 Available Seats & Occupancy %
- **Total Capacity**: E.g. 150 seats.
- **Occupied Seats**: Size of unique set of `seat_no` for active members (`is_active == true AND seat_no IS NOT NULL`).
- **Available Seats**: `Math.max(0, Total Capacity - Occupied Seats)`.
- **Occupancy %**: `(Occupied Seats / Total Capacity) * 100`.

---

## 2. Today's Activity Widget (Daily Operations)

Resets at midnight (`00:00:00`). Filters entries created today:

1. **Today's Collections**: Cash Collected Today vs Online Collected Today.
2. **Today's New Members**: Count and list of student admissions registered today.
3. **Today's Payments**: Live scrollable feed of all payments collected today with Student Name, Amount (₹), Payment Mode badge, and Purpose.
