#!/bin/bash

# Detailed test runner script for endurance-app

echo "🏁 Running Endurance App Tests with Detailed Output..."
echo "====================================================="

# Run tests with maximum verbosity and detail
NODE_OPTIONS=--experimental-vm-modules jest --verbose --no-coverage --detectOpenHandles --forceExit

echo ""
echo "🔍 For even more detail, you can also run:"
echo "npm test -- --verbose --no-coverage"
echo ""
echo "📊 To run with coverage report:"
echo "npm run test:coverage"
echo ""
echo "👀 To run in watch mode (re-runs on file changes):"
echo "npm run test:watch"
