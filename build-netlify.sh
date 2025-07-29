#!/bin/bash

echo "🧹 Cleaning previous build..."
rm -rf dist/
rm -rf node_modules/.vite/
rm -rf node_modules/.tmp/

echo "📦 Installing dependencies..."
npm ci

echo "🔨 Building for production..."
npm run build

echo "✅ Build complete! Files in dist/ directory:"
ls -la dist/

echo "🔍 Checking index.html for correct paths..."
if grep -q "/endurance-app/" dist/index.html; then
    echo "❌ ERROR: Found /endurance-app/ paths in built index.html"
    echo "This suggests the base path is still incorrect."
    exit 1
else
    echo "✅ No /endurance-app/ paths found in built files"
fi

echo "🚀 Ready for deployment!"
