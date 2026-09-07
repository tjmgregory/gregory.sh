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

## One-click unsubscribe

Newsletter emails carry a `List-Unsubscribe` header pointing at
`https://gregory.sh/api/unsubscribe?token=<token>`. A mail client can POST that
URL on its own (RFC 8058), so it has to prove where it came from without a form
or a Turnstile challenge.

The token is `base64url(email) + "." + base64url(HMAC-SHA256(secret, audience + ":" + email))`.
The address is lowercased and trimmed before it is encoded and before it is
signed. The HMAC key is the secret's own characters, not the bytes its hex
spells out. `src/lib/unsubscribe-token.ts` builds and checks it with Web Crypto.

- `UNSUBSCRIBE_AUDIENCE` in `src/lib/unsubscribe-config.ts` is the audience
  store name signed into the token. The sender signs the same name.
- `UNSUBSCRIBE_SECRET` is 32 random bytes as hex, held in 1Password and set on
  the Pages project. The sender holds the same value, so never rotate one side
  on its own:

  ```bash
  bunx wrangler pages secret put UNSUBSCRIBE_SECRET --project-name gregory-sh
  ```

  With no secret set the token path answers 503, never a silent removal.

`POST /api/unsubscribe?token=...` checks the signature, deletes the KV row and
answers the same JSON the form path answers. It skips Turnstile, because a mail
client cannot solve one. A bad or missing signature answers 400 and never
touches KV. `GET` on the same URL redirects to `/unsubscribe?token=...`, where
the browser decodes the address out of the token and shows one confirm button.
The address is never in the served HTML, per Email Protection above.

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
