# Personal Portfolio Site

A full-featured personal website built with **React + Vite**, hosted free on **Vercel**.
Includes resume, projects, todo list, GitHub contributions, and LeetCode stats — all on the free tier.

## Stack

| Layer | Service | Free tier |
|---|---|---|
| Frontend | React + Vite (this repo) | — |
| Hosting + CI/CD | Vercel | ✅ unlimited deploys |
| Serverless API | Vercel Functions | ✅ 100k req/month |
| Database (todos) | Supabase (PostgreSQL) | ✅ 500 MB |
| GitHub data | GitHub REST API (public) | ✅ no key needed |
| LeetCode data | LeetCode GraphQL (proxied) | ✅ public |

---

## Local development

```bash
# 1. Clone & install
git clone https://github.com/yourusername/personal-site
cd personal-site
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Open .env.local and fill in your values (see below)

# 3. Run dev server
npm run dev
# → http://localhost:5173
```

---

## Environment variables

Create `.env.local` (already gitignored):

```
VITE_GITHUB_USERNAME=yourusername
VITE_LEETCODE_USERNAME=yourleetcode
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Where to get each value

**GitHub username** — just your GitHub handle, e.g. `torvalds`

**LeetCode username** — your LeetCode profile handle

**Supabase URL + Anon Key**:
1. Go to https://supabase.com → New project (free)
2. Wait ~2 min for provisioning
3. Dashboard → Settings → API
4. Copy "Project URL" → `VITE_SUPABASE_URL`
5. Copy "anon public" key → `VITE_SUPABASE_ANON_KEY`

---

## Supabase: create the todos table

1. Supabase dashboard → SQL Editor → New query
2. Paste the contents of `supabase_migration.sql`
3. Click Run

---

## Deploy to Vercel (free, auto-deploys on git push)

### First deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy (follow prompts — framework preset: Vite)
vercel

# Set environment variables (do this once)
vercel env add VITE_GITHUB_USERNAME
vercel env add VITE_LEETCODE_USERNAME
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

### Connect to GitHub for auto-deploy

1. Push your repo to GitHub
2. Go to https://vercel.com/new
3. Import your GitHub repo
4. Add environment variables in the Vercel dashboard UI
5. Every `git push` to `main` auto-deploys 🎉

Your site will be live at `https://yourname.vercel.app` (or a custom domain).

---

## Customising content

| What to change | File |
|---|---|
| Your name, bio, social links | `src/pages/Home.jsx` |
| Work experience, education, skills | `src/pages/Resume.jsx` |
| Projects list | `src/pages/Projects.jsx` |
| Color accent / fonts | `tailwind.config.js` + `src/styles/index.css` |
| Nav items | `src/components/Layout.jsx` |

### Add a PDF resume

Drop your `resume.pdf` in the `public/` folder. The download button in `Resume.jsx`
already points to `/resume.pdf`.

---

## Project structure

```
personal-site/
├── api/
│   └── leetcode.js          # Vercel serverless function (LeetCode proxy)
├── public/
│   └── resume.pdf           # Drop your PDF here
├── src/
│   ├── components/
│   │   └── Layout.jsx       # Sidebar nav
│   ├── pages/
│   │   ├── Home.jsx         # Landing page with typewriter
│   │   ├── Resume.jsx       # Experience, education, skills
│   │   ├── Projects.jsx     # Filterable project cards
│   │   ├── Todo.jsx         # Todo list (Supabase-backed)
│   │   └── Stats.jsx        # GitHub calendar + LeetCode stats
│   ├── styles/
│   │   └── index.css        # Tailwind + global styles
│   ├── App.jsx              # Router
│   └── main.jsx             # Entry point
├── .env.example             # Copy to .env.local
├── supabase_migration.sql   # Run once in Supabase SQL Editor
├── vercel.json              # SPA routing + API headers
├── tailwind.config.js
├── vite.config.js
└── package.json
```

---

## Adding more coding profiles later

To add **Codeforces**:
1. Create `api/codeforces.js` (fetch `https://codeforces.com/api/user.info?handles=USERNAME`)
2. Add a `CodeforcesStats` component in `src/pages/Stats.jsx`
3. Add `VITE_CF_USERNAME` to `.env.local` and Vercel env vars

Same pattern works for HackerRank, CodeChef, etc.

---

## Upgrading the Todo to require login

Currently the todo list is public (anyone with your URL can read/write).
To add auth:
1. Supabase → Authentication → enable Email provider
2. Wrap `<Todo />` in an auth guard component
3. Update the RLS policy to `auth.uid() is not null`

Supabase Auth is free for up to 50,000 monthly active users.
