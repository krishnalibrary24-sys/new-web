# 🪑 05. Visual Seat Map & 15-Day Overdue Grace Period

This document specifies seat map visual grid rules, shift conflict prevention, and 15-day auto-seat release.

---

## 1. Visual Seat Grid (`/dashboard/seating`)

- Sequential seat tiles (Seats 1 to `Total Capacity`).
- Status Color Coding:
  - 🟩 Available (Green)
  - 🟦 Occupied Full Day (Blue)
  - 🟨 Occupied Morning / Evening / Night Shift (Yellow / Orange / Purple)
  - 🟧 Overdue Grace Period (Amber)
  - ⬛ Maintenance / Blocked (Gray)
- Clicking a seat tile opens drawer with student photo, name, phone, shift, expiry date, and quick actions (Reassign, Renew, View Profile).

---

## 2. Shift Conflict Validation Rules

- A seat can only be shared by 2 different students if their shifts DO NOT overlap (e.g. Morning Shift & Evening Shift).
- A Full Day student requires EXCLUSIVE reservation (no other student can be assigned to that seat).
- System queries active members on the branch before assignment:
  ```sql
  SELECT id FROM members 
  WHERE branch = 'main_branch' 
    AND seat_no = 'SEAT_12' 
    AND is_active = true 
    AND (shift = 'Full Day' OR shift = NEW_STUDENT_SHIFT);
  ```
  If match exists, blocks assignment and alerts user.

---

## 3. Overdue 15-Day Seat Release System

- Seats are NOT removed immediately on subscription expiry date. Students receive a **15-day grace period**.
- Auto-Release Engine (`checkAndReleaseSeats`):
  - If `CURRENT_DATE - subscription_end_date > 15` AND student has not renewed:
    - `previous_seat_no = seat_no`
    - `seat_no = null` (Releases seat back to available pool)
    - `status = 'UNRESERVED'`
