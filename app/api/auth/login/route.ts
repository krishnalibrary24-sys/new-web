import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    const { staff_id, password } = await req.json();

    if (!staff_id || !password) {
      return NextResponse.json({ error: 'Staff ID and password are required.' }, { status: 400 });
    }

    // Query using the secure database RPC function to bypass direct table restrictions securely
    const { data, error } = await supabaseAdmin
      .rpc('verify_staff_login', { p_staff_id: staff_id });

    // Since RPC returns a list of matching records, check if we got exactly one
    const userRecord = data && data.length > 0 ? data[0] : null;

    if (error || !userRecord) {
      console.error('Auth RPC error:', error);
      return NextResponse.json({ error: 'Invalid Staff ID or Password.' }, { status: 401 });
    }

    // Compare password with stored hash
    const isMatch = await bcrypt.compare(password, userRecord.password_hash);

    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid Staff ID or Password.' }, { status: 401 });
    }

    return NextResponse.json({ 
      success: true, 
      role: userRecord.role,
      staff_id: userRecord.staff_id
    });

  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Authentication failed.' }, { status: 500 });
  }
}
