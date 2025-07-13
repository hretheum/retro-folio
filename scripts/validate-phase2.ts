#!/usr/bin/env npx ts-node

import { Phase2Validator } from '../lib/context/phase2-validation';
import { promises as fs } from 'fs';
import { join } from 'path';

async function main() {
  console.log('🔍 Starting Phase 2 Validation with Real File Checking...\n');
  
  const validator = new Phase2Validator();
  
  try {
    const report = await validator.validatePhase2();
    
    // Display results
    console.log('📊 PHASE 2 VALIDATION REPORT');
    console.log('='.repeat(50));
    console.log(`Overall Status: ${getStatusIcon(report.overallStatus)} ${report.overallStatus}`);
    console.log(`Overall Score: ${report.overallScore.toFixed(1)}%`);
    console.log(`Timestamp: ${new Date(report.timestamp).toISOString()}`);
    console.log();
    
    // Component results
    console.log('📋 COMPONENT VALIDATION RESULTS');
    console.log('-'.repeat(50));
    report.components.forEach(component => {
      console.log(`${getStatusIcon(component.status)} ${component.component}: ${component.score.toFixed(1)}%`);
      console.log(`   Details: ${component.details}`);
      
      if (component.issues.length > 0) {
        console.log(`   Issues:`);
        component.issues.forEach(issue => console.log(`     ❌ ${issue}`));
      }
      
      if (component.recommendations.length > 0) {
        console.log(`   Recommendations:`);
        component.recommendations.forEach(rec => console.log(`     💡 ${rec}`));
      }
      console.log();
    });
    
    // Summary
    console.log('📈 SUMMARY');
    console.log('-'.repeat(50));
    console.log(`Total Components: ${report.summary.totalComponents}`);
    console.log(`✅ Passed: ${report.summary.passedComponents}`);
    console.log(`⚠️  Warnings: ${report.summary.warningComponents}`);
    console.log(`❌ Failed: ${report.summary.failedComponents}`);
    console.log();
    
    // Critical issues
    if (report.summary.criticalIssues.length > 0) {
      console.log('🚨 CRITICAL ISSUES');
      console.log('-'.repeat(50));
      report.summary.criticalIssues.forEach(issue => console.log(`❌ ${issue}`));
      console.log();
    }
    
    // Implementation gaps
    if (report.summary.implementationGaps.length > 0) {
      console.log('🔧 IMPLEMENTATION GAPS');
      console.log('-'.repeat(50));
      report.summary.implementationGaps.forEach(gap => console.log(`⚠️  ${gap}`));
      console.log();
    }
    
    // Metrics
    console.log('📊 METRICS');
    console.log('-'.repeat(50));
    console.log(`Code Complexity: ${report.metrics.codeComplexity}%`);
    console.log(`Test Coverage: ${report.metrics.testCoverage}%`);
    console.log(`Documentation Coverage: ${report.metrics.documentationCoverage}%`);
    console.log(`TypeScript Compliance: ${report.metrics.typeScriptCompliance}%`);
    console.log(`Memory Efficiency: ${report.metrics.memoryEfficiency}%`);
    console.log();
    
    // Save report
    const reportPath = join(process.cwd(), 'PHASE_2_REAL_VALIDATION_REPORT.md');
    await saveReportToFile(report, reportPath);
    console.log(`📄 Report saved to: ${reportPath}`);
    
    // Exit with appropriate code
    const exitCode = report.overallStatus === 'FAIL' ? 1 : 0;
    process.exit(exitCode);
    
  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  }
}

function getStatusIcon(status: string): string {
  switch (status) {
    case 'PASS': return '✅';
    case 'WARNING': return '⚠️';
    case 'FAIL': return '❌';
    default: return '❓';
  }
}

async function saveReportToFile(report: any, filePath: string): Promise<void> {
  const content = `# Phase 2 Real Validation Report

**Generated:** ${new Date(report.timestamp).toISOString()}  
**Overall Status:** ${report.overallStatus}  
**Overall Score:** ${report.overallScore.toFixed(1)}%  

## Executive Summary

This report contains the results of comprehensive Phase 2 validation that checks **actual file existence** and **real implementation** rather than theoretical assumptions.

### Key Findings

- **Total Components Tested:** ${report.summary.totalComponents}
- **Passed:** ${report.summary.passedComponents} (${((report.summary.passedComponents / report.summary.totalComponents) * 100).toFixed(1)}%)
- **Warnings:** ${report.summary.warningComponents} (${((report.summary.warningComponents / report.summary.totalComponents) * 100).toFixed(1)}%)
- **Failed:** ${report.summary.failedComponents} (${((report.summary.failedComponents / report.summary.totalComponents) * 100).toFixed(1)}%)

## Component Validation Results

${report.components.map((component: any) => `
### ${component.component}
- **Status:** ${component.status}
- **Score:** ${component.score.toFixed(1)}%
- **Details:** ${component.details}

${component.issues.length > 0 ? `**Issues:**
${component.issues.map((issue: string) => `- ❌ ${issue}`).join('\n')}` : ''}

${component.recommendations.length > 0 ? `**Recommendations:**
${component.recommendations.map((rec: string) => `- 💡 ${rec}`).join('\n')}` : ''}
`).join('\n')}

## Critical Issues

${report.summary.criticalIssues.length > 0 ? 
  report.summary.criticalIssues.map((issue: string) => `- ❌ ${issue}`).join('\n') : 
  'No critical issues found.'}

## Implementation Gaps

${report.summary.implementationGaps.length > 0 ? 
  report.summary.implementationGaps.map((gap: string) => `- ⚠️ ${gap}`).join('\n') : 
  'No implementation gaps found.'}

## Metrics

| Metric | Score |
|--------|-------|
| Code Complexity | ${report.metrics.codeComplexity}% |
| Test Coverage | ${report.metrics.testCoverage}% |
| Documentation Coverage | ${report.metrics.documentationCoverage}% |
| TypeScript Compliance | ${report.metrics.typeScriptCompliance}% |
| Memory Efficiency | ${report.metrics.memoryEfficiency}% |

## Next Steps

${report.overallStatus === 'FAIL' ? 
  `**CRITICAL:** This validation has failed. Immediate action required:
1. Address all critical issues listed above
2. Implement missing components
3. Re-run validation until all components pass` : 
  report.overallStatus === 'WARNING' ? 
    `**WARNING:** Some components need attention:
1. Review warning components
2. Implement recommended improvements
3. Re-run validation to achieve full pass status` : 
    `**SUCCESS:** All components have passed validation!
1. Proceed with integration testing
2. Deploy to staging environment
3. Monitor performance metrics`}

---
*Generated by Phase2Validator - Real Implementation Checker*
`;

  await fs.writeFile(filePath, content, 'utf8');
}

if (require.main === module) {
  main();
}