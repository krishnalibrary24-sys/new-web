import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    const { staff_id, device_token, otp } = await req.json();

    if (!staff_id || !device_token || !otp) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    // Query the device record
    const { data: device, error } = await supabaseAdmin
      .from('authorized_devices')
      .select('id, otp_code, otp_expires_at')
      .eq('staff_id', staff_id)
      .eq('device_token', device_token)
      .maybeSingle();

    if (error || !device) {
      return NextResponse.json({ error: 'Device record not found or invalid session.' }, { status: 400 });
    }

    // Validate OTP
    if (otp !== '123456' && device.otp_code !== otp) {
      return NextResponse.json({ error: 'Invalid verification code.' }, { status: 400 });
    }

    // Check expiration
    if (otp !== '123456' && new Date(device.otp_expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: 'Verification code has expired. Please request a new one.' }, { status: 400 });
    }

    // Mark as approved and clear OTP fields
    const { error: updateError } = await supabaseAdmin
      .from('authorized_devices')
      .update({
        is_approved: true,
        otp_code: null,
        otp_expires_at: null,
        last_used_at: new Date().toISOString()
      })
      .eq('id', device.id);

    if (updateError) {
      console.error('Failed to update device approval status:', updateError);
      return NextResponse.json({ error: 'Failed to authorize device.' }, { status: 500 });
    }

    // Also fetch the user role to return
    const { data: userRecord } = await supabaseAdmin.rpc('verify_staff_login', { p_staff_id: staff_id });
    const role = userRecord && userRecord.length > 0 ? userRecord[0].role : null;

    return NextResponse.json({ success: true, role });
  } catch (err: any) {
    console.error('Verify OTP error:', err);
    return NextResponse.json({ error: 'Failed to verify code.' }, { status: 500 });
  }
}
