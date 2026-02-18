# welook.ing App Update Plan

## Overview

Complete migration from "Oleks F1 Quizz" (CRA) to **welook.ing** — a generic prediction quiz platform built on Vite. Includes full rebrand, public landing page, user dashboard, push + email notifications, Firebase Analytics, and mobile-first design.

---

## Phase 1: CRA to Vite Migration

### 1.1 Create Vite Config Files

**Create `vite.config.js`:**
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 3000, open: true },
  build: { outDir: 'build', sourcemap: true }
})
```

**Create `postcss.config.js`:**
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

**Create `tailwind.config.js`:**
```javascript
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: { extend: {} },
}
```

### 1.2 Move `public/index.html` to root `index.html`

- Remove `%PUBLIC_URL%` references (use `/` instead)
- Add `<script type="module" src="/src/main.jsx"></script>` before `</body>`
- Title updated in Phase 2

### 1.3 Rename Entry Point

- `src/index.js` → `src/main.jsx`
- Remove `reportWebVitals` import and call

### 1.4 Update package.json

**Remove:**
- `react-scripts`
- `web-vitals`
- `@testing-library/*` packages
- `eslintConfig` section
- `browserslist` section

**Add:**
```json
"type": "module",
"scripts": {
  "dev": "vite",
  "start": "vite",
  "build": "vite build",
  "preview": "vite preview"
},
"devDependencies": {
  "vite": "^6.0.7",
  "@vitejs/plugin-react": "^4.3.4"
}
```

### 1.5 Environment Variables

**Update `.env` and `.env.example`:**
```
REACT_APP_* → VITE_*
```
Add: `VITE_FIREBASE_MEASUREMENT_ID`

**Update `src/firebase.js`:**
```javascript
process.env.REACT_APP_* → import.meta.env.VITE_*
```

### 1.6 Rename Components to `.jsx`

- `src/App.js` → `src/App.jsx`
- All files in `src/components/*.js` → `*.jsx`
- Keep `src/firebase.js` as `.js` (no JSX)

### 1.7 Delete Files

- `src/reportWebVitals.js`
- `src/setupTests.js`
- `src/App.test.js`
- `public/index.html` (after moving to root)

### 1.8 Verify

```bash
rm -rf node_modules && npm install
npm run dev      # Should start on localhost:3000
npm run build    # Should output to /build
```

---

## Phase 2: Rebrand to "welook.ing"

### 2.1 New Color Palette

Replace all F1 colors with a modern indigo/amber scheme:

```css
:root {
  --wl-primary: #4F46E5;        /* Indigo — main actions, links, highlights */
  --wl-primary-hover: #4338CA;
  --wl-primary-light: #EEF2FF;
  --wl-dark: #1E1B4B;           /* Deep indigo — header, nav background */
  --wl-dark-secondary: #312E81;
  --wl-accent: #F59E0B;         /* Amber — CTAs, admin accents */
  --wl-accent-hover: #D97706;
  --wl-success: #10B981;        /* Emerald — success states */
  --wl-gray-50: #F9FAFB;
  --wl-gray-100: #F3F4F6;
  --wl-gray-200: #E5E7EB;
  --wl-gray-500: #6B7280;
  --wl-gray-600: #4B5563;
  --wl-gray-900: #111827;
  --wl-white: #FFFFFF;
}
```

### 2.2 New Font

Replace Titillium Web with **Inter**:
```css
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap");

