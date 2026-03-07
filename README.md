# Pulse - Project Management App

A modern project management application built with React, Supabase, and SendGrid.

## Features

- ✅ Task management with assignments, priorities, and due dates
- ✅ Project organization
- ✅ Meeting minutes with action items
- ✅ Guest user access for external collaborators
- ✅ Email notifications via SendGrid
- ✅ File attachments
- ✅ Real-time updates
- ✅ Team analytics
- ✅ Dark theme UI

## Tech Stack

- **Frontend**: React + Vite
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (Google OAuth)
- **Email**: SendGrid
- **Deployment**: Vercel

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd pulse
npm install
```

### 2. Set Up Supabase

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Run the setup script
chmod +x setup-supabase.sh
./setup-supabase.sh
```

The script will:
- Link your Supabase project
- Deploy the database schema
- Deploy the send-email edge function
- Create your .env file

### 3. Configure SendGrid

1. **Get SendGrid API Key**:
   - Sign up at [sendgrid.com](https://sendgrid.com)
   - Go to Settings → API Keys
   - Create API Key with "Mail Send" permission

2. **Verify Sender Email**:
   - Go to Settings → Sender Authentication → Single Sender Verification
   - Add and verify your email address

3. **Set Supabase Secrets**:
   ```bash
   supabase secrets set SENDGRID_API_KEY=your_api_key_here
   supabase secrets set SENDGRID_FROM_EMAIL=verified@yourdomain.com
   ```

4. **Configure in App**:
   - Start the dev server: `npm run dev`
   - Go to Settings → Notifications
   - Enter your verified sender email
   - Click "Send Test Email" to verify

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173`

## Environment Variables

Create a `.env` file in the root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Get these from: Supabase Dashboard → Settings → API

## Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

Or connect your GitHub repo to Vercel for automatic deployments.

**Environment Variables in Vercel**:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Project Structure

```
pulse/
├── src/
│   ├── components/       # React components
│   ├── contexts/         # React contexts (Auth, Data, Theme)
│   ├── pages/           # Application pages
│   ├── lib/             # Utilities and database functions
│   │   ├── gmail.js     # Email templates
│   │   ├── supabase.js  # Supabase client
│   │   └── db/          # Database operations
│   └── ...
├── supabase/
│   ├── functions/
│   │   └── send-email/  # SendGrid email edge function
│   └── schema.sql       # Database schema
├── setup-supabase.sh    # Automated setup script
└── package.json
```

## Database Schema

Tables:
- `workspaces` - Organization/team data
- `workspace_members` - Team members and roles
- `projects` - Project containers
- `tasks` - Task items
- `meetings` - Meeting minutes
- `guests` - External collaborators
- `notif_settings` - Notification preferences
- `notif_logs` - Notification history

All tables have Row Level Security (RLS) enabled.

## Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build

# Supabase
supabase functions deploy send-email    # Deploy edge function
supabase functions logs send-email      # View logs
supabase secrets list                   # List secrets
supabase db push                        # Push schema changes
```

## Configuration

### SendGrid Setup

1. Create account at [sendgrid.com](https://sendgrid.com)
2. Verify sender email
3. Get API key
4. Set Supabase secrets
5. Configure in app Settings

### Google OAuth Setup

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Google provider
3. Add OAuth credentials
4. Configure redirect URL

## Troubleshooting

### Emails Not Sending

Check Supabase logs:
```bash
supabase functions logs send-email
```

Verify secrets are set:
```bash
supabase secrets list
```

### Database Connection Issues

- Verify `VITE_SUPABASE_URL` in .env
- Check Supabase project is active
- Ensure you're logged in: `supabase login`

### Build Errors

```bash
npm install
npm run build
```

## License

Private project. All rights reserved.

## Support

For issues or questions:
1. Check Supabase logs: `supabase functions logs send-email`
2. Verify secrets: `supabase secrets list`
3. Check SendGrid Activity dashboard
