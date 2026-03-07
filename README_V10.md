# Pulse v10 - Complete Package

Welcome to Pulse v10! This package includes everything you need to deploy your Pulse project management application with Supabase and SendGrid email notifications.

## 📦 What's Included

```
pulse-v10/
├── 📁 src/                          # Frontend application code
│   ├── components/                  # React components
│   ├── contexts/                    # React contexts (Auth, Data, Theme)
│   ├── pages/                       # Application pages
│   ├── lib/                         # Utilities and database functions
│   │   ├── gmail.js                 # Email templates and sender
│   │   ├── supabase.js             # Supabase client
│   │   └── db/                      # Database operations
│   └── ...
├── 📁 supabase/                     # Supabase configuration
│   ├── functions/
│   │   └── send-email/
│   │       └── index.ts             # SendGrid email edge function
│   └── schema.sql                   # Complete database schema
├── 🔧 setup-supabase.sh             # Automated Supabase setup script
├── 📄 SENDGRID_SETUP_GUIDE.md       # Detailed setup instructions
├── 📄 QUICK_SETUP_CHECKLIST.md      # Quick reference guide
├── 📄 TROUBLESHOOTING.md            # Common issues & solutions
├── 📄 .env.example                  # Environment variables template
├── 📄 test-email-payload.json       # Test payload for emails
├── 📄 package.json                  # Dependencies
└── 📄 vite.config.js                # Vite configuration
```

## 🚀 Quick Start (30 minutes)

### Prerequisites

Before you begin, ensure you have:

