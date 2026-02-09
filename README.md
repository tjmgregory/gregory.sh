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

## License

MIT
