# Gym House Management Platform — AI Agent Project Brief

## 1. Project Overview

We are building a modern web platform for a gym business ("Gym House") that replaces manual membership records and paper-based attendance signing with digital membership management, QR-code check-in/check-out, subscription payments, attendance analytics, and an optional shop for gym products.

**The immediate business goal is to build a polished, working MVP that can be demonstrated to a real gym owner and pitched as a project for sale.** Build for one gym first, but structure the code and data model so multiple gym locations or gyms could be supported later without a rewrite.

This is a gym-management product, not merely a marketing website. It has distinct experiences for:

- **Members:** subscribe, pay, access their membership/QR code, review attendance, and order products.
- **Receptionists:** verify members and record entry/exit quickly.
- **Gym administrators/managers:** manage members, plans, subscriptions, attendance, products, orders, and reports.

Use **“Gym House”** as a working brand name only. Keep the name, logo, colors, currency, and contact details easy to change until the client confirms their actual brand.

## 2. Problem We Are Solving

Many gyms rely on paper registers, manual checks, scattered payment records, and memory to understand member activity. This can cause:

- Slow reception and queues during busy periods.
- Incorrect or incomplete attendance records.
- Difficulty confirming whether a member's subscription is active.
- Time-consuming subscription renewals and follow-up.
- Little visibility into attendance patterns, inactive members, and peak periods.
- Poor visibility into sales of products such as towels, boxing gloves, water bottles, and other gym accessories.

The platform should make access faster, records more reliable, and gym operations easier to measure.

## 3. Product Goals

1. Digitize member profiles and subscription records.
2. Let members view available plans and subscribe online.
3. Record gym entry and exit using QR codes.
4. Prevent expired, suspended, or otherwise ineligible memberships from being checked in.
5. Give members a personal attendance history and simple activity insights.
6. Give staff a fast, clear reception check-in workflow with manual fallback.
7. Give managers useful daily operations, membership, revenue, and attendance reports.
8. Let the gym list products for members to browse and order.
9. Deliver a professional, trustworthy interface suitable for a live sales demo.
10. Keep the first version focused enough to build and validate quickly.

## 4. Product Principles

- **Fast at reception:** scanning and validation should take seconds.
- **One source of truth:** subscription status, payments, and attendance must come from persisted database records, not frontend assumptions.
- **Clear outcomes:** show success, invalid QR, expired subscription, already checked in, and other errors in plain language.
- **Privacy by role:** members can only see their own information; receptionists should see only the information needed to verify access; administrators have broader permissions.
- **Mobile-first for members:** members may open the app on their phone at the gym entrance.
- **Desktop-friendly administration:** the dashboard and record-management screens should work well on desktop and tablet.
- **Reliable before flashy:** polished visual design must not come at the cost of accurate membership and attendance records.
- **Demo honestly:** do not imply a payment, scan, order, or check-in succeeded unless the backend confirms it.

## 5. User Roles and Permissions

### A. Member

Can:

- Create an account and sign in.
- View and update permitted profile details.
- Browse subscription plans.
- Purchase or renew a plan.
- View current plan, start date, expiry date, and subscription status.
- Open a personal QR membership pass.
- View check-in/check-out history and attendance summaries.
- Browse gym products and place an order.
- View their own order history and status.

Cannot:

- Change their subscription status or payment state manually.
- View another member's profile, QR pass, attendance, or orders.
- Check themselves in by editing a client-side value.

### B. Receptionist

Can:

- Open a dedicated check-in screen.
- Scan a member's QR code using the device camera.
- See whether the member is eligible to enter.
- Record check-in and check-out with timestamps.
- Search for a member and use a controlled manual fallback if camera scanning fails.
- View the minimum member details required for access verification.
- See recent check-ins and the current gym occupancy estimate, if occupancy tracking is enabled.

Cannot:

