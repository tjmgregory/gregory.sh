# UC-001: Subscribe to Newsletter

**Related Vision Goal:** G-004.5 (Email capture)
**Related Requirements:** REQ-GDPR-001, REQ-GDPR-002

## Summary

A reader provides their email address to receive future updates from the site, with clear consent and awareness of their rights.

## Actors

- **Reader** — A visitor to the site who wants to be notified of new content

## Preconditions

- Reader has navigated to a page with the subscription form

## Basic Flow

1. Reader enters their email address into the subscription form
2. System displays links to privacy policy and unsubscribe option
3. Reader submits the form (consent implied by action)
4. System validates the email format
5. System stores the email with timestamp
6. System displays confirmation message

## Alternate Flows

### A1: Invalid Email Format
At step 4, if the email format is invalid:
1. System displays error message indicating invalid email
2. Reader corrects the email and resubmits

### A2: Already Subscribed
At step 5, if the email already exists:
1. System displays message indicating already subscribed
2. Flow ends (no duplicate entry created)

### A3: Service Unavailable
At step 5, if storage is unavailable:
1. System displays error message asking to try again later
2. Flow ends

## Postconditions

- Email is stored in the subscriber list (unless already present)
- Reader sees confirmation of their action
- Reader was informed of privacy policy and unsubscribe option before submitting

## UI Notes

- Form should be simple: email input + submit button
- Privacy policy and unsubscribe links shown when input is active
- Success state replaces form with confirmation
- Error state shows inline message without losing input

## GDPR Compliance

- Consent is explicit: reader must actively enter email and click submit
- Privacy policy link visible before submission
- Unsubscribe option clearly communicated
- See UC-002 for unsubscribe flow

## Data Stored

| Field | Type | Description |
|-------|------|-------------|
| email | string | Normalized (lowercase, trimmed) |
| subscribedAt | ISO timestamp | When they subscribed |
