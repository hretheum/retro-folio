// Chat Endpoints Test Script
// Tests all chat endpoints to verify proper functionality
// Run with: node scripts/test-chat-endpoints.js

const baseURL = 'http://localhost:3000';

async function testIntelligentChat() {
  console.log('🧪 Testing Intelligent Chat Endpoint...\n');
  
  const testQueries = [
    'jakie posiadasz umiejętności',  // The original failing query
    'what skills do you have',
    'opowiedz o projektach',
    'tell me about your experience'
  ];
  
  for (const query of testQueries) {
    console.log(`\n📝 Testing query: "${query}"`);
    
    try {
      const response = await fetch(`${baseURL}/api/ai/intelligent-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: query }],
          sessionId: `test-${Date.now()}`
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Status:', response.status);
        console.log('💬 Response preview:', data.content.substring(0, 200) + '...');
        console.log('📊 Metadata:', {
          queryIntent: data.metadata?.queryIntent,
          contextLength: data.metadata?.contextLength,
          responseTime: data.metadata?.responseTime + 'ms',
          tokensUsed: data.metadata?.tokensUsed
        });
        
        // Check if response contains the old fallback
        if (data.content.includes('nie zrozumiałem pytania')) {
          console.log('⚠️  WARNING: Still getting fallback response!');
        }
      } else {
        console.log('❌ Status:', response.status);
        const errorData = await response.json();
        console.log('❌ Error:', errorData.error || errorData.content);
      }
      
    } catch (error) {
      console.log('❌ Network Error:', error.message);
    }
  }
}

async function testAllEndpoints() {
  console.log('\n\n🔄 Testing All Chat Endpoints...\n');
  
  const query = 'jakie posiadasz umiejętności';
  const endpoints = [
    '/api/ai/intelligent-chat',
    '/api/ai/chat',
    '/api/ai/chat-with-llm',
    '/api/ai/chat-streaming'
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\n📡 Testing: ${endpoint}`);
    
    try {
      const response = await fetch(`${baseURL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: query }],
          sessionId: `test-${Date.now()}`
        })
      });
      
      if (response.ok) {
        // Handle both JSON and streaming responses
        if (endpoint.includes('streaming')) {
          const text = await response.text();
          console.log('✅ Streaming response preview:', text.substring(0, 200) + '...');
          
          if (text.includes('nie zrozumiałem pytania')) {
            console.log('⚠️  Still using fallback response');
          } else {
            console.log('✅ Proper response received');
          }
        } else {
          const data = await response.json();
          const content = data.content || data.message || '';
          console.log('✅ JSON response preview:', content.substring(0, 200) + '...');
          
          if (content.includes('nie zrozumiałem pytania')) {
            console.log('⚠️  Still using fallback response');
          } else {
            console.log('✅ Proper response received');
          }
        }
      } else {
        console.log('❌ Status:', response.status);
      }
      
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  }
}

async function testContextRetrieval() {
  console.log('\n\n🔍 Testing Context Retrieval...\n');
  
  // Test if we can get context data directly
  try {
    console.log('📡 Testing basic chat endpoint...');
    const response = await fetch(`${baseURL}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'test context retrieval' }],
        sessionId: `context-test-${Date.now()}`
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Chat endpoint working');
      console.log('📊 Metadata available:', !!data.metadata);
      
      if (data.metadata) {
        console.log('🔍 Context details:', {
          contextLength: data.metadata.contextLength,
          searchResultsCount: data.metadata.searchResultsCount,
          confidence: data.metadata.confidence,
          cacheHit: data.metadata.cacheHit
        });
      }
    } else {
      console.log('❌ Chat endpoint failed:', response.status);
    }
  } catch (error) {
    console.log('❌ Context test error:', error.message);
  }
}

// Main test execution
async function runAllTests() {
  console.log('🚀 Starting Chat System Tests...');
  console.log('='.repeat(50));
  
  try {
    await testIntelligentChat();
    await testAllEndpoints();
    await testContextRetrieval();
    
    console.log('\n' + '='.repeat(50));
    console.log('🏁 All tests completed!');
    console.log('\n💡 If you see "nie zrozumiałem pytania" responses,');
    console.log('   the RAG system may need further debugging.');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
  }
}

// Run tests
runAllTests();