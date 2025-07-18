#!/bin/bash

# Easy deployment script for Vercel

echo "🏁 Deploying Endurance App to Vercel..."
echo "========================================"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Build the app first
echo "🔨 Building the app..."
npm run build

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo "📱 Your app is now live and accessible to anyone with the URL"
echo "🔗 Share the URL with your friends to test the app"
echo ""
echo "💡 Pro tip: Future deployments will be automatic if you connect to GitHub"
