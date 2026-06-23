const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase
    .from('authorized_devices')
    .upsert({
      staff_id: 'test',
      device_token: 'test',
      device_name: 'test',
      is_approved: false
    }, { onConflict: 'device_token' });
  
  console.log("Error:", error);
}

test();
