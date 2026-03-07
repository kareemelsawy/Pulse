# Pulse v10 - Quick Start Guide

Get your Pulse application running in 15 minutes!

## 🎯 Overview

1. Install dependencies (2 min)
2. Run setup script (10 min)
3. Start dev server (1 min)
4. Test (2 min)

## 📋 Prerequisites Checklist

Before starting, make sure you have:

- [ ] Node.js installed (v16+) - `node --version`
- [ ] Supabase account created at [supabase.com](https://supabase.com)
- [ ] SendGrid account created at [sendgrid.com](https://sendgrid.com)
- [ ] SendGrid API Key ready (Settings → API Keys)
- [ ] SendGrid sender email verified (Settings → Sender Authentication)

## 🚀 Quick Setup

### 1. Install Dependencies

```bash
cd pulse-v10
npm install
npm install -g supabase
```

### 2. Run the Setup Script

```bash
chmod +x setup-supabase.sh
./setup-supabase.sh
```

**The script will ask you for:**

1. **Supabase Project Reference**
   - Find it in your dashboard URL: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`

2. **Deploy Database Schema?**
   - Answer `y` to create all tables

3. **Configure SendGrid?**
   - Answer `y`
   - Paste your SendGrid API Key
   - Enter your verified sender email

4. **Create .env file?**
   - Answer `y`
   - Paste your Supabase ANON key (from dashboard → Settings → API)

5. **Test email?**
   - Answer `y` and enter your email to receive a test

### 3. Start Development Server

```bash
npm run dev
```

Visit: `http://localhost:5173`

### 4. Test the Application

1. Sign up with your Google account
2. Create a workspace
3. Create a project
4. Create a task and assign it to someone
5. Check if they receive an email notification!

## 🎉 You're Done!

Your Pulse application is now running locally with:
- ✅ Database configured
- ✅ Email notifications working
- ✅ Authentication enabled

## 🚢 Deploy to Production

### Option 1: Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

Then set environment variables in Vercel dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Option 2: Push to GitHub

1. Push your code to GitHub
2. Import to Vercel
3. Set environment variables
4. Deploy automatically

## 🐛 Something Not Working?

### Check Logs

```bash
# View edge function logs
supabase functions logs send-email

# View all logs
supabase functions logs
```

### Common Fixes

**"Email service not configured"**
```bash
supabase secrets set SENDGRID_API_KEY=your_key
supabase secrets set SENDGRID_FROM_EMAIL=your_email
supabase functions deploy send-email
```

**Can't connect to database**
- Check `VITE_SUPABASE_URL` in .env
- Make sure it matches your project URL

**Emails not arriving**
- Check SendGrid Activity dashboard
- Verify sender email is verified
- Check spam folder

### Full Troubleshooting

See `TROUBLESHOOTING.md` for detailed solutions.

## 📖 Next Steps

- Read `README_V10.md` for complete documentation
- Check `SENDGRID_SETUP_GUIDE.md` for detailed setup info
- See `ARCHITECTURE.md` to understand the code structure

## 💡 Pro Tips

1. **Local Development**: The setup script creates a `.env` file - don't commit it!
2. **Production**: Use Domain Authentication in SendGrid (not Single Sender)
3. **Monitoring**: Regularly check `supabase functions logs send-email`
4. **Scaling**: Start with free tiers, upgrade as you grow

## 🆘 Need Help?

1. Run `./setup-supabase.sh` again (it's safe to re-run)
2. Check the logs: `supabase functions logs send-email`
3. Review `TROUBLESHOOTING.md`
4. Verify all secrets are set: `supabase secrets list`

---

**Ready to build?** You're all set! Start creating tasks and collaborating with your team.
