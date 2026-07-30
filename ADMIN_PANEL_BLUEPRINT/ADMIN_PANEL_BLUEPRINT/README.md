# 🏛️ Complete Admin Panel Integration Guide for New Library Website

This folder (`ADMIN_PANEL_BLUEPRINT/`) contains the complete specification, SQL database scripts, core business logic, formulas, and an AI Master Prompt to build and integrate the exact **Library Admin & Management Section** into another library website.

---

## 📁 Folder Structure

```
ADMIN_PANEL_BLUEPRINT/
├── README.md                              <- (This file) Overview & Instructions
├── MASTER_AI_PROMPT.md                    <- Copy-paste prompt for ChatGPT / Claude / Gemini
├── 01_DATABASE_SCHEMA_AND_SQL.md          <- Complete PostgreSQL / Supabase DDL Script
├── 02_ADMIN_METRICS_AND_REVENUE.md        <- Revenue, Occupancy, Today's Activity Algorithms
├── 03_STUDENT_MANAGEMENT_AND_ADMISSION.md <- Student directory, status engine, Admission form
├── 04_PAYMENTS_DUES_AND_LOSS_SETTLEMENT.md<- Payment manager, dues recovery, Settle Loss Fee
├── 05_VISUAL_SEAT_MAP_AND_GRACE_PERIOD.md <- Visual seat grid, shift rules, 15-day seat release
└── 06_EXPENSES_PROFIT_AND_AUDIT_LOGS.md   <- Expense ledger, Net Profit, Activity Audit Trail
```

---

## 🚀 How to Use This Blueprint for a New Website

### Step 1: Set Up Database Tables
1. Open your Supabase / PostgreSQL dashboard for the new library website.
2. Go to **SQL Editor**.
3. Open `01_DATABASE_SCHEMA_AND_SQL.md` from this folder.
4. Copy the complete SQL script and click **Run**. This will create all 5 required tables (`branches`, `members`, `payments`, `expenses`, `activity_logs`).

### Step 2: Use the Master AI Prompt
1. Open `MASTER_AI_PROMPT.md`.
2. Copy the entire prompt.
3. Paste it into your AI Coding Assistant (ChatGPT, Claude, or Gemini) when working in the new website's repository.
4. The AI will generate all Next.js pages (`/dashboard`, `/dashboard/members`, `/dashboard/admission`, etc.) matching this exact specification.

### Step 3: Refer to Individual Feature Docs for Detail
If you or your developer want to understand specific feature logic:
- For Revenue & Occupancy math -> See `02_ADMIN_METRICS_AND_REVENUE.md`
- For Admission & Student statuses -> See `03_STUDENT_MANAGEMENT_AND_ADMISSION.md`
- For Loss Payment settlement -> See `04_PAYMENTS_DUES_AND_LOSS_SETTLEMENT.md`
- For Seat map & 15-day grace period -> See `05_VISUAL_SEAT_MAP_AND_GRACE_PERIOD.md`
