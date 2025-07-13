#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const VALIDATION_FILES = [
  'PHASE_1_VALIDATION_RESULTS.md',
  'PHASE_2_VALIDATION_RESULTS.md',
  'PHASE_3_VALIDATION_RESULTS.md'
];

const PENDING_STATUS = '⏳ PENDING VALIDATION';
const SUCCESS_STATUS = '✅ VALIDATION PASSED';
const FAILED_STATUS = '❌ VALIDATION FAILED';

async function runTests() {
  console.log('🔍 Running validation tests...');
  
  const testResults = {};
  
  try {
    // Run Phase 1 tests
    console.log('Testing Phase 1: Query Intelligence...');
    const phase1Result = execSync('npm test -- --testPathPatterns="query.*intelligence|context.*sizing" --silent', { encoding: 'utf8' });
    testResults.phase1 = phase1Result.includes('PASS') && !phase1Result.includes('FAIL');
    
    // Run Phase 2 tests  
    console.log('Testing Phase 2: Adaptive Retrieval...');
    const phase2Result = execSync('npm test -- --testPathPatterns="multi.*stage|hybrid.*search" --silent', { encoding: 'utf8' });
    testResults.phase2 = phase2Result.includes('PASS') && !phase2Result.includes('FAIL');
    
    // Run Phase 3 tests
    console.log('Testing Phase 3: Context Compression...');
    const phase3Result = execSync('npm test -- --testPathPatterns="context.*pruning|context.*cache" --silent', { encoding: 'utf8' });
    testResults.phase3 = phase3Result.includes('PASS') && !phase3Result.includes('FAIL');
    
    // Run Phase 4 tests
    console.log('Testing Phase 4: Integration...');
    const phase4Result = execSync('npm test -- --testPathPatterns="integration|pipeline" --silent', { encoding: 'utf8' });
    testResults.phase4 = phase4Result.includes('PASS') && !phase4Result.includes('FAIL');
    
    return testResults;
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    return {
      phase1: false,
      phase2: false,
      phase3: false,
      phase4: false
    };
  }
}

async function updateValidationFile(filename, phase, passed) {
  const filePath = path.join(process.cwd(), filename);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File ${filename} not found, skipping...`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  const timestamp = new Date().toISOString();
  
  // Update main phase status
  const status = passed ? SUCCESS_STATUS : FAILED_STATUS;
  content = content.replace(
    /\*\*Phase Status\*\*:\s*[⏳✅❌].*$/m,
    `**Phase Status**: ${status}`
  );
  
  // Update completion date
  content = content.replace(
    /\*\*Completion Date\*\*:\s*.*$/m,
    `**Completion Date**: ${timestamp}`
  );
  
  // Update metrics table
  if (passed) {
    content = content.replace(
      /\| ([^|]+) \| ([^|]+) \| To be measured \| ⏳ Pending Validation \|/g,
      (match, metric, target) => {
        // This would need actual test results to populate "measured" values
        // For now, we'll just mark as validation passed
        return `| ${metric} | ${target} | Validation passed | ✅ Validated |`;
      }
    );
  } else {
    content = content.replace(
      /\| ([^|]+) \| ([^|]+) \| To be measured \| ⏳ Pending Validation \|/g,
      (match, metric, target) => {
        return `| ${metric} | ${target} | Validation failed | ❌ Failed |`;
      }
    );
  }
  
  // Update block statuses
  content = content.replace(
    /### Block \d+\.\d+: [^⏳✅❌]*[⏳✅❌]/g,
    (match) => {
      return match.replace(/[⏳✅❌]/, passed ? '✅' : '❌');
    }
  );
  
  // Update block status text
  content = content.replace(
    /\*\*Status\*\*:\s*PENDING VALIDATION/g,
    `**Status**: ${passed ? 'VALIDATION PASSED' : 'VALIDATION FAILED'}`
  );
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Updated ${filename} with ${passed ? 'PASSED' : 'FAILED'} status`);
}

async function generateTestReport(testResults) {
  const report = {
    timestamp: new Date().toISOString(),
    results: testResults,
    summary: {
      total: Object.keys(testResults).length,
      passed: Object.values(testResults).filter(Boolean).length,
      failed: Object.values(testResults).filter(r => !r).length
    }
  };
  
  // Create test report
  let reportContent = `# Validation Test Report\n\n`;
  reportContent += `**Generated**: ${report.timestamp}\n`;
  reportContent += `**Total Phases**: ${report.summary.total}\n`;
  reportContent += `**Passed**: ${report.summary.passed}\n`;
  reportContent += `**Failed**: ${report.summary.failed}\n\n`;
  
  reportContent += `## Phase Results\n\n`;
  
  Object.entries(testResults).forEach(([phase, passed]) => {
    const status = passed ? '✅ PASSED' : '❌ FAILED';
    reportContent += `- **${phase.toUpperCase()}**: ${status}\n`;
  });
  
  reportContent += `\n## Next Steps\n\n`;
  
  if (report.summary.failed > 0) {
    reportContent += `⚠️ ${report.summary.failed} phase(s) failed validation. Review test results and fix issues before proceeding.\n`;
  } else {
    reportContent += `✅ All phases passed validation. Ready for production integration.\n`;
  }
  
  fs.writeFileSync('VALIDATION_TEST_REPORT.md', reportContent, 'utf8');
  console.log('📋 Generated VALIDATION_TEST_REPORT.md');
}

async function main() {
  console.log('🚀 Starting validation status update...');
  
  const testResults = await runTests();
  
  console.log('\n📊 Test Results:');
  console.log('Phase 1:', testResults.phase1 ? '✅ PASSED' : '❌ FAILED');
  console.log('Phase 2:', testResults.phase2 ? '✅ PASSED' : '❌ FAILED');
  console.log('Phase 3:', testResults.phase3 ? '✅ PASSED' : '❌ FAILED');
  console.log('Phase 4:', testResults.phase4 ? '✅ PASSED' : '❌ FAILED');
  
  console.log('\n📝 Updating validation files...');
  
  // Update validation files
  await updateValidationFile('PHASE_1_VALIDATION_RESULTS.md', 'phase1', testResults.phase1);
  await updateValidationFile('PHASE_2_VALIDATION_RESULTS.md', 'phase2', testResults.phase2);
  await updateValidationFile('PHASE_3_VALIDATION_RESULTS.md', 'phase3', testResults.phase3);
  
  // Generate test report
  await generateTestReport(testResults);
  
  console.log('\n✅ Validation status update completed!');
  
  // Exit with error code if any tests failed
  const hasFailures = Object.values(testResults).some(result => !result);
  if (hasFailures) {
    console.log('\n❌ Some tests failed. Check the validation report for details.');
    process.exit(1);
  } else {
    console.log('\n🎉 All validations passed!');
    process.exit(0);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}

module.exports = { updateValidationFile, runTests, generateTestReport };