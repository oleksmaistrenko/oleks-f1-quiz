# welook.ing App Update Plan

## Overview

Complete migration from "Oleks F1 Quizz" (CRA) to **welook.ing** — a generic prediction quiz platform built on Vite. Includes full rebrand, public landing page, user dashboard, push + email notifications, Firebase Analytics, i18n translation, and mobile-first design.

---

## Hosting

**Platform:** Firebase Hosting (already configured in `firebase.json` and `.firebaserc`).

**Why Firebase Hosting:**
- Already integrated — Auth, Firestore, Cloud Functions, and Hosting all in one project
- Free Spark plan: 10 GB storage, 360 MB/day transfer, automatic SSL
- SPA rewrites already configured (`** → /index.html`)
- Single `firebase deploy` deploys hosting + functions together
- Custom domain (`welook.ing`) setup via Firebase Console → Hosting → Custom domains

**Deployment:**
```bash
npm run build                          # Build to /build
firebase deploy --only hosting         # Deploy frontend
firebase deploy --only functions       # Deploy Cloud Functions
firebase deploy                        # Deploy everything
```

**Optional future upgrades:**
- **Cloudflare DNS** in front of Firebase Hosting for DDoS protection and caching
- **GitHub Actions CI/CD** — auto-deploy on merge to `main` (see `.github/workflows/` example below)

```yaml
# .github/workflows/deploy.yml (optional, for later)
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 18 }
      - run: npm ci && npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          channelId: live
```

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
| `src/components/Login.jsx` | Remove `racing-pattern` class, "Login to F1 Quiz" → "Login to welook.ing", add password reset (see 2.6) |
| `src/components/QuizGame.jsx` | Remove `racing-pattern`, replace all `var(--f1-*)` |
| `src/components/QuizAdmin.jsx` | Replace `var(--f1-*)` color refs |
| `src/components/Rankings.jsx` | Replace F1 colors in table header styles |
| `src/components/Rules.jsx` | Full text rewrite — generic prediction language, no race/F1/championship refs |
| `index.html` | Title → "welook.ing - Prediction Quiz Platform" |
| `public/manifest.json` | Update name, short_name, theme_color |

### 2.6 Password Reset

**Add to `src/firebase.js`:**
```javascript
import { sendPasswordResetEmail } from "firebase/auth";

export const resetPassword = (email) => {
  return sendPasswordResetEmail(auth, email);
};
```

**Update `src/components/Login.jsx`:**

Add a `forgotPassword` state and a third form view:

```jsx
const [mode, setMode] = useState("login"); // "login" | "register" | "forgot"
const [resetSent, setResetSent] = useState(false);

const handleForgotPassword = async (e) => {
  e.preventDefault();
  setError("");
  setLoading(true);
  try {
    await resetPassword(email);
    setResetSent(true);
  } catch (error) {
    setError(
      error.code === "auth/user-not-found"
        ? "No account found with this email"
        : "Failed to send reset email"
    );
  }
  setLoading(false);
};
```

UI changes:
- Add "Forgot password?" link below the password field (visible in login mode)
- Clicking it switches to forgot mode — shows only email field + "Send Reset Link" button
- On success: show confirmation message "Check your email for a reset link"
- "Back to login" link to return

### 2.7 Verify

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

## Phase 8: Internationalization (i18n)

### 8.1 Install Dependencies

```bash
npm install i18next react-i18next i18next-browser-languagedetector
```

### 8.2 Create Translation Files

**Create `src/i18n/` directory with locale files:**

