# User Notifications Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add automatic FCM web push and Resend email notifications for new quizzes and 2-hour deadline reminders.

**Architecture:** Firebase Cloud Functions handle notification delivery. `onQuizCreated` triggers on new quiz docs. `sendReminders` runs every 15 minutes via Cloud Scheduler. FCM tokens stored per-device in a Firestore subcollection. Resend handles email. Frontend requests push permission and manages user preferences.

**Tech Stack:** Firebase Cloud Functions v2, Firebase Cloud Messaging (Web Push), Resend (email), React frontend.

**Spec:** `docs/superpowers/specs/2026-03-15-user-notifications-design.md`

---

## Chunk 1: Infrastructure & Backend

### Task 1: Service Worker & Manifest

**Files:**
- Create: `public/firebase-messaging-sw.js`
- Modify: `public/manifest.json`
- Modify: `.env.example`

- [ ] **Step 1: Create the FCM service worker**

Create `public/firebase-messaging-sw.js`. The compat SDK is used because service workers don't support ES modules. Config is received via `postMessage` from the main app and cached for cold starts:

```javascript
importScripts("https://www.gstatic.com/firebasejs/11.4.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.4.0/firebase-messaging-compat.js");

const CONFIG_CACHE = "firebase-config";
let messagingInitialized = false;

function initFirebase(config) {
  if (messagingInitialized) return;
  firebase.initializeApp(config);
  messagingInitialized = true;
}

// Receive config from main app
self.addEventListener("message", (event) => {
  if (event.data?.type === "FIREBASE_CONFIG") {
    initFirebase(event.data.config);
    // Persist to cache for cold starts
    caches.open(CONFIG_CACHE).then((cache) => {
      cache.put("config", new Response(JSON.stringify(event.data.config)));
    });
  }
});

// On cold start, try to load config from cache
caches.open(CONFIG_CACHE).then(async (cache) => {
  const response = await cache.match("config");
  if (response) {
    const config = await response.json();
    initFirebase(config);
  }
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  const payload = event.data.json();
  const { title, body } = payload.notification || {};
  if (!title) return;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/logo192.png",
      badge: "/favicon.ico",
      data: payload.data,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(clients.openWindow(url));
});
```

- [ ] **Step 2: Update manifest.json**

Add `gcm_sender_id` to `public/manifest.json` (required for FCM web push):

```json
{
  "short_name": "we-check.ing",
  "name": "we-check.ing — F1 Prediction Quiz",
  "gcm_sender_id": "103953800507",
  "icons": [
    ...existing icons...
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#0A0A12",
  "background_color": "#0A0A12"
}
```

The `gcm_sender_id` value `103953800507` is a fixed Google-owned sender ID required for all FCM web push — it is NOT project-specific.

- [ ] **Step 3: Add VAPID key to .env.example**

Add to `.env.example`:

```
VITE_FIREBASE_VAPID_KEY=your_vapid_key_here
```

The actual VAPID key is generated in Firebase Console > Project Settings > Cloud Messaging > Web Push certificates. Add the real key to `.env`.

- [ ] **Step 4: Commit**

```bash
git add public/firebase-messaging-sw.js public/manifest.json .env.example
git commit -m "feat: add FCM service worker and update manifest for web push"
```

---

### Task 2: Firestore Rules

**Files:**
- Modify: `firestore.rules`

- [ ] **Step 1: Add fcmTokens subcollection rules and remove reminders rules**

Update `firestore.rules`. Add the fcmTokens rule inside the `users/{userId}` block and remove the `reminders` match:

```
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && (
        (request.auth.uid == userId && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role', 'elite']))
        || isAdmin()
      );

      match /fcmTokens/{tokenId} {
        allow read, write, delete: if request.auth != null && request.auth.uid == userId;
      }
    }
```

Remove this entire block:

```
    match /reminders/{reminderId} {
      allow read, update, delete: if request.auth != null
        && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null
        && request.resource.data.userId == request.auth.uid;
    }
```

- [ ] **Step 2: Commit**

```bash
git add firestore.rules
git commit -m "feat: add fcmTokens security rules, remove reminders rules"
```

---

### Task 3: FCM Initialization in firebase.js

**Files:**
- Modify: `src/firebase.js`

- [ ] **Step 1: Add FCM messaging, token management, and service worker registration**

