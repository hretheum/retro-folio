// Test script for local API
// Run with: node test-api.js

async function testAPI() {
  const baseURL = 'http://localhost:3000/api/content';
  
  console.log('🧪 Testing Timeline API...\n');
  
  try {
    // 1. Test GET
    console.log('1. Testing GET /api/content/timeline');
    const getResponse = await fetch(`${baseURL}/timeline`);
    console.log('   Status:', getResponse.status);
    const items = await getResponse.json();
    console.log('   Items found:', items.length);
    console.log('   Published items:', items.filter(i => i.status === 'published').length);
    
    // 2. Test POST - Create new timeline item
    console.log('\n2. Testing POST /api/content/timeline');
    const newItem = {
      type: 'timeline',
      title: 'Test Timeline Event',
      status: 'published', // Important: must be published to show in Timeline
      data: {
        year: '2025',
        description: 'Test event for debugging',
        detail: 'This is a test timeline event to verify API functionality',
        icon: 'sparkles',
        color: 'from-green-500 to-green-600'
      }
    };
    
    const postResponse = await fetch(`${baseURL}/timeline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem)
    });
    console.log('   Status:', postResponse.status);
    const createdItem = await postResponse.json();
    console.log('   Created item ID:', createdItem.id);
    
    // 3. Test GET again
    console.log('\n3. Verifying item was saved');
    const verifyResponse = await fetch(`${baseURL}/timeline`);
    const updatedItems = await verifyResponse.json();
    console.log('   Total items now:', updatedItems.length);
    console.log('   Published items now:', updatedItems.filter(i => i.status === 'published').length);
    
    console.log('\n✅ API tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ API test failed:', error);
  }
}

// Run the test
testAPI();