`src/i18n/en.json`:
```json
{
  "nav": {
    "dashboard": "Dashboard",
    "play": "Play",
    "rankings": "Rankings",
    "rules": "Rules",
    "login": "Login",
    "logout": "Logout",
    "admin": "Admin",
    "users": "Users"
  },
  "landing": {
    "headline": "Predict. Compete. Prove You Called It.",
    "subheading": "Make predictions on real-world outcomes and compete with friends.",
    "getStarted": "Get Started",
    "howItWorks": "How It Works",
    "step1Title": "Predict",
    "step1Desc": "Answer yes/no questions about upcoming events.",
    "step2Title": "Wait",
    "step2Desc": "Results are revealed when the event concludes.",
    "step3Title": "Score",
    "step3Desc": "See how you stack up on the leaderboard.",
    "cta": "Start Predicting Today"
  },
  "login": {
    "title": "Login to welook.ing",
    "email": "Email",
    "password": "Password",
    "loginButton": "Login",
    "registerButton": "Register",
    "noAccount": "Don't have an account?",
    "hasAccount": "Already have an account?"
  },
  "dashboard": {
    "title": "Dashboard",
    "quizzesPlayed": "Quizzes Played",
    "totalPoints": "Total Points",
    "accuracy": "Accuracy",
    "quizHistory": "Quiz History",
    "quizTitle": "Quiz Title",
    "score": "Score",
    "date": "Date",
    "status": "Status",
    "statusScored": "Scored",
    "statusOpen": "Open",
    "notifications": "Notification Preferences",
    "pushNotifications": "Push Notifications",
    "emailNotifications": "Email Notifications"
  },
  "quiz": {
    "deadline": "Deadline",
    "submit": "Submit Answers",
    "submitted": "Answers Submitted",
    "yes": "Yes",
    "no": "No",
    "resultsAvailable": "Results Available",
    "correct": "Correct",
    "incorrect": "Incorrect",
    "pending": "Pending"
  },
  "rankings": {
    "title": "Rankings",
    "rank": "Rank",
    "player": "Player",
    "score": "Score"
  },
  "rules": {
    "title": "Rules",
    "content": "..."
  },
  "common": {
    "loading": "Loading...",
    "error": "Something went wrong",
    "save": "Save",
    "cancel": "Cancel",
    "back": "Back"
  }
}
```

Additional locale files (same structure, translated values):
- `src/i18n/es.json` — Spanish
- `src/i18n/de.json` — German
- `src/i18n/fr.json` — French
- `src/i18n/pt.json` — Portuguese

Start with the top 4-5 languages by global internet users. Add more locales as demand grows.

### 8.3 Initialize i18n

**Create `src/i18n/index.js`:**
```javascript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './en.json';
import es from './es.json';
import de from './de.json';
import fr from './fr.json';
import pt from './pt.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      de: { translation: de },
      fr: { translation: fr },
      pt: { translation: pt },
    },
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
```

**Import in `src/main.jsx`:**
```javascript
import './i18n';
```

### 8.4 Language Switcher Component

**Create `src/components/LanguageSwitcher.jsx`:**
```jsx
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
  { code: 'de', label: 'DE' },
  { code: 'fr', label: 'FR' },
  { code: 'pt', label: 'PT' },
];

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  return (
    <div className="language-switcher">
      {languages.map((lang) => (
        <button
          key={lang.code}
          className={i18n.language === lang.code ? 'active' : ''}
          onClick={() => i18n.changeLanguage(lang.code)}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
```

Render in `Header.jsx` (visible to both authenticated and unauthenticated users).

### 8.5 Replace Hardcoded Strings in Components

Use the `useTranslation` hook in each component:
```jsx
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();
  return <h1>{t('dashboard.title')}</h1>;
};
```

**Components to update:**
| Component | Keys to use |
|-----------|-------------|
| `Header.jsx` | `nav.*` |
| `LandingPage.jsx` | `landing.*` |
| `Login.jsx` | `login.*` |
| `Dashboard.jsx` | `dashboard.*` |
| `QuizGame.jsx` | `quiz.*` |
| `Rankings.jsx` | `rankings.*` |
| `Rules.jsx` | `rules.*` |
| `NotificationPrompt.jsx` | `dashboard.notifications` |

### 8.6 Quiz Content Auto-Translation

Quiz questions and answers live in Firestore and are created by admins in English. Auto-translate on the fly using the Cloud Translation API.

**Add Cloud Function for translation caching:**

`functions/translate.js`:
```javascript
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { getFirestore } = require("firebase-admin/firestore");
const { TranslationServiceClient } = require("@google-cloud/translate");

const translationClient = new TranslationServiceClient();
const TARGET_LANGS = ["es", "de", "fr", "pt"];

exports.onQuizCreatedTranslate = onDocumentCreated("quizzes/{quizId}", async (event) => {
  const db = getFirestore();
  const quizData = event.data.data();
  const quizId = event.params.quizId;
  const projectId = process.env.GCLOUD_PROJECT;

  const textsToTranslate = [
    quizData.title,
    ...quizData.questions.map((q) => q.text),
  ];

  const translations = {};

  for (const lang of TARGET_LANGS) {
    const [response] = await translationClient.translateText({
      parent: `projects/${projectId}/locations/global`,
      contents: textsToTranslate,
      mimeType: "text/plain",
      sourceLanguageCode: "en",
      targetLanguageCode: lang,
    });

    const translated = response.translations.map((t) => t.translatedText);
    translations[lang] = {
      title: translated[0],
      questions: translated.slice(1),
    };
  }

  // Store translations as a subcollection
  await db.doc(`quizzes/${quizId}/translations/auto`).set(translations);
});
```

