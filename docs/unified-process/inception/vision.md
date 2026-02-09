# Vision: gregory.sh

## G-001: Problem Statement

Building in public requires a platform. Existing options are either too constrained (Substack, Medium) or too complex (custom CMS). Need a personal site that's fast, SEO-optimized, and enjoyable to maintain—one that can grow with evolving interests and showcase technical capabilities.

## G-002: Product Position

For **Theo Gregory**, who wants to share learnings, projects, and thinking publicly, **gregory.sh** is a **personal website and blog** that provides a fast, minimal platform for writing and building in public. Unlike hosted platforms, it offers full control over design, content, and data while remaining lean and maintainable.

## G-003: Stakeholders

| Stakeholder | Role | Concerns |
|-------------|------|----------|
| Theo | Author, developer | Writing experience, site performance, maintainability |
| Readers | Audience | Content discovery, readability, RSS/newsletter access |
| Search engines | Discovery | SEO, structured data, fast load times |

## G-004: Core Goals

| ID | Goal | Success Metric |
|----|------|----------------|
| G-004.1 | Ship v0.1 fast | Live on gregory.sh within 1 week |
| G-004.2 | Ultra-fast performance | Lighthouse 100/100 |
| G-004.3 | SEO-first | Proper meta tags, structured data, sitemap |
| G-004.4 | Low-friction publishing | Write markdown, push, done |
| G-004.5 | Email capture | Collect subscribers for newsletter |
| G-004.6 | RSS feed | Standard feed for readers who prefer RSS |
| G-004.7 | Automated SEO | AI-powered SEO generation and optimization at build time |

## G-005: Features (MVP)

| Feature | Priority | Description |
|---------|----------|-------------|
| Homepage | P1 | Latest post or posts summary |
| Blog index | P1 | Chronological list of all posts |
| Blog post pages | P1 | Rendered markdown with good typography |
| RSS feed | P1 | `/rss.xml` endpoint |
| Email capture | P1 | Simple form, self-hosted via Cloudflare Worker + KV |
| SEO basics | P1 | Meta tags, OG images, sitemap |

## G-006: Non-Goals (MVP)

- Comments system
- Analytics beyond Cloudflare's built-in
- Search functionality
- Categories/tags (can add later)
- Dark mode (can add later)
- Custom CMS/admin UI

## G-007: Technical Constraints

- **SvelteKit** with static adapter for Cloudflare Pages
- **mdsvex** for markdown processing
- **Cloudflare** for hosting, Workers, KV
- No external runtime dependencies (database, CMS, etc.)
- Content lives in git as markdown files

## G-008: Risks

| Risk | Mitigation |
|------|------------|
| Over-engineering before shipping | Strict MVP scope, ship fast |
| Design paralysis | Start minimal, iterate in public |
| Email capture complexity | Keep it simple: form → Worker → KV |
