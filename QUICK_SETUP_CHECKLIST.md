# SendGrid Setup - Quick Checklist

## ✅ Pre-Setup (5 minutes)

- [ ] Create SendGrid account at sendgrid.com
- [ ] Create API Key (Settings → API Keys → Create)
- [ ] Copy API key (save it somewhere safe!)
- [ ] Create Single Sender (Settings → Sender Authentication → Single Sender)
- [ ] Verify sender email (check your inbox for verification link)

## ✅ Supabase Edge Function (10 minutes)

### Install CLI
```bash
npm install -g supabase
supabase login
```

### Link Project
```bash
cd pulse-v8-src
supabase link --project-ref YOUR_PROJECT_REF
```

### Create Function
```bash
supabase functions new send-email
```
Then copy the `send-email/index.ts` file content into `supabase/functions/send-email/index.ts`

### Set Secrets
```bash
supabase secrets set SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx
supabase secrets set SENDGRID_FROM_EMAIL=your-verified-email@domain.com
```

### Deploy
```bash
supabase functions deploy send-email
```

## ✅ Test (2 minutes)

### Via Supabase Dashboard
1. Go to Edge Functions → send-email
2. Click "Invoke Function"
3. Payload:
```json
{
  "to": "your-email@example.com",
  "subject": "Test",
  "html": "<h1>It works!</h1>"
}
```
4. Check your email!

### Via Your App
1. Deploy to Vercel
2. Create/update a task
3. Email should arrive

## ✅ Optional: Update Frontend

Edit `src/lib/gmail.js` line 98 to remove hardcoded domain reference.

## 🎯 You're Done!

Your notification emails now use SendGrid instead of Gmail.

## Common Commands

```bash
# View logs
supabase functions logs send-email

# List secrets
supabase secrets list

# Update a secret
supabase secrets set SENDGRID_API_KEY=new_key

# Re-deploy function
supabase functions deploy send-email
```

## Troubleshooting

**Not receiving emails?**
1. Check Supabase logs: `supabase functions logs send-email`
2. Check SendGrid Activity dashboard
3. Verify sender email is verified in SendGrid
4. Confirm secrets are set: `supabase secrets list`

**403 Forbidden?**
- Your SendGrid API key needs "Mail Send" permission

**Sender not verified?**
- Complete Single Sender Verification in SendGrid
- Click the verification link in your email