body {
  font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
}
```

### 2.3 CSS Variable Mapping

| Old (F1) | New (welook.ing) |
|----------|-----------------|
| `--f1-red` | `--wl-primary` |
| `--f1-black` | `--wl-dark` |
| `--f1-darkgray` | `--wl-dark-secondary` |
| `--f1-gray` | `--wl-gray-500` |
| `--f1-lightgray` | `--wl-gray-200` |
| `--f1-white` | `--wl-white` |
| `--f1-accent` | `--wl-accent` |

### 2.4 Files to Update

| File | Changes |
|------|---------|
| `src/index.css` | Replace font import, all CSS variables, delete `.racing-pattern` block, update spinner colors |
| `src/components/Header.jsx` | "Oleks F1 Quizz" → "welook.ing", update color refs |
| `src/components/Login.jsx` | Remove `racing-pattern` class, "Login to F1 Quiz" → "Login to welook.ing" |
| `src/components/QuizGame.jsx` | Remove `racing-pattern`, replace all `var(--f1-*)` |
| `src/components/QuizAdmin.jsx` | Replace `var(--f1-*)` color refs |
| `src/components/Rankings.jsx` | Replace F1 colors in table header styles |
| `src/components/Rules.jsx` | Full text rewrite — generic prediction language, no race/F1/championship refs |
| `index.html` | Title → "welook.ing - Prediction Quiz Platform" |
| `public/manifest.json` | Update name, short_name, theme_color |

### 2.5 Verify

```bash
grep -ri "f1\|formula\|race\|racing\|titillium\|checkered" src/
# Should return zero results
```
Visual check: indigo/amber palette everywhere, no red, no racing patterns.

---

## Phase 3: Public Landing Page

### 3.1 Create `src/components/LandingPage.jsx`

Pure presentational component (no Firebase calls), sections:
1. **Hero**: Dark gradient background, headline "Predict. Compete. Prove You Called It.", subheading, "Get Started" button → `/login`
2. **How It Works**: 3-step visual — Predict → Wait → See Results
3. **Features**: 2x2 card grid — Simple Yes/No, Timed Deadlines, Live Leaderboards, Community
4. **CTA**: "Start Predicting Today" + Login/Register button
5. **Footer**: Links + branding

### 3.2 Create `src/components/HomeRoute.jsx`

Auth-conditional wrapper for the `/` route:
```jsx
const HomeRoute = () => {
  // Listen to auth state
  // If loading → spinner
  // If authenticated → <Navigate to="/dashboard" />
  // If not authenticated → <LandingPage />
};
```

### 3.3 Update Routing

**`src/App.jsx`:**
- Import `HomeRoute` for the `/` route (replaces direct `QuizGame`)
- Add new routes from Phase 4

**`src/components/Header.jsx`:**
- Unauthenticated: show only logo + "Login" button
- Authenticated: show full nav (Dashboard, Play, Rankings, Rules, admin links)

### 3.4 SEO Meta Tags

Add to `index.html` `<head>`:
```html
<meta name="description" content="welook.ing - Predict outcomes, compete with friends, prove you called it." />
<meta property="og:title" content="welook.ing - Prediction Quiz Platform" />
<meta property="og:description" content="Predict outcomes, compete with friends, prove you called it." />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://welook.ing" />
<meta name="twitter:card" content="summary_large_image" />
```

### 3.5 Landing Page CSS

Add to `src/index.css`:
```css
.landing-hero {
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  background: linear-gradient(135deg, var(--wl-dark) 0%, var(--wl-dark-secondary) 100%);
  color: var(--wl-white);
  padding: 40px 20px;
}
/* ... additional landing styles */
```

### 3.6 Verify

- Visit `/` logged out → landing page with hero, how it works, CTA
- Click "Get Started" → navigates to `/login`
- Log in → redirects to `/dashboard`
- View page source → OG tags present

---

## Phase 4: User Dashboard

### 4.1 Create `src/components/Dashboard.jsx`

Fetches `quizAnswers` where `userId == currentUser.uid`, computes stats.

**Layout:**
```
┌──────────────┬──────────────┬──────────────┐
│ Quizzes      │ Total        │ Accuracy     │
│ Played: 12   │ Points: 28   │ 77.8%        │
└──────────────┴──────────────┴──────────────┘

┌─────────────────────────────────────────────┐
│ Quiz History                                │
│ ┌─────────────┬───────┬──────────┬────────┐ │
│ │ Quiz Title  │ Score │ Date     │ Status │ │
│ ├─────────────┼───────┼──────────┼────────┤ │
│ │ Week 5 Quiz │ 2/3   │ Feb 10   │ Scored │ │
│ │ Week 4 Quiz │ 3/3   │ Feb 3    │ Scored │ │
│ │ Week 6 Quiz │ -     │ Feb 15   │ Open   │ │
│ └─────────────┴───────┴──────────┴────────┘ │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Notification Preferences                    │
│ [ ] Push Notifications                      │
│ [ ] Email Notifications                     │
└─────────────────────────────────────────────┘
```

### 4.2 Route & Navigation

- `src/App.jsx` — add `<Route path="/dashboard" element={<Dashboard />} />`
- `src/components/HomeRoute.jsx` — authenticated → `<Navigate to="/dashboard" />`
- `src/components/Header.jsx` — add "Dashboard" nav link (first item for logged-in users)

### 4.3 Dashboard CSS

```css
.dashboard-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: var(--wl-white);
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--wl-primary);
}

