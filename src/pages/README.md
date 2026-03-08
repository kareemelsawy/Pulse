# ◈ Pulse — Setup Guide for Beginners

This guide walks you through every single step to get Pulse running locally and deployed live. No experience needed.

---

## What you'll need

- A computer with internet
- A free [Supabase](https://supabase.com) account (the database)
- A free [Vercel](https://vercel.com) account (the hosting)
- A free [GitHub](https://github.com) account (to connect Vercel)
- [Node.js](https://nodejs.org) installed on your computer (download the LTS version)

---

## Step 1 — Install Node.js (if you haven't)

1. Go to https://nodejs.org
2. Download the **LTS** version (the green button)
3. Run the installer — click Next through everything
4. To check it worked, open your terminal and type:
   ```
   node --version
   ```
   You should see something like `v20.11.0`. ✓

---

## Step 2 — Set up Supabase (your database)

1. Go to https://supabase.com and click **Start your project**
2. Sign up with GitHub or email
3. Click **New Project**
4. Fill in:
   - **Name**: `pulse` (or anything you like)
   - **Database Password**: make a strong password and save it somewhere
   - **Region**: pick the one closest to you
5. Click **Create new project** — wait about 2 minutes for it to spin up

### Create your database tables

6. In your Supabase project, click **SQL Editor** in the left sidebar
7. Click **+ New query**
8. Open the file `supabase-setup.sql` from this project
9. Copy **everything** in that file and paste it into the SQL editor
10. Click **Run** (the green button)
11. You should see "Success. No rows returned" ✓

### Enable Google login

12. In Supabase, go to **Authentication** → **Providers**
13. Find **Google** and click it
14. Toggle it **on**
15. You'll need a Google Client ID and Secret. Here's how:
    - Go to https://console.cloud.google.com
    - Create a new project (top left dropdown → New Project)
    - Search for "OAuth consent screen" → configure it (External, fill in your app name)
    - Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
    - Application type: **Web application**
    - Under **Authorized redirect URIs**, paste this (from your Supabase Auth settings page):
      `https://YOUR-PROJECT-ID.supabase.co/auth/v1/callback`
      *(You'll find the exact URL in Supabase → Authentication → Providers → Google)*
    - Click Create → copy your **Client ID** and **Client Secret**
16. Paste them into Supabase → Authentication → Google → Save

### Get your Supabase keys

17. In Supabase, go to **Settings** (gear icon) → **API**
18. You'll see two values you need:
    - **Project URL** — looks like `https://abcdefgh.supabase.co`
    - **anon public** key — a long string starting with `eyJ`
    - 📋 Copy both of these somewhere — you'll need them in a moment

---

## Step 3 — Set up the project on your computer

1. Download this project as a ZIP (or clone it if you know Git)
2. Unzip it to a folder on your Desktop, e.g. `pulse`
3. Open your **terminal**:
   - **Mac**: Press Cmd+Space, type "Terminal", press Enter
   - **Windows**: Press Win+R, type "cmd", press Enter
4. Navigate to the pulse folder. Type:
   ```
   cd Desktop/pulse
   ```
   (adjust the path if you put it somewhere else)
5. Install dependencies:
   ```
   npm install
   ```
   Wait for it to finish (might take a minute).

### Create your .env file

6. In the pulse folder, find the file called `.env.example`
7. Make a copy of it and rename the copy to `.env`
   - **Mac**: right-click → Duplicate, then rename
   - **Windows**: right-click → Copy, Paste, rename
8. Open `.env` in any text editor (Notepad works)
9. Replace the placeholder values with your Supabase values:
   ```
   VITE_SUPABASE_URL=https://abcdefgh.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
10. Save the file

### Start the app

11. Back in your terminal, run:
    ```
    npm run dev
    ```
12. Open your browser and go to: **http://localhost:5173**
13. You should see the Pulse login screen! 🎉

---

## Step 4 — Deploy to Vercel (make it live on the internet)

### Put your code on GitHub

1. Go to https://github.com and sign up / log in
2. Click **+** → **New repository**
3. Name it `pulse`, make it **Private**, click **Create repository**
4. Follow GitHub's instructions to push your local code. In your terminal:
   ```
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/pulse.git
   git push -u origin main
   ```
   *(Replace YOUR-USERNAME with your GitHub username)*

### Deploy on Vercel

5. Go to https://vercel.com and sign up with GitHub
6. Click **Add New Project**
7. Find your `pulse` repository and click **Import**
8. Under **Environment Variables**, add both keys:
   - Click **Add** for each one:
   - `VITE_SUPABASE_URL` = your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
9. Click **Deploy**
10. Wait about 1 minute — Vercel builds and deploys automatically
11. You'll get a live URL like `https://pulse-yourname.vercel.app` 🎉

### Add your live URL to Supabase

12. Copy your Vercel URL (e.g. `https://pulse-yourname.vercel.app`)
13. Go to Supabase → **Authentication** → **URL Configuration**
14. Add your Vercel URL to **Site URL**
15. Also add it to **Redirect URLs**

---

## You're live! 🚀

Every time you make changes to your code and push to GitHub:
```
git add .
git commit -m "describe your change"
git push
```
Vercel will automatically redeploy in about 60 seconds.

---

## Common problems

**"Cannot find module" error when running npm install**
→ Make sure you're in the pulse folder in your terminal. Type `ls` (Mac) or `dir` (Windows) — you should see `package.json`.

**Login doesn't work / redirects back to login**
→ Make sure your Vercel URL is added to Supabase → Authentication → URL Configuration → Site URL and Redirect URLs.

**"Missing Supabase config" warning on the login screen**
→ Your `.env` file isn't set up correctly. Make sure it's named exactly `.env` (not `.env.txt`) and has no placeholder values.

**Changes aren't showing after editing .env**
→ Stop the dev server (Ctrl+C) and start it again with `npm run dev`.

---

## Quick reference

| Command | What it does |
|---|---|
| `npm install` | Install dependencies (run once) |
| `npm run dev` | Start local development server |
| `npm run build` | Build for production |
| Ctrl+C | Stop the dev server |

---

Built with ◈ Pulse