Add these imports to the top of `src/firebase.js`:

```javascript
import { getMessaging, getToken, deleteToken } from "firebase/messaging";
import { writeBatch, deleteField } from "firebase/firestore";
```

Note: `writeBatch` and `deleteField` are added as static imports (used by `deletePushTokens` and `migrateNotificationPrefs` later).

After the existing `const analytics = ...` line, add:

```javascript
// FCM Messaging (only in browser context)
let messaging = null;
if (typeof window !== "undefined" && "Notification" in window) {
  try {
    messaging = getMessaging(app);
  } catch (e) {
    console.warn("FCM messaging not supported:", e);
  }
}
```

Add these functions before the final exports:

```javascript
// Register service worker and get FCM token
export const requestPushPermission = async (userId) => {
  if (!messaging) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    // Register service worker and wait for it to be active
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    await navigator.serviceWorker.ready;

    // Pass config to service worker (use installing/waiting/active to handle all states)
    const sw = registration.active || registration.installing || registration.waiting;
    sw?.postMessage({
      type: "FIREBASE_CONFIG",
      config: {
        apiKey: firebaseConfig.apiKey,
        projectId: firebaseConfig.projectId,
        messagingSenderId: firebaseConfig.messagingSenderId,
        appId: firebaseConfig.appId,
      },
    });

    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      // Save token to Firestore subcollection
      const tokenRef = doc(db, "users", userId, "fcmTokens", token);
      await setDoc(tokenRef, {
        token,
        createdAt: serverTimestamp(),
        userAgent: navigator.userAgent,
      });
    }

    return token;
  } catch (e) {
    console.error("Error getting push token:", e);
    return null;
  }
};

// Delete all FCM tokens for a user (all devices)
export const deletePushTokens = async (userId) => {
  if (!messaging) return;

  try {
    await deleteToken(messaging);
  } catch (e) {
    // Token may already be invalid
  }

  // Clear all tokens from Firestore
  const tokensRef = collection(db, "users", userId, "fcmTokens");
  const snapshot = await getDocs(tokensRef);
  const batch = writeBatch(db);
  snapshot.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
};
```

- [ ] **Step 2: Add messaging to exports**

Update the final export line:

```javascript
export { db, auth, analytics, messaging };
```

- [ ] **Step 3: Verify build**

```bash
npx vite build
```

Expected: build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/firebase.js public/firebase-messaging-sw.js
git commit -m "feat: add FCM initialization and token management"
```

---

### Task 4: Cloud Functions — Resend + onQuizCreated

**Files:**
- Modify: `functions/package.json`
- Modify: `functions/index.js`

- [ ] **Step 1: Add resend dependency**

```bash
cd functions && npm install resend
```

- [ ] **Step 2: Add onQuizCreated function**

Add to `functions/index.js` after the existing `calculateScores` export:

```javascript
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { getMessaging } = require("firebase-admin/messaging");
const { getAuth } = require("firebase-admin/auth");
const { Resend } = require("resend");
const { defineSecret } = require("firebase-functions/params");

const resendApiKey = defineSecret("RESEND_API_KEY");

// Helper: get all opted-in users with their preferences and tokens
async function getNotificationRecipients() {
  const usersSnapshot = await db.collection("users").get();
  const recipients = { push: [], email: [] };

  for (const userDoc of usersSnapshot.docs) {
    const data = userDoc.data();
    const userId = userDoc.id;

    // Default to true if field doesn't exist
    const pushEnabled = data.notificationPush !== false;
    const emailEnabled = data.notificationEmail !== false;

    if (pushEnabled) {
      const tokensSnapshot = await db
        .collection("users").doc(userId)
        .collection("fcmTokens").get();
      const tokens = tokensSnapshot.docs.map((d) => d.data().token).filter(Boolean);
      if (tokens.length > 0) {
        recipients.push.push({ userId, tokens });
      }
    }

    if (emailEnabled) {
      try {
        const authUser = await getAuth().getUser(userId);
        if (authUser.email) {
          recipients.email.push({ userId, email: authUser.email });
        }
      } catch (e) {
        // User may not exist in Auth
      }
    }
  }

  return recipients;
}

