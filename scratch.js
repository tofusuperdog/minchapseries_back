require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const names = ['banner', 'banners', 'display', 'displays', 'app_config', 'settings', 'main_banner'];
  for (const name of names) {
    const { data, error } = await supabase.from(name).select('*').limit(1);
    if (!error) console.log('Found table:', name);
  }
}
run();
