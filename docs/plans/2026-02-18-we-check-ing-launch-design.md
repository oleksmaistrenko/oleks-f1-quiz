# we-check.ing — F1 Prediction Quiz Platform Launch Design

## Overview

**Product:** we-check.ing — a public F1 prediction quiz platform inspired by the "we are checking" Ferrari meme.

**Goal:** Launch a fully featured F1 prediction quiz platform before the 2026 F1 season (mid-March 2026).

**Scope:** New site, everything launches together. This is a complete rebuild/rebrand of the existing F1 quiz app.

**Separate from:** welook.ing (generic prediction platform — future, separate project).

## Brand Identity

### Name & Concept
- **Domain:** we-check.ing
- **Origin:** Ferrari's infamous "we are checking" team radio meme + clown/circus imagery
- **Tone:** Playful throughout — serious predictions, not-so-serious presentation. Meme references woven into UX copy, clown mascot for personality, professional layout with fun micro-interactions.
- **Tagline ideas:** "Predict. Compete. Prove it." / "We are checking your predictions..."

### Color Palette
| Role | Color | Hex | Notes |
|------|-------|-----|-------|
| Primary | Ferrari Red | #DC2626 | CTAs, navigation, branding |
| Accent bright | Clown nose red | #FF4444 | Hover states, playful accents |
| Accent warm | Gold/Yellow | #F59E0B | Scores, achievements, highlights |
| Background | Near-black | #0F0F1A | Dark mode default |
| Surface | Dark gray | #1E1E30 | Cards, panels |
| Secondary | Carbon dark | #1A1A2E | Deep backgrounds |
| Text primary | White | #F5F5F5 | |
| Text secondary | Light gray | #A0A0B0 | |
| Success | Green | #22C55E | Correct predictions |
| Error | Red | #EF4444 | Incorrect predictions, errors |
| Warning | Amber | #F59E0B | Deadlines approaching |

### Typography
- **Headings & Body:** Inter
- **Monospace (timers/scores):** JetBrains Mono or similar

### Design Language
- Dark-mode-first (fits motorsport/racing aesthetic)
- Card-based UI with subtle borders
- Checkered flag pattern as subtle decorative element
- Mobile-first, designed for phone-in-hand use during race weekends
- Clown mascot character for: loading states, errors, 404, empty states

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 |
| Build | Vite (migrated from CRA) |
| Routing | React Router v6 |
| Database | Firebase Firestore |
| Auth | Firebase Auth (email/password) |
| Hosting | Firebase Hosting |
| Styling | Tailwind CSS |
| Notifications | Firebase Cloud Messaging (push) + SendGrid (email) |
| Backend logic | Firebase Cloud Functions |
| i18n | i18next (6 languages) |
| Font | Inter (Google Fonts) |

## Project Structure

```
we-check-ing/
├── index.html                     # Vite entry point
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── src/
│   ├── main.jsx                   # Entry point
│   ├── App.jsx
│   ├── firebase.js                # Firebase config
│   ├── i18n.js                    # i18next setup
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── Layout.jsx        # Wraps header + footer
│   │   ├── auth/
│   │   │   ├── Login.jsx
│   │   │   ├── PasswordReset.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── quiz/
│   │   │   ├── QuizGame.jsx
│   │   │   └── QuizAdmin.jsx
│   │   ├── dashboard/
│   │   │   └── Dashboard.jsx
│   │   ├── pages/
│   │   │   ├── Landing.jsx
│   │   │   ├── Rankings.jsx
│   │   │   ├── Rules.jsx
│   │   │   ├── Privacy.jsx
│   │   │   ├── Terms.jsx
│   │   │   └── CookieConsent.jsx
│   │   └── admin/
│   │       └── UsersList.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   └── useNotifications.js
│   ├── locales/
│   │   ├── en.json
│   │   ├── fr.json
│   │   ├── es.json
│   │   ├── it.json
│   │   ├── pt.json
│   │   └── uk.json
│   └── styles/
│       └── index.css
├── functions/                     # Firebase Cloud Functions
│   ├── index.js
│   └── package.json
├── public/
│   ├── favicon.ico
│   └── manifest.json
├── firebase.json
└── package.json
```

## Feature Set