// Helper: send FCM push and clean up stale tokens
async function sendPush(recipients, notification, data) {
  const messaging = getMessaging();

  for (const { userId, tokens } of recipients) {
    for (const token of tokens) {
      try {
        await messaging.send({
          token,
          notification,
          data,
          webpush: {
            fcmOptions: { link: data?.url || "https://we-check.ing" },
          },
        });
      } catch (e) {
        if (
          e.code === "messaging/registration-token-not-registered" ||
          e.code === "messaging/invalid-registration-token"
        ) {
          // Delete stale token
          const tokenDocs = await db
            .collection("users").doc(userId)
            .collection("fcmTokens")
            .where("token", "==", token).get();
          tokenDocs.forEach((d) => d.ref.delete());
        }
      }
    }
  }
}

// Helper: send emails via Resend
async function sendEmails(recipients, subject, body) {
  const resend = new Resend(resendApiKey.value());

  for (const { email } of recipients) {
    try {
      await resend.emails.send({
        from: "we-check.ing <notify@we-check.ing>",
        to: email,
        subject,
        text: body,
      });
    } catch (e) {
      console.error(`Failed to email ${email}:`, e.message);
    }
  }
}

// Notify all opted-in users when a new quiz is created
exports.onQuizCreated = onDocumentCreated(
  { document: "quizzes/{quizId}", secrets: [resendApiKey] },
  async (event) => {
    const quiz = event.data?.data();
    if (!quiz) return;

    const title = quiz.title || "New Quiz";
    const quizUrl = "https://we-check.ing";

    const recipients = await getNotificationRecipients();

    await sendPush(
      recipients.push,
      { title: "we-check.ing", body: `New quiz: ${title} — Predictions are open!` },
      { url: quizUrl }
    );

    await sendEmails(
      recipients.email,
      `New quiz: ${title}`,
      `New quiz: ${title} — Predictions are open!\n\nOpen the app: ${quizUrl}`
    );

    console.log(
      `New quiz notification sent: ${recipients.push.length} push, ${recipients.email.length} email`
    );
  }
);
```

Also add `onDocumentCreated` to the require at the top. The existing `onDocumentWritten` import becomes:

```javascript
const { onDocumentWritten, onDocumentCreated } = require("firebase-functions/v2/firestore");
```

Wait — `onDocumentCreated` is imported separately further down in the file. Instead, consolidate all requires at the top of `functions/index.js`:

```javascript
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");
const { getAuth } = require("firebase-admin/auth");
const { initializeApp } = require("firebase-admin/app");
const { defineSecret } = require("firebase-functions/params");
const { Resend } = require("resend");
```

Remove the duplicate requires from inside the function bodies.

- [ ] **Step 3: Verify functions build**

```bash
cd functions && node -e "require('./index.js'); console.log('OK')"
```

Expected: `OK` (no syntax errors).

- [ ] **Step 4: Commit**

```bash
git add functions/package.json functions/package-lock.json functions/index.js
git commit -m "feat: add onQuizCreated notification function with FCM + Resend"
```

---

### Task 5: Cloud Functions — sendReminders

**Files:**
- Modify: `functions/index.js`

- [ ] **Step 1: Add the sendReminders scheduled function**

Add to `functions/index.js` after the `onQuizCreated` export:

```javascript
// Send reminders ~2 hours before quiz deadline to users who haven't submitted
exports.sendReminders = onSchedule(
  { schedule: "every 15 minutes", secrets: [resendApiKey] },
  async () => {
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    // Find quizzes closing within the next 2 hours
    const quizzesSnapshot = await db
      .collection("quizzes")
      .where("endTime", ">", now)
      .where("endTime", "<=", twoHoursFromNow)
      .get();

    if (quizzesSnapshot.empty) return;

    const recipients = await getNotificationRecipients();

    for (const quizDoc of quizzesSnapshot.docs) {
      const quiz = quizDoc.data();
      const quizId = quizDoc.id;
      const title = quiz.title || "Quiz";
      const remindersSent = quiz.remindersSent || {};

      // Find users who haven't submitted and haven't been reminded
      const allUserIds = new Set([
        ...recipients.push.map((r) => r.userId),
        ...recipients.email.map((r) => r.userId),
      ]);

      const usersToNotify = [];
      for (const userId of allUserIds) {
        if (remindersSent[userId]) continue; // Already reminded

        // Check if user has submitted (doc ID format: {userId}_{quizId})
        const answerDoc = await db
          .collection("quizAnswers")
          .doc(`${userId}_${quizId}`)
          .get();

        if (!answerDoc.exists || !answerDoc.data().answers || Object.keys(answerDoc.data().answers).length === 0) {
          usersToNotify.push(userId);
        }
      }

      if (usersToNotify.length === 0) continue;

      const notifySet = new Set(usersToNotify);

      // Send push notifications
      const pushRecipients = recipients.push.filter((r) => notifySet.has(r.userId));
      await sendPush(
        pushRecipients,
        { title: "we-check.ing", body: `${title} closes in 2 hours — you haven't submitted!` },
        { url: "https://we-check.ing" }
      );

      // Send emails
      const emailRecipients = recipients.email.filter((r) => notifySet.has(r.userId));
      await sendEmails(
        emailRecipients,
        `${title} closes soon`,
        `${title} closes in 2 hours — you haven't submitted!\n\nOpen the app: https://we-check.ing`
      );

      // Mark users as reminded
      const updatedReminders = { ...remindersSent };
      usersToNotify.forEach((uid) => { updatedReminders[uid] = true; });
      await quizDoc.ref.update({ remindersSent: updatedReminders });

      console.log(
        `Reminder sent for "${title}": ${pushRecipients.length} push, ${emailRecipients.length} email`
      );
    }
  }
);
```

- [ ] **Step 2: Verify functions build**

```bash
cd functions && node -e "require('./index.js'); console.log('OK')"
```

Expected: `OK`.

- [ ] **Step 3: Commit**

```bash
git add functions/index.js
git commit -m "feat: add sendReminders scheduled function (every 15 min)"
```

---

## Chunk 2: Frontend Changes

### Task 6: Notification Preference Migration

**Files:**
- Modify: `src/firebase.js`

- [ ] **Step 1: Add lazy migration function**

Add to `src/firebase.js` before the exports:

```javascript
// Migrate notificationOptIn to new preference fields (lazy, on login)
export const migrateNotificationPrefs = async (userId) => {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return;

  const data = userSnap.data();

  // Already migrated
  if (data.notificationPush !== undefined || data.notificationEmail !== undefined) return;

  const updates = {};

  if (data.notificationOptIn === true) {
    updates.notificationPush = true;
    updates.notificationEmail = true;
  } else if (data.notificationOptIn === false) {
    updates.notificationPush = false;
    updates.notificationEmail = false;
  } else {
    // Never prompted — default to true
    updates.notificationPush = true;
    updates.notificationEmail = true;
  }

  // Remove old field (deleteField already imported at top of file)
  updates.notificationOptIn = deleteField();

  await updateDoc(userRef, updates);
};
```

- [ ] **Step 2: Commit**

```bash
git add src/firebase.js
git commit -m "feat: add lazy migration for notification preferences"
```

---

### Task 7: Remove Reminder Button from QuizGame.jsx

**Files:**
- Modify: `src/components/quiz/QuizGame.jsx`

- [ ] **Step 1: Remove reminder state, handler, and UI**

Remove these state declarations:
```javascript
const [reminderSet, setReminderSet] = useState(false);
```

Remove the entire `handleRemindMe` function (lines ~284-301 in current file).

Remove the `reminders` Firestore import usage (the `setDoc` call writing to `reminders` collection).

Remove the "Remind Me Before Deadline" button JSX block (the section that checks `!submitted && !reminderSet`).

Remove the `reminders` collection import if it's the only usage of `setDoc` for reminders.

- [ ] **Step 2: Update the notification opt-in prompt**

Replace the existing `notificationOptIn` prompt (shown after first submission) with a simpler message. The current prompt sets `notificationOptIn` on the user doc. Update it to set both `notificationPush` and `notificationEmail` and also request push permission:

Find the section that handles the notification prompt (around lines 260-278) and update:

```javascript
const handleNotifOptIn = async () => {
  try {
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      notificationPush: true,
      notificationEmail: true,
    });
    await requestPushPermission(user.uid);
    setShowNotifPrompt(false);
    addToast("Notifications enabled!", "success");
  } catch (e) {
    console.error("Error enabling notifications:", e);
  }
};
```

Add `requestPushPermission` to the imports from `../../firebase`.

- [ ] **Step 3: Request push permission on page load (non-iOS only)**

Add a `useEffect` that runs on mount to request push permission. On iOS PWA, `Notification.requestPermission()` must be triggered by a user gesture, so we skip auto-request on iOS — those users will get prompted via the opt-in button or the Rules page toggle instead:

```javascript
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