**Client-side usage in `QuizGame.jsx`:**
```javascript
const { i18n } = useTranslation();
const lang = i18n.language;

// Fetch translations doc if lang !== 'en'
// Fall back to original English text if translation unavailable
```

**Firestore structure:**
```
quizzes/{quizId}/translations/auto: {
  es: { title: "...", questions: ["...", "...", "..."] },
  de: { title: "...", questions: ["...", "...", "..."] },
  fr: { title: "...", questions: ["...", "...", "..."] },
  pt: { title: "...", questions: ["...", "...", "..."] },
}
```

**Prerequisites:**
- Enable Cloud Translation API in Google Cloud Console
- Add `@google-cloud/translate` to `functions/package.json`
- The API is free for first 500,000 characters/month

### 8.7 Language Switcher CSS

```css
.language-switcher {
  display: flex;
  gap: 4px;
}

.language-switcher button {
  background: transparent;
  border: 1px solid var(--wl-gray-200);
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--wl-gray-500);
  cursor: pointer;
  transition: all 0.2s;
}

.language-switcher button.active {
  background: var(--wl-primary);
  border-color: var(--wl-primary);
  color: var(--wl-white);
}
```

### 8.8 Verify

- Switch to Spanish/German/French/Portuguese → all UI labels change
- Refresh page → language persists (localStorage)
- New visitor → language auto-detected from browser
- Quiz questions and titles auto-translated when viewing in non-English language
- Falls back to English gracefully if translation not yet available
- Landing page, login, dashboard, quiz, rankings, rules — all translated

---

## Phase 9: Additional Features

### 9.1 PWA Install Prompt

The app already has `manifest.json` and a service worker setup. Add a custom install prompt.

**Create `src/components/InstallPrompt.jsx`:**
```jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const InstallPrompt = () => {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="install-banner">
      <span>Install welook.ing for a better experience</span>
      <button onClick={handleInstall}>Install</button>
      <button onClick={() => setShowPrompt(false)}>Dismiss</button>
    </div>
  );
};

export default InstallPrompt;
```

Render in `App.jsx` (above routes).

### 9.2 Social Sharing

**Create `src/components/ShareButton.jsx`:**
```jsx
const ShareButton = ({ quizTitle, score, total }) => {
  const text = `I scored ${score}/${total} on "${quizTitle}" at welook.ing! Can you beat me?`;
  const url = 'https://welook.ing';

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: 'welook.ing', text, url });
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(`${text}\n${url}`);
      alert('Copied to clipboard!');
    }
  };

  return (
    <button className="share-button" onClick={handleShare}>
      Share Result
    </button>
  );
};

export default ShareButton;
```

Render in `QuizGame.jsx` after results are shown, and optionally in `Dashboard.jsx` per quiz row.

### 9.3 Dark Mode

**Extend CSS variables in `src/index.css`:**
```css
:root {
  /* ... existing light theme variables ... */
  --wl-bg: #FFFFFF;
  --wl-bg-secondary: var(--wl-gray-50);
  --wl-text: var(--wl-gray-900);
  --wl-text-secondary: var(--wl-gray-600);
  --wl-card-bg: var(--wl-white);
  --wl-card-shadow: rgba(0, 0, 0, 0.08);
  --wl-border: var(--wl-gray-200);
}

[data-theme="dark"] {
  --wl-bg: #0F172A;
  --wl-bg-secondary: #1E293B;
  --wl-text: #F1F5F9;
  --wl-text-secondary: #94A3B8;
  --wl-card-bg: #1E293B;
  --wl-card-shadow: rgba(0, 0, 0, 0.3);
  --wl-border: #334155;
  --wl-primary-light: #312E81;
  --wl-gray-50: #1E293B;
  --wl-gray-100: #334155;
}

body {
  background-color: var(--wl-bg);
  color: var(--wl-text);
}
```

**Create `src/components/ThemeToggle.jsx`:**
```jsx
import { useState, useEffect } from 'react';

const ThemeToggle = () => {
  const [dark, setDark] = useState(
    () => localStorage.getItem('theme') === 'dark'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <button className="theme-toggle" onClick={() => setDark(!dark)}>
      {dark ? '☀️' : '🌙'}
    </button>
  );
};

export default ThemeToggle;
```

Render in `Header.jsx` next to `LanguageSwitcher`.

Update all components to use semantic variables (`var(--wl-bg)`, `var(--wl-card-bg)`, `var(--wl-text)`) instead of hardcoded colors.

