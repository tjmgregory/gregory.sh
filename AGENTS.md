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
    newsroom/              # Client for the newsroom lists API (see below)
content/
  posts/<year>/<month>/   # Markdown blog posts, filed by year and month
docs/
  unified-process/        # UP artefacts
```

## Content

Blog posts live in `content/posts/<year>/<month>/<slug>.md`, so a post dated 9 Feb 2026
sits at `content/posts/2026/02/building-inc.md`. Each file has frontmatter:

```md
---
title: Post Title
date: 2026-02-09
description: Brief description for SEO
slug: post-slug
---

Content here...
```

The public URL is `/blog/<slug>`. The slug comes from frontmatter, not the filename or
the folder, so always set it.

## Commands

```bash
bun install              # Install dependencies
bun run dev:port <port>  # Development server (REQUIRED: specify port)
bun run build            # Build for production
bun run preview          # Preview production build
bun run check            # Type checking
bun run test             # Run tests in watch mode
bun run test:run         # Run tests once
bun run newsroom:pull     # refreshes the pinned newsroom lists schema
bun run newsroom:generate # regenerates the typed client from the pinned schema
bun run newsroom:check    # fails when the client and the schema have drifted
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

**Use Linear to find work.** Use the `linear-cli` skill (the `linear` binary on PATH).

```bash
linear issue mine                            # Issues assigned to me
linear issue list --team <key>               # See all issues for a team
linear issue view <id>                       # Issue details
linear issue update <id> --status "In Progress"  # Claim work
linear issue update <id> --status "Done"     # Mark done
```

## Unified Process

Follows `/unified-process`. See `docs/unified-process/inception/vision.md` for goals.

Current phase: **Inception** (ready to move to Construction)

## Design Decisions

- **Markdown in repo** over CMS — zero external deps, git-backed, fast
- **Self-hosted email capture** over Buttondown — learning opportunity, full control
- **Static generation** over SSR — fastest possible, SEO-first
- **Minimal MVP** — ship fast, iterate in public

## Email Protection

**CRITICAL: NEVER expose plaintext email addresses in code or content.**

All contact emails are base64-encoded and only decoded at click time to prevent scraper harvesting. See `NavContact.svelte` for the pattern:

```typescript
// Email encoded to prevent scraping
const encodedEmail = 'c2l0ZUBncmVnb3J5LnNo';

function handleEmailClick() {
  const email = atob(encodedEmail);
  window.location.href = 'mailto:' + email;
}
```

**NEVER:**
- Put `mailto:user@domain.com` in HTML
- Write plaintext email addresses in templates
- Expose email in any form that can be scraped from source

**ALWAYS:**
- Use the base64 encode pattern above
- Decode only on user interaction (click)
- Use a button with onclick handler, not an anchor tag

## Newsroom lists API

Subscribes and unsubscribes go through the newsroom's lists API, not just KV.
`src/lib/newsroom/` holds a generated client for the list routes of
`https://the-newsroom-lists.crafts.software`, and both API routes call it.

- `client.server.ts` is the client. `lists.server.ts` builds it from the platform
  env and maps a failure to the answer the browser gets. Both are server only,
  because the bearer token must never reach the browser: nothing in a `.svelte`
  file or under `src/lib/components` may import either.
- `types.ts` and `openapi.json` are generated. Never edit them by hand.
  `bun run newsroom:pull` refreshes the pinned schema (from the public host, or
  from a checkout with `--from <path>`), `bun run newsroom:generate` rewrites the
  types, and `bun run newsroom:check` fails when the two have drifted. CI runs
  the check, so a hand-edited type cannot ship.
- `src/lib/newsroom/config.ts` holds the list this site writes to
  (`gregory_subscribers`) and `kvWrites`, the cutover switch: on, a signup or an
  unsubscribe is also written to the `SUBSCRIBERS` KV namespace, so the old
  audience sync keeps working. Off after the final sync, and then the KV
  namespace can go. Any change to the routes has to hold for both settings, and
  the tests check both.
- The token is `NEWSROOM_LISTS_TOKEN`, a Pages secret. `deploy.yml` loads it from
  1Password (`op://TSE Systems/gregory.sh - the-newsroom-lists bearer token/token`)
  and writes it to both Pages environments before deploying. Never put it in
  `wrangler.toml` and never add it as a GitHub secret. When a workflow reads a
  variable that 1Password loaded, read it from the environment; naming it again
  as `${{ secrets.NAME }}` shadows it with an empty value.
- `NEWSROOM_LISTS_URL` overrides the host through `[vars]` in `wrangler.toml`. It
  is only needed to point an environment somewhere other than the public host.
- An API 400 comes back to the browser as a 400 carrying the API's own detail.
  Everything else (a bad token, the wrong list, the list gone, the API down, no
  answer at all) reads as 503 "Service unavailable": that is misconfiguration,
  not the visitor's mistake.

## One-click unsubscribe

Newsletter emails carry a `List-Unsubscribe` header pointing at
`https://gregory.sh/api/unsubscribe?token=<token>`. A mail client can POST that
URL on its own (RFC 8058), and the same URL sits in the footer for a person to
click.

The site checks the token's shape only (non-empty, at most 512 characters,
`[A-Za-z0-9_.-]`), then hands it to the newsroom, which holds the verification
secret and removes the address, and answers 200 with a one-line HTML page.
While `kvWrites` is on it also writes the old `unsub:<token>` marker to
`SUBSCRIBERS` with a 30-day TTL, so the newsroom's audience sync keeps working
through the cutover.

`GET /api/unsubscribe?token=...` redirects to `/unsubscribe?token=...` for a
person who clicked the footer link, so a human confirms first. That page
form-posts to the same URL a mail client hits, so both paths call the same
newsroom endpoint and land on the same confirmation page.

The mail client posts a form body with no `origin` header, which SvelteKit's
own CSRF check refuses, and that check cannot be waived for one route. So
`csrf.trustedOrigins` in `svelte.config.js` turns it off and
`src/cross-site-forms.ts` runs the same check from `hooks.server.ts`, letting
through only `/api/unsubscribe` with a token.

## CSS / Responsive

**Mobile-first.** Base styles target mobile, then scale up with `min-width` media queries.

- Breakpoint: `600px` (single breakpoint for simplicity)
- Base styles = mobile
- `@media (min-width: 600px)` = desktop adjustments

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create Linear issues for anything that needs follow-up (`linear issue create`)
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items (`linear issue update <id> --status …`)
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
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