useEffect(() => {
  if (!user || !userProfile) return;
  if (isIOS) return; // iOS requires user gesture for push permission
  if (userProfile.notificationPush !== false) {
    requestPushPermission(user.uid);
  }
}, [user, userProfile]);
```

Also call `migrateNotificationPrefs` when the user profile loads:

```javascript
// Inside the auth useEffect, after userProfile is fetched:
await migrateNotificationPrefs(currentUser.uid);
```

Add `migrateNotificationPrefs` to the imports from `../../firebase`.

- [ ] **Step 4: Update the opt-in prompt condition**

The existing submission handler checks `notificationOptIn === true` to decide whether to show the prompt. Update the condition to check the new fields instead:

```javascript
// Replace:  const alreadyOptedIn = userDoc.exists() && userDoc.data().notificationOptIn === true;
// With:
const data = userDoc.exists() ? userDoc.data() : {};
const alreadyOptedIn = data.notificationPush !== undefined || data.notificationEmail !== undefined;
```

This prevents the prompt from showing again to already-migrated users.

- [ ] **Step 5: Verify build**

```bash
npx vite build
```

Expected: build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/components/quiz/QuizGame.jsx
git commit -m "feat: remove reminder button, update notification opt-in, request push on load"
```

---

### Task 8: Notification Toggles on Rules Page

