# Pulse — Security & Production Checklist

## Environment Variables (never commit .env)
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

## Supabase RLS (Row-Level Security)
Ensure ALL tables have RLS enabled:
- `workspaces` — members can read their own workspace
- `workspace_members` — members can read same-workspace rows
- `workspace_invitations` — workspace admins can insert; recipients can read by email
- `projects` — workspace members only
- `tasks` — workspace members only
- `task_comments` — workspace members only
- `task_attachments` — workspace members only
- `project_meetings` — workspace members only
- `notif_settings` — workspace admins only
- `notif_logs` — workspace admins only

## workspace_invitations table (run in Supabase SQL editor)
```sql
CREATE TABLE IF NOT EXISTS workspace_invitations (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  email            text NOT NULL,
  role             text NOT NULL DEFAULT 'member' CHECK (role IN ('admin','member','viewer')),
  access_projects  boolean DEFAULT true,
  access_tasks     boolean DEFAULT true,
  access_meetings  boolean DEFAULT true,
  invited_at       timestamptz DEFAULT now(),
  status           text DEFAULT 'pending' CHECK (status IN ('pending','accepted','expired')),
  UNIQUE(workspace_id, email)
);

ALTER TABLE workspace_invitations ENABLE ROW LEVEL SECURITY;

-- Workspace members can view invitations for their workspace
CREATE POLICY "members_see_invites" ON workspace_invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = workspace_invitations.workspace_id
        AND user_id = auth.uid()
    )
  );

-- Workspace admins can create invitations
CREATE POLICY "admins_create_invites" ON workspace_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = workspace_invitations.workspace_id
        AND user_id = auth.uid()
        AND role = 'admin'
    )
  );

-- Admins can update/delete invitations
CREATE POLICY "admins_manage_invites" ON workspace_invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = workspace_invitations.workspace_id
        AND user_id = auth.uid()
        AND role = 'admin'
    )
  );
```

## Hosting (Vercel / Netlify)
Set these security headers in vercel.json or netlify.toml:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" }
      ]
    }
  ]
}
```

## Auth
- Password minimum: 8 characters (enforced client-side + Supabase)
- Email confirmation: enable in Supabase Auth settings
- JWT expiry: default 1 hour with refresh tokens

## API Keys
- Supabase anon key is public — ensure RLS protects all tables
- Resend API key stored in notif_settings (DB) — never in client env vars
- Never commit API keys to git — .env is in .gitignore