- Edit payment transactions or alter subscription status unless explicitly authorized.
- View sensitive account information unrelated to reception.
- Delete or rewrite attendance history.

### C. Gym Administrator / Manager

Can:

- View the operations dashboard.
- Create, edit, activate, and deactivate subscription plans.
- Manage member records and membership status.
- Review subscriptions and payment status.
- Review attendance and check-in/check-out history.
- Manage staff access and roles.
- Manage products, stock, and orders.
- View reports and export appropriate records.
- Configure gym details and operational settings.

Use server-side authorization and database policies. Hiding a button in the UI is not authorization.

## 6. MVP Scope — Build in This Order

### Phase 1: Foundation and Demo Shell

- Set up the app, design system, routes, layouts, and navigation.
- Create role-aware member, reception, and admin areas.
- Build realistic responsive UI with loading, empty, error, and success states.
- Use clearly identified demo data only where backend functionality is not yet connected.

### Phase 2: Authentication and Member Records

- Sign up, sign in, sign out, and protected routes.
- Member profile and administrator member list/detail views.
- Role and gym association for every user.
- Enforce authorization on the server and in database policies.

### Phase 3: Plans, Subscriptions, and Payments

- Admin CRUD for subscription plans.
- Member plan listing and subscription purchase flow.
- Store subscription start/end dates, status, and payment references.
- Use a payment provider suitable for the target market (for example, Paystack in Nigeria) behind a server-side integration.
- Verify payment transactions server-side using provider verification/webhooks before activating a paid subscription.
- Never store raw card details.
- Support a clearly marked admin-recorded/manual payment method if the gym requires it, with staff identity, amount, date, and reference/audit details.
- Do not activate a paid plan based only on a frontend success redirect.

### Phase 4: QR Check-In and Check-Out

- Give each eligible member a unique, hard-to-guess membership QR token.
- QR codes should identify a membership/token, not expose phone numbers, email addresses, payment data, or other personal information.
- Receptionist scans the QR code using the device camera.
- Backend validates the token, member status, subscription validity, and current attendance session.
- If the member is not checked in, record check-in and timestamp.
- If the member has an open attendance session, allow a check-out action and record its timestamp.
- Prevent duplicate active sessions and race-condition double scans.
- Display clear outcomes: accepted, expired membership, suspended account, invalid code, already checked in, or successful check-out.
- Provide member search as a permission-controlled fallback.
- Log staff actions for auditability.
- QR tokens must be revocable/rotatable if compromised. Do not rely on a QR image itself as proof that a subscription is active.

**Important workflow decision:** use one attendance session per gym visit, with `checked_in_at` and nullable `checked_out_at`. A scan starts a session; a subsequent authorized scan ends it. Make the screen's next action explicit so receptionists do not accidentally toggle a member in or out.

### Phase 5: Member Dashboard and Attendance Insights

Members should see:

- Current membership and expiry date.
- A quick-access QR pass.
- Visits this week/month.
- Attendance history.
- Most active day of the week, based on their own recorded visits.
- Optional personal streak or consistency indicator, only if the calculation is clearly defined.

Admins should see:

- Today's check-ins and current/estimated occupancy.
- Visits by day/week/month.
- Peak attendance days and hours, based on actual check-in timestamps.
- Active, expiring soon, expired, and suspended memberships.
- Renewals and payment totals, clearly distinguishing paid revenue from pending/failed transactions.
- Inactive members, using a configurable definition such as no visit in the last 14 or 30 days.
- Product orders and low-stock items, once shop functionality exists.

Analytics must be calculated from persisted records. Avoid fabricated graphs or hard-coded numbers outside explicitly labelled demo mode. Define time zone handling using the gym's configured local time.

### Phase 6: Gym Product Shop

