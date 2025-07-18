#!/bin/bash

# GitHub Repository Setup Script

echo "🏁 Setting up GitHub Repository for Endurance App..."
echo "===================================================="

# Check if we're already in a git repo
if [ -d ".git" ]; then
    echo "✅ Git repository already exists"
else
    echo "📦 Initializing git repository..."
    git init
fi

# Create .gitignore if it doesn't exist
if [ ! -f ".gitignore" ]; then
    echo "📝 Creating .gitignore..."
    cat > .gitignore << EOL
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production builds
dist/
build/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Test coverage
coverage/

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Temporary folders
tmp/
temp/

# Build info
.tsbuildinfo

# Test results
test-results/

# Backup files
*.backup
EOL
fi

# Add all files
echo "📁 Adding files to git..."
git add .

# Make initial commit
echo "💾 Making initial commit..."
git commit -m "Initial commit: Endurance Racing Pit Strategy App

Features:
- 24-hour endurance race management
- Real-time pit stop strategy
- Driver rotation management  
- FCY (Full Course Yellow) handling
- Dark mode Material Design UI
- Comprehensive test suite
- Responsive design for mobile/desktop"

# Check if GitHub CLI is available
if command -v gh &> /dev/null; then
    echo "🐙 GitHub CLI found! Creating repository..."
    
    # Create GitHub repository
    gh repo create endurance-app --public --description "24-Hour Endurance Racing Pit Strategy App - Real-time race management with pit stop strategy, driver rotation, and FCY handling" --push
    
    echo ""
    echo "✅ Repository created successfully!"
    echo "🔗 Your repo: https://github.com/$(gh api user --jq .login)/endurance-app"
    echo ""
    echo "🚀 Next steps:"
    echo "1. Enable GitHub Pages for easy deployment"
    echo "2. Add collaborators if needed"
    echo "3. Set up automatic deployments"
    
else
    echo "⚠️  GitHub CLI not found. Creating repository manually..."
    echo ""
    echo "📋 Manual setup instructions:"
    echo "1. Go to https://github.com/new"
    echo "2. Repository name: endurance-app"
    echo "3. Description: 24-Hour Endurance Racing Pit Strategy App"
    echo "4. Make it Public"
    echo "5. Don't initialize with README (we already have files)"
    echo "6. Click 'Create repository'"
    echo ""
    echo "7. Then run these commands:"
    echo "   git remote add origin https://github.com/YOUR_USERNAME/endurance-app.git"
    echo "   git branch -M main"
    echo "   git push -u origin main"
fi

echo ""
echo "🎯 Repository features:"
echo "- ✅ Complete source code"
echo "- ✅ Comprehensive test suite"
echo "- ✅ Build and deployment scripts"
echo "- ✅ Documentation"
echo "- ✅ Dark mode Material Design"
echo "- ✅ Mobile responsive"
