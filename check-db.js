const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data } = await supabase.from('members').select('*').order('created_at', { ascending: false }).limit(5);
  console.log("Latest members in DB:");
  console.log(data);
}
check();
