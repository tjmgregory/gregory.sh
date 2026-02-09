# gregory.sh

Personal website and blog for building in public.

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
bun install              # Install dependencies
bun run dev:port <port>  # Development server (REQUIRED: specify port)
bun run build            # Build for production
bun run preview          # Preview production build
bun run check            # Type checking
bun run test             # Run tests in watch mode
bun run test:run         # Run tests once
```

## Dev Server & Port Management

**CRITICAL: Multi-worktree port allocation is mandatory.**

Since this repo uses worktrees, multiple dev servers may run simultaneously. Each worktree MUST use a unique port.

### Port Allocation

| Location | Port |
|----------|------|
| Main checkout (read-only) | 5173 (reserved, don't use) |
| First worktree | 5180 |
| Second worktree | 5181 |
| Third worktree | 5182 |
| ... | 518N |

### Starting the Dev Server

```bash
# Always specify a port explicitly
bun run dev:port 5180
```

The server will fail if the port is in use—choose the next available port.

### Playwright / Browser Automation

When using Playwright MCP or browser automation:

1. **Start the dev server first** and note the port
2. **Use that port in all browser interactions**

```bash
# Example: Start dev server
bun run dev:port 5180 &

# Then navigate Playwright to:
# http://localhost:5180
```

**IMPORTANT:** Store the port you're using and reference it for ALL browser_navigate calls. Do not assume port 5173.

## Issue Tracking

**Use beads to find work.** Run `bd ready` to see unblocked tasks.

```bash
bd ready                              # Find work with no blockers
bd list                               # See all issues
bd show <id>                          # Issue details
bd update <id> --status in_progress   # Claim work
bd close <id>                         # Mark done
```

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