.stat-label {
  font-size: 0.875rem;
  color: var(--wl-gray-500);
  text-transform: uppercase;
}

@media (max-width: 640px) {
  .dashboard-stats { grid-template-columns: 1fr; }
}
```

### 4.4 Firebase Helper for Notification Prefs

Add to `src/firebase.js`:
```javascript
export const updateNotificationPrefs = async (userId, prefs) => {
  const userRef = doc(db, "users", userId);
  await setDoc(userRef, prefs, { merge: true });
};
```

Dashboard toggles call this with `{ notifyPush: boolean, notifyEmail: boolean }`.

### 4.5 Verify

- Log in → land on `/dashboard`
- Stats cards show correct computed values
- Quiz history table shows scores per quiz
- Toggle notification preferences → saved in Firestore `users` doc
- Nav: Dashboard, Play, Rankings, Rules all accessible

---

## Phase 5: Notifications (Push + Email)

### 5.1 Firestore Data Model Changes

**`users` collection** — add fields:
```
notifyPush: boolean     (default: false)
notifyEmail: boolean    (default: false)
fcmToken: string | null (default: null)
```

**New `mail` collection** (used by Firebase "Trigger Email" extension):
```
{ to: string, message: { subject: string, html: string } }
```

### 5.2 Firebase Cloud Functions

**Create `functions/` directory:**

`functions/package.json`:
```json
{
  "name": "welooking-functions",
  "engines": { "node": "18" },
  "main": "index.js",
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^5.0.0"
  }
}
```

`functions/index.js` — Firestore trigger on `quizzes/{quizId}` creation:
```javascript
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();

exports.onQuizCreated = onDocumentCreated("quizzes/{quizId}", async (event) => {
  const db = getFirestore();
  const messaging = getMessaging();
  const quizData = event.data.data();
  const quizTitle = quizData.title;

  const usersSnapshot = await db.collection("users").get();
  const pushPromises = [];
  const emailPromises = [];

  usersSnapshot.forEach((userDoc) => {
    const userData = userDoc.data();

    // Push notification
    if (userData.notifyPush && userData.fcmToken) {
      pushPromises.push(
        messaging.send({
          token: userData.fcmToken,
          notification: {
            title: "New Quiz Available!",
            body: `"${quizTitle}" is now live. Make your predictions!`,
          },
          webpush: { fcmOptions: { link: "/" } },
        }).catch((err) => console.error("FCM send error:", err))
      );
    }

    // Email notification (via Trigger Email extension)
    if (userData.notifyEmail && userData.email) {
      emailPromises.push(
        db.collection("mail").add({
          to: userData.email,
          message: {
            subject: `New Quiz: ${quizTitle} - welook.ing`,
            html: `
              <h2>New Quiz Available!</h2>
              <p>"${quizTitle}" is now live on welook.ing.</p>
              <p>Make your predictions before the deadline!</p>
              <a href="https://welook.ing">Go to welook.ing</a>
            `,
          },
        })
      );
    }
  });

  await Promise.all([...pushPromises, ...emailPromises]);
});
```

### 5.3 FCM Service Worker

**Create `public/firebase-messaging-sw.js`:**
```javascript
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  // Hardcoded config (these are public identifiers, not secrets)
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "...",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: '/logo192.png',
  });
});
```

### 5.4 FCM Client-Side (`src/firebase.js`)

Add:
```javascript
import { getMessaging, getToken, onMessage } from "firebase/messaging";

let messaging = null;
try {
  messaging = getMessaging(app);
} catch (e) {
  console.log("FCM not supported in this browser");
}

export const requestNotificationPermission = async (userId) => {
  if (!messaging) return null;
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  const token = await getToken(messaging, {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
  });

  // Store token in Firestore
  const userRef = doc(db, "users", userId);
  await setDoc(userRef, { fcmToken: token, notifyPush: true }, { merge: true });
  return token;
};

