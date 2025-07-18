#!/bin/bash

# Test Results Viewer for endurance-app
# This script runs tests and saves detailed output to files for review

RESULTS_DIR="./test-results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Create results directory
mkdir -p $RESULTS_DIR

echo "🏁 Running Endurance App Tests - Detailed Logging"
echo "=================================================="
echo "📁 Results will be saved to: $RESULTS_DIR"
echo ""

# Run tests with full output captured
echo "🚀 Running all tests..."
NODE_OPTIONS=--experimental-vm-modules jest --verbose --no-coverage 2>&1 | tee "$RESULTS_DIR/test-output-$TIMESTAMP.log"

# Check exit code
TEST_EXIT_CODE=${PIPESTATUS[0]}

echo ""
echo "📊 Test Results Summary:"
echo "========================"

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ All tests passed!"
else
    echo "❌ Some tests failed (exit code: $TEST_EXIT_CODE)"
    echo ""
    echo "🔍 Failed test details:"
    echo "----------------------"
    grep -A 5 -B 5 "FAIL\|●.*›" "$RESULTS_DIR/test-output-$TIMESTAMP.log" || echo "No detailed failure info found"
fi

echo ""
echo "📋 Full test log saved to:"
echo "   $RESULTS_DIR/test-output-$TIMESTAMP.log"
echo ""
echo "🔍 To view the full log:"
echo "   cat $RESULTS_DIR/test-output-$TIMESTAMP.log"
echo ""
echo "📊 To view only failures:"
echo "   grep -A 10 -B 5 'FAIL\\|●.*›' $RESULTS_DIR/test-output-$TIMESTAMP.log"

# Also run a specific test if requested
if [ "$1" != "" ]; then
    echo ""
    echo "🎯 Running specific test: $1"
    NODE_OPTIONS=--experimental-vm-modules jest --verbose --testNamePattern="$1" 2>&1 | tee "$RESULTS_DIR/specific-test-$TIMESTAMP.log"
fi
