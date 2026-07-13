const { createClient } = require('@supabase/supabase-js');

// Read env variables
const supabaseUrl = 'https://feqlpgszuecggjwmokix.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlcWxwZ3N6dWVjZ2dqd21va2l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MjI4MzQsImV4cCI6MjA5MTM5ODgzNH0.6s-_NbwyQbK1asJ_BqxuujMs_EMHxdbxbtu6p2VLFWY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase
    .from('events')
    .select('id, name, images')
    .limit(5);

  if (error) {
    console.error('Error fetching events:', error);
  } else {
    console.log('Events images:', JSON.stringify(data, null, 2));
  }
}

test();