**Files:**
- Modify: `src/components/pages/Rules.jsx`

- [ ] **Step 1: Update the "Reminders" tip text**

In the "Good to Know" tips array, update the Reminders entry since manual reminders are replaced by automatic notifications:

```javascript
// Replace:
{ title: "Reminders", desc: "Set a reminder to get nudged 2 hours before the quiz closes." },
// With:
{ title: "Reminders", desc: "You'll get a nudge 2 hours before the quiz closes if you haven't submitted." },
```

- [ ] **Step 2: Add notification management section**

Add state and auth imports at the top of `Rules.jsx`:

```javascript
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, auth, requestPushPermission, deletePushTokens } from "../../firebase";
```

Add state and effects inside the `Rules` component:

```javascript
const [user, setUser] = useState(null);
const [pushEnabled, setPushEnabled] = useState(true);
const [emailEnabled, setEmailEnabled] = useState(true);
const [prefsLoaded, setPrefsLoaded] = useState(false);

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
    setUser(currentUser);
    if (currentUser) {
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setPushEnabled(data.notificationPush !== false);
        setEmailEnabled(data.notificationEmail !== false);
      }
      setPrefsLoaded(true);
    }
  });
  return () => unsubscribe();
}, []);

const handleTogglePush = async () => {
  if (!user) return;
  const newValue = !pushEnabled;
  setPushEnabled(newValue);
  await updateDoc(doc(db, "users", user.uid), { notificationPush: newValue });

  if (newValue) {
    await requestPushPermission(user.uid);
  } else {
    await deletePushTokens(user.uid);
  }
};

const handleToggleEmail = async () => {
  if (!user) return;
  const newValue = !emailEnabled;
  setEmailEnabled(newValue);
  await updateDoc(doc(db, "users", user.uid), { notificationEmail: newValue });
};
```

- [ ] **Step 3: Add the toggles JSX**

Add before the closing `</div>` of the card, after the "Explore" section:

```jsx
{prefsLoaded && (
  <>
    <h2 className="card-title card-title-sm" style={{ margin: "32px 0 16px" }}>
      Manage Notifications
    </h2>

    <div className="flex flex-col gap-3">
      <div className="tip-row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span className="font-bold">Push notifications</span>
          <span className="text-secondary text-sm" style={{ display: "block" }}>
            New quizzes and deadline reminders
          </span>
        </div>
        <label className="race-director-toggle">
          <input
            type="checkbox"
            checked={pushEnabled}
            onChange={handleTogglePush}
          />
          <span className="race-director-toggle-track">
            <span className="race-director-toggle-thumb" />
          </span>
        </label>
      </div>

      <div className="tip-row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span className="font-bold">Email notifications</span>
          <span className="text-secondary text-sm" style={{ display: "block" }}>
            Same alerts sent to your email
          </span>
        </div>
        <label className="race-director-toggle">
          <input
            type="checkbox"
            checked={emailEnabled}
            onChange={handleToggleEmail}
          />
          <span className="race-director-toggle-track">
            <span className="race-director-toggle-thumb" />
          </span>
        </label>
      </div>
    </div>
  </>
)}
```

