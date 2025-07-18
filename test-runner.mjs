#!/usr/bin/env node

// test-runner.mjs - Simple test to verify setup (ES Module version)
import { execSync } from 'child_process';

console.log('🧪 Testing Jest setup...');

// Test that Jest can run
try {
  console.log('📦 Checking if all dependencies are installed...');
  
  // Check if jest is available
  execSync('npx jest --version', { stdio: 'pipe' });
  console.log('✅ Jest is installed and working');
  
  console.log('🚀 Running a simple test...');
  const result = execSync('npx jest --testNamePattern="renders race configuration screen initially" --verbose', { 
    encoding: 'utf8',
    stdio: 'pipe'
  });
  
  console.log('✅ Test setup is working!');
  console.log(result);
  console.log('\n📋 To run all tests, use:');
  console.log('  npm test');
  console.log('\n📋 To run tests in watch mode, use:');
  console.log('  npm run test:watch');
  console.log('\n📋 To run tests with coverage, use:');
  console.log('  npm run test:coverage');
  
} catch (error) {
  console.error('❌ Test setup failed:');
  console.error(error.message);
  
  if (error.message.includes('Cannot find module')) {
    console.log('\n💡 Try running: npm install');
  }
  
  if (error.message.includes('moduleNameMapping')) {
    console.log('\n💡 There might be an issue with the Jest configuration');
  }
  
  console.log('\n🔧 Let\'s try running Jest directly:');
  console.log('Run: npx jest --version');
  
  process.exit(1);
}