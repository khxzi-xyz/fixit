const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://fuavdydvadklatjnimal.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1YXZkeWR2YWRrbGF0am5pbWFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjIxNTg3MiwiZXhwIjoyMDk3NzkxODcyfQ.WxAjdxqkwRFj1yF10Y3kJ9UQit2XkLpQn65qX2lK5qY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  const { data: listData } = await supabase.auth.admin.listUsers();
  for (const u of listData.users) {
    if (u.email === 'vendor@fixit.com' || u.email === 'admin@fixit.com' || u.email === 'admin@foodxpress.app' || u.email === 'owner@foodxpress.app') {
      console.log(`Setting password Password123! for ${u.email}...`);
      await supabase.auth.admin.updateUserById(u.id, {
        password: 'Password123!',
        email_confirm: true
      });
      console.log(`Updated ${u.email}`);
    }
  }
}

run().catch(console.error);
