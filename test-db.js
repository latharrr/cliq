const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const supabase = createClient(
  'https://atcfcwtfyjrcvuzpgria.supabase.co',
  'sb_publishable_HZvgAPjGUj_w2M5lhfqOXg_YLnKaGW4'
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
