# 🗄️ 01. Database Schema & Supabase SQL Script

Copy and run this entire SQL script in your Supabase project's **SQL Editor** to create all database tables required for the library admin section.

```sql
-- 1. Branches Table
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    total_capacity INT NOT NULL DEFAULT 150,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Members Master Table (Students)
CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    permanent_id VARCHAR(50) UNIQUE NOT NULL,
    student_no VARCHAR(50),
    full_name VARCHAR(150) NOT NULL,
    father_name VARCHAR(150),
    mobile VARCHAR(20) NOT NULL,
    dob DATE,
    gender VARCHAR(20),
    address TEXT,
    aadhar_no VARCHAR(20),
    targeting_exam VARCHAR(100),
    branch VARCHAR(50) NOT NULL DEFAULT 'main_branch',
    
    -- Seating & Shift
    shift VARCHAR(50) NOT NULL DEFAULT 'Full Day',
    seat_no VARCHAR(20),
    previous_seat_no VARCHAR(20),
    
    -- Status & Lifecycle
    is_active BOOLEAN NOT NULL DEFAULT true,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    payment_status VARCHAR(50) NOT NULL DEFAULT 'PAID',
    joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
    subscription_end_date DATE NOT NULL,
    
    -- Financials & Dues
    plan_amount NUMERIC(10, 2) NOT NULL DEFAULT 1000.00,
    outstanding_dues NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    due_date DATE,
    
    -- Left / Defaulter Management
    left_at TIMESTAMP WITH TIME ZONE,
    left_reason TEXT,
    left_with_dues BOOLEAN NOT NULL DEFAULT false,
    loss_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Payments Ledger Table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    invoice_id UUID,
    amount NUMERIC(10, 2) NOT NULL,
    branch VARCHAR(50) NOT NULL DEFAULT 'main_branch',
    payment_mode VARCHAR(50) NOT NULL DEFAULT 'Cash',
    paid_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Expenses Ledger Table
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch VARCHAR(50) NOT NULL DEFAULT 'main_branch',
    title VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    payment_mode VARCHAR(50) DEFAULT 'Cash',
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    receipt_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Activity Audit Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch VARCHAR(50) NOT NULL DEFAULT 'main_branch',
    action_type VARCHAR(100) NOT NULL,
    details TEXT NOT NULL,
    performed_by VARCHAR(100) DEFAULT 'Admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed default branch
INSERT INTO branches (code, name, total_capacity) 
VALUES ('main_branch', 'Main Branch Library', 150)
ON CONFLICT (code) DO NOTHING;
```
