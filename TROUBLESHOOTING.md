# SendGrid Email Troubleshooting Guide

## 🔍 Diagnostic Steps

### 1. Check Supabase Edge Function Logs

```bash
# View recent logs
supabase functions logs send-email

# Follow logs in real-time
supabase functions logs send-email --follow
```

Look for error messages like:
- `SendGrid not configured`
- `Invalid email address`
- `Failed to send email`

### 2. Verify Secrets Are Set

```bash
supabase secrets list
```

You should see:
- `SENDGRID_API_KEY`
- `SENDGRID_FROM_EMAIL`

If missing, set them:
```bash
supabase secrets set SENDGRID_API_KEY=your_key
supabase secrets set SENDGRID_FROM_EMAIL=your_email
```

### 3. Check SendGrid Activity

1. Login to SendGrid
2. Go to **Activity** in the left sidebar
3. Look for recent email attempts
4. Check for:
   - Delivered ✅
   - Processed ⏳
   - Bounced ❌
   - Blocked 🚫

---

## ❌ Common Errors & Solutions

### Error: "Email service not configured"

**Cause**: Environment variables not set in Supabase Edge Function

**Solution**:
```bash
supabase secrets set SENDGRID_API_KEY=your_actual_key
supabase secrets set SENDGRID_FROM_EMAIL=verified@email.com
supabase functions deploy send-email
```

---

### Error: "The from address does not match a verified Sender Identity"

**Cause**: The email in `SENDGRID_FROM_EMAIL` is not verified in SendGrid

**Solution**:
1. Go to SendGrid → Settings → Sender Authentication → Single Sender Verification
2. Make sure you have a verified sender
3. Click the verification link in your email if pending
4. Update the secret to match exactly:
   ```bash
   supabase secrets set SENDGRID_FROM_EMAIL=exact-verified@email.com
   ```

---

### Error: "Unauthorized" or "403 Forbidden"

**Cause**: API Key is invalid or doesn't have Mail Send permission

**Solution**:
1. Go to SendGrid → Settings → API Keys
2. Create a new API Key with **Full Access** or **Mail Send** permission
3. Update the secret:
   ```bash
   supabase secrets set SENDGRID_API_KEY=SG.new_key_here
   supabase functions deploy send-email
   ```

---

### Error: "Invalid email address"

**Cause**: Email format validation failed

**Solution**:
- Ensure the email address is valid: `user@domain.com`
- Check for extra spaces or special characters
- Test with a known good email address

---

### Error: CORS / Network Issues

**Cause**: Frontend can't reach the Supabase Edge Function

**Solution**:
1. Check your `VITE_SUPABASE_URL` in Vercel environment variables
2. Ensure it matches your Supabase project URL
3. Verify the Edge Function is deployed:
   ```bash
   supabase functions list
   ```
4. Check CORS headers are included (they are in the provided code)

---

### Emails Not Arriving in Inbox

**Possible Causes & Solutions**:

1. **Check Spam Folder**
   - SendGrid emails may initially go to spam
   - Mark as "Not Spam" to train filters

2. **Rate Limits Hit**
   - SendGrid Free: 100 emails/day
   - Check usage in SendGrid Dashboard → Activity
   - Upgrade plan if needed

3. **Sender Reputation**
   - New SendGrid accounts may have deliverability issues initially
   - Send a few test emails to establish reputation
   - Consider Domain Authentication for better deliverability

4. **Email Blocked by Recipient**
   - Check SendGrid Activity for "Blocked" status
   - Recipient's email provider may have restrictions
   - Try a different test email address

---

## 🧪 Testing Checklist

### Test 1: Direct Edge Function Test

```bash
# Get your Supabase URL and ANON key
# From: Supabase Dashboard → Settings → API

curl -X POST \
  'https://your-project.supabase.co/functions/v1/send-email' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -d '{
    "to": "test@example.com",
    "subject": "Test",
    "html": "<h1>Hello</h1>"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Email sent successfully",
  "to": "test@example.com"
}
```

### Test 2: Via Supabase Dashboard

1. Go to Supabase Dashboard → Edge Functions → send-email
2. Click **Invoke Function**
3. Use payload from `test-email-payload.json`
4. Click **Invoke**
5. Check response and email inbox

### Test 3: Via Your Application

1. Deploy to Vercel
2. Create a task and assign it to someone
3. Check if notification email arrives
4. Check Supabase logs for any errors

---

## 🔧 Advanced Debugging

### Enable Detailed Logging

Edit `supabase/functions/send-email/index.ts` to add more logging:

```typescript
console.log('Request received:', { to, subject })
console.log('SendGrid response status:', sendGridResponse.status)
console.log('SendGrid response:', await sendGridResponse.text())
```

Then redeploy:
```bash
supabase functions deploy send-email
```

### Check Network Connectivity

Test if Supabase can reach SendGrid:

```typescript
// Add to the edge function for debugging
const testResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
  method: 'GET',
  headers: { 'Authorization': `Bearer ${SENDGRID_API_KEY}` }
})
console.log('SendGrid API reachable:', testResponse.status)
```

### Verify Supabase Edge Function Deployment

```bash
# List all functions
supabase functions list

# Check specific function details
supabase functions describe send-email

# View deployment history
supabase functions deploy send-email --dry-run
```

---

## 📊 Monitoring & Logs

### Real-time Monitoring

```bash
# Watch logs live
supabase functions logs send-email --follow

# Filter by error level
supabase functions logs send-email --level error
```

### SendGrid Analytics

Monitor in SendGrid Dashboard:
- **Statistics** → Overview of all sends
- **Activity** → Individual email events
- **Suppressions** → Bounces and unsubscribes

---

## 🚨 Production Checklist

Before going live:

- [ ] Domain Authentication configured (not just Single Sender)
- [ ] Sender reputation established (send some test emails first)
- [ ] Rate limits appropriate for your volume
- [ ] Error handling tested
- [ ] Logs monitored regularly
- [ ] Backup notification method available
- [ ] Email templates tested across clients (Gmail, Outlook, etc.)

---

## 🆘 Still Having Issues?

If none of the above solutions work:

1. **Check Supabase Status**: https://status.supabase.com
2. **Check SendGrid Status**: https://status.sendgrid.com
3. **Review Logs**:
   ```bash
   supabase functions logs send-email --level error --limit 50
   ```
4. **Test with curl**: Use the Test 1 command above
5. **Create a minimal test case**: Strip down to the simplest possible email
6. **Check Supabase Community**: https://github.com/supabase/supabase/discussions

---

## 📞 Support Resources

- **Supabase Docs**: https://supabase.com/docs/guides/functions
- **SendGrid Docs**: https://docs.sendgrid.com/
- **Supabase Discord**: https://discord.supabase.com
- **SendGrid Support**: support@sendgrid.com

---

## 🔑 Key Files & Locations

```
Project Structure:
├── supabase/functions/send-email/index.ts    # Edge function code
├── src/lib/gmail.js                          # Email templates & sender
├── .env                                       # Local environment (not committed)
└── SENDGRID_SETUP_GUIDE.md                   # Full setup guide

Supabase:
- Secrets: Dashboard → Settings → Edge Functions → Secrets
- Logs: Dashboard → Edge Functions → send-email → Logs
- Invoke: Dashboard → Edge Functions → send-email → Invoke

SendGrid:
- API Keys: Settings → API Keys
- Sender Auth: Settings → Sender Authentication
- Activity: Activity (main navigation)
```

---

**Remember**: Most issues are due to incorrect API keys or unverified sender emails. Double-check these first!
