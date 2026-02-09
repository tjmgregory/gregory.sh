# gregory.sh

Personal website and blog. Building in public.

## Stack

- [SvelteKit](https://svelte.dev/) + [mdsvex](https://mdsvex.pngwn.io/) for markdown
- [Cloudflare Pages](https://pages.cloudflare.com/) for hosting
- Self-hosted email capture via Cloudflare Workers + KV

## Development

```bash
npm install
npm run dev
```

## Writing

Add posts to `content/posts/`:

```md
---
title: My Post
date: 2026-02-09
description: A brief description
---

Your content here...
```

## Deployment

Deployed automatically to Cloudflare Pages on push to `main`. The workflow auto-creates the Pages project on first deploy.

### Setup (one-time)

Create a GitHub environment called `prod` with:

| Type | Name | Value |
|------|------|-------|
| Secret | `CLOUDFLARE_API_TOKEN` | API token (see below) |
| Variable | `CLOUDFLARE_ACCOUNT_ID` | Your account ID (from URL) |

**API Token permissions** (create at dash.cloudflare.com/profile/api-tokens):
- Account → Cloudflare Pages → Edit

### Custom domain

Configure `gregory.sh` in Cloudflare Pages dashboard under Custom Domains.

## License

MIT
