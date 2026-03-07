#!/bin/bash

# ============================================================================
# Pulse v10 - Complete Supabase Setup Script
# ============================================================================
# This script will:
# 1. Set up your Supabase project connection
# 2. Deploy the database schema
# 3. Deploy the SendGrid email function
# 4. Configure all necessary secrets
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
  echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_success() {
  echo -e "${GREEN}✓${NC} $1"
}

print_error() {
  echo -e "${RED}✗${NC} $1"
}

print_info() {
  echo -e "${YELLOW}ℹ${NC} $1"
}

print_step() {
  echo -e "\n${BLUE}→${NC} $1"
}

# ============================================================================
# BANNER
# ============================================================================

clear
echo -e "${BLUE}"
cat << "EOF"
  ____        _            __     ______  
 |  _ \ _   _| |___  ___   \ \   / /_  / 
 | |_) | | | | / __|/ _ \   \ \ / / / /  
 |  __/| |_| | \__ \  __/    \ V / / /__ 
 |_|    \__,_|_|___/\___|     \_/ /_____|
                                          
   Complete Supabase Setup Script
EOF
echo -e "${NC}"

print_header "Prerequisites Check"

# ============================================================================
# CHECK PREREQUISITES
# ============================================================================

# Check if Supabase CLI is installed
print_step "Checking for Supabase CLI..."
if ! command -v supabase &> /dev/null; then
  print_error "Supabase CLI not found!"
  echo ""
  echo "Install it with:"
  echo "  npm install -g supabase"
  echo ""
  echo "Or via Homebrew (macOS/Linux):"
  echo "  brew install supabase/tap/supabase"
  exit 1
fi
print_success "Supabase CLI found ($(supabase --version))"

# Check if user is logged in
print_step "Checking Supabase login status..."
if ! supabase projects list &> /dev/null 2>&1; then
  print_error "Not logged in to Supabase"
  echo ""
  print_info "Please run: supabase login"
  echo "Then run this script again."
  exit 1
fi
print_success "Logged in to Supabase"

# ============================================================================
# PROJECT LINKING
# ============================================================================

print_header "Project Setup"

# Check if already linked
if [ -f ".supabase/config.toml" ]; then
  print_success "Project already linked"
  PROJECT_REF=$(grep 'project_id' .supabase/config.toml | cut -d'"' -f2)
  print_info "Project ID: $PROJECT_REF"
else
  print_step "Linking to Supabase project..."
  echo ""
  echo "Find your project reference in your Supabase dashboard URL:"
  echo "https://supabase.com/dashboard/project/YOUR_PROJECT_REF"
  echo ""
  read -p "Enter your Supabase project reference: " PROJECT_REF
  
  if [ -z "$PROJECT_REF" ]; then
    print_error "Project reference is required"
    exit 1
  fi
  
  print_step "Linking to project $PROJECT_REF..."
  supabase link --project-ref "$PROJECT_REF"
  print_success "Project linked successfully"
fi

# ============================================================================
# DATABASE SCHEMA DEPLOYMENT
# ============================================================================

print_header "Database Schema Setup"

read -p "Do you want to deploy the database schema? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  print_step "Deploying database schema..."
  
  if [ -f "supabase/schema.sql" ]; then
    # Get database URL
    print_step "Getting database connection..."
    DB_URL=$(supabase status | grep "DB URL" | awk '{print $3}')
    
    if [ -z "$DB_URL" ]; then
      print_info "Starting local Supabase (this may take a minute)..."
      supabase start
      DB_URL=$(supabase status | grep "DB URL" | awk '{print $3}')
    fi
    
    # Apply schema using psql or supabase db
    print_step "Applying schema to database..."
    if command -v psql &> /dev/null; then
      psql "$DB_URL" -f supabase/schema.sql
      print_success "Schema deployed successfully via psql"
    else
      print_info "psql not found, using supabase db push..."
      supabase db push
      print_success "Schema deployed successfully"
    fi
  else
    print_error "Schema file not found at supabase/schema.sql"
    print_info "Skipping schema deployment"
  fi
else
  print_info "Skipping schema deployment"
fi

# ============================================================================
# SENDGRID CONFIGURATION
# ============================================================================

print_header "SendGrid Email Setup"

