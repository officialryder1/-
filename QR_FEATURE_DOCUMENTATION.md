# QR Feature Documentation

## Overview
This project now includes a lightweight QR-code membership flow for the Gym House demo app. The feature is designed to follow the project brief for member access and reception validation without introducing a full production backend yet.

## What was implemented

### 1. Member QR pass
- The member dashboard generates a QR code using the `qrcode` package.
- The QR payload is structured as a Gym House membership token:
  - `gymhouse-member:<memberId>:<passToken>`
- This is created in `src/lib/qr.ts` and used in the member page.

### 2. QR parsing and validation helper
- A reusable helper parses the QR payload and confirms it matches the expected Gym House format.
- Invalid strings are rejected safely.
- This helps keep the reception workflow trustworthy and consistent.

### 3. Reception validation flow
- The reception screen now includes a QR payload input field.
- When a code is submitted, it validates:
  - whether the payload matches the expected QR format,
  - whether the member exists,
  - whether the member is currently active or blocked.
- The UI shows success or rejection messages based on the result.

### 4. Camera scanner
- The reception screen also includes a live browser camera scan mode.
- It requests access to the device camera, decodes the QR payload with `jsqr`, and validates the member status automatically.
- The scanner handles permission denial and gracefully reports if the browser cannot access the camera.
- Camera startup waits for Svelte to mount the conditional video element before attaching the stream, then waits for video data before beginning scans. This avoids checking for frames before the preview exists and reports a useful error if frames do not arrive.
- Camera startup tries rear-camera constraints first when available and falls back to other camera constraints.
- The feature supports real demo scanning without requiring a server-side API to generate QR codes.

### 5. Demo data setup
- The reception page includes demo member records to simulate valid and invalid access states.
- This supports a working sales/demo experience without requiring a real database or auth integration yet.

## Files added or updated
- `src/lib/qr.ts`
- `src/lib/qr.spec.ts`
- `src/routes/member/+page.svelte`
- `src/routes/reception/+page.svelte`
- `src/routes/reception/+page.server.ts`
- `package.json`

## Verification
I validated the feature with fresh checks:
- `npm run check` → Svelte/TypeScript diagnostics passed with 0 errors and 0 warnings after the mobile preview fix
- `npx vitest run src/lib/qr.spec.ts` → 3 tests passed

The mobile preview fix was committed and pushed as `66c9596` (`Fix mobile camera preview initialization`). The code checks pass, but camera rendering still needs to be confirmed on the target phone and browser after the deployment updates.

## Notes
This is an MVP QR implementation for the demo app. It includes member pass generation and a working browser camera scan flow for a real-time reception demo. It is intentionally simple and should later be replaced with real database-backed QR tokens, server-side validation, and stronger access controls when the project moves into production.
