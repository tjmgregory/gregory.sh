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

### Matrix Rain Entrance Effect (G-009)

| ID | Requirement | Priority | Traces To |
|----|-------------|----------|-----------|
| REQ-011 | Page content must be extractable to a character grid where each character has a column and row position | P2 | G-009 |
| REQ-012 | On page load, characters must animate from a "falling rain" state to their final grid positions | P2 | G-009 |
| REQ-013 | During the rain phase, characters must display random Matrix-style glyphs (katakana, numbers) before settling to correct characters | P2 | G-009 |
| REQ-014 | The animation must complete within 3 seconds to avoid blocking content access | P2 | G-009 |
| REQ-015 | Links and interactive elements must remain functional after animation completes | P1 | G-009 |
| REQ-016 | The effect must be disabled when user has `prefers-reduced-motion` enabled | P1 | G-009 |
| REQ-017 | The grid must recalculate on viewport resize to handle responsive line breaks | P3 | G-009 |
| REQ-018 | Page-to-page navigation should trigger a dissolve → rain → settle transition | P3 | G-009 |

### Acceptance Criteria

**REQ-011: Character grid extraction**
- Given any page with text content
- When the animation system initializes
- Then every visible character has a computed (col, row) position
- And positions account for line wrapping at viewport width
- And non-text elements (images, etc.) are excluded from the grid

**REQ-012: Rain-to-settle animation**
- Given extracted character positions
- When the page loads
- Then characters start above the viewport at their correct column
- And characters animate downward with varied timing per column
- And characters come to rest at their final (col, row) positions
- And the animation uses CSS transforms (GPU-accelerated)

**REQ-013: Character cycling**
- Given the rain animation is in progress
- When a character is falling
- Then it displays random Matrix glyphs (katakana, latin, numbers)
- And glyph changes are staggered for visual effect
- And the correct character is revealed as the character settles

**REQ-014: Animation duration**
- Given the rain animation
- When measuring from page load to content readable
- Then total time is under 3 seconds
- And users can interact with content after animation

**REQ-015: Post-animation interactivity**
- Given the animation has completed
- When the user interacts with the page
- Then links are clickable
- And text is selectable
- And page behaves as standard DOM

**REQ-016: Reduced motion**
- Given a user with `prefers-reduced-motion: reduce`
- When the page loads
- Then no rain animation occurs
- And content is immediately visible

**REQ-017: Responsive grid**
- Given a viewport resize
- When line breaks change
- Then character grid is recalculated
- And characters animate to new positions (if animation active)
- Or are immediately repositioned (if settled)

**REQ-018: Page transitions**
- Given navigation between pages
- When the user clicks a link
- Then current content dissolves (rain effect in reverse or fade to rain)
- And new content settles from rain
- And URL updates appropriately

## Non-Functional Requirements

| ID | Requirement | Metric | Traces To |
|----|-------------|--------|-----------|
| NFR-001 | Build time must remain acceptable with SEO pipeline | < 60s for 50 posts | G-004.2 |
| NFR-002 | SEO pipeline must not require external services at runtime | Zero runtime dependencies | G-007 |
| NFR-003 | Generated descriptions must be coherent and grammatical | Manual review pass rate > 90% | G-004.7 |
| NFR-004 | Matrix rain animation must maintain 60fps on modern devices | No dropped frames on 2020+ hardware | G-009, G-004.2 |
| NFR-005 | Animation must not increase page weight significantly | < 10KB additional JS (gzipped) | G-009, G-004.2 |
| NFR-006 | Animation must not delay First Contentful Paint | FCP unaffected vs. no-animation baseline | G-009, G-004.2 |

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
| REQ-011 | UC-004 (planned) | TC-011 (planned) |
| REQ-012 | UC-004 (planned) | TC-012 (planned) |
| REQ-013 | UC-004 (planned) | TC-013 (planned) |
| REQ-014 | UC-004 (planned) | TC-014 (planned) |
| REQ-015 | UC-004 (planned) | TC-015 (planned) |
| REQ-016 | UC-004 (planned) | TC-016 (planned) |
| REQ-017 | UC-004 (planned) | TC-017 (planned) |
| REQ-018 | UC-005 (planned) | TC-018 (planned) |
