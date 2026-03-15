# User Notifications Design

## Overview

Automatic push and email notifications for we-check.ing. Two triggers: new quiz available, and quiz closing in 2 hours for users who haven't submitted.

## Delivery Channels

- **FCM Web Push** — works on Android browsers and iOS PWA (added to Home Screen). Service worker handles background delivery.
- **Email via Resend** — fallback for all users, especially iOS users who don't install the PWA. Free tier (3,000/month) covers 30 users easily.

## User Preferences

Stored in `users` Firestore document:

- `notificationPush` — boolean, default `true`
- `notificationEmail` — boolean, default `true`

FCM tokens stored in `users/{userId}/fcmTokens` subcollection (one doc per device/browser).

All users are opted in by default. Opt-out via "Manage notifications" section at the bottom of the Rules page (two toggles). Turning off push deletes FCM tokens.

### Migration

Existing users with `notificationOptIn: true` get mapped to `notificationPush: true` + `notificationEmail: true`. The `notificationOptIn` field is deprecated.

## Notification Content

### New Quiz

- **FCM push** — title: `we-check.ing` / body: `New quiz: {title} — Predictions are open!`
- **Email** — from: `we-check.ing <notify@we-check.ing>` / subject: `New quiz: {title}` / body: same message + link to the quiz

### Reminder (2 hours before deadline)

- **FCM push** — title: `we-check.ing` / body: `{title} closes in 2 hours — you haven't submitted!`
- **Email** — from: `we-check.ing <notify@we-check.ing>` / subject: `{title} closes soon` / body: same message + link to the quiz

FCM click action opens the app URL (quiz page directly).

## Cloud Functions

### `onQuizCreated` — Firestore `onCreate` trigger on `quizzes/{quizId}`

1. Fetch all users with `notificationPush: true` and their FCM tokens
2. Fetch all users with `notificationEmail: true` and their email from Firebase Auth
3. Send FCM push to all tokens
4. Send Resend email to all email addresses

### `sendReminders` — Cloud Scheduler, every 15 minutes

1. Query quizzes where `endTime` is within the next 2 hours
2. For each qualifying quiz, check `remindersSent` map on the quiz doc to avoid duplicates
3. Find opted-in users who have no `quizAnswers` doc for that quiz
4. Send FCM push and/or email based on user preferences
5. Update `remindersSent` map on the quiz doc with notified user IDs

## Service Worker & PWA

- New file: `/public/firebase-messaging-sw.js` — handles background push notifications
- Update `/public/manifest.json` with PWA fields for iOS Home Screen install support
- On iOS Safari (non-PWA context), show a one-time dismissible banner: "Add we-check.ing to your Home Screen to receive push notifications" with brief instructions. Dismissed state stored in `localStorage`.
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

## Cleanup

- Remove `reminders` Firestore collection usage from QuizGame.jsx
- Remove Firestore security rules for `reminders` collection
- Deprecate `notificationOptIn` field

## Not in Scope

- User profile page
- Notification history
- Granular per-quiz notification settings
- Native mobile app