1. **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
2. **Supabase account** - [Sign up](https://supabase.com)
3. **SendGrid account** - [Sign up](https://sendgrid.com)
4. **Vercel account** (optional, for deployment) - [Sign up](https://vercel.com)

### Step 1: Install Dependencies (2 minutes)

```bash
cd pulse-v10
npm install

# Install Supabase CLI globally
npm install -g supabase
```

### Step 2: Set Up Supabase (10 minutes)

**Option A: Automated Setup (Recommended)**

```bash
chmod +x setup-supabase.sh
./setup-supabase.sh
```

The script will guide you through:
- Linking your Supabase project
- Deploying the database schema
- Configuring SendGrid
- Creating your .env file
- Testing the email function

**Option B: Manual Setup**

See `SENDGRID_SETUP_GUIDE.md` for detailed step-by-step instructions.

### Step 3: Configure SendGrid (5 minutes)

If you skipped SendGrid during the automated setup:

1. **Get SendGrid API Key**:
   - Go to [SendGrid](https://sendgrid.com) → Settings → API Keys
   - Create API Key with "Mail Send" permission
   - Copy the key

2. **Verify Sender Email**:
   - Go to Settings → Sender Authentication → Single Sender Verification
   - Add and verify your email address

3. **Set Supabase Secrets**:
   ```bash
   supabase secrets set SENDGRID_API_KEY=your_api_key_here
   supabase secrets set SENDGRID_FROM_EMAIL=verified@yourdomain.com
   ```

4. **Deploy Email Function**:
   ```bash
   supabase functions deploy send-email
   ```

### Step 4: Run Locally (3 minutes)

```bash
# Make sure .env file exists (created by setup script or manually)
# Then start the dev server
npm run dev
```

Visit `http://localhost:5173` to see your application!

### Step 5: Deploy to Vercel (10 minutes)

1. **Install Vercel CLI** (optional):
   ```bash
   npm install -g vercel
   ```

2. **Set Environment Variables in Vercel**:
   - Go to your Vercel project → Settings → Environment Variables
   - Add:
     - `VITE_SUPABASE_URL` = your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key

3. **Deploy**:
   ```bash
   vercel --prod
   ```
   
   Or push to GitHub/GitLab and let Vercel auto-deploy.

## 🎯 Features

- ✅ **Task Management** - Create, assign, and track tasks
- ✅ **Project Organization** - Organize tasks into projects
- ✅ **Meeting Minutes** - Document meetings and action items
- ✅ **Guest Access** - Assign tasks to non-workspace users
- ✅ **Email Notifications** - SendGrid-powered notifications
- ✅ **Real-time Updates** - Supabase real-time subscriptions
- ✅ **File Attachments** - Upload files to tasks
- ✅ **Dark Theme** - Beautiful dark UI
- ✅ **Analytics** - Track team productivity

## 📖 Documentation

| Document | Description |
|----------|-------------|
| `SENDGRID_SETUP_GUIDE.md` | Complete step-by-step setup guide |
| `QUICK_SETUP_CHECKLIST.md` | Fast reference checklist |
| `TROUBLESHOOTING.md` | Solutions for common issues |
| `ARCHITECTURE.md` | Application architecture overview |

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Get these from: Supabase Dashboard → Settings → API

### Supabase Secrets (for Edge Functions)

```bash
# Set via Supabase CLI
supabase secrets set SENDGRID_API_KEY=SG.xxxxx
supabase secrets set SENDGRID_FROM_EMAIL=verified@domain.com
```

## 🧪 Testing

### Test Email Function

```bash
# Via Supabase CLI
supabase functions invoke send-email --body '{
  "to": "your-email@example.com",
  "subject": "Test",
  "html": "<h1>Hello!</h1>"
}'

# Or use the test payload file
supabase functions invoke send-email --body "$(cat test-email-payload.json)"
```

### Test in Application

1. Create a new task
2. Assign it to a user
3. Check if notification email arrives
4. View logs: `supabase functions logs send-email`

## 🛠️ Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy Supabase functions
supabase functions deploy send-email

# View function logs
supabase functions logs send-email

# List Supabase secrets
supabase secrets list
```

## 📊 Database Schema

The database includes these main tables:

- **workspaces** - Workspace/organization data
- **workspace_members** - Team members and roles
- **projects** - Project containers
- **tasks** - Task items with status, priority, assignees
- **meetings** - Meeting minutes and action items
- **guests** - External collaborators
- **notif_settings** - Notification preferences
- **notif_logs** - Email notification history

All tables have Row Level Security (RLS) enabled for data protection.

See `supabase/schema.sql` for the complete schema.

## 🐛 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| "Email service not configured" | Run `supabase secrets set SENDGRID_API_KEY=...` |
| Emails not arriving | Check SendGrid Activity dashboard |
| "Sender not verified" | Complete Single Sender Verification in SendGrid |
| Database connection errors | Check VITE_SUPABASE_URL in .env |
| Build errors | Run `npm install` and check Node.js version |

See `TROUBLESHOOTING.md` for detailed solutions.

## 🔒 Security

- ✅ Row Level Security (RLS) enabled on all tables
- ✅ API keys stored in Supabase secrets (not in code)
- ✅ .env files excluded from Git (.gitignore)
- ✅ User authentication via Supabase Auth

## 📈 Scaling

### SendGrid Limits

| Plan | Emails/Day | Price |
|------|------------|-------|
| Free | 100 | $0 |
| Essentials | 100,000 | $19.95/mo |
| Pro | 1,500,000 | $89.95/mo |

### Supabase Limits

| Plan | Database | Storage | Edge Functions |
|------|----------|---------|----------------|
| Free | 500 MB | 1 GB | 500K invocations/mo |
| Pro | 8 GB | 100 GB | 2M invocations/mo |

## 🤝 Support

Need help? Check these resources:

1. **Documentation**: Read the included guides first
2. **Supabase Docs**: https://supabase.com/docs
3. **SendGrid Docs**: https://docs.sendgrid.com
4. **Logs**: `supabase functions logs send-email`

## 🚀 Deployment Checklist

Before going live:

- [ ] Database schema deployed
- [ ] SendGrid configured with Domain Authentication (not just Single Sender)
- [ ] Environment variables set in Vercel
- [ ] Email notifications tested
- [ ] RLS policies verified
- [ ] File attachments tested
- [ ] Guest access tested
- [ ] Mobile responsiveness checked

## 📝 License

This is a private project. Customize as needed for your organization.

## 🎉 You're Ready!

Your Pulse application is set up and ready to use. Start by:

1. Creating your first workspace
2. Inviting team members
3. Creating projects
4. Assigning tasks
5. Sending your first notification email!

For detailed setup instructions, run `./setup-supabase.sh` or see `SENDGRID_SETUP_GUIDE.md`.

---

**Need help?** Check `TROUBLESHOOTING.md` or run `./setup-supabase.sh` for an interactive setup experience.
