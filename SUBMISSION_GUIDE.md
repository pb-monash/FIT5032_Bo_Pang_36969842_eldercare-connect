# A2 Submission Guide

Use this checklist when preparing the Moodle submission. It is a project aid, not a replacement for the official submission template.

## Before submitting

- [ ] Run `pnpm install --frozen-lockfile` and `pnpm build` without errors.
- [ ] Confirm the GitHub repository is shared with the tutor.
- [ ] Confirm the Git history contains several meaningful, time-separated code commits.
- [ ] Fill in the official A2 submission template.
- [ ] Record the functional demonstration video.
- [ ] Create the Moodle ZIP from the project source, excluding `node_modules` and `dist`.

## Suggested video run sheet

The video does not need audio. Keep the browser zoom at 100% and record each result clearly.

1. **Responsive website** - show the home page at a mobile width, then tablet and desktop widths. Open and close the mobile navigation.
2. **Dynamic data** - open **Find support**, search by suburb, filter by category and sort by rating. Show the no-results message, then clear it.
3. **Validation and registration** - attempt invalid email, short password and missing name values. Then create a valid community member account.
4. **Booking and persistence** - book an activity, show it in **My account**, refresh the page and show that the booking remains. Cancel it and show the available seat count increases.
5. **Ratings** - submit a service rating, show the aggregate average/rating count change, then update the same rating to show that it is not counted twice.
6. **Role-based access** - sign in as the staff demo account shown on the login page. Open **Staff hub**, edit a service and add/remove a draft service. Sign out and show that a community account has no staff-hub link.
7. **Accessibility** - use the `A+` and `Contrast` controls, then refresh to show that the selected reading preferences persist.

## Security reflection notes for BR C.4

Adapt these points in your own words for the official template:

- User-entered names and service-management text are length limited and have angle brackets/control characters removed before they are saved.
- The interface displays state through Vue interpolation instead of inserting user content as HTML, so user input is not executed with `v-html`.
- Registration validates name, email format, password length and duplicate email addresses. Staff service editing validates required values and distance format.
- The project is a front-end course demonstration using Local Storage. A production version would move authentication and validation to a server, hash passwords, use HTTPS-only cookies and apply server-side authorisation checks.

## AI acknowledgement prompt

Use the official template's AI acknowledgement section and describe your use accurately. State which tools were used, what they assisted with, and how you reviewed the final work. Do not copy this guide verbatim if it does not reflect your own process.
