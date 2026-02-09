# ADR-001: Email Subscriber Storage

**Status:** Accepted
**Date:** 2026-02-09
**Related:** G-004.5 (Email capture), UC-001

## Context

We need to store email addresses from visitors who subscribe to updates. The storage solution must:
- Persist subscriber emails reliably
- Prevent duplicates
- Require zero external dependencies
- Work within the Cloudflare stack

## Options Considered

### 1. Cloudflare KV
- Key-value store native to Cloudflare
- Email as key provides natural deduplication
- Simple reads/writes, no query language
- Free tier: 100k reads/day, 1k writes/day

### 2. Cloudflare D1 (SQLite)
- Relational database on Cloudflare
- More powerful querying
- Overkill for simple email list
- Additional complexity in schema management

### 3. External Service (Buttondown, ConvertKit, etc.)
- Managed newsletter service
- Adds external dependency
- Monthly cost at scale
- Less control over data

## Decision

**Use Cloudflare KV** with:
- **Key**: Normalized email (lowercase, trimmed)
- **Value**: JSON with metadata (`{ subscribedAt: ISO timestamp }`)

## Rationale

1. **Simplicity**: Key-value is sufficient—we only need store/check/list operations
2. **Native**: No additional services, stays within Cloudflare stack
3. **Deduplication**: Email-as-key prevents duplicates at storage level
4. **Cost**: Free tier covers expected volume for a personal site
5. **Control**: Full ownership of subscriber data

## Consequences

### Positive
- Zero external dependencies
- Simple implementation
- Fast reads/writes at edge

### Negative
- No built-in email sending (future consideration)
- Limited querying (can't filter by date range easily)
- Manual export needed to use with newsletter tools later

### Future Considerations
- If newsletter sending is needed, export subscribers to a service or build with Cloudflare Email Workers
- If analytics needed (growth over time), consider migrating to D1 or adding a separate analytics store
