# Kickoff Prompt — Paste this as your FIRST message in Claude Code

---

Hi! This is the start of the HaresvaMi project. Before doing anything:

1. Read `CLAUDE.md` in the project root — this is the master context file.
2. Read all files in the `docs/` directory in order (00 through 06).
3. Confirm to me that you've read them by summarizing in 3-4 sentences:
   - What HaresvaMi is
   - The tech stack
   - The current phase we're in
   - The build order for Phase 0

Do NOT start writing code yet. Just confirm understanding.

After my confirmation, your task is **Phase 0: Foundation Setup** as described in `docs/01-architecture.md` section "Build order (Phase 0)".

You will:

1. Initialize the Next.js 15 project in this directory
2. Install all dependencies listed
3. Set up shadcn/ui with our customized base
4. Create the Supabase client files
5. Configure design tokens (coral palette + Manrope font) per `docs/03-design-system.md`
6. Set up i18n with `next-intl`
7. Create the SQL migration files in `supabase/migrations/` per `docs/02-schema.md`
8. Create the PWA manifest
9. Set up the basic folder structure under `app/`, `components/`, `lib/`

Do NOT yet:

- Build any pages (auth, dashboard, kiosk) — that's Phase 1
- Connect to Supabase (I'll create the project and add env vars first)
- Write any business logic

After scaffold is done, give me a clear list of:

- What to do on supabase.com (create project, run migrations, etc.)
- What env vars to add to `.env.local`
- The exact command to run to verify everything works (`npm run dev`)

Work in small commits. Use git. Commit after each major step (project init, deps installed, shadcn ready, design tokens applied, i18n configured, migrations written, PWA ready).

Begin.