export const onForegroundMessage = (callback) => {
  if (!messaging) return () => {};
  return onMessage(messaging, callback);
};
```

Add to `.env` / `.env.example`: `VITE_FIREBASE_VAPID_KEY`

### 5.5 Notification Prompt UI

**Create `src/components/NotificationPrompt.jsx`:**

Non-intrusive banner on Dashboard:
- Checks if permission already granted or prompt dismissed (localStorage)
- "Enable notifications" → calls `requestNotificationPermission(userId)`
- "Not now" → dismisses to localStorage

Render inside `Dashboard.jsx` at the top.

### 5.6 Dashboard Notification Toggles (Wire Up)

- Toggle `notifyPush` on: calls `requestNotificationPermission(userId)` if no token yet
- Toggle `notifyPush` off: updates Firestore `{ notifyPush: false }`
- Toggle `notifyEmail` on/off: updates Firestore `{ notifyEmail: boolean }`

### 5.7 Update Deployment Config

**`firebase.json`:**
```json
{
  "hosting": {
    "public": "build",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }]
  },
  "functions": {
    "source": "functions"
  }
}
```

**`.gitignore`:** Add `functions/node_modules`

### 5.8 Verify

- Create a new quiz as admin
- Check Firebase Console → Functions → Logs for trigger
- Opted-in user receives push notification (even with tab closed)
- `mail` collection gets new document → email delivered (check SendGrid dashboard)
- Toggle prefs off → no notifications on next quiz creation

---

## Phase 6: Firebase Analytics

### 6.1 Update `src/firebase.js`

```javascript
import { getAnalytics, logEvent } from "firebase/analytics";

const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export const trackEvent = (eventName, params = {}) => {
  if (analytics) logEvent(analytics, eventName, params);
};

export const trackQuizStart = (quizId, title) =>
  trackEvent('quiz_start', { quiz_id: quizId, quiz_title: title });

export const trackQuizSubmit = (quizId, title, count) =>
  trackEvent('quiz_submit', { quiz_id: quizId, quiz_title: title, questions_answered: count });

