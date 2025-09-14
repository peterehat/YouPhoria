#!/usr/bin/env node

/**
 * Test Categories Script
 * Runs specific categories of tests based on command line arguments
 */

const { execSync } = require('child_process');
const path = require('path');

// Test categories and their patterns
const testCategories = {
  unit: {
    description: 'Unit tests - isolated component/function tests',
    patterns: [
      '--testNamePattern="unit|Unit"',
      '--testPathPattern="\\.(unit|spec)\\.(js|ts|jsx|tsx)$"'
    ]
  },
  integration: {
    description: 'Integration tests - API and database tests',
    patterns: [
      '--testNamePattern="integration|Integration"',
      '--testPathPattern="integration/"'
    ]
  },
  e2e: {
    description: 'End-to-end tests - full workflow tests',
    patterns: [
      '--testNamePattern="e2e|E2E|end-to-end"',
      '--testPathPattern="e2e/"'
    ]
  },
  frontend: {
    description: 'Frontend tests - React components and UI',
    patterns: [
      '--projects website admin'
    ]
  },
  backend: {
    description: 'Backend tests - API and server logic',
    patterns: [
      '--projects backend'
    ]
  }
};

function showHelp() {
  console.log('Test Categories Script');
  console.log('=====================');
  console.log('');
  console.log('Usage: node scripts/test-categories.js <category> [jest-options]');
  console.log('');
  console.log('Available categories:');
  console.log('');
  
  Object.entries(testCategories).forEach(([category, config]) => {
    console.log(`  ${category.padEnd(12)} - ${config.description}`);
  });
  
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/test-categories.js unit');
  console.log('  node scripts/test-categories.js integration --watch');
  console.log('  node scripts/test-categories.js frontend --coverage');
  console.log('  node scripts/test-categories.js e2e --verbose');
  console.log('');
}

function runTests(category, additionalArgs = []) {
  const config = testCategories[category];
  
  if (!config) {
    console.error(`❌ Unknown test category: ${category}`);
    console.log('');
    showHelp();
    process.exit(1);
  }
  
  console.log(`🧪 Running ${category} tests...`);
  console.log(`📝 ${config.description}`);
  console.log('');
  
  // Build Jest command
  const jestCommand = [
    'npx jest',
    ...config.patterns,
    ...additionalArgs
  ].join(' ');
  
  console.log(`Command: ${jestCommand}`);
  console.log('');
  
  try {
    execSync(jestCommand, {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log('');
    console.log(`✅ ${category} tests completed successfully!`);
  } catch (error) {
    console.log('');
    console.error(`❌ ${category} tests failed!`);
    process.exit(error.status || 1);
  }
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    showHelp();
    return;
  }
  
  const category = args[0];
  const jestArgs = args.slice(1);
  
  runTests(category, jestArgs);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  testCategories,
  runTests
};
