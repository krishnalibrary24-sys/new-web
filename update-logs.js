const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Fetching members...');
  const { data: members, error: memErr } = await supabase.from('members').select('permanent_id, student_no');
  if (memErr) {
    console.error(memErr);
    return;
  }

  console.log(`Found ${members.length} members. Fetching activity logs...`);
  const { data: logs, error: logErr } = await supabase.from('activity_logs').select('id, details');
  if (logErr) {
    console.error(logErr);
    return;
  }

  console.log(`Found ${logs.length} activity logs.`);
  let updatedCount = 0;

  for (const log of logs) {
    let newDetails = log.details;
    let modified = false;

    // We look for patterns like (KLB5) or (KLN12)
    for (const member of members) {
      if (member.permanent_id && member.student_no) {
        // Only update if it doesn't already have the student_no format
        const targetString1 = `(${member.permanent_id})`;
        const targetString2 = `Student ${member.permanent_id} marked`;
        const replacement1 = `(${member.permanent_id} [#${member.student_no}])`;
        const replacement2 = `Student ${member.permanent_id} [#${member.student_no}] marked`;

        if (newDetails.includes(targetString1)) {
          newDetails = newDetails.replace(targetString1, replacement1);
          modified = true;
        } else if (newDetails.includes(targetString2)) {
          newDetails = newDetails.replace(targetString2, replacement2);
          modified = true;
        }
      }
    }

    if (modified) {
      const { error: updateErr } = await supabase.from('activity_logs').update({ details: newDetails }).eq('id', log.id);
      if (updateErr) {
        console.error(`Failed to update log ${log.id}:`, updateErr);
      } else {
        updatedCount++;
      }
    }
  }

  console.log(`Successfully updated ${updatedCount} old activity logs.`);
}

main();
