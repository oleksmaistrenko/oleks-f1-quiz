# User Notifications Design

## Overview

Automatic push and email notifications for we-check.ing. Two triggers: new quiz available, and quiz closing in ~2 hours for users who haven't submitted.

## Delivery Channels

- **FCM Web Push** — works on Android browsers and iOS PWA (added to Home Screen). Service worker handles background delivery.
- **Email via Resend** — fallback for all users, especially iOS users who don't install the PWA. Free tier (3,000/month) covers 30 users easily.

## User Preferences

Stored in `users` Firestore document:

- `notificationPush` — boolean, default `true`
- `notificationEmail` — boolean, default `true`

FCM tokens stored in `users/{userId}/fcmTokens` subcollection (one doc per device/browser).

All users are opted in by default. Opt-out via "Manage notifications" section at the bottom of the Rules page (two toggles).

Turning off push deletes FCM tokens. Turning push back on re-requests browser notification permission and registers a new token.

### Migration

Lazy migration on next login/page load:
- Users with `notificationOptIn: true` get `notificationPush: true` + `notificationEmail: true`
- Users with `notificationOptIn: false` get `notificationPush: false` + `notificationEmail: false`
- Users with no `notificationOptIn` field (never prompted) get the defaults: both `true`
- After migration, `notificationOptIn` field is removed from the doc

### Firestore Security Rules

Add rules for `fcmTokens` subcollection:
- Users can read/write/delete only their own tokens: `users/{userId}/fcmTokens/{tokenId}` where `request.auth.uid == userId`
- `remindersSent` field on quiz docs is written only by Cloud Functions (Admin SDK), no client rules needed

## Notification Content

### New Quiz

- **FCM push** — title: `we-check.ing` / body: `New quiz: {title} — Predictions are open!`
- **Email** — from: `we-check.ing <notify@we-check.ing>` / subject: `New quiz: {title}` / body: same message + link to the quiz

### Reminder (~2 hours before deadline)

- **FCM push** — title: `we-check.ing` / body: `{title} closes in 2 hours — you haven't submitted!`
- **Email** — from: `we-check.ing <notify@we-check.ing>` / subject: `{title} closes soon` / body: same message + link to the quiz

FCM click action opens the app URL (quiz page directly).

Note: since the scheduler runs every 15 minutes, reminders fire between 1h46m and 2h00m before the deadline. Close enough for this use case.

## Cloud Functions

### `onQuizCreated` — Firestore `onCreate` trigger on `quizzes/{quizId}`

1. Fetch all users with `notificationPush: true` and their FCM tokens
2. Fetch all users with `notificationEmail: true` and their email from Firebase Auth
3. Send FCM push to all tokens
4. Send Resend email to all email addresses
5. On FCM errors with `messaging/registration-token-not-registered`, delete the stale token from the subcollection

Note: quizzes are always created with full data (title, questions, endTime) in a single write from QuizAdmin.jsx, so the `onCreate` payload is complete.

### `sendReminders` — Cloud Scheduler, every 15 minutes

1. Query quizzes where `endTime` is within the next 2 hours
2. For each qualifying quiz, check `remindersSent` map on the quiz doc to avoid duplicates
3. Find opted-in users who have no `quizAnswers` doc for that quiz (check by doc ID format `{userId}_{quizId}`)
4. Send FCM push and/or email based on user preferences
5. On FCM errors with stale tokens, delete them
6. Update `remindersSent` map on the quiz doc with notified user IDs

## Service Worker & PWA

- New file: `/public/firebase-messaging-sw.js` — handles background push notifications
- Update `/public/manifest.json`: add `"gcm_sender_id": "103953800507"` (required for FCM web push)
- On iOS Safari (non-PWA context), show a one-time dismissible banner: "Add we-check.ing to your Home Screen to receive push notifications" with brief instructions. Dismissed state stored in `localStorage`.
- On iOS PWA, request notification permission on a user gesture (e.g., tapping the push toggle or a prompt button) — Apple requires this since iOS 16.4.
- On Android/desktop, request notification permission directly on first visit.

## Frontend Changes

### QuizGame.jsx

- Remove "Remind Me Before Deadline" button and all `reminders` collection usage
- On first visit (for opted-in users), request browser notification permission and store FCM token
- Replace `notificationOptIn` prompt after first submission with push+email opt-in prompt

### Rules.jsx

- Add "Manage notifications" section at the bottom with two toggles: push notifications, email notifications

### src/firebase.js

- Initialize FCM messaging (`getMessaging`, `getToken`)
- Token management utilities (save/delete tokens)

## Resend Integration

- API key stored in Firebase Functions secrets
- Simple transactional emails, no HTML templates — plain text with quiz title and link
- Sender: `notify@we-check.ing`
- All users authenticate with email/password (Firebase Auth), so email is always available

## Cleanup

- Remove `reminders` Firestore collection usage from QuizGame.jsx
- Remove Firestore security rules for `reminders` collection
- Deprecate and migrate `notificationOptIn` field

## Not in Scope

- User profile page
- Notification history
- Granular per-quiz notification settings
- Native mobile app