### Landing Page (unauthenticated)
1. **Hero:** "We are checking..." headline, F1 prediction pitch, sign-up CTA, clown mascot
2. **How it works:** 3-step visual (Predict -> Watch -> Score)
3. **Live leaderboard teaser:** Top 5 from current season
4. **Community section:** "Join X fans who are also checking"
5. **Footer:** Privacy, Terms, language switcher

### Authentication
- Sign up: email + password + username
- Login: email + password
- Password reset: "Forgot password?" -> Firebase sends reset email -> user sets new password
- Session management via Firebase Auth (auto token refresh)

### Quiz Game (core loop)
- View active quiz with yes/no prediction questions
- Countdown timer showing deadline
- Submit predictions before deadline
- After reveal: see score with correct/incorrect highlights
- Loading state: "We are checking your answers..."

### User Dashboard
- Season overview: total score, rank, quizzes completed
- Recent quizzes: last 3-5 with scores
- Prediction accuracy: percentage correct, streak tracking
- Quick stats summary
- Active quiz CTA if one is open

### Rankings / Leaderboard
- Season leaderboard: rank, username, total score
- Current user position highlighted
- Quiz-by-quiz breakdown (expandable)
- Fun titles for positions ("Strategy Chief," "Pit Wall Genius," last place: "We Are Checking...")

### Notifications

**Push (Firebase Cloud Messaging):**
- New quiz available
- Deadline approaching (1 hour before)
- Results revealed
- Opt-in on first visit, manage in settings

**Email (SendGrid via Cloud Functions):**
- Same triggers as push
- Weekly digest option
- Unsubscribe link in every email

### Legal Pages
- **Privacy Policy:** Data collected (email, username, predictions), storage (Firebase), no third-party selling
- **Terms of Service:** Free service, no gambling, admin moderation rights
- **Cookie Consent:** Banner on first visit, essential cookies only + optional analytics

### Internationalization (i18n)
- 6 languages: EN, FR, ES, IT, PT, UK
- Language switcher in header/footer
- Browser language auto-detection on first visit
- All UI text externalized to JSON locale files
- Quiz content stays in admin's language (not auto-translated)

## Data Model

### Firestore Collections

**users**
```
{
  email: string,
  username: string,
  role: "user" | "admin",
  language: string,
  notificationPrefs: {
    push: boolean,
    email: boolean,
    weeklyDigest: boolean
  },
  fcmToken: string | null,
  stats: {
    totalScore: number,
    quizCount: number,
    correctCount: number
  },
  createdAt: timestamp
}
```

**quizzes**
```
{
  title: string,
  questions: [{ text: string, answer: boolean | null }],
  deadline: timestamp,
  createdBy: string,
  createdAt: timestamp
}
```

**quizAnswers**
```
{
  quizId: string,
  userId: string,
  answers: boolean[],
  score: number | null,
  submittedAt: timestamp
}
```

## Error Handling
- **Network errors:** Toast with retry. "We are checking your connection..."
- **Auth errors:** Clear form messages. "Even Ferrari's strategy team could log in faster."
- **Quiz submission:** Save draft to localStorage, retry on reconnect
- **404:** Clown mascot — "We are still checking... but this page doesn't exist"
- **Rate limiting:** Firebase Security Rules server-side

## Security
- Firebase Security Rules: users read/write own answers only, admins create quizzes and reveal answers
- Input sanitization on quiz creation
- Env vars via Vite (VITE_* prefix), no secrets in client code

## Execution Plan (4 weeks)

### Week 1 — Foundation
- CRA -> Vite migration
- Rebrand: new color palette, typography, logo placeholder
- Mobile-first CSS refactor with Tailwind
- Reorganize project structure

### Week 2 — Core Features
- Landing page
- User dashboard with stats
- Password reset flow
- Legal pages (Privacy, Terms, Cookie consent)
- Footer component

### Week 3 — Engagement Features
- Firebase Cloud Functions setup
- Push notifications (FCM)
- Email notifications (SendGrid)
- i18n setup + 6 language translations
- Language switcher

### Week 4 — Polish & Launch
- Clown mascot illustrations/SVGs
- Fun meme copy throughout UI
- Leaderboard enhancements
- Cross-browser & mobile testing
- Deploy to Firebase Hosting with we-check.ing domain
- Final testing checklist

**Launch strategy:** Everything ships together as a new site. No staged rollout.
