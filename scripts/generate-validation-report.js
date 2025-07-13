#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Ensure test-results directory exists
const testResultsDir = path.join(process.cwd(), 'test-results');
if (!fs.existsSync(testResultsDir)) {
  fs.mkdirSync(testResultsDir, { recursive: true });
}

async function testOpenAIAPI() {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Test message' }],
        max_tokens: 10
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      return { status: 'success', response: data };
    } else {
      return { status: 'error', error: `HTTP ${response.status}` };
    }
  } catch (error) {
    return { status: 'error', error: error.message };
  }
}

async function testSupabaseAPI() {
  try {
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': process.env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return { status: 'success', response: data };
    } else {
      return { status: 'error', error: `HTTP ${response.status}` };
    }
  } catch (error) {
    return { status: 'error', error: error.message };
  }
}

async function testVercelAPI() {
  try {
    const response = await fetch('https://api.vercel.com/v1/user', {
      headers: {
        'Authorization': `Bearer ${process.env.VERCEL_TOKEN}`,
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return { status: 'success', response: data };
    } else {
      return { status: 'error', error: `HTTP ${response.status}` };
    }
  } catch (error) {
    return { status: 'error', error: error.message };
  }
}

async function generateValidationReport() {
  console.log('🔍 Generating Phase 1 Validation Report...');
  
  const report = {
    timestamp: new Date().toISOString(),
    phase: 'Phase 1',
    tests: {
      unit: { passed: 0, failed: 0, total: 0 },
      integration: { passed: 0, failed: 0, total: 0 },
      e2e: { passed: 0, failed: 0, total: 0 },
      api: []
    },
    coverage: 0,
    apiTests: []
  };
  
  // Test API connectivity
  console.log('🔌 Testing API connectivity...');
  
  const openAITest = await testOpenAIAPI();
  report.apiTests.push({
    name: 'OpenAI API',
    status: openAITest.status,
    details: openAITest.error || 'Connected successfully'
  });
  
  const supabaseTest = await testSupabaseAPI();
  report.apiTests.push({
    name: 'Supabase API',
    status: supabaseTest.status,
    details: supabaseTest.error || 'Connected successfully'
  });
  
  const vercelTest = await testVercelAPI();
  report.apiTests.push({
    name: 'Vercel API',
    status: vercelTest.status,
    details: vercelTest.error || 'Connected successfully'
  });
  
  // Read test results if they exist
  try {
    const jestResults = JSON.parse(fs.readFileSync('coverage/coverage-summary.json', 'utf8'));
    report.coverage = Math.round(jestResults.total.lines.pct);
  } catch (error) {
    console.log('No coverage data found');
  }
  
  // Count test results
  try {
    const testOutput = fs.readFileSync('test-results/test-output.txt', 'utf8');
    const passedMatches = testOutput.match(/✓ (\d+) tests passed/);
    const failedMatches = testOutput.match(/✗ (\d+) tests failed/);
    
    if (passedMatches) report.tests.unit.passed = parseInt(passedMatches[1]);
    if (failedMatches) report.tests.unit.failed = parseInt(failedMatches[1]);
    report.tests.unit.total = report.tests.unit.passed + report.tests.unit.failed;
  } catch (error) {
    console.log('No test output found');
  }
  
  // Calculate overall status
  const apiSuccessCount = report.apiTests.filter(test => test.status === 'success').length;
  const totalAPITests = report.apiTests.length;
  
  report.summary = {
    apiConnectivity: `${apiSuccessCount}/${totalAPITests} APIs connected`,
    testCoverage: `${report.coverage}%`,
    overallStatus: apiSuccessCount === totalAPITests && report.coverage >= 80 ? 'PASSED' : 'FAILED'
  };
  
  // Save report
  const reportPath = path.join(testResultsDir, 'validation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Generate human-readable report
  const humanReport = `
# Phase 1 Validation Report
Generated: ${report.timestamp}

## Overall Status: ${report.summary.overallStatus}

## API Connectivity Tests
${report.apiTests.map(test => 
  `- ${test.name}: ${test.status === 'success' ? '✅' : '❌'} ${test.details}`
).join('\n')}

## Test Coverage
- Coverage: ${report.coverage}%
- Unit Tests: ${report.tests.unit.passed}/${report.tests.unit.total} passed

## Summary
- API Connectivity: ${report.summary.apiConnectivity}
- Test Coverage: ${report.summary.testCoverage}
- Overall Status: ${report.summary.overallStatus}
  `.trim();
  
  const humanReportPath = path.join(testResultsDir, 'validation-report.md');
  fs.writeFileSync(humanReportPath, humanReport);
  
  console.log('📊 Validation report generated successfully!');
  console.log(`📄 JSON: ${reportPath}`);
  console.log(`📄 Markdown: ${humanReportPath}`);
  
  // Exit with appropriate code
  process.exit(report.summary.overallStatus === 'PASSED' ? 0 : 1);
}

// Run the report generation
generateValidationReport().catch(error => {
  console.error('❌ Error generating validation report:', error);
  process.exit(1);
});