- Admin can create/edit/archive products.
- Product fields: name, description, category, price, image, stock quantity, active status.
- Members can browse products and view product details.
- Members can add items to a cart and submit an order.
- Admin can review orders and update fulfillment status.
- Track stock changes consistently and prevent overselling.
- For MVP, the order can be marked as “pending confirmation” or “pay at gym” if online shop payment is not in scope. Make the payment and fulfillment process explicit to the member.
- Keep shop purchases separate from membership subscriptions in the data model.

### Phase 7: Hardening and Sales Demo

- Test key user journeys and role restrictions.
- Validate mobile layouts, camera permission denial, poor connectivity, and API failures.
- Add audit logs for important administrative and reception actions.
- Add useful empty states and sample data for the pitch demo.
- Include basic setup documentation, environment-variable documentation, and deployment instructions.
- Ensure the app is branded as a demo until the real gym confirms its name, policies, prices, and payment setup.

## 7. Recommended Technology

Use this stack unless the project repository already has an established, working alternative:

- **Frontend/full-stack framework:** SvelteKit with Svelte 5 and TypeScript.
- **Styling:** Tailwind CSS; use the repository's existing component system if one is already configured.
- **Icons:** Lucide.
- **Database and authentication:** Supabase (PostgreSQL + Supabase Auth).
- **Authorization:** server-side checks plus Row Level Security (RLS) policies.
- **QR scanning:** a browser camera library compatible with mobile browsers; handle permission denial and unsupported devices.
- **Payments:** a provider integration such as Paystack, subject to the client's country and business setup.
- **Validation:** shared schema validation on server inputs; never trust client-submitted prices, roles, payment status, or subscription validity.

Before installing dependencies or replacing existing architecture, inspect the repository, package manager, framework version, current routes, database schema, and established conventions. Do not overwrite existing work without a clear reason.

## 8. Suggested Data Model

Design the schema with foreign keys, timestamps, appropriate indexes, and constraints. Exact naming can follow repository conventions.

### `gyms`

- `id`
- `name`
- `slug`
- `timezone`
- `currency`
- `address`
- `contact_phone`
- `created_at`

Even if the first deployment is for one gym, associate records with a gym ID so a later multi-location version is possible.

### `profiles`

- `id` (matches authenticated user ID)
- `gym_id`
- `full_name`
- `phone`
- `email` (where appropriate; auth may be the source of truth)
- `role` (`member`, `receptionist`, `admin`)
- `status` (`active`, `suspended`)
- `created_at`
- `updated_at`

### `subscription_plans`

- `id`
- `gym_id`
- `name`
- `description`
- `price`
- `duration_days` or a clearly defined duration unit
- `features` (optional structured data)
- `is_active`
- `created_at`
- `updated_at`

### `subscriptions`

- `id`
- `gym_id`
- `member_id`
- `plan_id`
- `starts_at`
- `expires_at`
- `status` (`pending`, `active`, `expired`, `cancelled`, `suspended`)
- `created_at`
- `updated_at`

Do not assume a subscription is active just because its stored status says `active`; eligibility should also consider start and expiry timestamps and any suspension rules.

### `payments`

- `id`
- `gym_id`
- `member_id`
- `subscription_id` (nullable for non-subscription transactions if later needed)
- `provider`
- `provider_reference` (unique where appropriate)
- `amount`
- `currency`
- `status` (`pending`, `successful`, `failed`, `refunded`)
- `paid_at`
- `metadata` (minimal, non-sensitive provider metadata)
- `created_at`

### `member_qr_tokens`

- `id`
- `gym_id`
- `member_id`
- `token_hash` (prefer storing a hash rather than a reusable raw secret)
- `is_active`
- `created_at`
- `revoked_at`

### `attendance_sessions`

- `id`
- `gym_id`
- `member_id`
- `checked_in_at`
- `checked_out_at` (nullable while visit is open)
- `check_in_method` (`qr`, `manual`)
- `checked_in_by` (staff user ID, nullable only where policy permits)
- `checked_out_by` (staff user ID, nullable where policy permits)
- `created_at`

