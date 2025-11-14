#!/usr/bin/env node
/**
 * Test script to verify the conversations API endpoint
 * 
 * Usage:
 *   node test-conversations-api.js
 * 
 * This will test the backend conversations endpoint directly
 */

const http = require('http');

// Configuration
const API_HOST = '192.168.7.89'; // Update this to match your backend IP
const API_PORT = 3000;
const USER_ID = '90ecdf1e-ac7f-4ef4-978e-a01ef1d86473';

console.log('🧪 Testing Conversations API\n');
console.log('Configuration:');
console.log(`  Host: ${API_HOST}`);
console.log(`  Port: ${API_PORT}`);
console.log(`  User ID: ${USER_ID}`);
console.log('');

// Test 1: Health Check
function testHealthCheck() {
  return new Promise((resolve, reject) => {
    console.log('📡 Test 1: Health Check');
    console.log(`   GET http://${API_HOST}:${API_PORT}/health`);
    
    const req = http.get(`http://${API_HOST}:${API_PORT}/health`, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`   Status: ${res.statusCode}`);
        try {
          const json = JSON.parse(data);
          console.log(`   Response: ${JSON.stringify(json, null, 2)}`);
          console.log('   ✅ Health check passed\n');
          resolve();
        } catch (e) {
          console.log(`   Response: ${data}`);
          console.log('   ✅ Health check passed (non-JSON response)\n');
          resolve();
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`   ❌ Error: ${error.message}`);
      console.log('   💡 Make sure the backend is running and accessible\n');
      reject(error);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      console.log('   ❌ Timeout: Request took too long');
      console.log('   💡 Check if the backend is running\n');
      reject(new Error('Timeout'));
    });
  });
}

// Test 2: API Info
function testApiInfo() {
  return new Promise((resolve, reject) => {
    console.log('📡 Test 2: API Info');
    console.log(`   GET http://${API_HOST}:${API_PORT}/api/v1`);
    
    const req = http.get(`http://${API_HOST}:${API_PORT}/api/v1`, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`   Status: ${res.statusCode}`);
        try {
          const json = JSON.parse(data);
          console.log(`   Response: ${JSON.stringify(json, null, 2)}`);
          console.log('   ✅ API info retrieved\n');
          resolve();
        } catch (e) {
          console.log(`   Response: ${data}`);
          console.log('   ⚠️  Could not parse JSON response\n');
          resolve();
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`   ❌ Error: ${error.message}\n`);
      reject(error);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      console.log('   ❌ Timeout\n');
      reject(new Error('Timeout'));
    });
  });
}

// Test 3: Get Conversations
function testGetConversations() {
  return new Promise((resolve, reject) => {
    console.log('📡 Test 3: Get Conversations');
    console.log(`   GET http://${API_HOST}:${API_PORT}/api/v1/chat/conversations?userId=${USER_ID}`);
    
    const req = http.get(
      `http://${API_HOST}:${API_PORT}/api/v1/chat/conversations?userId=${USER_ID}`,
      (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          console.log(`   Status: ${res.statusCode}`);
          
          try {
            const json = JSON.parse(data);
            console.log(`   Response: ${JSON.stringify(json, null, 2)}`);
            
            if (json.success && json.conversations) {
              console.log(`   ✅ Success! Found ${json.conversations.length} conversation(s)`);
              
              if (json.conversations.length > 0) {
                console.log('\n   📋 Conversation Details:');
                json.conversations.forEach((conv, i) => {
                  console.log(`   ${i + 1}. ${conv.title}`);
                  console.log(`      ID: ${conv.id}`);
                  console.log(`      Messages: ${conv.messageCount}`);
                  console.log(`      Updated: ${conv.updatedAt}`);
                  console.log(`      Preview: ${conv.preview || '(no preview)'}`);
                });
              } else {
                console.log('   ⚠️  No conversations found for this user');
                console.log('   💡 Check if conversations exist in the database for this user ID');
              }
            } else {
              console.log('   ⚠️  Unexpected response format');
            }
            console.log('');
            resolve(json);
          } catch (e) {
            console.log(`   Response: ${data}`);
            console.log(`   ❌ Could not parse JSON response: ${e.message}\n`);
            reject(e);
          }
        });
      }
    );
    
    req.on('error', (error) => {
      console.log(`   ❌ Error: ${error.message}`);
      console.log('   💡 Common causes:');
      console.log('      - Backend not running');
      console.log('      - Wrong IP address or port');
      console.log('      - Firewall blocking connection');
      console.log('      - Device not on same network\n');
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      console.log('   ❌ Timeout: Request took too long\n');
      reject(new Error('Timeout'));
    });
  });
}

// Run all tests
async function runTests() {
  try {
    await testHealthCheck();
    await testApiInfo();
    const result = await testGetConversations();
    
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ All tests completed!');
    console.log('═══════════════════════════════════════════════════════');
    
    if (result && result.conversations && result.conversations.length === 0) {
      console.log('\n⚠️  IMPORTANT: No conversations found!');
      console.log('\nNext steps:');
      console.log('1. Verify conversations exist in Supabase for this user');
      console.log('2. Check the user ID is correct');
      console.log('3. Run this SQL in Supabase:');
      console.log(`   SELECT * FROM chat_conversations WHERE user_id = '${USER_ID}';`);
    }
    
  } catch (error) {
    console.log('═══════════════════════════════════════════════════════');
    console.log('❌ Tests failed!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('\nTroubleshooting:');
    console.log('1. Make sure backend is running: cd backend && npm run dev');
    console.log('2. Check backend is accessible at http://' + API_HOST + ':' + API_PORT);
    console.log('3. Verify IP address matches your computer\'s IP');
    console.log('4. Check firewall settings');
    console.log('5. Ensure device is on same network as backend');
    process.exit(1);
  }
}

// Run the tests
runTests();

