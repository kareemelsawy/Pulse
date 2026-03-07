#!/bin/bash

# ============================================================================
# Pulse - Supabase Database Setup Script
# ============================================================================
# This script sets up the database schema only.
# SendGrid configuration is done in the app Settings UI.
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_header() {
  echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_success() { echo -e "${GREEN}✓${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }
print_info() { echo -e "${YELLOW}ℹ${NC} $1"; }
print_step() { echo -e "\n${BLUE}→${NC} $1"; }

clear
echo -e "${BLUE}"
cat << "EOF"
  ____        _           
 |  _ \ _   _| |___  ___  
 | |_) | | | | / __|/ _ \ 
 |  __/| |_| | \__ \  __/ 
 |_|    \__,_|_|___/\___|
                          
   Supabase Setup Script
EOF
echo -e "${NC}"

print_header "Prerequisites Check"

# Check Supabase CLI
print_step "Checking for Supabase CLI..."
if ! command -v supabase &> /dev/null; then
  print_error "Supabase CLI not found!"
  echo ""
  echo "Install with: npm install -g supabase"
  exit 1
fi
print_success "Supabase CLI found"

# Check login
print_step "Checking Supabase login..."
if ! supabase projects list &> /dev/null 2>&1; then
  print_error "Not logged in to Supabase"
  echo ""
  print_info "Run: supabase login"
  exit 1
fi
print_success "Logged in to Supabase"

print_header "Project Setup"

# Link project
if [ -f ".supabase/config.toml" ]; then
  print_success "Project already linked"
  PROJECT_REF=$(grep 'project_id' .supabase/config.toml | cut -d'"' -f2)
else
  echo "Get your project reference from:"
  echo "https://supabase.com/dashboard/project/YOUR_PROJECT_REF"
  echo ""
  read -p "Enter Supabase project reference: " PROJECT_REF
  
  if [ -z "$PROJECT_REF" ]; then
    print_error "Project reference required"
    exit 1
  fi
  
  print_step "Linking to project..."
  supabase link --project-ref "$PROJECT_REF"
  print_success "Project linked"
fi

print_header "Database Schema Deployment"

read -p "Deploy database schema? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  if [ ! -f "supabase/schema.sql" ]; then
    print_error "Schema file not found at supabase/schema.sql"
    exit 1
  fi
  
  print_step "Deploying schema..."
  
  # Get connection string
  DB_URL=$(supabase status 2>/dev/null | grep "DB URL" | awk '{print $3}')
  
  if [ -z "$DB_URL" ]; then
    print_info "Getting database connection..."
    # Try to get from remote
    supabase db remote commit
  fi
  
  # Apply schema
  if command -v psql &> /dev/null; then
    print_step "Applying schema via psql..."
    psql "$(supabase status | grep 'DB URL' | awk '{print $3}')" -f supabase/schema.sql 2>/dev/null || {
      print_info "Using supabase db push instead..."
      supabase db push
    }
  else
    print_step "Applying schema via supabase db..."
    supabase db push
  fi
  
  print_success "Database schema deployed"
else
  print_info "Skipping schema deployment"
fi

print_header "Edge Function Deployment"

read -p "Deploy send-email function? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  if [ ! -d "supabase/functions/send-email" ]; then
    print_error "Edge function not found at supabase/functions/send-email/"
    exit 1
  fi
  
  print_step "Deploying send-email function..."
  supabase functions deploy send-email --project-ref "$PROJECT_REF"
  print_success "Edge function deployed"
  
  echo ""
  print_info "⚠️  SendGrid configuration:"
  print_info "Configure SendGrid API key and sender email in the app Settings tab"
  print_info "Or set manually with:"
  echo "  supabase secrets set SENDGRID_API_KEY=your_key"
  echo "  supabase secrets set SENDGRID_FROM_EMAIL=your_email"
else
  print_info "Skipping edge function deployment"
fi

print_header "Environment Setup"

SUPABASE_URL="https://${PROJECT_REF}.supabase.co"

print_info "Your Supabase URL: $SUPABASE_URL"
echo ""
print_info "Get your ANON key from:"
echo "https://supabase.com/dashboard/project/$PROJECT_REF/settings/api"
echo ""

read -p "Create .env file? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  read -p "Paste your ANON key: " ANON_KEY
  
  if [ -z "$ANON_KEY" ]; then
    print_error "ANON key required"
  else
    cat > .env << EOF
VITE_SUPABASE_URL=$SUPABASE_URL
VITE_SUPABASE_ANON_KEY=$ANON_KEY
EOF
    print_success ".env file created"
    print_info "⚠️  Don't commit this file!"
  fi
else
  print_info "Skipping .env creation"
  print_info "Copy .env.example to .env and fill in your values"
fi

print_header "Setup Complete! 🎉"

echo ""
print_success "Supabase is configured!"
echo ""
print_info "Next steps:"
echo ""
echo "  1. Install dependencies: npm install"
echo "  2. Start dev server: npm run dev"
echo "  3. Configure SendGrid in app Settings"
echo "  4. Test email notifications"
echo ""
print_info "Useful commands:"
echo ""
echo "  View logs:     supabase functions logs send-email"
echo "  List secrets:  supabase secrets list"
echo "  Re-deploy:     supabase functions deploy send-email"
echo ""