export const trackLogin = () => trackEvent('login', { method: 'email' });
export const trackSignUp = () => trackEvent('sign_up', { method: 'email' });
```

### 6.2 Page View Tracking

Move `BrowserRouter` from `App.jsx` to `main.jsx`, then add to `App.jsx`:
```javascript
const location = useLocation();
useEffect(() => {
  trackEvent('page_view', { page_path: location.pathname });
}, [location]);
```

### 6.3 Event Tracking in Components

- **Login.jsx**: `trackLogin()` / `trackSignUp()` on success
- **QuizGame.jsx**: `trackQuizStart()` on load, `trackQuizSubmit()` on submit

### 6.4 Verify

- DevTools → Network tab → filter `google-analytics` or `firebase`
- Navigate through app: page_view events fire per route
- Log in, load quiz, submit quiz: respective events fire

---

## Phase 7: Mobile-First CSS

### 7.1 Refactor Media Queries

Convert `max-width` (desktop-first) to `min-width` (mobile-first) in `src/index.css`:

```css
/* Mobile base (default) */
.header-content {
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

/* Tablet+ */
@media (min-width: 768px) {
  .header-content {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}
```

Apply to: `.header-content`, `.nav-menu`, `.card`, `.admin-controls`, `.dashboard-stats`, quiz options.

### 7.2 Hamburger Menu (`Header.jsx`)

- Add `menuOpen` state + hamburger button (hidden on desktop via CSS)
- Toggle `.nav-menu.open` class
- Close menu on route change (`useEffect` with `location`)

```css
.hamburger { display: flex; /* mobile */ }
.nav-menu { display: none; }
.nav-menu.open { display: flex; flex-direction: column; }

@media (min-width: 768px) {
  .hamburger { display: none; }
  .nav-menu { display: flex; flex-direction: row; }
}
```

### 7.3 Mobile Card Views for Tables

**Rankings.jsx:**
- `.desktop-only` table (hidden on mobile)
- `.mobile-only` ranking cards: rank badge, username, total score

**UsersList.jsx:**
- Same pattern: user cards on mobile, table on desktop

```css
.mobile-only { display: block; }
.desktop-only { display: none; }

@media (min-width: 768px) {
  .mobile-only { display: none; }
  .desktop-only { display: block; }
}
```

### 7.4 Quiz Options Layout

Replace `flex space-x-4` with `.options-grid`:
```css
.options-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

@media (min-width: 480px) {
  .options-grid { flex-direction: row; }
}
```

### 7.5 Verify

- Test at 375px, 768px, 1024px widths
- Hamburger menu toggles at mobile width
- Rankings/Users show cards on mobile, tables on desktop
- Quiz options stack vertically on mobile
- No horizontal scrolling at 375px
- All tap targets >= 44px

---

## Files Summary

### Create (11 new files)

| File | Phase | Purpose |
|------|-------|---------|
| `vite.config.js` | 1 | Vite build configuration |
| `postcss.config.js` | 1 | PostCSS/Tailwind config |
| `tailwind.config.js` | 1 | Tailwind theme config |
| `index.html` (root) | 1 | Root HTML (moved from public/) |
| `src/components/LandingPage.jsx` | 3 | Public marketing page |
| `src/components/HomeRoute.jsx` | 3 | Auth-conditional route |
| `src/components/Dashboard.jsx` | 4 | User dashboard with stats |
| `src/components/NotificationPrompt.jsx` | 5 | FCM permission banner |
| `public/firebase-messaging-sw.js` | 5 | FCM service worker |
| `functions/package.json` | 5 | Cloud Functions dependencies |
| `functions/index.js` | 5 | Cloud Function: onQuizCreated |

### Modify (15 files)

| File | Phases | Changes |
|------|--------|---------|
| `package.json` | 1 | Remove CRA, add Vite deps, `"type": "module"` |
| `.env` / `.env.example` | 1, 5 | Rename vars, add measurement ID + VAPID key |
| `src/firebase.js` | 1, 5, 6 | Vite env vars, Analytics, FCM, notification helpers |
| `src/main.jsx` | 1, 6 | Entry point (renamed), BrowserRouter moved here |
| `src/App.jsx` | 3, 4, 6 | New routes, page tracking, import HomeRoute/Dashboard |
| `src/index.css` | 2, 3, 4, 7 | Full rebrand, landing styles, dashboard styles, mobile-first |
| `src/components/Header.jsx` | 2, 3, 4, 7 | Rebrand, conditional nav, dashboard link, hamburger |
| `src/components/Login.jsx` | 2, 6 | Remove racing-pattern, rebrand text, analytics |
| `src/components/QuizGame.jsx` | 2, 6, 7 | Rebrand colors, analytics, mobile options |
| `src/components/QuizAdmin.jsx` | 2 | Replace F1 color refs |
| `src/components/Rankings.jsx` | 2, 7 | Replace F1 colors, mobile card view |
| `src/components/Rules.jsx` | 2 | Full text rewrite (generic prediction language) |
| `src/components/UsersList.jsx` | 7 | Mobile card view |
| `firebase.json` | 5 | Add functions config |
| `public/manifest.json` | 2 | Update name, theme_color |

### Delete (4 files)

| File | Phase | Reason |
|------|-------|--------|
| `src/reportWebVitals.js` | 1 | CRA-specific |
| `src/setupTests.js` | 1 | Removing tests |
| `src/App.test.js` | 1 | Removing tests |
| `public/index.html` | 1 | Moved to root |

---

## Prerequisites (Manual Setup)

Before Phase 5, set up in Firebase Console:
1. **Enable Analytics** — get measurement ID
2. **Enable Cloud Messaging** — generate VAPID key pair
3. **Install "Trigger Email from Firestore" extension** — configure with SendGrid
4. **SendGrid account** — free tier (100 emails/day), get API key
5. **Domain** — configure `welook.ing` in Firebase Hosting custom domains

---

## Execution Order

```
Phase 1 (Vite Migration)
  ↓
Phase 2 (Rebrand)
  ↓
Phase 3 (Landing Page)
  ↓  ↘
  ↓   Phase 6 (Analytics) — can run in parallel
  ↓  ↗
Phase 4 (Dashboard)
  ↓
Phase 5 (Notifications)
  ↓
Phase 7 (Mobile-First CSS) — best done last, touches CSS across all components
```

### Branch Strategy

```bash
git checkout -b feature/phase1-vite-migration
# ... merge to main
git checkout -b feature/phase2-rebrand
# ... merge to main
# ... etc for each phase
```

---

## Test Checklist

### After Each Phase
- [ ] `npm run dev` — app loads without errors
- [ ] `npm run build` — build succeeds

### Final Integration
- [ ] Logged out: landing page renders at `/`
- [ ] Login/Register works
- [ ] Logged in: redirected to `/dashboard`
- [ ] Dashboard shows correct stats + quiz history
- [ ] Play quiz: loads, submits, shows results
- [ ] Rankings display correctly
- [ ] Notification prefs toggle and persist
- [ ] Push notification received when new quiz created
- [ ] Email notification received when new quiz created
- [ ] Analytics events visible in Network tab
- [ ] Mobile (375px): hamburger works, cards instead of tables, options stack
- [ ] No F1/racing references anywhere in UI
- [ ] `firebase deploy --only hosting` works
- [ ] `firebase deploy --only functions` works
