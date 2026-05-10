const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabase() {
  console.log("Checking members table...");
  const { data: members, error: selError } = await supabase.from('members').select('*');
  console.log("Members Select Error:", selError);
  console.log("Total members found:", members?.length);
  if (members) {
    console.log("Last 2 members:", members.slice(-2));
  }

  console.log("\nAttempting a test insert...");
  const payload = {
    permanent_id: '#TEST999',
    full_name: 'Test Insert',
    mobile: '9999999999',
    branch: 'bengali-chowk',
    shift: 'Full Day',
    plan_amount: 1000,
    is_active: true,
    subscription_end_date: new Date().toISOString(),
  };
  
  const { data: insertData, error: insError } = await supabase.from('members').insert([payload]).select();
  console.log("Insert Error:", insError);
  console.log("Insert Data:", insertData);
  
  if (!insError) {
    // cleanup
    await supabase.from('members').delete().eq('permanent_id', '#TEST999');
  }
}

testSupabase();
