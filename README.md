# gregory.sh

Personal website and blog. Building in public.

## Stack

- [SvelteKit](https://svelte.dev/) on [Cloudflare Pages](https://pages.cloudflare.com/)
- Blog posts read from [Workers KV](https://developers.cloudflare.com/kv/) and rendered at request time
- Email capture through the newsroom's lists API

## Development

```bash
npm install
npm run dev
```

## Writing

Posts are written and published in the newsroom, which writes each published
post to the `POSTS` Workers KV namespace. The site reads them at request time, so
publishing, editing or unpublishing a post needs no change here. The URL is
`/blog/<slug>`. See `docs/unified-process/architecture/ADR-003-posts-from-kv.md`.

To see posts in local development, copy the preview namespace into local KV:

```bash
bun run posts:pull
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
