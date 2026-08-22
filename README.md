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



## A3 cloud deployment

The repository still includes the GitHub Pages workflow used for the static A3 checkpoint, but the Exceeds-level cloud path is Firebase Hosting + Firebase Functions:

- Firebase Hosting serves the Vue production bundle from `dist`.
- Firebase Hosting rewrites `/api/email/queue` to the `queueEmail` Firebase Function.
- Firebase Authentication is enabled from the front-end through the `VITE_FIREBASE_*` environment variables.
- The email function supports Brevo or SendGrid secrets for real delivery with text attachments. Without provider secrets it still runs in `firebase-cloud-preview` mode, which is useful for safe demonstrations.

Current Firebase project:

- Project ID: `eldercare-connect-36969842`
- Hosting URL: `https://eldercare-connect-36969842.web.app`
- Email/password Firebase Authentication is configured through `firebase.json` and deployed with `firebase deploy --only auth`.
- Firebase Functions code is ready in `functions/index.js`, but deploying Functions requires upgrading the Firebase project to the Blaze plan.

### Firebase setup

1. Create a Firebase project, then copy `.firebaserc.example` to `.firebaserc` and replace the project id.
2. In Firebase Console, enable **Authentication > Sign-in method > Email/Password**.
3. Register a web app in Firebase Console and copy the web config into `.env.local` for local testing:

```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_STAFF_EMAILS=staff@eldercare.org
```

4. Install Firebase CLI if needed:

```bash
npm install -g firebase-tools
firebase login
```

5. Set at least one email provider for real D.2 delivery:

```bash
firebase functions:secrets:set BREVO_API_KEY
firebase functions:secrets:set BREVO_SENDER_EMAIL
firebase functions:secrets:set BREVO_SENDER_NAME
```

or use the `SENDGRID_API_KEY`, `SENDGRID_SENDER_EMAIL`, and `SENDGRID_SENDER_NAME` equivalents.

6. Build and deploy:

```bash
pnpm install
pnpm --dir functions install
pnpm firebase:deploy
```

After deployment, verify:

- the Firebase Hosting URL opens the app;
- account registration/sign-in shows Firebase Authentication;
- Staff hub email composer returns `delivered` when provider secrets are set, or `firebase-cloud-preview` when only the cloud function is configured.

## A3 cloud function notes

The legacy `functions/email-worker.js` file is retained as a Cloudflare Worker reference from the earlier scaffold. The deployed Firebase Functions entry point is `functions/index.js`.

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
