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

Deployed automatically to Cloudflare Pages on push to `main`.

### Setup (one-time)

1. Create a Cloudflare Pages project named `gregory-sh`
2. Add GitHub secrets:
   - `CLOUDFLARE_API_TOKEN` - API token with Pages edit permissions
   - `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID
3. (Optional) For email capture: Create a KV namespace and update `wrangler.toml`

### Custom domain

Configure `gregory.sh` in Cloudflare Pages dashboard under Custom Domains.

## License

MIT
