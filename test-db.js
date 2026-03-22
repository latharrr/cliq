require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  const { data: user } = await supabase.from('users').select('id').limit(1).single();
  if (!user) return console.log('No user to test with');
  
  const { error } = await supabase.from('messages').insert({
    id: crypto.randomUUID(),
    senderId: user.id,
    receiverId: user.id,
    content: 'test',
    isRead: false,
  });
  console.log("Result error:", JSON.stringify(error, null, 2));
}
test();
