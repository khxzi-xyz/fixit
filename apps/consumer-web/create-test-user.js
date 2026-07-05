import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://fuavdydvadklatjnimal.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1YXZkeWR2YWRrbGF0am5pbWFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjIxNTg3MiwiZXhwIjoyMDk3NzkxODcyfQ.WxAjdxqkwRFj1yF10Y3kJ9UQit2XkLpQn65qX2lK5qY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'test@fixit.com',
    password: 'password123',
    email_confirm: true,
    user_metadata: { role: 'CONSUMER', full_name: 'Test Consumer' }
  });

  if (error) {
    if (error.message.includes('already exists')) {
      console.log('User already exists, updating password...');
      const { data: users } = await supabase.auth.admin.listUsers();
      const user = users.users.find(u => u.email === 'test@fixit.com');
      if (user) {
        await supabase.auth.admin.updateUserById(user.id, { password: 'password123' });
        console.log('Password updated for test@fixit.com to password123');
      }
    } else {
      console.error('Error creating user:', error);
    }
  } else {
    console.log('User created:', data.user.email);
  }
}

main();
