#!/bin/bash

# Fixed deployment script - installs Vercel locally instead of globally

echo "🏁 Deploying Endurance App to Vercel..."
echo "========================================"

# Install Vercel CLI locally (no permissions needed)
if ! command -v npx &> /dev/null; then
    echo "❌ npx not found. Please install Node.js"
    exit 1
fi

echo "📦 Using npx to run Vercel (no global install needed)..."

# Build the app first
echo "🔨 Building the app..."
npm run build

# Check if build succeeded
if [ $? -ne 0 ]; then
    echo "❌ Build failed! Fix TypeScript errors first."
    echo "💡 Run 'npm run build' to see all errors"
    exit 1
fi

# Deploy to Vercel using npx (no global install needed)
echo "🚀 Deploying to Vercel..."
npx vercel --prod

echo ""
echo "✅ Deployment complete!"
echo "📱 Your app is now live and accessible to anyone with the URL"
echo "🔗 Share the URL with your friends to test the app"
echo ""
echo "💡 Pro tip: Future deployments will be automatic if you connect to GitHub"
