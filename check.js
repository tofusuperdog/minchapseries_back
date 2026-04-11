const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('information_schema.tables').select('table_name').eq('table_schema', 'public');
  // fallback if information schema is not accessible for anon:
  // usually anon cannot read information_schema, but we can try 
  // checking standard tables by just trying to select them.
  console.log(data || error);
}
run();
