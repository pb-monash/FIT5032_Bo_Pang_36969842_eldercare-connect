# ElderCare Connect

FIT5032 A2 Basic Web App and A3 Advanced Web App - Bo Pang (36969842)

ElderCare Connect is a Vue 3 web application for a health charity supporting older adults. It helps community members find nearby support, book activities, rate services, and access simple wellbeing resources.

## Run locally

Requirements: Node.js 20 or later and pnpm.

```bash
pnpm install
pnpm dev
```

Open the local address printed by Vite (normally `http://localhost:5173`). To create a production bundle, run:

```bash
pnpm build
```

For A3 external integrations, copy `.env.example` to `.env.local` and fill in only the services being tested locally. Do not commit `.env.local` or provider secrets.

## A2 feature checklist

| Requirement | Implementation |
| --- | --- |
| A.1 Vue 3 | Built with Vue 3 and Vite. |
| A.2 Responsiveness | Responsive navigation, grids and forms across desktop, tablet and mobile breakpoints. |
| B.1 Validation | Required name, email format, password length, duplicate-email and staff service-form validation with visible feedback. |
| B.2 Dynamic data | Services, activities, bookings, ratings, accounts and reading preferences are rendered from Vue state and persisted in Local Storage. |
| C.1 Authentication | Local registration, sign-in and sign-out for multiple accounts. |
| C.2 Role access | Community members cannot access the staff hub. The staff account has a protected management dashboard. |
| C.3 Rating | Members can rate a service once, update their own rating and see the aggregated average. |
| C.4 Security | User text is length limited and sanitised before storage; content is rendered through Vue interpolation rather than raw HTML. |

## A3 target checklist

| Requirement | Planned implementation |
| --- | --- |
| D.1 External Authentication | Firebase Authentication with a clear member/staff login flow. |
| D.2 Email | Serverless email workflow through a provider such as SendGrid or Brevo, with compose and attachment support. |
| D.3 Interactive Table Data | Two staff-facing data tables with sorting, global search, column search and 10-row pagination. |
| D.4 Deployment to the Cloud | Public cloud deployment after the advanced features are complete. |
| E.1 Cloud Functions | Serverless functions for email, exports and privileged actions. |
| E.2 Geo Location | Map-based service discovery with place search and route/trip information. |
| E.3 Accessibility | WCAG 2.1 AA-oriented keyboard, contrast, labels and text alternative checks. |
| E.4 Export | CSV and PDF exports for selected operational data. |
| F.1 Innovation | Calendar-constrained booking, bulk email, analytics charts and an enhanced admin dashboard. |


## A3 cloud function scaffold

The `functions/email-worker.js` file provides a safe Cloudflare Worker-style endpoint for D.2/E.1 development. It validates email requests, recipients, and attachment metadata, then returns a queued preview result. It does not send external email until a real provider integration is deliberately added with platform secrets and tutor-approved deployment settings.

## Demo staff account

Use this account to demonstrate staff-only access and service management:

- Email: `staff@eldercare.org`
- Password: `StaffDemo2026`

New registrations are always community-member accounts. Staff access is assigned separately in this demo.

## Manual demonstration flow

1. Resize the browser to 375px, 640px, 1024px and 1440px to demonstrate responsive layouts.
2. Search, filter and sort **Find support** services; submit and update a star rating.
3. Register a community account with both invalid and valid form values to demonstrate validation.
4. Book and cancel an activity; refresh the page to show Local Storage persistence.
5. Sign in with the staff demo account, open **Staff hub**, edit a service and add/remove a draft service.
6. Use the **A+** and **Contrast** controls in the header, then refresh to demonstrate accessible reading preferences.
