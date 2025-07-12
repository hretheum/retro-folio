import dotenv from 'dotenv';

dotenv.config();

// Intent pattern examples - map current regex patterns to training data
const INTENT_PATTERNS = {
  SYNTHESIS: [
    // Polish
    "Jakie są twoje główne umiejętności?",
    "Co potrafisz robić najlepiej?",
    "Przedstaw swoje kompetencje",
    "Opisz swoje doświadczenie zawodowe",
    "Jakie masz kwalifikacje?",
    // English
    "What are your key skills and competencies?",
    "Tell me about your technical expertise",
    "What are your main qualifications?",
    "Describe your professional experience",
    "What can you do best?",
    // More variations
    "Podsumuj swoje umiejętności techniczne",
    "Present your capabilities",
    "What technologies are you proficient in?",
    "Analyze your competencies",
    "What's your skillset?"
  ],
  
  EXPLORATION: [
    // Polish
    "Opowiedz więcej o projekcie",
    "Jak wyglądał proces rozwoju?",
    "Opisz swoje podejście do",
    "Co się działo podczas",
    "Wyjaśnij metodologię",
    // English  
    "Tell me more about your experience at",
    "Can you elaborate on your role",
    "Explain your approach to",
    "How did you handle",
    "Describe the process of",
    // More variations
    "Elaborate on the challenges",
    "Walk me through the project",
    "What was your methodology?",
    "Deep dive into",
    "Explain in detail"
  ],
  
  COMPARISON: [
    // Polish
    "Które było bardziej wymagające",
    "Porównaj swoje doświadczenia",
    "Różnice między projektami",
    "Co było trudniejsze",
    "Podobieństwa i różnice",
    // English
    "Compare your experience at",
    "What's the difference between",
    "Which was more challenging",
    "Contrast your roles",
    "How does X compare to Y",
    // More variations
    "Similarities and differences",
    "Which project was bigger",
    "Compare the technologies",
    "What was better",
    "Versus"
  ],
  
  FACTUAL: [
    // Polish
    "Ile lat doświadczenia masz?",
    "Kiedy pracowałeś w",
    "Gdzie studiowałeś?",
    "Jaki był rozmiar zespołu?",
    "Ile użytkowników miała aplikacja?",
    // English
    "How many years of experience?",
    "When did you work at",
    "Where did you study?",
    "What was the team size?",
    "How many users did it have?",
    // More variations
    "What year was that?",
    "Exact number of",
    "Specific technologies used",
    "Duration of the project",
    "Quantify your impact"
  ],
  
  CASUAL: [
    // Polish
    "Cześć",
    "Dzień dobry",
    "Jak się masz?",
    "Dziękuję",
    "Do widzenia",
    // English
    "Hello",
    "Hi there",
    "How are you?",
    "Thanks",
    "Goodbye",
    // More variations
    "Hey",
    "Good morning",
    "Nice to meet you",
    "Appreciate it",
    "See you"
  ]
};

// Mock embedding generation function
function generateMockEmbedding(text: string): number[] {
  // Generate a mock 1536-dimensional vector
  const embedding: number[] = [];
  for (let i = 0; i < 1536; i++) {
    embedding.push(Math.random() * 2 - 1); // Random values between -1 and 1
  }
  return embedding;
}

async function initializeIntentPatterns() {
  console.log('🚀 Initializing intent patterns in Pinecone (MOCK MODE)...');
  
  // Mock Pinecone initialization
  console.log('📝 Mock Pinecone connection established');
  
  let totalVectors = 0;
  
  // Process each intent type
  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    console.log(`\n📝 Processing ${intent} patterns (${patterns.length} examples)...`);
    
    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      console.log(`  - Embedding: "${pattern.substring(0, 50)}..."`);
      
      try {
        // Generate mock embedding
        const embedding = generateMockEmbedding(pattern);
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 50));
        
        totalVectors++;
        console.log(`    ✅ Processed vector ${totalVectors}`);
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 50));
        
      } catch (error) {
        console.error(`    ❌ Failed to process pattern: ${error.message}`);
      }
    }
  }
  
  // Mock verification
  console.log('\n📊 Mock Pinecone namespace stats:', {
    totalVectors,
    namespaces: ['intent-patterns']
  });
  
  console.log('\n✅ Intent patterns initialization complete! (MOCK MODE)');
  console.log('📝 Note: This was a simulation. Real implementation requires valid API keys.');
}

function detectLanguage(text: string): 'pl' | 'en' {
  const polishChars = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/;
  const polishWords = /\b(jest|są|czy|jak|gdzie|kiedy|dlaczego|twoje|masz)\b/i;
  
  if (polishChars.test(text) || polishWords.test(text)) {
    return 'pl';
  }
  return 'en';
}

// Run initialization
initializeIntentPatterns().catch(console.error);