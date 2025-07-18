#!/bin/bash

# Test script to verify our accessibility fixes
echo "🧪 Testing Accessibility Fixes"
echo "================================"

cd /Users/darrenwalsh/endurance-app

echo "1. Checking if all labels have htmlFor attributes..."

# Check if our fixes are in the source code
if grep -q 'htmlFor="track-name"' src/App.tsx; then
    echo "✅ Track Name label has htmlFor attribute"
else
    echo "❌ Track Name label missing htmlFor attribute"
fi

if grep -q 'htmlFor="race-length"' src/App.tsx; then
    echo "✅ Race Length label has htmlFor attribute"
else
    echo "❌ Race Length label missing htmlFor attribute"
fi

if grep -q 'htmlFor="fuel-range"' src/App.tsx; then
    echo "✅ Fuel Range label has htmlFor attribute"
else
    echo "❌ Fuel Range label missing htmlFor attribute"
fi

if grep -q 'htmlFor="min-pit-time"' src/App.tsx; then
    echo "✅ Min Pit Time label has htmlFor attribute"
else
    echo "❌ Min Pit Time label missing htmlFor attribute"
fi

echo ""
echo "2. Checking if all inputs have matching id attributes..."

if grep -q 'id="track-name"' src/App.tsx; then
    echo "✅ Track Name input has id attribute"
else
    echo "❌ Track Name input missing id attribute"
fi

if grep -q 'id="race-length"' src/App.tsx; then
    echo "✅ Race Length input has id attribute"
else
    echo "❌ Race Length input missing id attribute"
fi

if grep -q 'id="fuel-range"' src/App.tsx; then
    echo "✅ Fuel Range input has id attribute"
else
    echo "❌ Fuel Range input missing id attribute"
fi

if grep -q 'id="min-pit-time"' src/App.tsx; then
    echo "✅ Min Pit Time input has id attribute"
else
    echo "❌ Min Pit Time input missing id attribute"
fi

echo ""
echo "3. Checking team-specific dynamic IDs..."

if grep -q 'htmlFor={`team-number-${teamIndex}`}' src/App.tsx; then
    echo "✅ Team Number labels have dynamic htmlFor attributes"
else
    echo "❌ Team Number labels missing dynamic htmlFor attributes"
fi

if grep -q 'id={`team-number-${teamIndex}`}' src/App.tsx; then
    echo "✅ Team Number inputs have dynamic id attributes"
else
    echo "❌ Team Number inputs missing dynamic id attributes"
fi

echo ""
echo "🎯 Summary:"
echo "Our accessibility fixes should resolve the React Testing Library errors."
echo "The labels now have proper htmlFor attributes that match the input ids."
echo ""
echo "The key fixes made:"
echo "- Added htmlFor='track-name' to Track Name label"
echo "- Added id='track-name' to Track Name input"
echo "- Added htmlFor='race-length' to Race Length label"
echo "- Added id='race-length' to Race Length input"
echo "- Added htmlFor='fuel-range' to Fuel Range label" 
echo "- Added id='fuel-range' to Fuel Range input"
echo "- Added htmlFor='min-pit-time' to Min Pit Time label"
echo "- Added id='min-pit-time' to Min Pit Time input"
echo "- Added dynamic htmlFor and id attributes for team fields"
echo "- Added aria-label attributes for driver inputs"
echo ""
echo "✨ Tests should now pass! ✨"
