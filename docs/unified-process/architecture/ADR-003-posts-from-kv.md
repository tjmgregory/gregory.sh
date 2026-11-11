# ADR-003: Posts come from Workers KV

**Status:** Accepted
**Date:** 2026-11-09
**Related:** TSE-815, TSE-822. Replaces the content layer in ADR-002.

## Context

Posts were markdown files in `content/posts`, compiled by mdsvex at build time.
The newsroom published them by opening a PR here with `scripts/publish.ts`. That
path drifted from the newsroom's own copy and broke. The newsroom now owns posts,
and publishing, editing or unpublishing one must not need a change to this repo.

## Decision

The newsroom writes published posts to Workers KV, and the site reads them at
request time.

- Binding `POSTS`. Namespace `gregory-sh-posts` for production,
  `gregory-sh-posts-preview` for preview deploys and local dev.
- `post:<slug>` holds
  `{slug, title, date, description, keywords, seoTitle, ogImage, updated, images, videos, markdown}`.
  `index` holds the same objects without `markdown`, `images` and `videos`, newest first.
  KV holds published posts only, so a missing key is a 404.
- `images` is optional: `[{url, width, height, color, alt}]`, one entry per
  image the markdown shows. `url` is the original exactly as the markdown has it
  (`https://assets.crafts.software/<key>` for newsroom uploads). `width` and
  `height` are the displayed pixels after EXIF orientation. `color` is
  `#rrggbb` and may be absent. A malformed entry, or a malformed `color`, is
  dropped and logged; the post still renders.
- `videos` is optional: `[{url, poster, width, height, color, durationMs, alt}]`,
  one entry per video the markdown shows. The markdown shows a video as an
  image, `![alt](<url>)`. `url` is an H.264/AAC MP4 at
  `https://assets.crafts.software/<key>.mp4` and `poster` a JPEG of the same
  size. `color` is the poster's average colour and `durationMs` a positive
  integer; either may be absent. An entry without `url`, `poster`, `width` or
  `height` is dropped and logged; a malformed optional field is dropped.
- `markdown` is plain markdown with every newsroom token already expanded.
- `ogImage` is an absolute URL, or a path to a file in this repo's `static/`.
- The site renders the markdown at runtime with remark and rehype, set up to
  give the HTML mdsvex gave: smart quotes per text node, `rel="nofollow"` on
  absolute http(s) links, and code blocks as
  `<pre class="language-x"><code class="language-x">` with Prism token classes.
  Raw HTML passes through, as it did with mdsvex.
- The site builds every image URL it serves; the newsroom carries only the
  original URL and its size. A markdown image whose URL has an `images` entry
  gets `width`, `height`, `decoding="async"`, and `loading="lazy"`, or
  `loading="eager" fetchpriority="high"` inside the first two blocks of the
  body. On `assets.crafts.software` it also gets `src`, `srcset` and `sizes`
  from Cloudflare Image Transformations:
  `https://assets.crafts.software/cdn-cgi/image/width=<w>,format=auto,metadata=none/<key>`
  for `w` in 480, 640, 960 and 1280, stopping at the first step at or past the
  intrinsic width, whose descriptor is the intrinsic width (transforms never
  upscale). Those four option strings are the only ones a WAF rule on
  `assets.crafts.software` lets through, so they change only together with that
  rule. `color` goes on the element as `data-color` and is not styled yet.
  Images with no entry, and raw HTML images, render as plain `<img src alt>`.
- A markdown image whose URL has a `videos` entry becomes, in the same `<p>`,
  `<video controls playsinline preload="metadata" poster width height data-color aria-label>`
  with a `<source src="<url>" type="video/mp4">` and a link to the MP4 as its
  fallback. A poster on `assets.crafts.software` is served through
  `width=1280,format=auto,metadata=none`, one of the four allowed option
  strings. The MP4 is never sent through a transform (transforms answer 415 for
  video). `aria-label` is the entry's `alt`, else the markdown alt. Videos get
  the same `max-width: 100%; height: auto` as images and no other styling yet.
- The site sends no Content-Security-Policy, so media from
  `assets.crafts.software` needs no policy change.
- Each isolate keeps the rendered HTML for a post until its markdown, its
  images or its videos change.
- KV reads use `cacheTtl: 30`, the minimum. Pages that show posts send
  `Cache-Control: public, max-age=0, s-maxage=30`. adapter-cloudflare stores
  those responses in the data centre's Cache API. Together a new, changed or
  removed post shows within about a minute. The Cache API ignores
  stale-while-revalidate, so it is not used.
- `rss.xml` keeps its one-hour cache. Each request that misses that cache writes
  feed reader stats to `RSS_STATS`, so a shorter cache means more KV writes.
- KV reads are the `posts-get` datastore check in `/healthz`, and `/healthz`
  fails without the `POSTS` binding.

## Consequences

- The newsroom publishes, edits and unpublishes posts without a deploy here.
- An OG image given as a path still needs a deploy of this repo.
- `/ideas` links three posts by slug. Nothing checks that they stay published.
- The server bundle grows from about 106 KB to 244 KB gzipped.
- Local dev reads a local namespace, empty until `bun run posts:pull` copies
  the preview one into it.
