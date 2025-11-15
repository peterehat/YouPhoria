/**
 * Check all conversations and their owners
 */

const { createClient } = require('./backend/node_modules/@supabase/supabase-js');
require('./backend/node_modules/dotenv').config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAllConversations() {
  console.log('🔍 Checking ALL conversations and their owners\n');
  console.log('='.repeat(80));
  
  // Get all conversations
  const { data: conversations, error } = await supabase
    .from('chat_conversations')
    .select(`
      id,
      user_id,
      title,
      created_at,
      updated_at
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching conversations:', error);
    return;
  }

  // Get user emails
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  
  if (userError) {
    console.error('❌ Error fetching users:', userError);
    return;
  }

  const userMap = {};
  if (users && users.users) {
    for (const user of users.users) {
      userMap[user.id] = user.email;
    }
  }

  console.log(`\n📊 Total conversations: ${conversations.length}\n`);
  console.log('Listing ALL conversations with owners:\n');

  // Show all conversations
  conversations.forEach((conv, idx) => {
    const userEmail = userMap[conv.user_id] || 'Unknown';
    const date = new Date(conv.created_at).toLocaleString();
    
    console.log(`${idx + 1}. "${conv.title}"`);
    console.log(`   Owner: ${userEmail}`);
    console.log(`   Created: ${date}`);
    console.log(`   Conversation ID: ${conv.id}`);
    console.log('');
  });

  console.log('='.repeat(80));
  
  // Summary by user
  const byUser = {};
  conversations.forEach(conv => {
    const email = userMap[conv.user_id] || 'Unknown';
    if (!byUser[email]) {
      byUser[email] = [];
    }
    byUser[email].push(conv.title);
  });

  console.log('\n📊 Summary by User:\n');
  Object.keys(byUser).forEach(email => {
    console.log(`${email}: ${byUser[email].length} conversations`);
  });

  console.log('\n✅ Check complete!\n');
}

checkAllConversations().catch(console.error);