### 9.4 Quiz Categories/Tags (Future)

Add optional `category` field to quiz documents in Firestore:
```
quizzes/{id}: { ..., category: "sports" | "politics" | "entertainment" | "general" }
```

- Filter dropdown on the quiz list page
- Category badges on quiz cards
- Dashboard stats broken down by category

*Lower priority — implement when quiz volume justifies filtering.*

### 9.5 Achievement Badges (Future)

Firestore `users/{id}/achievements` subcollection:
```
{ type: "first_quiz" | "perfect_score" | "streak_5" | "streak_10", earnedAt: timestamp }
```

Cloud Function triggers on quiz scoring to check and award badges. Display on Dashboard and profile.

*Lower priority — implement for gamification after core features are stable.*

### 9.6 Verify

- PWA: "Install" banner appears on mobile Chrome, app installs to home screen
- Sharing: "Share Result" opens native share sheet (mobile) or copies to clipboard (desktop)
- Dark mode: toggle works, persists across sessions, all pages render correctly
- No hardcoded white/dark backgrounds that break in the opposite theme

---

## Files Summary

### Create (22 new files)

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
| `functions/translate.js` | 8 | Cloud Function: auto-translate quiz content |
| `src/i18n/index.js` | 8 | i18n initialization and config |
| `src/i18n/en.json` | 8 | English translation strings |
| `src/i18n/es.json` | 8 | Spanish translation strings |
| `src/i18n/de.json` | 8 | German translation strings |
| `src/i18n/fr.json` | 8 | French translation strings |
| `src/i18n/pt.json` | 8 | Portuguese translation strings |
| `src/components/LanguageSwitcher.jsx` | 8 | Language selector component |
| `src/components/InstallPrompt.jsx` | 9 | PWA install banner |
| `src/components/ShareButton.jsx` | 9 | Social sharing for quiz results |
| `src/components/ThemeToggle.jsx` | 9 | Dark/light mode toggle |

### Modify (15 files)

| File | Phases | Changes |
|------|--------|---------|
| `package.json` | 1, 8 | Remove CRA, add Vite deps, `"type": "module"`, add i18n deps |
| `.env` / `.env.example` | 1, 5 | Rename vars, add measurement ID + VAPID key |
| `src/firebase.js` | 1, 5, 6 | Vite env vars, Analytics, FCM, notification helpers |
| `src/main.jsx` | 1, 6, 8 | Entry point (renamed), BrowserRouter moved here, import i18n |
| `src/App.jsx` | 3, 4, 6, 9 | New routes, page tracking, InstallPrompt |
| `src/index.css` | 2, 3, 4, 7, 8, 9 | Full rebrand, landing styles, dashboard styles, mobile-first, language switcher, dark mode |
| `src/components/Header.jsx` | 2, 3, 4, 7, 8, 9 | Rebrand, conditional nav, hamburger, LanguageSwitcher, ThemeToggle |
| `src/components/Login.jsx` | 2, 6, 8 | Remove racing-pattern, rebrand text, analytics, i18n |
| `src/components/QuizGame.jsx` | 2, 6, 7, 8, 9 | Rebrand colors, analytics, mobile options, i18n, ShareButton |
| `src/components/QuizAdmin.jsx` | 2 | Replace F1 color refs |
| `src/components/Rankings.jsx` | 2, 7, 8 | Replace F1 colors, mobile card view, i18n |
| `src/components/Rules.jsx` | 2, 8 | Full text rewrite, i18n |
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

Before Phase 8:
6. **Enable Cloud Translation API** in Google Cloud Console (free for first 500K chars/month)
7. Add `@google-cloud/translate` to `functions/package.json`

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
Phase 7 (Mobile-First CSS)
  ↓
Phase 8 (i18n) — after UI is stable, extract all strings
  ↓
Phase 9 (PWA Install, Sharing, Dark Mode) — polish layer
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
- [ ] "Forgot password?" sends reset email, link works
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
- [ ] Language switcher: switch to Spanish/German/etc. → all UI labels change
- [ ] Quiz content auto-translates when language is changed
- [ ] Language persists across page refresh (localStorage)
- [ ] Dark mode toggle works, all pages render correctly in both themes
- [ ] Dark mode preference persists across sessions
- [ ] PWA install banner appears on mobile Chrome
- [ ] Share button opens native share (mobile) or copies to clipboard (desktop)
- [ ] `firebase deploy --only hosting` works
- [ ] `firebase deploy --only functions` works
