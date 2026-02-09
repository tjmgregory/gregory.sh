# gregory.sh

Personal website and blog for building in public.

## Current Status

**Phase:** Inception → ready for Construction
**Last session:** 2026-02-09
**State:** Scaffolded, not yet runnable

### What's Done
- SvelteKit + mdsvex + Cloudflare adapter configured
- UP vision document written (`docs/unified-process/inception/vision.md`)
- Beads initialized with MVP epic and tasks
- Project structure defined

### What's NOT Done
- Dependencies not installed (`npm install` needed)
- No GitHub repo yet (need to create and push)
- No actual code written yet—just scaffold

### Next Steps
1. `npm install` to get dependencies
2. Create GitHub repo: `gh repo create tjmgregory/gregory.sh --public --source=. --push`
3. Start with `gregory.sh-85j.1` (Set up blog post loading) — this unblocks most other tasks

## Stack

- **SvelteKit 5** + **mdsvex** for markdown blog posts
- **Cloudflare Pages** for hosting (static)
- **Cloudflare Workers + KV** for email capture (self-hosted, no external deps)
- **TypeScript** throughout

## Project Structure

```
src/
  routes/
    +page.svelte          # Homepage
    blog/
      +page.svelte        # Blog index
      [slug]/+page.svelte # Individual posts
    rss.xml/+server.ts    # RSS feed
    api/
      subscribe/+server.ts # Email capture endpoint
  lib/
    posts.ts              # Post loading utilities
content/
  posts/                  # Markdown blog posts
docs/
  unified-process/        # UP artefacts
```

## Content

Blog posts live in `content/posts/` as markdown files with frontmatter:

```md
---
title: Post Title
date: 2026-02-09
description: Brief description for SEO
---

Content here...
```

## Commands

```bash
npm install      # Install dependencies (DO THIS FIRST)
npm run dev      # Development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run check    # Type checking
```

## Issue Tracking

Uses beads. Key commands:

```bash
bd list          # See all issues
bd ready         # See unblocked work
bd show <id>     # Issue details
bd update <id> --status in_progress  # Claim work
bd close <id>    # Mark done
```

**MVP Epic:** `gregory.sh-85j`
- 8 tasks, dependencies set up
- Start with `gregory.sh-85j.1` (blog post loading)

## Unified Process

Follows `/unified-process`. See `docs/unified-process/inception/vision.md` for goals.

Current phase: **Inception** (ready to move to Construction)

## Design Decisions

- **Markdown in repo** over CMS — zero external deps, git-backed, fast
- **Self-hosted email capture** over Buttondown — learning opportunity, full control
- **Static generation** over SSR — fastest possible, SEO-first
- **Minimal MVP** — ship fast, iterate in public

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
