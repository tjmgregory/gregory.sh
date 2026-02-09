# Requirements Catalogue: gregory.sh

## Functional Requirements

### SEO Automation (G-004.7)

| ID | Requirement | Priority | Traces To |
|----|-------------|----------|-----------|
| REQ-001 | Posts missing meta descriptions must have descriptions auto-generated; descriptions must include primary keyword and be unique per post | P2 | G-004.7, G-004.3 |
| REQ-002 | Posts must include structured data (JSON-LD) for articles with datePublished, dateModified, author (Person), and publisher (Organization) | P2 | G-004.7, G-004.3 |
| REQ-003 | Content images must have contextual alt text; missing alt text must be auto-generated; decorative images must use empty alt | P3 | G-004.7, G-004.3 |
| REQ-004 | The system must identify internal linking opportunities with anchor text recommendations, prioritizing links within topical clusters | P3 | G-004.7 |
| REQ-005 | SEO generation must occur at build time, not runtime | P2 | G-004.7, G-004.2 |
| REQ-006 | Auto-generated SEO content must be reviewable before deployment | P2 | G-004.7, G-004.4 |
| REQ-007 | Each post must have a unique, keyword-aware title tag (50-60 chars) | P2 | G-004.7, G-004.3 |
| REQ-008 | Post URLs must be readable and include the primary topic | P2 | G-004.7, G-004.3 |
| REQ-009 | Posts must have logical heading hierarchy (single H1, sequential H2/H3) | P2 | G-004.7, G-004.3 |
| REQ-010 | Posts should have auto-generated Open Graph images for social sharing | P3 | G-004.7 |

### Acceptance Criteria

**REQ-001: Meta description generation**
- Given a post without a `description` in frontmatter
- When the build runs
- Then a description (120-160 chars) is generated from post content
- And the description includes the post's primary keyword
- And the description is unique across all posts
- And the description is used in meta tags

**REQ-002: Structured data**
- Given any published post
- When the page renders
- Then valid Article JSON-LD is present
- And it includes `datePublished` and `dateModified`
- And it includes `author` as Person schema with name
- And it includes `publisher` as Organization schema
- And it passes Google's Rich Results Test

**REQ-003: Image alt text**
- Given a post with content images lacking alt text
- When the build runs
- Then contextual alt text is generated (what the image means in context)
- And decorative images are given empty alt (`alt=""`)
- And alt text is not just the filename

**REQ-004: Internal linking**
- Given a collection of posts
- When analysis runs
- Then related posts are identified by content similarity
- And anchor text recommendations are provided
- And links within topical clusters are prioritized
- And suggestions are surfaced (not auto-inserted)

**REQ-005: Build-time execution**
- Given the SEO pipeline
- When deployment occurs
- Then all SEO content is pre-generated
- And no LLM calls occur at request time

**REQ-006: Review capability**
- Given auto-generated SEO content
- When the build completes
- Then generated content is visible in build output or PR preview
- And author can override by adding explicit frontmatter

**REQ-007: Title tags**
- Given a post
- When the page renders
- Then the title tag is 50-60 characters
- And the title includes the primary keyword
- And the title is unique across all posts

**REQ-008: URL structure**
- Given a new post
- When the URL is generated
- Then the URL is human-readable (no IDs or hashes)
- And the URL includes the primary topic/keyword
- And the URL uses hyphens as separators

**REQ-009: Heading hierarchy**
- Given a post
- When the content is analyzed
- Then there is exactly one H1
- And headings follow sequential order (H1 → H2 → H3, no skips)
- And warnings are surfaced for violations

**REQ-010: Open Graph images**
- Given a post without a custom OG image
- When the build runs
- Then an OG image is generated with post title
- And the image meets platform size requirements (1200x630)

## Non-Functional Requirements

| ID | Requirement | Metric | Traces To |
|----|-------------|--------|-----------|
| NFR-001 | Build time must remain acceptable with SEO pipeline | < 60s for 50 posts | G-004.2 |
| NFR-002 | SEO pipeline must not require external services at runtime | Zero runtime dependencies | G-007 |
| NFR-003 | Generated descriptions must be coherent and grammatical | Manual review pass rate > 90% | G-004.7 |

## Open Questions

- [x] Should generated content be cached/committed, or regenerated each build? **→ Cache/commit recommended for consistency and cost control**
- [ ] What LLM provider to use? (Claude API, local model, other?)
- [ ] How to handle costs if using paid API?

## Traceability Matrix

| Requirement | Use Cases | Tests |
|-------------|-----------|-------|
| REQ-001 | UC-002 (planned) | TC-001 (planned) |
| REQ-002 | UC-002 (planned) | TC-002 (planned) |
| REQ-003 | UC-002 (planned) | TC-003 (planned) |
| REQ-004 | UC-003 (planned) | TC-004 (planned) |
| REQ-005 | UC-002 (planned) | TC-005 (planned) |
| REQ-006 | UC-002 (planned) | TC-006 (planned) |
| REQ-007 | UC-002 (planned) | TC-007 (planned) |
| REQ-008 | UC-002 (planned) | TC-008 (planned) |
| REQ-009 | UC-002 (planned) | TC-009 (planned) |
| REQ-010 | UC-002 (planned) | TC-010 (planned) |
