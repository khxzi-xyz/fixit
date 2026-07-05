const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.storage.createBucket('avatars', { public: true });
  if (error) {
    if (error.message.includes('already exists')) {
      console.log('Bucket already exists');
    } else {
      console.error('Error creating bucket:', error);
    }
  } else {
    console.log('Bucket created:', data);
  }
}
run();
