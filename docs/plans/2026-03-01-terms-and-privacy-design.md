# Terms of Service & Privacy Policy — Design

**Date:** 2026-03-01
**Status:** Approved

## Goal

Add Terms of Service and Privacy Policy pages to we-check.ing for public launch. Users must accept terms at registration. Links accessible site-wide via a footer.

## Data Collected

- Email address (Firebase Auth)
- Username (Firestore)
- Quiz answers and scores (Firestore)
- Firebase Analytics (usage metrics)

## Components

### 1. Terms of Service Page (`src/components/pages/Terms.jsx`)

- Route: `/terms` (public, no auth required)
- Layout: card-based, matching Rules.jsx pattern
- "Last updated" date at top

Content sections:
- **Acceptance of Terms** — using the service means you agree
- **Eligibility** — must be 13+ years old
- **Accounts** — one account per person, responsible for credentials
- **Quiz Gameplay** — admin controls questions/scoring, no guarantees on availability
- **Not Affiliated with F1** — unofficial, not associated with Formula 1, FIA, or any team
- **Intellectual Property** — we-check.ing branding belongs to the operator; F1 marks belong to their owners
- **Termination** — accounts can be suspended or deleted at operator discretion
- **Limitation of Liability** — provided "as is", no warranties
- **Changes to Terms** — may update terms, continued use = acceptance
- **Contact** — email address for questions

### 2. Privacy Policy Page (`src/components/pages/Privacy.jsx`)

- Route: `/privacy` (public, no auth required)
- Same layout pattern
- "Last updated" date at top

Content sections:
- **What We Collect** — email, username, quiz answers/scores, Firebase Analytics data
- **How We Use It** — account management, quiz functionality, leaderboards, analytics
- **Data Storage** — Firebase (Google Cloud), data stored in Firestore
- **Third Parties** — Firebase as data processor, no selling of data
- **Cookies** — Firebase session cookies, Analytics cookies
- **Data Retention** — kept while account is active, deleted on request
- **Your Rights** — request access to or deletion of your data by contacting admin
- **Children** — not intended for users under 13
- **Changes** — may update policy, users notified via the app
- **Contact** — email address

### 3. Signup Checkbox (`src/components/auth/Login.jsx`)

- Visible only in registration mode (`isRegistering`)
- Checkbox: "I agree to the Terms of Service and Privacy Policy" (with links to `/terms` and `/privacy`)
- Must be checked to enable "Create Account" button
- New state: `termsAccepted` (boolean)

### 4. Firestore Update (`src/firebase.js`)

- Add `termsAcceptedAt: new Date()` to user document in `registerWithEmail`

### 5. Footer Component (`src/components/layout/Footer.jsx`)

- Minimal footer rendered in `App.jsx` below `<main>`
- Contains: "Terms" and "Privacy" links
- Styled consistently with the dark cockpit theme
- Visible on all pages

## Routing Changes (`src/App.jsx`)

- Import Terms and Privacy components
- Add `/terms` and `/privacy` routes
- Import and render Footer below main content

## Files to Create

- `src/components/pages/Terms.jsx`
- `src/components/pages/Privacy.jsx`
- `src/components/layout/Footer.jsx`

## Files to Modify

- `src/App.jsx` (routes + footer)
- `src/components/auth/Login.jsx` (checkbox)
- `src/firebase.js` (termsAcceptedAt field)
- `src/styles/App.css` (footer styles)
