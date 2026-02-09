# gregory.sh

Personal website and blog for building in public.

## Stack

- **SvelteKit 5** + **mdsvex** for markdown blog posts
- **Cloudflare Pages** for hosting (static)
- **Cloudflare Workers + KV** for email capture
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
npm run dev      # Development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run check    # Type checking
```

## Unified Process

This project follows `/unified-process`. See `docs/unified-process/` for artefacts.

Current phase: **Inception**

## Issue Tracking

Uses beads. Run `bd list` to see open issues.

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