Enforce at most one open attendance session per member per gym, using a database constraint/index or transaction-safe server logic. Store UTC timestamps and display them in the gym's configured time zone.

### `products`

- `id`
- `gym_id`
- `name`
- `description`
- `category`
- `price`
- `image_url`
- `stock_quantity`
- `is_active`
- `created_at`
- `updated_at`

### `orders`

- `id`
- `gym_id`
- `member_id`
- `status` (`pending`, `confirmed`, `ready`, `completed`, `cancelled`)
- `subtotal`
- `currency`
- `payment_status` (`unpaid`, `pending`, `paid`, `refunded`)
- `fulfillment_note`
- `created_at`
- `updated_at`

### `order_items`

- `id`
- `order_id`
- `product_id`
- `product_name_snapshot`
- `unit_price_snapshot`
- `quantity`
- `line_total`

Store product name and price snapshots so historical orders remain accurate after a product changes.

### `audit_logs`

- `id`
- `gym_id`
- `actor_id`
- `action`
- `target_type`
- `target_id`
- `metadata` (avoid sensitive data)
- `created_at`

Consider additional tables only when justified, such as gym locations, staff invitations, notification preferences, or inventory movements. Do not overbuild the first release.

## 9. Core Business Rules

1. Only eligible members can enter. Eligibility requires an active member account and a valid subscription for the current time, subject to gym policy.
2. Payment confirmation must be verified by the backend/provider before a paid subscription is activated.
3. Every successful check-in creates a durable attendance record with a server-generated timestamp.
4. A member must not have more than one open attendance session at the same gym.
5. Check-out requires an existing open session.
6. Staff manual check-in must record who performed it and why when appropriate.
7. Members can read only their own profile, subscriptions, payments, attendance, and orders.
8. Admin actions require server-side authorization and must be scoped to the correct gym.
9. Prices and totals must be recalculated server-side from current trusted product data.
10. Order stock updates must be atomic or otherwise protected against overselling.
11. Every date-based report must use the gym's configured time zone.
12. All important state changes should be auditable.
13. Do not expose service-role keys or payment secrets to the browser.
14. Never use phone number, email, or a predictable member ID as the QR secret.
15. Avoid collecting sensitive personal information that the gym does not need.

## 10. UX and Visual Direction

Create a polished, restrained, modern fitness-business product. Avoid generic AI-generated dashboard patterns, excessive gradients, decorative glassmorphism, meaningless charts, and overcrowded screens.

Design qualities:

- Clear hierarchy and strong typography.
- Consistent spacing, layout, and reusable components.
- Practical, high-contrast controls for reception use.
- Member-facing mobile experience that feels like a digital membership card.
- Admin dashboard that prioritizes today's operations and important exceptions.
- Clear status labels and feedback.
- Accessible keyboard interactions and visible focus states.
- Skeleton/loading, empty, success, and error states.
- Responsive design across mobile, tablet, and desktop.

Use a neutral base with one deliberate fitness-oriented accent color, but keep brand tokens centralized so the gym's real brand can replace the demo styling. Do not assume official Gym House colors or logo without client confirmation.

### Suggested main navigation

**Member**

- Overview
- My Membership
- My QR Pass
- Attendance
- Shop
- My Orders
- Profile

**Reception**

- Check In / Check Out
- Recent Visits
- Member Lookup

**Admin**

- Overview
- Members
- Subscriptions
- Plans
- Attendance
- Products
- Orders
- Reports
- Staff & Settings

Keep navigation role-specific; do not show admin links to members.

## 11. Key Screens to Build

### Public / Account

- Public landing page or sign-in entry point for the demo.
- Sign up / sign in.
- Subscription plan comparison.

### Member

- Dashboard with current membership status and expiry.
- Digital QR pass.
- Attendance history and simple insights.
- Plan purchase/renewal flow.
- Shop catalogue, product detail, cart/order confirmation.
- Profile and order history.

### Reception

