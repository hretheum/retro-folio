// Script to trigger the prepare-pinecone endpoint

async function indexToPinecone() {
  const baseUrl = process.env.API_URL || 'http://localhost:3000';
  
  try {
    console.log('Triggering Pinecone indexing...');
    console.log('This will:');
    console.log('1. Fetch all content from Redis');
    console.log('2. Create text chunks');
    console.log('3. Generate embeddings using OpenAI');
    console.log('4. Store in Pinecone vector database\n');
    
    const response = await fetch(`${baseUrl}/api/ai/prepare-pinecone`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    console.log('\nIndexing completed!');
    console.log('Results:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log(`\n✅ Successfully indexed ${result.processedChunks} chunks to Pinecone`);
      console.log(`💰 Total cost: $${result.totalCost.toFixed(4)}`);
      console.log(`⏱️  Duration: ${(result.duration / 1000).toFixed(2)}s`);
    } else {
      console.log(`\n⚠️  Indexing completed with errors`);
      console.log(`✅ Processed: ${result.processedChunks} chunks`);
      console.log(`❌ Failed: ${result.failedChunks} chunks`);
    }
    
  } catch (error) {
    console.error('Error indexing to Pinecone:', error);
  }
}

// Check if we're running locally or need to use production URL
const args = process.argv.slice(2);
if (args.includes('--production')) {
  process.env.API_URL = 'https://retro-git-main-eryk-orlowskis-projects.vercel.app';
}

// Run the indexing
indexToPinecone().catch(console.error);