read -p "Do you want to configure SendGrid for email notifications? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo ""
  print_info "You'll need:"
  print_info "1. SendGrid API Key (from Settings → API Keys)"
  print_info "2. Verified sender email (from Settings → Sender Authentication)"
  echo ""
  
  read -p "Do you have these ready? (y/n): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    print_step "Configuring SendGrid..."
    
    # Get SendGrid API Key
    echo ""
    read -sp "Enter your SendGrid API Key: " SENDGRID_API_KEY
    echo ""
    
    if [ -z "$SENDGRID_API_KEY" ]; then
      print_error "API Key is required"
      print_info "Skipping SendGrid setup - you can run this script again later"
    else
      # Get verified sender email
      read -p "Enter your verified sender email: " SENDGRID_FROM_EMAIL
      
      if [ -z "$SENDGRID_FROM_EMAIL" ]; then
        print_error "Sender email is required"
        print_info "Skipping SendGrid setup - you can run this script again later"
      else
        # Set secrets
        print_step "Setting Supabase secrets..."
        supabase secrets set SENDGRID_API_KEY="$SENDGRID_API_KEY" --project-ref "$PROJECT_REF"
        supabase secrets set SENDGRID_FROM_EMAIL="$SENDGRID_FROM_EMAIL" --project-ref "$PROJECT_REF"
        print_success "SendGrid secrets configured"
        
        # Deploy edge function
        print_step "Deploying send-email edge function..."
        if [ -d "supabase/functions/send-email" ]; then
          supabase functions deploy send-email --project-ref "$PROJECT_REF"
          print_success "Edge function deployed"
        else
          print_error "Edge function directory not found"
          print_info "Expected: supabase/functions/send-email/"
        fi
      fi
    fi
  else
    print_info "Skipping SendGrid setup"
    echo ""
    print_info "To set up SendGrid later, run:"
    echo "  supabase secrets set SENDGRID_API_KEY=your_key"
    echo "  supabase secrets set SENDGRID_FROM_EMAIL=your_email"
    echo "  supabase functions deploy send-email"
  fi
else
  print_info "Skipping SendGrid setup"
fi

# ============================================================================
# ENVIRONMENT VARIABLES
# ============================================================================

print_header "Environment Variables"

print_step "Getting your Supabase project credentials..."

# Get project details
SUPABASE_URL=$(supabase status | grep "API URL" | awk '{print $3}' || echo "")
if [ -z "$SUPABASE_URL" ]; then
  SUPABASE_URL="https://${PROJECT_REF}.supabase.co"
fi

print_success "Supabase URL: $SUPABASE_URL"

echo ""
print_info "You need to get your ANON KEY from Supabase Dashboard:"
print_info "1. Go to: https://supabase.com/dashboard/project/$PROJECT_REF/settings/api"
print_info "2. Copy the 'anon public' key"
echo ""

read -p "Do you want to create a .env file now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  read -p "Enter your Supabase ANON KEY: " ANON_KEY
  
  if [ -z "$ANON_KEY" ]; then
    print_error "ANON KEY is required"
    print_info "Skipping .env creation"
  else
    print_step "Creating .env file..."
    cat > .env << EOF
# Supabase Configuration
VITE_SUPABASE_URL=$SUPABASE_URL
VITE_SUPABASE_ANON_KEY=$ANON_KEY

# SendGrid is configured in Supabase secrets (not here)
# See .env.example for more info
EOF
    print_success ".env file created"
    print_info "⚠️  Don't commit this file! It's already in .gitignore"
  fi
else
  print_info "Skipping .env creation"
  echo ""
  print_info "You can create it manually later using .env.example as a template"
fi

# ============================================================================
# TESTING
# ============================================================================

print_header "Testing Setup"

read -p "Do you want to test the email function? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo ""
  read -p "Enter your email to receive a test: " TEST_EMAIL
  
  if [ -z "$TEST_EMAIL" ]; then
    print_info "Skipping email test"
  else
    print_step "Sending test email to $TEST_EMAIL..."
    
    supabase functions invoke send-email \
      --project-ref "$PROJECT_REF" \
      --body "$(cat <<EOF
{
  "to": "$TEST_EMAIL",
  "subject": "Pulse Setup Test",
  "html": "<h1>Success!</h1><p>Your Pulse email setup is working correctly.</p>"
}
EOF
)"
    
    print_success "Test email sent! Check your inbox at $TEST_EMAIL"
  fi
else
  print_info "Skipping email test"
fi

# ============================================================================
# COMPLETION
# ============================================================================

print_header "Setup Complete! 🎉"

echo ""
print_success "Your Pulse application is configured!"
echo ""

print_info "Next steps:"
echo ""
echo "  1. Set up your workspace and projects in the app"
echo "  2. Test email notifications by creating/assigning tasks"
echo "  3. Deploy to Vercel:"
echo "     - Set environment variables in Vercel dashboard"
echo "     - Push to your Git repository"
echo "     - Or run: vercel --prod"
echo ""

print_info "Useful commands:"
echo ""
echo "  View edge function logs:"
echo "    supabase functions logs send-email --project-ref $PROJECT_REF"
echo ""
echo "  List secrets:"
echo "    supabase secrets list --project-ref $PROJECT_REF"
echo ""
echo "  Re-deploy edge function:"
echo "    supabase functions deploy send-email --project-ref $PROJECT_REF"
echo ""

print_info "Documentation:"
echo ""
echo "  📖 Full setup guide: SENDGRID_SETUP_GUIDE.md"
echo "  🐛 Troubleshooting: TROUBLESHOOTING.md"
echo "  ✅ Quick reference: QUICK_SETUP_CHECKLIST.md"
echo ""

print_header "Happy building! 🚀"