- Large, focused camera scan view.
- Clear camera permission and unsupported-device states.
- Scan result panel with member name, membership status, and the next action.
- Check-in/check-out confirmation.
- Manual member search fallback.
- Recent visits list.

### Admin

- Operations overview with real metrics.
- Member list, search, filters, detail page.
- Subscription plan management.
- Subscription and payment records.
- Attendance history and filters.
- Product management, inventory, and orders.
- Reports for visits, active/expired memberships, and payment totals.
- Staff and gym settings.

Build the smallest coherent flow end-to-end before polishing every screen. A working sign-in → subscription status → QR scan → attendance record path is more valuable than a large collection of static pages.

## 12. MVP Acceptance Criteria

The MVP is ready for a gym-owner demonstration when:

- A member can sign in and see their membership status.
- An administrator can create a plan and assign or activate a subscription through a valid, auditable flow.
- A member's QR pass can be scanned from a supported phone camera.
- The backend accepts a valid eligible member and rejects invalid/expired/suspended memberships.
- A successful scan records a check-in timestamp.
- A subsequent scan or explicit staff action records check-out.
- Duplicate scans cannot create duplicate open sessions.
- Reception can manually find a member if scanning fails, with the action recorded.
- Admin can view attendance for a selected date and find who checked in.
- Member and admin attendance insights use actual stored data.
- Member access is restricted to that member's own records.
- Products can be listed and a member can submit an order with clear fulfillment/payment status, if shop scope is included in the demo.
- The UI works on mobile and desktop and includes error/empty/loading states.
- Environment variables and setup steps are documented.
- No secret keys are exposed to the client.

## 13. Out of Scope for the First MVP

Unless the gym specifically requires them, do not start with:

- Biometric or facial recognition.
- Hardware turnstile integration.
- Complex multi-branch franchise reporting.
- Workout programming, trainer scheduling, diet plans, or medical/fitness assessments.
- Social feeds, leaderboards, or gamification.
- Full accounting/payroll.
- Native iOS/Android apps; start with a responsive web app/PWA if useful.
- Automated WhatsApp/SMS campaigns before the core records are reliable.
- Complex online retail shipping logistics.

These can be future phases after validating the core gym workflow.

## 14. Agent Working Instructions

Before coding:

1. Inspect the current repository and report its stack, structure, and existing implementation.
2. Identify missing product decisions and state assumptions explicitly. Do not block on cosmetic decisions; use configurable defaults.
3. Propose a phased implementation plan with the database, authorization, and critical user journey first.
4. If the repository already contains project context or design rules, read and follow them.

While coding:

1. Implement in small, verifiable increments.
2. Keep components modular and typed; avoid giant page components.
3. Use Svelte 5 conventions if this is a SvelteKit project.
4. Keep secrets and privileged database operations on the server.
5. Validate all inputs and enforce permissions on the server and database.
6. Do not fake backend functionality with static arrays once a real integration is expected.
7. Clearly label mock/demo data.
8. Add migrations/schema changes and explain how to apply them.
9. Add tests for membership eligibility, payment verification logic, QR check-in/check-out, duplicate session prevention, role access, and order totals/stock where feasible.
10. After each phase, summarize files changed, functionality completed, commands/tests run, known limitations, and the next step.
11. Do not silently install a new UI framework or replace established project architecture.
12. Never claim a feature is complete unless it has been implemented and tested to the extent stated.

## 15. First Task for the Agent

Start with **Phase 1: repository inspection and product foundation**.

Deliver:

1. A short audit of the current repository and stack.
2. A proposed route map for public, member, reception, and admin experiences.
3. A database schema/migration plan for the MVP.
4. A prioritized implementation checklist.
5. A first UI foundation: design tokens, shared layout, role-aware navigation, and responsive dashboard shell.

Do not attempt to build every feature in one pass. Confirm the core data model and user journeys, then implement the project incrementally.
