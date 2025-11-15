/**
 * Check who owns specific conversations
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

async function checkConversationOwner() {
  console.log('🔍 Checking conversation ownership\n');
  console.log('='.repeat(80));
  
  // Get the specific conversation
  const { data: conversations, error } = await supabase
    .from('chat_conversations')
    .select(`
      id,
      user_id,
      title,
      created_at,
      updated_at
    `)
    .eq('title', 'Show me my TSH levels');

  if (error) {
    console.error('❌ Error fetching conversation:', error);
    return;
  }

  console.log(`\n📊 Found ${conversations.length} conversation(s) with title "Show me my TSH levels"\n`);

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

  // Show details for each conversation
  for (const conv of conversations) {
    const userEmail = userMap[conv.user_id] || 'Unknown';
    
    console.log(`\n📧 Conversation Details:`);
    console.log(`   Title: "${conv.title}"`);
    console.log(`   Conversation ID: ${conv.id}`);
    console.log(`   Owner Email: ${userEmail}`);
    console.log(`   Owner User ID: ${conv.user_id}`);
    console.log(`   Created: ${new Date(conv.created_at).toLocaleString()}`);
    console.log(`   Updated: ${new Date(conv.updated_at).toLocaleString()}`);
    
    // Get messages for this conversation
    const { data: messages, error: msgError } = await supabase
      .from('chat_messages')
      .select('role, content, created_at')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: true });
    
    if (!msgError && messages) {
      console.log(`\n   Messages (${messages.length}):`);
      messages.forEach((msg, idx) => {
        const preview = msg.content.substring(0, 100);
        console.log(`     ${idx + 1}. [${msg.role}] ${preview}${msg.content.length > 100 ? '...' : ''}`);
      });
    }
  }

  console.log('\n' + '='.repeat(80));
  
  // Now check what the API returns for peterehat
  console.log('\n🔍 Checking what the API returns for peterehat@gmail.com...\n');
  
  const peterUserId = '90ecdf1e-ac7f-4ef4-978e-a01ef1d86473';
  
  const { data: peterConvs, error: peterError } = await supabase
    .from('chat_conversations')
    .select(`
      id,
      title,
      created_at,
      updated_at,
      chat_messages (
        content,
        created_at
      )
    `)
    .eq('user_id', peterUserId)
    .order('updated_at', { ascending: false });

  if (peterError) {
    console.error('❌ Error fetching Peter\'s conversations:', peterError);
    return;
  }

  console.log(`📊 API would return ${peterConvs.length} conversations for peterehat@gmail.com\n`);
  
  // Check if "Show me my TSH levels" is in the results
  const tshConv = peterConvs.find(c => c.title === 'Show me my TSH levels');
  
  if (tshConv) {
    console.log('⚠️  WARNING: "Show me my TSH levels" IS in the results for peterehat@gmail.com');
    console.log('   This means the conversation is correctly owned by Peter.');
    console.log('   If Peter didn\'t create it, someone else may have access to his account.');
  } else {
    console.log('✅ "Show me my TSH levels" is NOT in the results for peterehat@gmail.com');
    console.log('   This means it belongs to a different user.');
  }
  
  console.log('\n✅ Check complete!\n');
}

checkConversationOwner().catch(console.error);

