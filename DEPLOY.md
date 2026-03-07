# Quick Deployment Guide

## For GitHub Users

### 1. Push to GitHub

```bash
# In your pulse-v10-github directory
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/pulse.git
git push -u origin main
```

### 2. Run Supabase Setup

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Run setup script
chmod +x setup-supabase.sh
./setup-supabase.sh
```

**What the script does:**
- Links your Supabase project
- Deploys database schema (all tables)
- Deploys send-email edge function
- Creates .env file

### 3. Configure SendGrid

**Via Supabase CLI** (recommended):

```bash
supabase secrets set SENDGRID_API_KEY=SG.your_key_here
supabase secrets set SENDGRID_FROM_EMAIL=notifications@yourdomain.com
```

**Or via UI** (after deployment):

1. Start app: `npm run dev`
2. Go to Settings → Notifications
3. Enter sender email
4. Follow CLI instructions shown in UI

### 4. Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

Or:
1. Connect repo to Vercel
2. Add environment variables
3. Deploy automatically

## What Goes in the Repo

✅ **Include:**
- All source code (`src/`)
- Supabase configuration (`supabase/`)
- Setup script (`setup-supabase.sh`)
- Config files (`package.json`, `vite.config.js`, etc.)
- Documentation (`README.md`, `SETUP.md`)

❌ **Exclude (in .gitignore):**
- `node_modules/`
- `.env`
- `dist/`
- `.supabase/` (local state)

## Environment Variables

### Local Development (.env)
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
```

### Vercel Deployment
Add these in Vercel dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Supabase Secrets
Set via CLI:
- `SENDGRID_API_KEY`
- `SENDGRID_FROM_EMAIL`

## Workflow

1. **Develop locally**: `npm run dev`
2. **Commit changes**: `git commit -am "message"`
3. **Push to GitHub**: `git push`
4. **Auto-deploy**: Vercel deploys automatically
5. **Configure emails**: In app Settings

## SendGrid Configuration UI

After deployment, configure SendGrid in the app:

1. Go to **Settings** tab
2. Click **Notifications**
3. Enter verified sender email
4. Save configuration
5. Run CLI commands shown in UI
6. Test email

## Updating Database Schema

If you modify `supabase/schema.sql`:

```bash
supabase db push
```

## Updating Edge Function

If you modify `supabase/functions/send-email/index.ts`:

```bash
supabase functions deploy send-email
```

## Monitoring

### View Function Logs
```bash
supabase functions logs send-email
```

### Check Secrets
```bash
supabase secrets list
```

### SendGrid Activity
Visit: SendGrid Dashboard → Activity

## Quick Commands

```bash
# Setup
npm install
./setup-supabase.sh

# Development
npm run dev

# Deployment
git push                    # Push to GitHub
vercel --prod              # Deploy to Vercel

# Supabase
supabase functions deploy send-email
supabase functions logs send-email
supabase secrets set KEY=value
supabase db push

# Testing
npm run build              # Test production build
npm run preview            # Preview build locally
```

## Troubleshooting

**"Module not found" errors**
```bash
npm install
```

**Supabase errors**
```bash
supabase login
supabase link --project-ref YOUR_REF
```

**Email not working**
```bash
supabase functions logs send-email
supabase secrets list
```

## Next Steps

1. ✅ Push code to GitHub
2. ✅ Run `./setup-supabase.sh`
3. ✅ Configure SendGrid secrets
4. ✅ Deploy to Vercel
5. ✅ Test in production
6. ✅ Add team members
7. ✅ Start using!
