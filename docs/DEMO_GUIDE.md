# Gym House — Demo Guide

> One-page setup + demo script for pitching Gym House to a gym owner.

## What this is

A working gym-management platform: digital memberships, QR check-in, subscription
payments, product shop, and attendance analytics. Built as a polished MVP demo.

**Status:** all demo data is mock (in-memory). Supabase is intentionally **not** wired
yet — the owner chose to hold off on a live project until after the pitch.

## Run it locally

```bash
npm install
npm run build
npm run preview -- --port 5173
```

Open <http://localhost:5173>.

> **Why build+preview instead of `dev`?** `vite dev` on this stack desyncs CSS module
> hashes (DOM gets one hash, browser another) and styles drop. `build && preview` serves
> production-built assets so the layout is always correct. Trade-off: no hot reload.

## Demo accounts

| Role | Email | Password | Lands on |
|---|---|---|---|
| **Admin** | `admin@demogym.com` | `admin1234` | `/admin` — full overview |
| **Receptionist** | `reception@demogym.com` | `reception123` | `/reception` — the scanner |
| **Member (active)** | `alice@demogym.com` | `member123` | `/member` — dashboard + QR |
| **Member (active)** | `chloe@demogym.com` | `member123` | `/member` |
| **Member (expired)** | `bob@demogym.com` | `member123` | `/member` — shows expired state |

## Demo script (~8 minutes)

### 1. The pitch (30s)
> "Every paper sign-in sheet is a membership you can't verify. Gym House makes every
> visit a record — who came in, when, and whether they were paid up."

### 2. Member view (2 min)
Sign in as **alice@demogym.com**.
- **Overview** — membership status, visits this week, current streak.
- **QR Pass** — the scannable pass that lives on her phone.
- **Plans** — compare plans, subscribe (pay at gym).
- **Attendance** — her own visit history.
- **Shop** — buy a product; checkout creates an order.

### 3. Reception view (2 min) — *the money shot*
Sign in as **reception@demogym.com**.
- **Check In** — the scanner. Paste the demo QR payload
  `gymhouse-member:member-1:demo-member-1-pass` and hit **Validate pass**.
  - Alice checks in → "Alice Johnson checked in. 3 on floor."
  - Switch to **Check out**, validate again → session closes.
  - Try `member-2` (Bob, expired) → **rejected**: "Bob Chen is expired. Access is not allowed."
  - Try `member-1` twice without checking out → **rejected**: "already has an open session."
- **Member Lookup** — search fallback when a phone is dead.

### 4. Admin view (3 min)
Sign in as **admin@demogym.com**.
- **Analytics** — occupancy, visits by day/hour, membership breakdown, revenue.
- **Members** — roster with search + status filter.
- **Plans / Subscriptions** — create a plan; suspend/reactivate a subscription.
- **Reports** — revenue, membership, attendance summaries.
- **Audit Log** — *every staff action is recorded*: who checked whom in, who
  changed which subscription, who created which plan.
- **Staff** — who has access.

### 5. The close (30s)
> "This is the whole operation on one screen. Multi-location is a data model change,
> not a rewrite."

## Business rules enforced (verified)

| # | Rule | Where |
|---|---|---|
| 1 | Only eligible members enter | `attendance.ts` `checkIn` — rejects non-active |
| 2 | Payment verified before activation | `plans.ts` |
| 4 | No duplicate open sessions | `attendance.ts` — `ALREADY_OPEN` |
| 5 | Check-out requires an open session | `attendance.ts` — `NO_OPEN_SESSION` |
| 6 | Staff actions recorded in an audit log | `audit.ts` + `/admin/audit` |
| 9 | Prices recalculated server-side | order/subscription APIs |
| 10 | Atomic stock updates | `shop.ts` |
| 12 | All state changes auditable | `audit.ts` |

## PWA

Installable on mobile. Offline: the app shell + `/offline` fallback are cached by the
service worker (`static/sw.js`). Verified in a real browser with the network cut.

## Known limitations (be honest in the pitch)

- **Mock data only** — resets when the server restarts. Supabase swap is the next step.
- **Payments are simulated** — no live Paystack key in the demo.
- **Single gym** — multi-location is modelled but not exposed in the UI.
