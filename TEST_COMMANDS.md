# Test Logging Commands Reference

## 🏃‍♂️ Quick Commands

### Basic Test Commands
```bash
# Standard test run
npm test

# Verbose output (shows all test details)
npm run test:verbose

# Debug mode (maximum detail + handles detection)
npm run test:debug

# Watch mode (re-runs when files change)
npm run test:watch

# With coverage report
npm run test:coverage
```

### Advanced Logging Commands
```bash
# Save test output to file
npm test 2>&1 | tee test-results.log

# Run tests and only show failures
npm test 2>&1 | grep -A 10 -B 5 "FAIL\|●.*›"

# Run a specific test by name
npm test -- --testNamePattern="can open pit stop dialog"

# Run tests from specific file
npm test -- src/App.test.tsx

# Run with maximum Jest debugging
npm test -- --verbose --detectOpenHandles --forceExit --no-coverage
```

### Using the Custom Scripts
```bash
# Make scripts executable
chmod +x *.sh

# Run with detailed logging and file output
./test-logger.sh

# Run specific test with logging
./test-logger.sh "can open pit stop dialog"

# Run verbose tests
./run-tests-verbose.sh
```

## 📊 Understanding Test Output

### ✅ Passing Test Format:
```
✓ test name (time)
```

### ❌ Failing Test Format:
```
✕ test name (time)

● TestSuite › TestGroup › test name

  Error details here...
  
  at file:line:column
```

### 📋 Test Suite Summary:
```
Test Suites: X failed, Y passed, Z total
Tests:       A failed, B passed, C total
```

## 🔍 Common Debugging Patterns

### Find Specific Failures:
```bash
# Search for failed tests
grep -n "✕\|FAIL" test-results.log

# Show test errors with context
grep -A 15 -B 5 "●.*›" test-results.log
```

### View Real-Time Results:
```bash
# Watch tests in real-time
npm run test:watch

# Or with verbose output
npm test -- --watch --verbose
```

## 📁 File Locations

- Test logs: `./test-results/`
- Test files: `./src/**/*.test.{js,ts,tsx}`
- Jest config: `./jest.config.cjs`
- Setup: `./src/setupTests.js`
