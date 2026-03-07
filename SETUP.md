# Setup Guide

## Prerequisites

- Node.js v16+ installed
- Supabase account ([sign up](https://supabase.com))
- SendGrid account ([sign up](https://sendgrid.com))
- GitHub account (for deployment)

## Step 1: Supabase Project Setup

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose organization
4. Enter project name (e.g., "pulse")
5. Create a strong database password
6. Select region closest to your users
7. Click "Create new project" (takes 2-3 minutes)

### 1.2 Get Project Credentials

1. Go to Settings → API
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Anon (public) key**: Long string starting with `eyJ...`

Save these for later.

## Step 2: Local Setup

### 2.1 Clone Repository

```bash
git clone <your-repo-url>
cd pulse
npm install
```

### 2.2 Install Supabase CLI

```bash
npm install -g supabase
```

### 2.3 Login to Supabase

```bash
supabase login
```

This opens a browser for authentication.

### 2.4 Run Setup Script

```bash
chmod +x setup-supabase.sh
./setup-supabase.sh
```

**The script will ask you for:**

1. **Project Reference**: Get from your Supabase project URL
   - URL: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`
   - Enter: `YOUR_PROJECT_REF`

2. **Deploy Schema**: Answer `y`
   - This creates all database tables

3. **Deploy Edge Function**: Answer `y`
   - This deploys the email sending function

4. **Create .env**: Answer `y`
   - Paste your ANON key when prompted

## Step 3: SendGrid Setup

### 3.1 Create SendGrid Account

1. Go to [sendgrid.com](https://sendgrid.com)
2. Sign up (free tier: 100 emails/day)
3. Verify your email address

### 3.2 Get API Key

1. Go to Settings → API Keys
2. Click "Create API Key"
3. Name: `Pulse Notifications`
4. Select: **Full Access** (or minimum: Mail Send)
5. Click "Create & View"
6. **Copy the key immediately** (you won't see it again!)

### 3.3 Verify Sender Email

1. Go to Settings → Sender Authentication → Single Sender Verification
2. Click "Create New Sender"
3. Fill in:
   - From Name: `Pulse Notifications`
   - From Email: `notifications@yourdomain.com`
   - Reply To: Same as above
   - Company details
4. Click "Create"
5. **Check your email and verify**

### 3.4 Set Supabase Secrets

```bash
# Set SendGrid API Key
supabase secrets set SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxx

# Set verified sender email
supabase secrets set SENDGRID_FROM_EMAIL=notifications@yourdomain.com
```

Replace with your actual values from steps 3.2 and 3.3.

## Step 4: Test Email

### 4.1 Start Development Server

```bash
npm run dev
```

### 4.2 Configure in UI

1. Visit `http://localhost:5173`
2. Sign in with Google
3. Create a workspace
4. Go to Settings → Notifications
5. Enter your verified sender email
6. Click "Send Test Email"
7. Check your inbox!

### 4.3 Test via CLI (Alternative)

```bash
supabase functions invoke send-email --body '{
  "to": "your-email@example.com",
  "subject": "Test",
  "html": "<h1>It works!</h1>"
}'
```

## Step 5: Google OAuth Setup

### 5.1 Configure in Supabase

1. Go to Supabase Dashboard → Authentication → Providers
2. Find "Google" and enable it
3. Click "Configure"
4. You'll need Google OAuth credentials

### 5.2 Create Google OAuth App

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project (or select existing)
3. Go to "APIs & Services" → "Credentials"
4. Click "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure consent screen if needed
6. Application type: **Web application**
7. Add Authorized redirect URI:
   ```
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```
8. Click "Create"
9. Copy Client ID and Client Secret

### 5.3 Add to Supabase

1. Back in Supabase → Authentication → Providers → Google
2. Paste Client ID
3. Paste Client Secret
4. Click "Save"

## Step 6: Deploy to Vercel

### 6.1 Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 6.2 Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Add Environment Variables:
   - `VITE_SUPABASE_URL`: Your Supabase URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
6. Click "Deploy"

Your app is now live!

## Verification Checklist

After setup, verify:

- [ ] Database tables created (check Supabase Table Editor)
- [ ] Edge function deployed (check Supabase Functions)
- [ ] SendGrid secrets set (run `supabase secrets list`)
- [ ] Test email works
- [ ] Google OAuth works
- [ ] Can create workspace
- [ ] Can create project
- [ ] Can create task
- [ ] Email notification arrives

## Troubleshooting

### "Supabase CLI not found"

```bash
npm install -g supabase
```

### "Not logged in to Supabase"

```bash
supabase login
```

### Emails not sending

1. Check logs:
   ```bash
   supabase functions logs send-email
   ```

2. Verify secrets:
   ```bash
   supabase secrets list
   ```

3. Check SendGrid Activity dashboard

### Google OAuth not working

1. Verify redirect URI in Google Console matches:
   ```
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```

2. Check credentials are saved in Supabase

### Database connection errors

1. Verify .env file exists with correct values
2. Check Supabase project is active
3. Try restarting dev server

## Next Steps

1. Customize email templates in `src/lib/gmail.js`
2. Add team members to your workspace
3. Create your first project
4. Set up notification preferences
5. Invite external collaborators as guests

## Upgrading

### SendGrid

Free tier: 100 emails/day
- Essentials: $19.95/mo (100k emails/day)
- Pro: $89.95/mo (1.5M emails/day)

Upgrade at: SendGrid → Settings → Account Details

### Supabase

Free tier: 500MB database, 1GB storage
- Pro: $25/mo (8GB database, 100GB storage)

Upgrade at: Supabase Dashboard → Settings → Billing

## Support

If you encounter issues:

1. Check Supabase function logs
2. Check SendGrid Activity feed
3. Verify all secrets are set
4. Ensure sender email is verified
5. Try the test email function
