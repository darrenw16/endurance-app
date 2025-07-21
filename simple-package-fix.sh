#!/bin/bash

# Simple package.json fix
echo "Fixing package.json..."

cd /Users/darrenwalsh/endurance-app

# Check if there are issues with package.json
echo "Current package.json issues:"
grep -n "homepage.*github" package.json || echo "No homepage duplication found"
grep -n "your-email@example.com" package.json || echo "No placeholder email found"

echo ""
echo "To fix manually:"
echo "1. Edit package.json"
echo "2. Change 'your-email@example.com' to your real email"
echo "3. Remove any duplicate 'homepage' entries in scripts section"
echo "4. Save the file"
echo ""

echo "Would you like me to try the automated fix? (y/n)"
read -r response

if [[ "$response" =~ ^[Yy]$ ]]; then
    # Create backup
    cp package.json package.json.backup
    echo "✅ Created backup: package.json.backup"
    
    # Simple sed replacements (safer than node for this environment)
    sed -i.tmp 's/your-email@example.com/darren@example.com/g' package.json
    rm package.json.tmp 2>/dev/null
    
    echo "✅ Updated email placeholder (change to your real email)"
    echo "📝 Please manually check package.json for any other issues"
else
    echo "Manual fix recommended."
fi
