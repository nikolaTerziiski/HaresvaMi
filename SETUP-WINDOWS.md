# Setup Guide — Windows

> Step-by-step to go from "downloaded the starter pack" to "Claude Code building HaresvaMi."

## Prerequisites

You need these installed:

### 1. Node.js 20 LTS or newer
Check: `node --version` (should be v20.x or v22.x)
Install if needed: https://nodejs.org/en/download → Windows installer

### 2. Git
Check: `git --version`
Install if needed: https://git-scm.com/download/win

### 3. A terminal
**Recommended:** Windows Terminal (free from Microsoft Store)
Alternative: PowerShell that comes with Windows

### 4. VS Code (or your editor of choice)
Download: https://code.visualstudio.com/

## Step 1 — Set up the project folder

Open Windows Terminal (or PowerShell):

```powershell
# Go to wherever you keep your dev projects
cd C:\Users\YOUR_USER\Projects

# Create the project folder
mkdir haresvami
cd haresvami

# Initialize git
git init
```

## Step 2 — Drop in the starter pack files

Copy these files from the starter pack into `C:\Users\YOUR_USER\Projects\haresvami\`:

```
haresvami/
├── CLAUDE.md
├── KICKOFF-PROMPT.md
├── SETUP-WINDOWS.md  (this file)
└── docs/
    ├── 00-product.md
    ├── 01-architecture.md
    ├── 02-schema.md
    ├── 03-design-system.md
    ├── 04-business-logic.md
    ├── 05-i18n.md
    └── 06-deployment.md
```

**Verify in PowerShell:**
```powershell
ls
# Should show: CLAUDE.md, KICKOFF-PROMPT.md, SETUP-WINDOWS.md, docs/
```

## Step 3 — First git commit

```powershell
git add .
git commit -m "Add project documentation and kickoff plan"
```

## Step 4 — Install Claude Code

```powershell
npm install -g @anthropic-ai/claude-code
```

**Verify:**
```powershell
claude --version
```

If you get "command not found" after install, restart your terminal.

## Step 5 — Authenticate Claude Code

```powershell
claude
```

First run will prompt you to log in via browser. Complete the OAuth flow.

You should see Claude Code's interactive prompt waiting for input.

## Step 6 — Start building

Open `KICKOFF-PROMPT.md` in your editor, copy the entire content (everything below the "---" line).

Paste it as your first message in Claude Code.

Claude will:
1. Read all the docs
2. Confirm understanding back to you
3. Wait for your "go ahead"
4. Then scaffold the entire Phase 0 project

Once scaffolding is done, Claude will tell you:
- What env vars to set
- What to do on supabase.com
- How to verify it works

## Step 7 — Set up Supabase

Follow the instructions in `docs/06-deployment.md` section "Initial setup steps":
1. Create Supabase project (Frankfurt region)
2. Apply migrations from `supabase/migrations/` (Claude will create these in Step 6)
3. Create storage buckets
4. Configure auth provider

Copy the env vars into `.env.local` (Claude will create the `.env.example` template).

## Step 8 — Get Gemini API key

1. Go to https://ai.google.dev/
2. Click "Get API key"
3. Create new project: "haresvami"
4. Copy the key
5. Add to `.env.local` as `GOOGLE_GEMINI_API_KEY=...`

## Step 9 — Verify everything works

```powershell
npm run dev
```

Open `http://localhost:3000` — you should see the default Next.js page styled with our coral colors and Manrope font.

If yes: Phase 0 is complete. Tell Claude "Phase 0 verified, begin Phase 1 — Auth + Onboarding."

If no: paste the error into Claude and it will help debug.

## Step 10 — Set up GitHub (recommended)

```powershell
# Create a new private repo at github.com/new
# Name it "haresvami"
# Don't initialize with README (we already have files)

# Then in your local terminal:
git remote add origin https://github.com/YOUR_USERNAME/haresvami.git
git branch -M main
git push -u origin main
```

From now on, commit regularly:
```powershell
git add .
git commit -m "Phase 1: Auth pages complete"
git push
```

## Daily workflow

Each day you sit down to build:

```powershell
cd C:\Users\YOUR_USER\Projects\haresvami
claude
```

In Claude Code, your first message of the session should be:
```
Continuing HaresvaMi work. Read CLAUDE.md to refresh context.
We're currently on [Phase X — what we're doing].
Last session we finished [...]. 
Today let's [...].
```

Claude will pick up where you left off with full context.

## Common gotchas on Windows

### "npm install" is slow or hangs
Try: `npm install --no-audit --prefer-offline`

### Permission errors
Run terminal as Administrator OR install npm packages without `-g` (use `npx` instead)

### Path with spaces in username
If your Windows username has spaces ("John Smith"), Node.js sometimes struggles. Move project to `C:\Projects\haresvami` to avoid the user folder entirely.

### Long file paths
Windows has a 260-char path limit by default. Enable long paths:
```powershell
# As admin:
git config --system core.longpaths true
```

### PowerShell execution policy
If scripts won't run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## What to do when you hit a wall

In Claude Code, just describe the problem. Examples:

> "I'm getting a TypeScript error on line 45 of menu/page.tsx — paste of error"

> "The kiosk camera isn't opening on my Samsung tablet. What should I check?"

> "Supabase auth is redirecting to localhost in production. How do I fix this?"

Claude has all the project context — it knows our architecture, our schema, our design system. Use that.

## When in doubt

- Don't add packages without checking with Claude first
- Commit before any big change ("commit early, commit often")
- If you're not sure what phase you're in, ask Claude to read `CLAUDE.md` and tell you

Good luck. Ship it.
