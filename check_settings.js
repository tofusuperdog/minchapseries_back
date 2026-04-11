const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  console.log("Checking app_settings table...");
  const { data, error } = await supabase.from('app_settings').select('*');
  console.log("Read error:", error);
  console.log("Read data:", data);
  
  if (!error) {
    console.log("Attempting to upsert...");
    const { data: upData, error: upErr } = await supabase.from('app_settings').upsert({ id: 1, is_episodes_active: true });
    console.log("Upsert error:", upErr);
    console.log("Upsert data:", upData);
  }
}
run();
