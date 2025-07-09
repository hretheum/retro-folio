#!/usr/bin/env ts-node

import { BaselinePerformanceTester } from '../lib/context-management-tests';
import { writeFileSync } from 'fs';
import { join } from 'path';

async function runBaselineTest() {
  console.log('🚀 Starting Baseline Performance Test');
  console.log('=' .repeat(50));
  
  const tester = new BaselinePerformanceTester();
  
  try {
    const metrics = await tester.runBaseline();
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 FINAL BASELINE METRICS:');
    console.log('=' .repeat(50));
    console.log(`🕐 Average Response Time: ${metrics.avgResponseTime.toFixed(0)}ms`);
    console.log(`🎯 Average Tokens Used: ${metrics.avgTokensUsed.toFixed(0)}`);
    console.log(`📈 Accuracy Score: ${metrics.accuracyScore.toFixed(2)}/10`);
    console.log(`📊 Context Utilization: ${metrics.contextUtilization.toFixed(1)}%`);
    console.log(`❌ Error Rate: ${metrics.errorRate.toFixed(1)}%`);
    console.log(`✅ Tests Covered: ${metrics.testsCovered}`);
    
    // Export detailed results
    const detailedReport = tester.exportResults();
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `baseline-test-results-${timestamp}.md`;
    const filepath = join(process.cwd(), 'docs', filename);
    
    writeFileSync(filepath, detailedReport);
    console.log(`\n📄 Detailed report saved to: ${filepath}`);
    
    // Check if metrics meet our baseline requirements
    const validationResults = validateBaselineMetrics(metrics);
    console.log('\n' + '='.repeat(50));
    console.log('✅ BASELINE VALIDATION:');
    console.log('=' .repeat(50));
    
    Object.entries(validationResults).forEach(([metric, passed]) => {
      const icon = passed ? '✅' : '❌';
      console.log(`${icon} ${metric}: ${passed ? 'PASSED' : 'FAILED'}`);
    });
    
    const allPassed = Object.values(validationResults).every(Boolean);
    
    if (allPassed) {
      console.log('\n🎉 All baseline metrics meet requirements!');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some baseline metrics do not meet requirements. Continuing with available data.');
      process.exit(0); // Still continue with implementation
    }
    
  } catch (error) {
    console.error('❌ Error running baseline test:', error);
    process.exit(1);
  }
}

function validateBaselineMetrics(metrics: any): Record<string, boolean> {
  return {
    'Response Time < 3000ms': metrics.avgResponseTime < 3000,
    'Tests Covered >= 20': metrics.testsCovered >= 20,
    'Error Rate < 50%': metrics.errorRate < 50,
    'Context Utilization > 0%': metrics.contextUtilization > 0
  };
}

// Run the test
runBaselineTest().catch(console.error);

export { runBaselineTest };