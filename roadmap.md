# Voyaroo Roadmap

## Current MVP status

- Build status: passing (`pnpm build`)
- Tests: passing (`pnpm test`)
- Core flow available:
  - Register / login / logout
  - Create trip / edit trip details / delete trip
  - Itinerary / checklist / outfits CRUD
  - Mobile-first UI + PWA shell

This state is suitable for functional QA and exploratory testing.

## Stabilization priorities (short term)

### 1) Auth hardening and reliability

- Add migration-health/startup check so required auth tables always exist.
- Keep rate-limit fallback for missing table, but emit explicit high-severity logs/alerts.
- Normalize auth failure messaging to reduce user enumeration risk.
- Add timing-safe fallback compare for non-existent users in credential auth.

### 2) Password reset (critical missing capability)

- Add request-reset and reset-password flows.
- Store hashed reset tokens with expiry and one-time usage.
- Add email delivery integration for reset links.
- Invalidate existing sessions after password reset (session versioning).

### 3) iOS + simulator hardening

- Keep image proxy for external hero images.
- Limit proxy hosts and add strict size/time guards.
- Re-verify hydration consistency in client components on iOS Safari.

## Security roadmap

- Implement forgot/reset password end to end.
- Add basic audit logging for auth events:
  - login success/failure
  - register attempts
  - password reset request/complete
- Add simple abuse controls:
  - per-IP + per-email throttling
  - lockout/backoff policy for repeated failures

## Product roadmap (next increments)

### Phase A: Stabilize MVP

- Close known UI/SSR hydration edge cases.
- Add focused regression tests for:
  - login/register
  - create/edit/delete trip
  - itinerary/checklist/outfits CRUD

### Phase B: AI-assisted planning v1

- Add "Generate plan" action on trip overview.
- Return editable draft itinerary + checklist JSON.
- Apply drafts only with explicit user confirmation.

### Phase C: Packing intelligence

- Weather-aware checklist suggestions by destination and dates.
- Suggested items as accept/reject recommendations.

### Phase D: Outfit planning v2

- Wardrobe image upload and item tagging.
- Day/activity outfit recommendations from wardrobe + itinerary.

### Phase E: PWA polish

- Offline cache for trip list + active trip.
- Local draft edits with sync reconciliation.
- Install UX and reminder notification flow.

