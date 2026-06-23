import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const resend = new Resend('re_ZVRCWgTr_EEgm3pxE3jLjPJi3rk7YqZU1');

export async function POST(req: NextRequest) {
  try {
    const { staff_id, password, device_token, device_name } = await req.json();

    if (!staff_id || !password || !device_token) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    // Call custom Supabase RPC to fetch staff hash
    const { data, error } = await supabaseAdmin.rpc('verify_staff_login', { p_staff_id: staff_id });
    const userRecord = data && data.length > 0 ? data[0] : null;

    if (error || !userRecord) {
      console.error('Auth RPC error:', error);
      return NextResponse.json({ error: 'Invalid Staff ID or Password.' }, { status: 401 });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, userRecord.password_hash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid Staff ID or Password.' }, { status: 401 });
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 mins from now

    // Upsert device record using the unique device_token
    const { error: upsertError } = await supabaseAdmin
      .from('authorized_devices')
      .upsert({
        staff_id, // Update the staff_id to whoever is currently logging in
        device_token,
        device_name: device_name || 'Unknown Browser',
        is_approved: false,
        otp_code: otpCode,
        otp_expires_at: expiresAt,
        last_used_at: new Date().toISOString()
      }, { onConflict: 'device_token' });

    if (upsertError) {
      console.error('Upsert device error:', upsertError);
      // Let's not fail the request completely if they haven't set up the table properly yet
      // but we will return an error so the UI handles it gracefully
      return NextResponse.json({ error: 'Database configuration error. Please run the SQL setup.' }, { status: 500 });
    }

    // Send OTP via Resend
    const emailResult = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'krishnalibrary24@gmail.com',
      subject: 'Security Alert: Library Login OTP',
      html: `
        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
          <h2 style="color: #003178;">Library Staff Login Attempt</h2>
          <p>A login attempt was made for Staff ID: <strong>${staff_id}</strong>.</p>
          <p>Please use the following 6-digit verification code to confirm your identity. This code will expire in 5 minutes.</p>
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #1e293b;">${otpCode}</span>
          </div>
          <p style="font-size: 12px; color: #64748b;">If you did not initiate this login, please ignore this email.</p>
        </div>
      `
    });

    if (emailResult.error) {
      console.error('Resend error:', emailResult.error);
      return NextResponse.json({ error: 'Failed to send OTP email.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, role: userRecord.role });
  } catch (err: any) {
    console.error('Send OTP error:', err);
    return NextResponse.json({ error: 'Failed to process login.' }, { status: 500 });
  }
}
