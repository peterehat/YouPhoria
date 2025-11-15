/**
 * Test script to check if conversations are properly isolated by user
 * This will query the database directly to see what's actually stored
 */

const { createClient } = require('./backend/node_modules/@supabase/supabase-js');
require('./backend/node_modules/dotenv').config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in backend/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testUserIsolation() {
  console.log('🔍 Testing User Isolation for Conversations\n');
  console.log('='.repeat(80));
  
  // Get all conversations with user info
  const { data: allConversations, error } = await supabase
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

  console.log(`\n📊 Total conversations in database: ${allConversations.length}\n`);

  // Group by user_id
  const conversationsByUser = {};
  for (const conv of allConversations) {
    if (!conversationsByUser[conv.user_id]) {
      conversationsByUser[conv.user_id] = [];
    }
    conversationsByUser[conv.user_id].push(conv);
  }

  // Get user emails for each user_id
  const userIds = Object.keys(conversationsByUser);
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  
  if (userError) {
    console.error('❌ Error fetching users:', userError);
  }

  const userMap = {};
  if (users && users.users) {
    for (const user of users.users) {
      userMap[user.id] = user.email;
    }
  }

  console.log(`👥 Conversations grouped by user:\n`);
  
  for (const userId of userIds) {
    const userEmail = userMap[userId] || 'Unknown';
    const convs = conversationsByUser[userId];
    
    console.log(`\n📧 User: ${userEmail}`);
    console.log(`   ID: ${userId}`);
    console.log(`   Conversations: ${convs.length}`);
    
    if (convs.length > 0) {
      console.log(`   Titles:`);
      convs.forEach((conv, idx) => {
        console.log(`     ${idx + 1}. "${conv.title}" (${new Date(conv.created_at).toLocaleDateString()})`);
      });
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ Test complete!\n');
  
  // Check if there are multiple users
  if (userIds.length > 1) {
    console.log('⚠️  WARNING: Multiple users have conversations.');
    console.log('   If you\'re seeing other users\' conversations, the issue is likely:');
    console.log('   1. The wrong userId is being passed from the frontend');
    console.log('   2. The user object in the auth store contains the wrong ID');
    console.log('   3. Multiple users are logged in on different devices/sessions\n');
  } else {
    console.log('✅ All conversations belong to a single user.');
    console.log('   If you\'re seeing other users\' conversations in the app,');
    console.log('   the issue is NOT in the database - check the frontend userId.\n');
  }
}

testUserIsolation().catch(console.error);

