# ADR-002: SEO Automation Architecture

## Status

Accepted

## Context

Per G-004.7 and REQ-001 through REQ-010, we need automated SEO generation including:
- Meta descriptions
- Image alt text
- Structured data (JSON-LD)
- Internal linking suggestions
- OG image generation
- Content validation (titles, headings)

Key constraints:
- Must run at build time, not runtime (REQ-005)
- Must be reviewable before deployment (REQ-006)
- Build time must remain <60s for 50 posts (NFR-001)
- Generated content should be cached/committed for consistency

## Decision

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Pre-build Scripts                        │
├─────────────────────────────────────────────────────────────┤
│  generate-seo.ts          │  generate-og-images.ts          │
│  - Meta descriptions      │  - PNG images (1200x630)        │
│  - Image alt text         │  - satori + resvg-js            │
│  - Title validation       │                                  │
│  - Heading validation     │                                  │
│  - Internal link suggest  │                                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Content Layer                             │
├─────────────────────────────────────────────────────────────┤
│  content/posts/*.md       │  static/og/*.png                │
│  (frontmatter updated)    │  (generated images)             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Build (SvelteKit)                         │
├─────────────────────────────────────────────────────────────┤
│  Seo.svelte               │  posts.ts                       │
│  - JSON-LD generation     │  - Loads enriched frontmatter   │
│  - Meta tags              │                                  │
└─────────────────────────────────────────────────────────────┘
```

### LLM Provider

**Choice: OpenAI (gpt-4o-mini)**

Rationale:
- Cost-effective for high-volume text generation
- Fast response times (<1s per request)
- Good quality for short-form content (descriptions, alt text)
- User already has API key

Alternative considered: Claude API
- Higher quality but more expensive
- Overkill for meta descriptions

### Content Storage

**Choice: Write to frontmatter YAML**

Generated descriptions and alt text are written back to markdown files. This means:
- Content is versioned in git
- Reviewable in PRs
- No LLM calls during build
- Manual overrides preserved (script skips existing values)

Alternative considered: In-memory generation during build
- Rejected: inconsistent across builds, no review capability

### OG Image Generation

**Choice: satori + resvg-js**

Rationale:
- Pure JavaScript, no external dependencies
- Generates PNG at build time
- Images stored in static/og/
- No runtime image generation needed

Alternative considered: Vercel OG / Cloudflare Image Resizing
- Rejected: runtime dependency, added complexity

### Internal Linking

**Choice: Suggestions only (not auto-insert)**

The script suggests internal links with anchor text but does not modify content. This:
- Preserves author control over content
- Avoids awkward auto-inserted links
- Surfaces opportunities for manual review

## Consequences

### Positive

- Zero runtime LLM calls (fast page loads)
- All generated content reviewable in PRs
- Consistent SEO across builds
- Author can override any generated content
- OG images cached in git (no regeneration)

### Negative

- Requires running scripts before build
- OpenAI API costs (minimal with gpt-4o-mini)
- OG images add to repo size (~50-100KB each)

### Neutral

- Authors must run `bun run seo:generate` for new posts
- Internal links require manual insertion

## Implementation

Scripts:
- `scripts/generate-seo.ts` - Main SEO generation
- `scripts/generate-og-images.ts` - OG image generation

Commands:
- `bun run seo:generate` - Generate SEO content
- `bun run seo:generate --dry-run` - Preview without writing
- `bun run og:generate` - Generate OG images
- `bun run og:generate --force` - Regenerate all images

## References

- REQ-001 through REQ-010 in requirements.md
- G-004.7 (Automated SEO) in vision.md