This reuses the existing `race-director-toggle` CSS classes from the admin page for consistent toggle styling.

- [ ] **Step 4: Verify build**

```bash
npx vite build
```

Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/components/pages/Rules.jsx
git commit -m "feat: add notification preference toggles to Rules page"
```

---

### Task 9: iOS PWA Install Banner

**Files:**
- Create: `src/components/ui/IOSInstallBanner.jsx`
- Modify: `src/App.jsx` (or main layout component)

- [ ] **Step 1: Create the iOS install banner component**

```jsx
import React, { useState } from "react";

const isIOSSafari = () => {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isStandalone = window.navigator.standalone === true;
  return isIOS && !isStandalone;
};

const IOSInstallBanner = () => {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem("ios-install-banner-dismissed") === "true"
  );

  if (!isIOSSafari() || dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem("ios-install-banner-dismissed", "true");
    setDismissed(true);
  };

  return (
    <div className="question-container" style={{ borderLeft: "3px solid var(--wc-gold)", paddingLeft: "16px", marginBottom: "16px" }}>
      <p className="text-secondary text-sm" style={{ lineHeight: "1.7", margin: 0 }}>
        <span className="text-gold font-bold">Get push notifications:</span>{" "}
        Tap the share button <span style={{ fontSize: "1.1em" }}>&#9757;</span> in Safari, then "Add to Home Screen" to receive alerts for new quizzes and deadline reminders.
      </p>
      <button
        onClick={handleDismiss}
        className="btn btn-small btn-secondary"
        style={{ marginTop: "8px" }}
      >
        Got it
      </button>
    </div>
  );
};

export default IOSInstallBanner;
```

- [ ] **Step 2: Add banner to the main layout**

In `src/App.jsx`, add the import at the top:

```jsx
import IOSInstallBanner from "./components/ui/IOSInstallBanner";
```

Insert `<IOSInstallBanner />` inside `<div className="container">`, right before `<Routes>`:

```jsx
<div className="container">
  <IOSInstallBanner />
  <Routes>
```

- [ ] **Step 3: Verify build**

```bash
npx vite build
```

Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/IOSInstallBanner.jsx src/App.jsx
git commit -m "feat: add iOS PWA install banner for push notification support"
```

---

## Chunk 3: Deployment & Secrets

### Task 10: Configure Secrets and Deploy

- [ ] **Step 1: Generate VAPID key**

In Firebase Console > Project Settings > Cloud Messaging > Web Push certificates, generate a key pair. Copy the public key.

Add to `.env`:
```
VITE_FIREBASE_VAPID_KEY=<the_generated_vapid_key>
```

- [ ] **Step 2: Set Resend API key as Firebase secret**

```bash
firebase functions:secrets:set RESEND_API_KEY
```

Enter the Resend API key when prompted. Get the key from https://resend.com/api-keys.

- [ ] **Step 3: Configure Resend domain**

In the Resend dashboard, add and verify the domain `we-check.ing` so emails can be sent from `notify@we-check.ing`.

- [ ] **Step 4: Deploy Firestore rules**

```bash
firebase deploy --only firestore:rules
```

- [ ] **Step 5: Deploy Cloud Functions**

```bash
firebase deploy --only functions
```

- [ ] **Step 6: Deploy hosting**

```bash
npx vite build && firebase deploy --only hosting
```

- [ ] **Step 7: Test end-to-end**

1. Open the app on a desktop browser — should get notification permission prompt
2. Create a new quiz from admin — should receive FCM push + email
3. Wait for a quiz approaching deadline without submitting — should receive reminder
4. Open Rules page — toggle notifications off and on
5. Test on Android mobile browser — push should work
6. Test on iOS Safari — should see install banner
7. Add to Home Screen on iOS — push should work after granting permission
