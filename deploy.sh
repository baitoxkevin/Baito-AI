#!/bin/bash

# BaitoAI Production Deployment Script
# Usage: ./deploy.sh [platform]

set -e

echo "🚀 BaitoAI Deployment Script"
echo "============================"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found${NC}"
    echo "Please create .env file with your Supabase credentials"
    exit 1
fi

# Check if API keys are placeholder values
if grep -q "your_supabase" .env; then
    echo -e "${RED}❌ Error: Please update .env with actual Supabase credentials${NC}"
    exit 1
fi

# Function to check prerequisites
check_prerequisites() {
    echo "📋 Checking prerequisites..."

    # Check Node version
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        echo -e "${RED}❌ Node.js version 18 or higher required${NC}"
        exit 1
    fi

    # Check npm
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm is not installed${NC}"
        exit 1
    fi

    echo -e "${GREEN}✅ Prerequisites check passed${NC}"
}

# Function to run security checks
security_check() {
    echo "🔒 Running security checks..."

    # Check for exposed secrets in git
    if git log --oneline | grep -qi "supabase_key\|api_key\|secret"; then
        echo -e "${YELLOW}⚠️  Warning: Potential secrets found in git history${NC}"
        echo "Please review git history and remove sensitive data"
    fi

    # Run npm audit
    echo "Running npm audit..."
    npm audit --audit-level=high || true

    echo -e "${GREEN}✅ Security check completed${NC}"
}

# Function to build project
build_project() {
    echo "🏗️  Building project..."

    # Install dependencies
    npm ci

    # Run build
    npm run build

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Build successful${NC}"
    else
        echo -e "${RED}❌ Build failed${NC}"
        exit 1
    fi
}

# Function to deploy to Netlify
deploy_netlify() {
    echo "📦 Deploying to Netlify..."

    if ! command -v netlify &> /dev/null; then
        echo "Installing Netlify CLI..."
        npm install -g netlify-cli
    fi

    netlify deploy --prod --dir=dist

    echo -e "${GREEN}✅ Deployed to Netlify${NC}"
}

# Function to deploy to Vercel
deploy_vercel() {
    echo "📦 Deploying to Vercel..."

    if ! command -v vercel &> /dev/null; then
        echo "Installing Vercel CLI..."
        npm install -g vercel
    fi

    vercel --prod

    echo -e "${GREEN}✅ Deployed to Vercel${NC}"
}

# Main execution
PLATFORM=${1:-"netlify"}

check_prerequisites
security_check
build_project

case $PLATFORM in
    netlify)
        deploy_netlify
        ;;
    vercel)
        deploy_vercel
        ;;
    *)
        echo -e "${YELLOW}Platform not specified. Use: ./deploy.sh [netlify|vercel]${NC}"
        echo "Build complete. Ready for manual deployment from 'dist' folder"
        ;;
esac

echo ""
echo "🎉 Deployment process complete!"
echo ""
echo "📋 Post-deployment checklist:"
echo "  1. Verify application is accessible"
echo "  2. Test authentication flow"
echo "  3. Check browser console for errors"
echo "  4. Monitor Supabase dashboard"
echo "  5. Set up monitoring/analytics"
echo ""
echo "⚠️  Important reminders:"
echo "  - Ensure Supabase RLS policies are enabled"
echo "  - Configure custom domain if needed"
echo "  - Set up SSL certificate"
echo "  - Enable CDN for better performance"
echo "  - Configure backup strategy"