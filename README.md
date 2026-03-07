# Pulse SendGrid Email Integration

Complete setup files for migrating your Pulse application from Gmail to SendGrid for notification emails.

## 📦 What's Included

```
📁 SendGrid Integration Package
├── 📄 SENDGRID_SETUP_GUIDE.md      # Complete step-by-step guide
├── 📄 QUICK_SETUP_CHECKLIST.md     # Quick reference checklist
├── 📄 TROUBLESHOOTING.md           # Common issues & solutions
├── 📄 .env.example                 # Updated environment variables template
├── 🔧 setup-sendgrid.sh            # Automated setup script
├── 📁 send-email/
│   └── index.ts                    # Supabase Edge Function (SendGrid)
└── 📄 test-email-payload.json      # Test payload for verification
```

## 🚀 Quick Start (15 minutes)

### Option A: Automated Setup (Recommended)

```bash
# 1. Copy the send-email folder to your project
cp -r send-email/ pulse-v8-src/supabase/functions/

# 2. Run the setup script
cd pulse-v8-src
chmod +x setup-sendgrid.sh
./setup-sendgrid.sh
```

The script will:
- Link your Supabase project
- Prompt for SendGrid credentials
- Set up secrets
- Deploy the function

### Option B: Manual Setup

Follow the detailed guide: **SENDGRID_SETUP_GUIDE.md**

## ✅ Prerequisites

Before starting, make sure you have:

1. **SendGrid Account** (free tier is fine)
   - Sign up at [sendgrid.com](https://sendgrid.com)
   - Complete email verification

2. **SendGrid API Key**
   - Create at: Settings → API Keys
   - Needs "Mail Send" permission

3. **Verified Sender Email**
   - Set up at: Settings → Sender Authentication → Single Sender
   - Verify via email link

4. **Supabase Project**
   - Your existing Pulse project
   - Get project ref from dashboard URL

5. **Supabase CLI** (will install if needed)
   ```bash
   npm install -g supabase
   ```

## 📝 Step-by-Step Guide

### 1. SendGrid Setup (5 min)

- Create account → Verify email
- Create API Key → Copy it
- Add Single Sender → Verify email
- ✅ Ready for next step

### 2. Deploy Edge Function (5 min)

```bash
# Install & login
npm install -g supabase
supabase login

# Link project
cd pulse-v8-src
supabase link --project-ref YOUR_PROJECT_REF

# Create function
supabase functions new send-email

# Copy the provided index.ts content to:
# supabase/functions/send-email/index.ts

# Set secrets
supabase secrets set SENDGRID_API_KEY=SG.xxxxx
supabase secrets set SENDGRID_FROM_EMAIL=verified@email.com

# Deploy
supabase functions deploy send-email
```

### 3. Test (2 min)

```bash
# View logs
supabase functions logs send-email

# Test via dashboard
# Go to: Supabase → Edge Functions → send-email → Invoke
# Use test-email-payload.json content

# Or test via curl (replace values)
curl -X POST \
  'https://YOUR_PROJECT.supabase.co/functions/v1/send-email' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -d @test-email-payload.json
```

### 4. Deploy to Vercel (3 min)

```bash
# Ensure environment variables are set in Vercel
# VITE_SUPABASE_URL
# VITE_SUPABASE_ANON_KEY

# Deploy
vercel --prod
```

## ✨ What Changes?

### Backend (Supabase)
- **Old**: Edge Function called Gmail API with service account
- **New**: Edge Function calls SendGrid API with API key

### Frontend (No changes required!)
- `src/lib/gmail.js` already calls the edge function correctly
- Email templates remain the same
- No code changes needed

### Configuration
- **Old**: Gmail service account JSON in Supabase secrets
- **New**: SendGrid API key and verified email in Supabase secrets

## 🧪 Testing Your Setup

### Quick Test Commands

```bash
# Check function is deployed
supabase functions list

# Check secrets are set
supabase secrets list

# View recent logs
supabase functions logs send-email

# Test send (update the email)
supabase functions invoke send-email --payload '{
  "to": "your-email@example.com",
  "subject": "Test",
  "html": "<h1>Hello!</h1>"
}'
```

### In Your Application

1. Create a new task
2. Assign it to a user
3. Check that user receives an email notification
4. Check Supabase logs for confirmation

## 📖 Documentation

- **Full Setup Guide**: See `SENDGRID_SETUP_GUIDE.md` for detailed instructions
- **Quick Reference**: See `QUICK_SETUP_CHECKLIST.md` for a condensed checklist
- **Troubleshooting**: See `TROUBLESHOOTING.md` if you encounter issues

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| "Email service not configured" | Set secrets: `supabase secrets set SENDGRID_API_KEY=...` |
| "Sender not verified" | Complete Single Sender Verification in SendGrid |
| "403 Forbidden" | API key needs "Mail Send" permission |
| Emails in spam | Normal for new senders, will improve over time |
| Not receiving emails | Check SendGrid Activity dashboard |

Full troubleshooting guide: **TROUBLESHOOTING.md**

## 📊 SendGrid Limits

| Plan | Emails/Day | Price |
|------|------------|-------|
| Free | 100 | $0 |
| Essentials | 100,000 | $19.95/mo |
| Pro | 1,500,000 | $89.95/mo |

Start with free tier and upgrade as needed.

## 🔒 Security Best Practices

1. ✅ Never commit API keys to Git
2. ✅ Use `.env.example` for documentation only
3. ✅ Store secrets in Supabase Edge Functions (not frontend)
4. ✅ Use Domain Authentication in production (not just Single Sender)
5. ✅ Rotate API keys regularly
6. ✅ Monitor SendGrid activity for suspicious sends

## 🎯 Production Recommendations

Before launching:

- [ ] Upgrade to Domain Authentication (better deliverability)
- [ ] Set up SendGrid webhook for bounce handling
- [ ] Monitor email sending volume
- [ ] Test email templates across different clients
- [ ] Set up alerts for failed sends
- [ ] Document your SendGrid configuration

## 🆘 Need Help?

1. Check **TROUBLESHOOTING.md** first
2. View Supabase logs: `supabase functions logs send-email`
3. Check SendGrid Activity dashboard
4. Verify secrets: `supabase secrets list`
5. Test directly: Use test-email-payload.json

## 🔄 Migration Checklist

Migrating from Gmail? Here's what to do:

- [ ] Set up SendGrid account
- [ ] Create and verify sender email
- [ ] Get SendGrid API key
- [ ] Deploy new edge function
- [ ] Set Supabase secrets
- [ ] Test email sending
- [ ] Deploy to Vercel
- [ ] Remove old Gmail credentials (optional)
- [ ] Update any documentation

## 📞 Support

- **Supabase**: https://supabase.com/docs
- **SendGrid**: https://docs.sendgrid.com
- **Issues**: Check TROUBLESHOOTING.md

## 🎉 Success!

Once set up, your Pulse application will:
- Send beautiful notification emails
- Use reliable SendGrid infrastructure
- Scale from 100 to millions of emails
- Track delivery in SendGrid dashboard

---

**Ready to start?** Follow the **QUICK_SETUP_CHECKLIST.md** or run **./setup-sendgrid.sh**
