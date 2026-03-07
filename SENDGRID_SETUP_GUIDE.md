# SendGrid Email Setup Guide for Pulse

This guide will help you migrate from Gmail to SendGrid for sending notification emails in your Pulse application.

## Prerequisites

1. A SendGrid account (free tier allows 100 emails/day)
2. Supabase project
3. Vercel account (for deployment)

---

## Step 1: SendGrid Configuration

### 1.1 Create SendGrid Account & Get API Key

1. Go to [SendGrid.com](https://sendgrid.com) and sign up for a free account
2. Complete email verification
3. Navigate to **Settings** → **API Keys**
4. Click **Create API Key**
5. Name it `Pulse Notifications`
6. Select **Full Access** (or at minimum: **Mail Send** permission)
7. Click **Create & View**
8. **IMPORTANT**: Copy the API key immediately (you won't see it again)

### 1.2 Single Sender Verification

Since you're using Single Sender Verification:

1. Go to **Settings** → **Sender Authentication** → **Single Sender Verification**
2. Click **Create New Sender**
3. Fill in the form:
   - **From Name**: `Pulse Notifications` (or your preferred name)
   - **From Email Address**: Your verified email (e.g., `notifications@yourdomain.com`)
   - **Reply To**: Same email or support email
   - **Company Address**: Your company details
4. Click **Create**
5. Check your email and click the verification link
6. Wait for verification to complete (usually instant)

**Note**: For production, you should use Domain Authentication instead for better deliverability.

---

## Step 2: Deploy Supabase Edge Function

### 2.1 Install Supabase CLI

```bash
# macOS/Linux
brew install supabase/tap/supabase

# Windows (via scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Or via npm
npm install -g supabase
```

### 2.2 Initialize Supabase in Your Project

```bash
# Navigate to your project directory
cd pulse-v8-src

# Login to Supabase
supabase login

# Link to your existing project
supabase link --project-ref YOUR_PROJECT_REF
```

To find your `PROJECT_REF`:
- Go to your Supabase dashboard
- It's in the URL: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`

### 2.3 Create the Edge Function

```bash
# Create the functions directory structure
supabase functions new send-email
```

This creates: `supabase/functions/send-email/index.ts`

Replace the contents of that file with the `send-email/index.ts` file I've provided.

### 2.4 Set Environment Variables in Supabase

```bash
# Set SendGrid API Key
supabase secrets set SENDGRID_API_KEY=your_sendgrid_api_key_here

# Set the verified sender email
supabase secrets set SENDGRID_FROM_EMAIL=notifications@yourdomain.com
```

Replace with your actual values from Step 1.

### 2.5 Deploy the Function

```bash
# Deploy the send-email function
supabase functions deploy send-email

# Verify deployment
supabase functions list
```

You should see `send-email` in the list with status `ACTIVE`.

---

## Step 3: Update Your Frontend Code

The frontend code (`src/lib/gmail.js`) doesn't need changes! It already calls the edge function correctly:

```javascript
export async function sendEmail(supabaseUrl, { to, subject, html }) {
  const fnUrl = `${supabaseUrl}/functions/v1/send-email`
  // ... rest is the same
}
```

However, you should update the hardcoded domain in `buildGuestInviteEmail`:

### Edit: `src/lib/gmail.js`

Find line 98:
```javascript
<p style="margin:20px 0 0;color:#475569;font-size:11px;text-align:center;">
  Sign in with your @homzmart.com Google account to see your assigned tasks and meetings.
</p>
```

Change to your actual domain or make it generic:
```javascript
<p style="margin:20px 0 0;color:#475569;font-size:11px;text-align:center;">
  Sign in to see your assigned tasks and meetings.
</p>
```

---

## Step 4: Vercel Configuration

### 4.1 Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add these variables (if not already present):

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Get these from: Supabase Dashboard → Settings → API

### 4.2 Deploy to Vercel

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Deploy
vercel --prod
```

Or push to your Git repository if you have automatic deployments configured.

---

## Step 5: Test the Email Function

### 5.1 Test from Supabase Dashboard

1. Go to Supabase Dashboard → **Edge Functions** → `send-email`
2. Click **Invoke Function**
3. Use this test payload:

```json
{
  "to": "your-email@example.com",
  "subject": "Test Email from Pulse",
  "html": "<h1>Hello!</h1><p>This is a test email from Pulse using SendGrid.</p>"
}
```

4. Click **Invoke**
5. Check your email inbox

### 5.2 Test from Your Application

1. Log in to your Pulse application
2. Create or update a task that triggers a notification
3. Check the recipient's email
4. Check Supabase logs: Dashboard → Edge Functions → send-email → Logs

---

## Troubleshooting

### Email Not Sending

1. **Check Supabase Logs**:
   ```bash
   supabase functions logs send-email
   ```
   
2. **Verify Secrets Are Set**:
   ```bash
   supabase secrets list
   ```
   You should see `SENDGRID_API_KEY` and `SENDGRID_FROM_EMAIL`

3. **Check SendGrid Activity**:
   - Go to SendGrid Dashboard → Activity
   - Look for recent send attempts and any errors

### Common Errors

**"Email service not configured"**
- Solution: Set the environment variables in Supabase secrets

**"Sender address not verified"**
- Solution: Complete Single Sender Verification in SendGrid
- Make sure `SENDGRID_FROM_EMAIL` matches the verified email exactly

**"Invalid API Key"**
- Solution: Regenerate API key in SendGrid and update the secret

**CORS errors**
- Solution: The function includes CORS headers, but ensure your frontend URL is correct

### Rate Limits

- **SendGrid Free Tier**: 100 emails/day
- **Supabase Edge Functions**: 500K invocations/month (free tier)

If you need more, upgrade your SendGrid plan.

---

## Optional: Upgrade to Domain Authentication

For better email deliverability in production:

1. Go to SendGrid → Settings → Sender Authentication → Authenticate Your Domain
2. Follow the DNS setup wizard
3. Add the provided DNS records to your domain registrar
4. Verify the domain
5. Update `SENDGRID_FROM_EMAIL` to use your domain (e.g., `notifications@yourdomain.com`)

---

## File Structure

After setup, your project should have:

```
pulse-v8-src/
├── supabase/
│   └── functions/
│       └── send-email/
│           └── index.ts          # SendGrid edge function
├── src/
│   └── lib/
│       └── gmail.js              # Email templates & sender (no changes needed)
├── .env                          # Local env vars (don't commit!)
└── .env.example                  # Updated with new vars
```

---

## Security Notes

1. **Never commit** your SendGrid API key or `.env` file to Git
2. Use `.env.example` for documentation only
3. Rotate API keys regularly
4. Use domain authentication in production for better security

---

## Support

If you encounter issues:

1. Check Supabase Edge Function logs
2. Check SendGrid Activity feed
3. Verify all environment variables are set correctly
4. Test the edge function directly from Supabase dashboard

---

## Next Steps

Once email is working:

1. Configure notification settings in your Pulse app
2. Test all notification triggers (task assigned, status changed, etc.)
3. Monitor SendGrid usage to ensure you don't hit rate limits
4. Consider upgrading SendGrid plan if needed
5. Set up domain authentication for production

---

**You're all set!** Your Pulse application now sends emails via SendGrid instead of Gmail.
