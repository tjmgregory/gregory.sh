# Requirements Catalogue: gregory.sh

## Functional Requirements

### SEO Automation (G-004.7)

| ID | Requirement | Priority | Traces To |
|----|-------------|----------|-----------|
| REQ-001 | Posts missing meta descriptions must have descriptions auto-generated from content | P2 | G-004.7, G-004.3 |
| REQ-002 | Posts must include structured data (JSON-LD) for articles | P2 | G-004.7, G-004.3 |
| REQ-003 | Images in posts must have alt text; missing alt text must be auto-generated | P3 | G-004.7, G-004.3 |
| REQ-004 | The system must identify internal linking opportunities between posts | P3 | G-004.7 |
| REQ-005 | SEO generation must occur at build time, not runtime | P2 | G-004.7, G-004.2 |
| REQ-006 | Auto-generated SEO content must be reviewable before deployment | P2 | G-004.7, G-004.4 |

### Acceptance Criteria

**REQ-001: Meta description generation**
- Given a post without a `description` in frontmatter
- When the build runs
- Then a description (120-160 chars) is generated from post content
- And the description is used in meta tags

**REQ-002: Structured data**
- Given any published post
- When the page renders
- Then valid Article JSON-LD is present
- And it passes Google's Rich Results Test

**REQ-003: Image alt text**
- Given a post with images lacking alt text
- When the build runs
- Then alt text is generated for each image
- And alt text is descriptive (not just filename)

**REQ-004: Internal linking**
- Given a collection of posts
- When analysis runs
- Then related posts are identified by content similarity
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

## Non-Functional Requirements

| ID | Requirement | Metric | Traces To |
|----|-------------|--------|-----------|
| NFR-001 | Build time must remain acceptable with SEO pipeline | < 60s for 50 posts | G-004.2 |
| NFR-002 | SEO pipeline must not require external services at runtime | Zero runtime dependencies | G-007 |
| NFR-003 | Generated descriptions must be coherent and grammatical | Manual review pass rate > 90% | G-004.7 |

## Open Questions

- [ ] Should generated content be cached/committed, or regenerated each build?
- [ ] What LLM provider to use? (Claude API, local model, other?)
- [ ] Should OG images be auto-generated? (adds complexity)
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
