# UC-002: Unsubscribe from Newsletter

**Related Vision Goal:** G-004.5 (Email capture)
**Related Requirements:** REQ-GDPR-001, REQ-GDPR-003

## Summary

A subscriber removes their email address from the mailing list, exercising their right to withdraw consent.

## Actors

- **Subscriber** — A person who previously subscribed and wants to stop receiving emails

## Preconditions

- Subscriber has an email address (may or may not be in the system)

## Basic Flow

1. Subscriber navigates to /unsubscribe (directly or via link in email)
2. Subscriber enters their email address
3. Subscriber submits the form
4. System validates the email format
5. System removes the email from storage (if present)
6. System displays confirmation message

## Alternate Flows

### A1: Email Pre-filled from Link
At step 1, if URL contains `?email=` parameter:
1. Email field is pre-populated
2. Flow continues at step 3

### A2: Invalid Email Format
At step 4, if the email format is invalid:
1. System displays error message indicating invalid email
2. Subscriber corrects the email and resubmits

### A3: Email Not Found
At step 5, if the email is not in the system:
1. System displays same success message (privacy-preserving)
2. Flow ends (no information leaked about who is subscribed)

### A4: Service Unavailable
At step 5, if storage is unavailable:
1. System displays error message asking to try again later
2. Flow ends

## Postconditions

- Email is removed from the subscriber list (if it was present)
- Subscriber sees confirmation of their action
- No further emails will be sent to this address

## UI Notes

- Simple form: email input + unsubscribe button
- Same response whether email existed or not (privacy)
- Clear confirmation that no more emails will be sent
- Contact email provided for questions

## GDPR Compliance

- Withdrawal of consent is as easy as giving consent (single form submission)
- No login required to unsubscribe
- No "are you sure?" barriers
- Immediate effect (no "within 10 days" delays)
- Privacy-preserving: doesn't reveal whether email was subscribed

## Implementation Notes

- Endpoint: POST /api/unsubscribe
- Deletes key from Cloudflare KV
- Returns success even if email wasn't found
