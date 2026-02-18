# we-check.ing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the existing F1 quiz app into we-check.ing — a publicly launched F1 prediction quiz platform with dashboard, notifications, i18n (6 languages), legal pages, and a playful "we are checking" meme-inspired brand.

**Architecture:** React 19 SPA on Vite, Firebase backend (Auth, Firestore, Hosting, Cloud Functions, Cloud Messaging). Dark-mode-first UI with Ferrari red/gold/carbon theme. i18next for internationalization. SendGrid for emails via Cloud Functions.

**Tech Stack:** React 19, Vite, Tailwind CSS 4, Firebase (Auth, Firestore, Hosting, Functions, FCM), i18next, SendGrid, Inter font, JetBrains Mono

---

## Task 1: CRA → Vite Migration

**Files:**
- Delete: `src/reportWebVitals.js`, `src/components/reportWebVitals.js`, `src/components/setupTests.js`
- Create: `vite.config.js`
- Modify: `package.json`
- Modify: `public/index.html` → move to `index.html` (project root)
- Rename: `src/index.js` → `src/main.jsx`
- Modify: `src/firebase.js` (env var prefix)
- Modify: `.env.example` (env var prefix)
- Modify: `firebase.json` (build dir → dist)

**Step 1: Install Vite and remove CRA dependencies**

```bash
npm uninstall react-scripts web-vitals @testing-library/dom @testing-library/jest-dom @testing-library/react @testing-library/user-event
npm install --save-dev vite @vitejs/plugin-react
```

**Step 2: Create Vite and Tailwind config files**

Create `postcss.config.js`:

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

Create `tailwind.config.js`:

```js
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: { extend: {} },
};
```

**Step 3: Create `vite.config.js`**

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
```

**Step 3: Move and update `index.html`**

Move `public/index.html` to project root. Replace `%PUBLIC_URL%` references with `/`. Add Vite entry script:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#0F0F1A" />
    <meta name="description" content="we-check.ing — F1 Prediction Quiz" />
    <link rel="apple-touch-icon" href="/logo192.png" />
    <link rel="manifest" href="/manifest.json" />
    <title>we-check.ing</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

**Step 4: Rename entry point and update**

Rename `src/index.js` → `src/main.jsx`:

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**Step 5: Update environment variables**

In `src/firebase.js`, replace all `process.env.REACT_APP_` with `import.meta.env.VITE_`:

```js
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
```

Update `.env.example`:

```
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here
```

Also copy `.env` (the real file) and update its prefixes from `REACT_APP_` to `VITE_`.

**Step 6: Update `package.json` scripts**

```json
{
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

Remove `eslintConfig` and `browserslist` sections from `package.json` (CRA-specific).

**Step 7: Update `firebase.json`**

Change build directory from `build` to `dist`:

```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }]
  }
}
```

**Step 8: Delete CRA-specific files**

Delete: `src/reportWebVitals.js` (if at root level), `src/components/reportWebVitals.js`, `src/components/setupTests.js`, `src/App.test.js` (if exists), `public/index.html` (after moving to root)

**Step 9: Verify dev server starts**

```bash
npm run dev
```

Expected: App loads at localhost:3000 with no errors.

**Step 10: Verify build works**

```bash
npm run build
```

Expected: `dist/` directory created with bundled output.

**Step 11: Commit**

```bash
git add -A
git commit -m "feat: migrate from CRA to Vite"
```

---

## Task 2: Project Structure Reorganization

**Files:**
- Move: `src/components/Header.js` → `src/components/layout/Header.jsx`
- Move: `src/components/Login.js` → `src/components/auth/Login.jsx`
- Move: `src/components/QuizGame.js` → `src/components/quiz/QuizGame.jsx`
- Move: `src/components/QuizAdmin.js` → `src/components/quiz/QuizAdmin.jsx`
- Move: `src/components/Rankings.js` → `src/components/pages/Rankings.jsx`
- Move: `src/components/Rules.js` → `src/components/pages/Rules.jsx`
- Move: `src/components/UsersList.js` → `src/components/admin/UsersList.jsx`
- Move: `src/index.css` → `src/styles/index.css`
- Rename: `src/App.js` → `src/App.jsx`
- Create directories: `src/components/layout/`, `src/components/auth/`, `src/components/quiz/`, `src/components/pages/`, `src/components/admin/`, `src/components/dashboard/`, `src/hooks/`, `src/locales/`, `src/styles/`

**Step 1: Create directory structure**

```bash
mkdir -p src/components/{layout,auth,quiz,pages,admin,dashboard}
mkdir -p src/{hooks,locales,styles}
```

**Step 2: Move and rename files**

```bash
mv src/index.css src/styles/index.css
mv src/App.js src/App.jsx
mv src/App.css src/styles/App.css
mv src/components/Header.js src/components/layout/Header.jsx
mv src/components/Login.js src/components/auth/Login.jsx
mv src/components/QuizGame.js src/components/quiz/QuizGame.jsx
mv src/components/QuizAdmin.js src/components/quiz/QuizAdmin.jsx
mv src/components/Rankings.js src/components/pages/Rankings.jsx
mv src/components/Rules.js src/components/pages/Rules.jsx
mv src/components/UsersList.js src/components/admin/UsersList.jsx
```

**Step 3: Update all imports in `src/App.jsx`**

```jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import QuizGame from "./components/quiz/QuizGame";
import QuizAdmin from "./components/quiz/QuizAdmin";
import Login from "./components/auth/Login";
import Header from "./components/layout/Header";
import UsersList from "./components/admin/UsersList";
import Rankings from "./components/pages/Rankings";
import Rules from "./components/pages/Rules";
import "./styles/index.css";
```

**Step 4: Update import paths inside moved components**

Each component that imports from `../firebase` now needs `../../firebase` since they're one level deeper. Update these files:
- `src/components/layout/Header.jsx`: `../../firebase`
- `src/components/auth/Login.jsx`: `../../firebase`
- `src/components/quiz/QuizGame.jsx`: `../../firebase`
- `src/components/quiz/QuizAdmin.jsx`: `../../firebase`
- `src/components/pages/Rankings.jsx`: `../../firebase`
- `src/components/admin/UsersList.jsx`: `../../firebase`

**Step 5: Update `src/main.jsx` CSS import**

```jsx
import './styles/index.css';
```

**Step 6: Verify dev server starts and all pages work**

```bash
npm run dev
```

Navigate to: `/`, `/login`, `/admin`, `/rankings`, `/rules`, `/users`

**Step 7: Commit**

```bash
git add -A
git commit -m "refactor: reorganize project structure into feature directories"
```

---

## Task 3: Rebrand - Color Palette & Typography

**Files:**
- Modify: `src/styles/index.css` — replace entire CSS with new theme
- Modify: `index.html` — add Inter + JetBrains Mono fonts

**Step 1: Add fonts to `index.html`**

Add inside `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet" />
```

Remove the old Titillium Web import from `src/styles/index.css` (line 4).

**Step 2: Replace CSS variables in `src/styles/index.css`**

Replace the `:root` block and body styles:

```css
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap");

:root {
    /* we-check.ing color palette */
    --wc-red: #DC2626;
    --wc-red-bright: #FF4444;
    --wc-gold: #F59E0B;
    --wc-bg: #0F0F1A;
    --wc-surface: #1E1E30;
    --wc-carbon: #1A1A2E;
    --wc-text: #F5F5F5;
    --wc-text-secondary: #A0A0B0;
    --wc-border: #2E2E45;
    --wc-success: #22C55E;
    --wc-error: #EF4444;
    --wc-warning: #F59E0B;
}
```

**Step 3: Update body and all CSS classes**

Replace all `var(--f1-*)` references with `var(--wc-*)` throughout the CSS file:
- `--f1-red` → `--wc-red`
- `--f1-black` → `--wc-carbon`
- `--f1-darkgray` → `--wc-surface`
- `--f1-gray` → `--wc-text-secondary`
- `--f1-lightgray` → `--wc-border`
- `--f1-white` → `--wc-text`
- `--f1-accent` → `--wc-gold`

Update `font-family` from `"Titillium Web"` to `"Inter"`.

Update body background from light gray to dark:

```css
body {
    font-family: "Inter", sans-serif;
    background-color: var(--wc-bg);
    color: var(--wc-text);
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}
```

Update `.card` to dark surface:

```css
.card {
    background-color: var(--wc-surface);
    border: 1px solid var(--wc-border);
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    padding: 24px;
    margin-bottom: 24px;
}
```

Update `.card-title` color to white:

```css
.card-title {
    color: var(--wc-text);
}
```

Update `.header`:

```css
.header {
    background-color: var(--wc-carbon);
    color: var(--wc-text);
    padding: 16px 0;
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
    border-bottom: 2px solid var(--wc-red);
}
```

Update buttons (`.btn`) to use `--wc-red` and forms to dark theme. Update all inline `style=` references in components that use `var(--f1-*)`.

**Step 4: Update inline style references in components**

Search all `.jsx` files for `var(--f1-` and replace with `var(--wc-`:
- `Header.jsx`: `var(--f1-accent)` → `var(--wc-gold)`
- `QuizGame.jsx`: `var(--f1-red)` → `var(--wc-red)`
- `Rankings.jsx`: `var(--f1-black)` → `var(--wc-carbon)`, `var(--f1-white)` → `var(--wc-text)`, `var(--f1-red)` → `var(--wc-red)`
- `Rules.jsx`: `var(--f1-red)` → `var(--wc-red)`
- `QuizAdmin.jsx`: `var(--f1-red)` → `var(--wc-red)`, `var(--f1-accent)` → `var(--wc-gold)`

Also update `Header.jsx` line 47: `"Oleks F1 Quizz"` → `"we-check.ing"`

Also update hardcoded light-theme classes in components:
- Replace `bg-white` → `bg-[var(--wc-surface)]`
- Replace `bg-gray-100`, `bg-gray-50` → dark equivalents
- Replace `text-gray-600`, `text-gray-500` → `text-[var(--wc-text-secondary)]`
- Replace `text-red-500` → `text-[var(--wc-error)]`
- Replace `bg-green-100 text-green-800` → dark theme success colors
- Replace `bg-blue-50` → dark selection highlight

**Step 5: Update form inputs for dark theme**

```css
.form-input,
.form-select,
.form-textarea {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid var(--wc-border);
    border-radius: 8px;
    font-family: "Inter", sans-serif;
    font-size: 16px;
    background-color: var(--wc-bg);
    color: var(--wc-text);
    transition: border-color 0.2s;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
    border-color: var(--wc-red);
    outline: none;
}
```

**Step 6: Verify dark theme looks correct**

```bash
npm run dev
```

Check all pages visually.

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: rebrand to we-check.ing with dark motorsport theme"
```

---

## Task 4: Layout Components (Header, Footer, Layout)

**Files:**
- Modify: `src/components/layout/Header.jsx` — redesign with new brand
- Create: `src/components/layout/Footer.jsx`
- Create: `src/components/layout/Layout.jsx`
- Modify: `src/App.jsx` — use Layout wrapper

**Step 1: Create `src/components/layout/Layout.jsx`**

```jsx
import React from 'react';
import Header from './Header';
import Footer from './Footer';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--wc-bg)' }}>
      <Header />
      <main className="main-content flex-1">
        <div className="container">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
```

**Step 2: Create `src/components/layout/Footer.jsx`**

```jsx
import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer style={{
      backgroundColor: 'var(--wc-carbon)',
      borderTop: '1px solid var(--wc-border)',
      padding: '24px 0',
      color: 'var(--wc-text-secondary)',
      fontSize: '14px',
    }}>
      <div className="container">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <span style={{ color: 'var(--wc-text)', fontWeight: 600 }}>we-check.ing</span>
            {' '}&mdash; We are checking your predictions
          </div>
          <nav className="flex gap-6">
            <Link to="/privacy" style={{ color: 'var(--wc-text-secondary)', textDecoration: 'none' }}>
              Privacy
            </Link>
            <Link to="/terms" style={{ color: 'var(--wc-text-secondary)', textDecoration: 'none' }}>
              Terms
            </Link>
            <Link to="/rules" style={{ color: 'var(--wc-text-secondary)', textDecoration: 'none' }}>
              Rules
            </Link>
          </nav>
          <div>&copy; {new Date().getFullYear()} we-check.ing</div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
```

**Step 3: Update `src/App.jsx` to use Layout**

```jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import QuizGame from "./components/quiz/QuizGame";
import QuizAdmin from "./components/quiz/QuizAdmin";
import Login from "./components/auth/Login";
import UsersList from "./components/admin/UsersList";
import Rankings from "./components/pages/Rankings";
import Rules from "./components/pages/Rules";
import "./styles/index.css";

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<QuizGame />} />
          <Route path="/admin" element={<QuizAdmin />} />
          <Route path="/login" element={<Login />} />
          <Route path="/quiz/:id" element={<QuizGame />} />
          <Route path="/users" element={<UsersList />} />
          <Route path="/rankings" element={<Rankings />} />
          <Route path="/rules" element={<Rules />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
```

**Step 4: Update Header with new brand name and navigation**

Update `src/components/layout/Header.jsx` line 47: `"Oleks F1 Quizz"` → `"we-check.ing"` (if not already done in Task 3).

**Step 5: Verify layout renders correctly**

```bash
npm run dev
```

Check: header and footer appear on all pages, content is between them, footer sticks to bottom on short pages.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add Layout wrapper with Footer component"
```

---

## Task 5: Authentication - Password Reset

**Files:**
- Create: `src/components/auth/PasswordReset.jsx`
- Modify: `src/components/auth/Login.jsx` — add "Forgot password?" link
- Modify: `src/firebase.js` — add `sendPasswordResetEmail` export
- Modify: `src/App.jsx` — add route

**Step 1: Add password reset helper to `src/firebase.js`**

Add import and export:

```js
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
} from "firebase/auth";

// ... existing code ...

export const resetPassword = (email) => {
  return firebaseSendPasswordResetEmail(auth, email);
};
```

**Step 2: Create `src/components/auth/PasswordReset.jsx`**

```jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { resetPassword } from '../../firebase';

const PasswordReset = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      setError(
        err.code === 'auth/user-not-found'
          ? 'No account found with this email'
          : 'Failed to send reset email. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="card racing-pattern">
        <h1 className="card-title text-center">Check Your Email</h1>
        <p className="text-center mb-4" style={{ color: 'var(--wc-text-secondary)' }}>
          We are checking... just kidding. We sent a password reset link to <strong>{email}</strong>.
        </p>
        <Link to="/login" className="btn btn-block text-center">
          Back to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="card racing-pattern">
      <h1 className="card-title text-center">Reset Password</h1>
      <p className="mb-4" style={{ color: 'var(--wc-text-secondary)' }}>
        Forgot your password? Even the best pit crews make mistakes. Enter your email and we'll send you a reset link.
      </p>

      {error && <div className="alert alert-error mb-4">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="form-input"
            placeholder="Enter your email"
          />
        </div>

        <button type="submit" disabled={loading} className={`btn btn-block ${loading ? 'opacity-50' : ''}`}>
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>

      <div className="mt-4 text-center">
        <Link to="/login" style={{ color: 'var(--wc-red)', textDecoration: 'none' }}>
          Back to Login
        </Link>
      </div>
    </div>
  );
};

export default PasswordReset;
```

**Step 3: Add "Forgot password?" link to Login.jsx**

In `src/components/auth/Login.jsx`, after the password input (after line 123), add:

```jsx
{!isRegistering && (
  <div className="text-right mb-4">
    <Link to="/reset-password" style={{ color: 'var(--wc-red)', textDecoration: 'none', fontSize: '14px' }}>
      Forgot password?
    </Link>
  </div>
)}
```

Add `Link` to the import from `react-router-dom`.

**Step 4: Add route in `src/App.jsx`**

```jsx
import PasswordReset from "./components/auth/PasswordReset";
// ... in Routes:
<Route path="/reset-password" element={<PasswordReset />} />
```

**Step 5: Verify the flow**

```bash
npm run dev
```

Navigate to `/login` → click "Forgot password?" → enter email → submit → see success message.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add password reset flow"
```

---

## Task 6: Landing Page

**Files:**
- Create: `src/components/pages/Landing.jsx`
- Modify: `src/App.jsx` — conditional routing (landing for unauth, quiz for auth)
- Create: `src/hooks/useAuth.js` — shared auth hook

**Step 1: Create `src/hooks/useAuth.js`**

Extract the auth checking pattern used in every component into a reusable hook:

```js
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, getUserProfile } from '../firebase';

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          const profile = await getUserProfile(currentUser.uid);
          setUserProfile(profile);
          setIsAdmin(profile?.role === 'admin');
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } else {
        setUserProfile(null);
        setIsAdmin(false);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, userProfile, isAdmin, loading };
};

export default useAuth;
```

**Step 2: Create `src/components/pages/Landing.jsx`**

```jsx
import React from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <div>
      {/* Hero Section */}
      <section className="text-center py-16">
        <h1 style={{
          fontSize: '3rem',
          fontWeight: 800,
          color: 'var(--wc-text)',
          marginBottom: '16px',
          lineHeight: 1.2,
        }}>
          We are checking...
        </h1>
        <p style={{
          fontSize: '1.25rem',
          color: 'var(--wc-text-secondary)',
          maxWidth: '600px',
          margin: '0 auto 32px',
        }}>
          Think you can predict F1 race results better than Ferrari's strategy team? Prove it.
        </p>
        <div className="flex justify-center gap-4">
          <Link to="/login" className="btn" style={{ fontSize: '16px', padding: '14px 32px' }}>
            Start Predicting
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12">
        <h2 className="card-title text-center mb-8" style={{ fontSize: '1.5rem' }}>
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card text-center">
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>1</div>
            <h3 style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--wc-red)' }}>Predict</h3>
            <p style={{ color: 'var(--wc-text-secondary)' }}>
              Answer Yes/No prediction questions before each race weekend
            </p>
          </div>
          <div className="card text-center">
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>2</div>
            <h3 style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--wc-gold)' }}>Watch</h3>
            <p style={{ color: 'var(--wc-text-secondary)' }}>
              Watch the race and see if your predictions come true
            </p>
          </div>
          <div className="card text-center">
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>3</div>
            <h3 style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--wc-success)' }}>Score</h3>
            <p style={{ color: 'var(--wc-text-secondary)' }}>
              Get scored, climb the leaderboard, become the Strategy Chief
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="card text-center py-8" style={{ borderColor: 'var(--wc-red)' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '12px' }}>
          Ready to prove you're better than the pit wall?
        </h2>
        <p style={{ color: 'var(--wc-text-secondary)', marginBottom: '24px' }}>
          Join the community of F1 fans who are also checking.
        </p>
        <Link to="/login" className="btn" style={{ fontSize: '16px', padding: '14px 32px' }}>
          Create Free Account
        </Link>
      </section>
    </div>
  );
};

export default Landing;
```

**Step 3: Update routing in `src/App.jsx`**

Make the home route show Landing for unauthenticated users and QuizGame for authenticated:

```jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import QuizGame from "./components/quiz/QuizGame";
import QuizAdmin from "./components/quiz/QuizAdmin";
import Login from "./components/auth/Login";
import PasswordReset from "./components/auth/PasswordReset";
import UsersList from "./components/admin/UsersList";
import Rankings from "./components/pages/Rankings";
import Rules from "./components/pages/Rules";
import Landing from "./components/pages/Landing";
import useAuth from "./hooks/useAuth";
import "./styles/index.css";

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--wc-bg)' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={user ? <QuizGame /> : <Landing />} />
          <Route path="/admin" element={<QuizAdmin />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<PasswordReset />} />
          <Route path="/quiz/:id" element={<QuizGame />} />
          <Route path="/users" element={<UsersList />} />
          <Route path="/rankings" element={<Rankings />} />
          <Route path="/rules" element={<Rules />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
```

**Step 4a: Add SEO meta tags to `index.html`**

Add inside `<head>`:

```html
<meta property="og:title" content="we-check.ing — F1 Prediction Quiz" />
<meta property="og:description" content="Think you can predict F1 results better than Ferrari's strategy team? Prove it." />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://we-check.ing" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="we-check.ing — F1 Prediction Quiz" />
<meta name="twitter:description" content="We are checking your predictions..." />
```

Note: `useAuth` cannot be inside `<Router>` and also outside it. Since Layout needs Router context (for Links), we need to restructure slightly — put `useAuth` inside a child component of Router, or use the auth state in App differently. The simplest approach: keep `useAuth` in App but ensure Router wraps everything. This works because `useAuth` doesn't depend on Router.

**Step 4: Verify landing page shows for unauthenticated users**

```bash
npm run dev
```

Open in incognito → see landing page. Login → see quiz page.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add landing page and useAuth hook"
```

---

## Task 7: User Dashboard

**Files:**
- Create: `src/components/dashboard/Dashboard.jsx`
- Modify: `src/App.jsx` — add `/dashboard` route
- Modify: `src/components/layout/Header.jsx` — add Dashboard nav link

**Step 1: Create `src/components/dashboard/Dashboard.jsx`**

```jsx
import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const Dashboard = () => {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentQuizzes, setRecentQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      try {
        // Fetch user's quiz answers
        const answersQuery = query(
          collection(db, 'quizAnswers'),
          where('userId', '==', user.uid)
        );
        const answersSnap = await getDocs(answersQuery);

        let totalScore = 0;
        let totalQuestions = 0;
        let quizCount = 0;
        let correctCount = 0;
        const recent = [];

        answersSnap.forEach((doc) => {
          const data = doc.data();
          quizCount++;

          if (data.score !== undefined) {
            totalScore += data.score;
            correctCount += data.score;
          }
          if (data.totalQuestions) {
            totalQuestions += data.totalQuestions;
          }

          recent.push({
            id: doc.id,
            quizTitle: data.quizTitle || 'Untitled Quiz',
            score: data.score,
            totalQuestions: data.totalQuestions,
            submittedAt: data.submittedAt,
          });
        });

        // Sort recent by submission date (newest first)
        recent.sort((a, b) => {
          const aTime = a.submittedAt?.toDate?.() || new Date(0);
          const bTime = b.submittedAt?.toDate?.() || new Date(0);
          return bTime - aTime;
        });

        // Fetch total user count for rank calculation
        const allAnswersSnap = await getDocs(collection(db, 'quizAnswers'));
        const userScores = new Map();
        allAnswersSnap.forEach((doc) => {
          const data = doc.data();
          if (data.score !== undefined) {
            const current = userScores.get(data.userId) || 0;
            userScores.set(data.userId, current + data.score);
          }
        });

        const sortedScores = Array.from(userScores.entries())
          .sort((a, b) => b[1] - a[1]);
        const rank = sortedScores.findIndex(([uid]) => uid === user.uid) + 1;

        setStats({
          totalScore,
          totalQuestions,
          quizCount,
          correctCount,
          accuracy: totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0,
          rank: rank || '-',
          totalPlayers: userScores.size,
        });
        setRecentQuizzes(recent.slice(0, 5));
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchStats();
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="loading">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div>
      <h1 className="card-title mb-6" style={{ fontSize: '1.5rem' }}>
        Welcome back, {userProfile?.username || 'Racer'}
      </h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card text-center">
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--wc-red)' }}>
            {stats?.totalScore || 0}
          </div>
          <div style={{ color: 'var(--wc-text-secondary)', fontSize: '0.875rem' }}>Total Points</div>
        </div>
        <div className="card text-center">
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--wc-gold)' }}>
            #{stats?.rank || '-'}
          </div>
          <div style={{ color: 'var(--wc-text-secondary)', fontSize: '0.875rem' }}>
            Rank (of {stats?.totalPlayers || 0})
          </div>
        </div>
        <div className="card text-center">
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--wc-success)' }}>
            {stats?.accuracy || 0}%
          </div>
          <div style={{ color: 'var(--wc-text-secondary)', fontSize: '0.875rem' }}>Accuracy</div>
        </div>
        <div className="card text-center">
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--wc-text)' }}>
            {stats?.quizCount || 0}
          </div>
          <div style={{ color: 'var(--wc-text-secondary)', fontSize: '0.875rem' }}>Quizzes Played</div>
        </div>
      </div>

      {/* Recent Quizzes */}
      <div className="card">
        <h2 className="card-title">Recent Quizzes</h2>
        {recentQuizzes.length === 0 ? (
          <p style={{ color: 'var(--wc-text-secondary)' }}>
            No quizzes played yet. Time to start checking!
          </p>
        ) : (
          <div>
            {recentQuizzes.map((quiz) => (
              <div
                key={quiz.id}
                style={{
                  padding: '12px 0',
                  borderBottom: '1px solid var(--wc-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{quiz.quizTitle}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--wc-text-secondary)' }}>
                    {quiz.submittedAt?.toDate?.()
                      ? quiz.submittedAt.toDate().toLocaleDateString()
                      : 'Unknown date'}
                  </div>
                </div>
                <div style={{ fontWeight: 700, color: quiz.score !== undefined ? 'var(--wc-gold)' : 'var(--wc-text-secondary)' }}>
                  {quiz.score !== undefined
                    ? `${quiz.score}/${quiz.totalQuestions || '?'}`
                    : 'Pending'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4 mt-6">
        <Link to="/" className="btn">
          Play Latest Quiz
        </Link>
        <Link to="/rankings" className="btn btn-secondary">
          View Leaderboard
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
```

**Step 2: Add route and nav link**

In `src/App.jsx`, add:
```jsx
import Dashboard from "./components/dashboard/Dashboard";
// In Routes:
<Route path="/dashboard" element={<Dashboard />} />
```

In `src/components/layout/Header.jsx`, add a "Dashboard" link for logged-in users (between Play and Rankings).

**Step 3: Verify dashboard loads with stats**

```bash
npm run dev
```

Login → navigate to `/dashboard` → see stats and recent quizzes.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add user dashboard with stats and recent quizzes"
```

---

## Task 8: Legal Pages

**Files:**
- Create: `src/components/pages/Privacy.jsx`
- Create: `src/components/pages/Terms.jsx`
- Create: `src/components/pages/CookieConsent.jsx`
- Modify: `src/App.jsx` — add routes
- Modify: `src/App.jsx` — render CookieConsent globally

**Step 1: Create `src/components/pages/Privacy.jsx`**

A standard privacy policy page covering:
- Data collected: email, username, quiz predictions, scores
- Storage: Firebase (Google Cloud servers)
- No third-party data selling
- Data retention: as long as account is active
- Contact email for data deletion requests
- GDPR rights for EU users

```jsx
import React from 'react';

const Privacy = () => {
  return (
    <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 className="card-title" style={{ fontSize: '1.5rem' }}>Privacy Policy</h1>
      <p style={{ color: 'var(--wc-text-secondary)', marginBottom: '24px' }}>
        Last updated: February 2026
      </p>

      <div style={{ lineHeight: 1.8, color: 'var(--wc-text)' }}>
        <h2 style={{ fontWeight: 700, marginBottom: '8px', marginTop: '24px' }}>What We Collect</h2>
        <p>When you create an account, we collect your email address, username, and quiz predictions. We also store your scores and rankings.</p>

        <h2 style={{ fontWeight: 700, marginBottom: '8px', marginTop: '24px' }}>How We Store It</h2>
        <p>Your data is stored securely in Firebase (Google Cloud). We use industry-standard security measures to protect your information.</p>

        <h2 style={{ fontWeight: 700, marginBottom: '8px', marginTop: '24px' }}>What We Don't Do</h2>
        <p>We never sell your data to third parties. We never share your email with advertisers. We only use your data to provide the quiz service.</p>

        <h2 style={{ fontWeight: 700, marginBottom: '8px', marginTop: '24px' }}>Cookies</h2>
        <p>We use essential cookies for authentication (Firebase Auth). We may use optional analytics cookies with your consent.</p>

        <h2 style={{ fontWeight: 700, marginBottom: '8px', marginTop: '24px' }}>Your Rights</h2>
        <p>You can request deletion of your account and all associated data at any time. If you are in the EU, you have additional rights under GDPR including data portability and the right to be forgotten.</p>

        <h2 style={{ fontWeight: 700, marginBottom: '8px', marginTop: '24px' }}>Contact</h2>
        <p>For any privacy-related questions, contact us at privacy@we-check.ing</p>
      </div>
    </div>
  );
};

export default Privacy;
```

**Step 2: Create `src/components/pages/Terms.jsx`**

```jsx
import React from 'react';

const Terms = () => {
  return (
    <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 className="card-title" style={{ fontSize: '1.5rem' }}>Terms of Service</h1>
      <p style={{ color: 'var(--wc-text-secondary)', marginBottom: '24px' }}>
        Last updated: February 2026
      </p>

      <div style={{ lineHeight: 1.8, color: 'var(--wc-text)' }}>
        <h2 style={{ fontWeight: 700, marginBottom: '8px', marginTop: '24px' }}>The Service</h2>
        <p>we-check.ing is a free prediction quiz platform for Formula 1 fans. You make predictions, we check them. No money is involved — this is not gambling.</p>

        <h2 style={{ fontWeight: 700, marginBottom: '8px', marginTop: '24px' }}>Your Account</h2>
        <p>You are responsible for your account. Don't share your password. Pick a username that doesn't offend anyone — we reserve the right to moderate usernames and content.</p>

        <h2 style={{ fontWeight: 700, marginBottom: '8px', marginTop: '24px' }}>Fair Play</h2>
        <p>Don't try to cheat, exploit bugs, or ruin the fun for others. Administrators can remove users who violate the spirit of fair play.</p>

        <h2 style={{ fontWeight: 700, marginBottom: '8px', marginTop: '24px' }}>No Warranty</h2>
        <p>This service is provided "as is." We do our best to keep things running, but we can't guarantee 100% uptime. Like Ferrari's strategy, sometimes things don't go as planned.</p>

        <h2 style={{ fontWeight: 700, marginBottom: '8px', marginTop: '24px' }}>Changes</h2>
        <p>We may update these terms from time to time. Continued use of the service means you accept the updated terms.</p>
      </div>
    </div>
  );
};

export default Terms;
```

**Step 3: Create `src/components/pages/CookieConsent.jsx`**

```jsx
import React, { useState, useEffect } from 'react';

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'var(--wc-carbon)',
      borderTop: '1px solid var(--wc-border)',
      padding: '16px 24px',
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '12px',
    }}>
      <p style={{ color: 'var(--wc-text-secondary)', fontSize: '14px', flex: 1 }}>
        We use essential cookies for authentication. Optional analytics cookies help us improve.{' '}
        <a href="/privacy" style={{ color: 'var(--wc-red)', textDecoration: 'underline' }}>
          Learn more
        </a>
      </p>
      <div className="flex gap-3">
        <button onClick={handleDecline} className="btn btn-small btn-secondary">
          Essential Only
        </button>
        <button onClick={handleAccept} className="btn btn-small">
          Accept All
        </button>
      </div>
    </div>
  );
};

export default CookieConsent;
```

**Step 4: Add routes and render CookieConsent in `src/App.jsx`**

```jsx
import Privacy from "./components/pages/Privacy";
import Terms from "./components/pages/Terms";
import CookieConsent from "./components/pages/CookieConsent";

// In Routes:
<Route path="/privacy" element={<Privacy />} />
<Route path="/terms" element={<Terms />} />

// After </Router> closing tag but still inside the return, add CookieConsent:
// Actually, render it inside Layout, after Routes
```

In App.jsx return:

```jsx
return (
  <Router>
    <Layout>
      <Routes>
        {/* all routes */}
      </Routes>
    </Layout>
    <CookieConsent />
  </Router>
);
```

Note: CookieConsent must be inside Router since it uses `<a href>` (can change to `<Link>`) or outside Router with a plain `<a>`.

**Step 5: Verify all legal pages and cookie banner**

```bash
npm run dev
```

Open in incognito → see cookie banner at bottom. Click "Accept All" → banner disappears. Navigate to `/privacy` and `/terms`.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add Privacy Policy, Terms of Service, and Cookie Consent"
```

---

## Task 9: i18n Setup

**Files:**
- Create: `src/i18n.js`
- Create: `src/locales/en.json`
- Create: `src/locales/fr.json`
- Create: `src/locales/es.json`
- Create: `src/locales/it.json`
- Create: `src/locales/pt.json`
- Create: `src/locales/uk.json`
- Modify: `src/main.jsx` — import i18n
- Modify: `src/components/layout/Footer.jsx` — add language switcher
- Modify: `src/components/layout/Header.jsx` — add language switcher
- Modify: All UI components — replace hardcoded strings with `t()` calls

**Step 1: Install i18next**

```bash
npm install i18next react-i18next i18next-browser-languagedetector
```

**Step 2: Create `src/i18n.js`**

```js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import fr from './locales/fr.json';
import es from './locales/es.json';
import it from './locales/it.json';
import pt from './locales/pt.json';
import uk from './locales/uk.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
      es: { translation: es },
      it: { translation: it },
      pt: { translation: pt },
      uk: { translation: uk },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
```

**Step 3: Create English locale `src/locales/en.json`**

```json
{
  "nav": {
    "play": "Play",
    "dashboard": "Dashboard",
    "rankings": "Rankings",
    "rules": "Rules",
    "admin": "Admin",
    "users": "Users",
    "login": "Login",
    "logout": "Logout"
  },
  "landing": {
    "hero_title": "We are checking...",
    "hero_subtitle": "Think you can predict F1 race results better than Ferrari's strategy team? Prove it.",
    "cta": "Start Predicting",
    "how_title": "How It Works",
    "step1_title": "Predict",
    "step1_desc": "Answer Yes/No prediction questions before each race weekend",
    "step2_title": "Watch",
    "step2_desc": "Watch the race and see if your predictions come true",
    "step3_title": "Score",
    "step3_desc": "Get scored, climb the leaderboard, become the Strategy Chief",
    "bottom_cta_title": "Ready to prove you're better than the pit wall?",
    "bottom_cta_desc": "Join the community of F1 fans who are also checking.",
    "bottom_cta_btn": "Create Free Account"
  },
  "auth": {
    "login_title": "Login to we-check.ing",
    "register_title": "Create an Account",
    "email": "Email",
    "password": "Password",
    "username": "Username",
    "email_placeholder": "Enter your email",
    "password_placeholder": "Enter your password",
    "username_placeholder": "Choose a username",
    "login_btn": "Login",
    "register_btn": "Create Account",
    "processing": "Processing...",
    "switch_to_register": "Don't have an account? Register",
    "switch_to_login": "Already have an account? Login",
    "forgot_password": "Forgot password?",
    "reset_title": "Reset Password",
    "reset_desc": "Forgot your password? Even the best pit crews make mistakes. Enter your email and we'll send you a reset link.",
    "reset_btn": "Send Reset Link",
    "reset_sending": "Sending...",
    "reset_sent_title": "Check Your Email",
    "reset_sent_desc": "We are checking... just kidding. We sent a password reset link to",
    "back_to_login": "Back to Login",
    "error_invalid": "Invalid email or password",
    "error_email_in_use": "Email already in use",
    "error_generic": "An error occurred during authentication",
    "error_username_required": "Username is required",
    "error_not_found": "No account found with this email",
    "error_reset_failed": "Failed to send reset email. Please try again."
  },
  "quiz": {
    "checking_auth": "We are checking your credentials...",
    "loading": "We are checking for quizzes...",
    "not_found": "Quiz not found",
    "no_quizzes": "No quizzes found",
    "error_loading": "Error loading quiz data",
    "playing_as": "Playing as:",
    "quiz_closed": "Quiz closed",
    "remaining": "remaining",
    "submit": "Submit Answers",
    "update": "Update Answers",
    "submitting": "We are checking...",
    "submitted_msg": "Your answers have been submitted. You can still edit them until the quiz closes.",
    "submit_error": "Failed to submit answers. Please try again.",
    "results_title": "Your answers have been submitted",
    "your_answer": "Your answer:",
    "not_answered": "Not answered",
    "correct_answer": "Correct answer:",
    "pending_answer": "The correct answer will be revealed by the administrator"
  },
  "dashboard": {
    "welcome": "Welcome back,",
    "total_points": "Total Points",
    "rank": "Rank",
    "of": "of",
    "accuracy": "Accuracy",
    "quizzes_played": "Quizzes Played",
    "recent_title": "Recent Quizzes",
    "no_quizzes": "No quizzes played yet. Time to start checking!",
    "pending": "Pending",
    "play_latest": "Play Latest Quiz",
    "view_leaderboard": "View Leaderboard"
  },
  "rankings": {
    "title": "Leaderboard",
    "no_results": "No quiz results available yet.",
    "rank": "Rank",
    "player": "Player",
    "total_points": "Total Points"
  },
  "rules": {
    "title": "Quiz Rules",
    "how_to_play": "How to Play",
    "rule1": "Before each race, you'll receive three Yes/No questions about the approaching race.",
    "rule2": "You must select either \"Yes\" or \"No\" for each question before the quiz deadline.",
    "rule3": "After the race, the answers are evaluated and you receive +1 point for each correct answer.",
    "rule4": "The player with the most accumulated points across all quizzes wins the championship!",
    "tips_title": "Tips",
    "tip1": "You can edit your answers any time before the quiz deadline",
    "tip2": "The leaderboard updates after each race once the quiz is scored",
    "tip3": "Stay informed about F1 news to increase your chances of correct predictions",
    "tip4": "Check back regularly for new quizzes before each race weekend",
    "remember": "Remember:",
    "remember_text": "The person with the most points wins the quiz!"
  },
  "footer": {
    "tagline": "We are checking your predictions",
    "privacy": "Privacy",
    "terms": "Terms",
    "rules": "Rules"
  },
  "cookie": {
    "message": "We use essential cookies for authentication. Optional analytics cookies help us improve.",
    "learn_more": "Learn more",
    "essential_only": "Essential Only",
    "accept_all": "Accept All"
  },
  "errors": {
    "network": "We are checking your connection...",
    "not_found_title": "404",
    "not_found_desc": "We are still checking... but this page doesn't exist"
  }
}
```

**Step 4: Create translated locale files**

Create `fr.json`, `es.json`, `it.json`, `pt.json`, `uk.json` with the same structure but translated text. Use accurate translations — this will be the most time-consuming step. Each file should follow the exact same JSON structure as `en.json`.

**Step 5: Import i18n in `src/main.jsx`**

Add before App import:

```jsx
import './i18n';
```

**Step 6: Create a language switcher component**

Add to `src/components/layout/Footer.jsx` (or as a standalone component used in Header/Footer):

```jsx
import { useTranslation } from 'react-i18next';

// Inside Footer component:
const { i18n } = useTranslation();

const languages = [
  { code: 'en', label: 'EN' },
  { code: 'fr', label: 'FR' },
  { code: 'es', label: 'ES' },
  { code: 'it', label: 'IT' },
  { code: 'pt', label: 'PT' },
  { code: 'uk', label: 'UK' },
];

// In footer JSX, add language selector:
<div className="flex gap-2">
  {languages.map((lang) => (
    <button
      key={lang.code}
      onClick={() => i18n.changeLanguage(lang.code)}
      style={{
        padding: '4px 8px',
        borderRadius: '4px',
        border: 'none',
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: i18n.language === lang.code ? 700 : 400,
        backgroundColor: i18n.language === lang.code ? 'var(--wc-red)' : 'transparent',
        color: i18n.language === lang.code ? 'var(--wc-text)' : 'var(--wc-text-secondary)',
      }}
    >
      {lang.label}
    </button>
  ))}
</div>
```

**Step 7: Update all components to use `useTranslation`**

In each component, replace hardcoded strings with `t('key')` calls:

```jsx
import { useTranslation } from 'react-i18next';

// Inside component:
const { t } = useTranslation();

// Replace strings:
// "Play" → t('nav.play')
// "Loading quiz..." → t('quiz.loading')
// etc.
```

This applies to: `Header.jsx`, `Footer.jsx`, `Landing.jsx`, `Login.jsx`, `PasswordReset.jsx`, `QuizGame.jsx`, `Dashboard.jsx`, `Rankings.jsx`, `Rules.jsx`, `CookieConsent.jsx`.

**Step 8: Verify language switching works**

```bash
npm run dev
```

Change language in footer → all UI text updates.

**Step 9: Commit**

```bash
git add -A
git commit -m "feat: add i18n with 6 languages (EN, FR, ES, IT, PT, UK)"
```

---

## Task 10: Firebase Cloud Functions Setup

**Files:**
- Create: `functions/package.json`
- Create: `functions/index.js`
- Create: `functions/.eslintrc.js`
- Modify: `firebase.json` — add functions config

**Step 1: Initialize Firebase Functions**

```bash
cd /Users/oleksmaistrenko/Documents/private/oleks-f1-quiz
mkdir -p functions
```

Create `functions/package.json`:

```json
{
  "name": "we-check-ing-functions",
  "description": "Cloud Functions for we-check.ing",
  "engines": {
    "node": "18"
  },
  "main": "index.js",
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^5.0.0",
    "@sendgrid/mail": "^8.0.0"
  },
  "private": true
}
```

**Step 2: Create `functions/index.js`**

```js
const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

initializeApp();
const db = getFirestore();

// Send push notification when a new quiz is created
exports.onQuizCreated = onDocumentCreated('quizzes/{quizId}', async (event) => {
  const quiz = event.data.data();

  // Get all users with push enabled
  const usersSnap = await db.collection('users')
    .where('notificationPrefs.push', '==', true)
    .get();

  const tokens = [];
  usersSnap.forEach((doc) => {
    const user = doc.data();
    if (user.fcmToken) {
      tokens.push(user.fcmToken);
    }
  });

  if (tokens.length === 0) return;

  const message = {
    notification: {
      title: 'New Quiz Available!',
      body: `"${quiz.title}" — Make your predictions before the deadline!`,
    },
    tokens,
  };

  try {
    await getMessaging().sendEachForMulticast(message);
  } catch (error) {
    console.error('Error sending push notifications:', error);
  }
});

// Send notification when quiz answers are revealed (scores updated)
exports.onScoresUpdated = onDocumentUpdated('quizAnswers/{answerId}', async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();

  // Only trigger when score is first set
  if (before.score !== undefined || after.score === undefined) return;

  const userId = after.userId;
  const userDoc = await db.collection('users').doc(userId).get();
  const user = userDoc.data();

  if (!user?.fcmToken || !user?.notificationPrefs?.push) return;

  const message = {
    notification: {
      title: 'Results are in!',
      body: `You scored ${after.score}/${after.totalQuestions} on "${after.quizTitle}". We have checked!`,
    },
    token: user.fcmToken,
  };

  try {
    await getMessaging().send(message);
  } catch (error) {
    console.error('Error sending score notification:', error);
  }
});
```

**Step 3: Update `firebase.json`**

```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }]
  },
  "functions": {
    "source": "functions"
  }
}
```

**Step 4: Install functions dependencies**

```bash
cd functions && npm install && cd ..
```

**Step 5: Update `.gitignore`**

Add to `.gitignore`:

```
functions/node_modules
```

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add Firebase Cloud Functions for notifications"
```

---

## Task 11: Push Notifications (FCM)

**Files:**
- Create: `src/hooks/useNotifications.js`
- Create: `public/firebase-messaging-sw.js` — service worker for background push
- Modify: `src/firebase.js` — add FCM init
- Modify: `src/components/layout/Header.jsx` or Dashboard — notification opt-in UI
- Modify: `src/firebase.js` — add user notification prefs update

**Step 1: Add FCM to `src/firebase.js`**

```js
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// After auth init:
let messaging = null;
try {
  messaging = getMessaging(app);
} catch (e) {
  console.log('FCM not supported in this browser');
}

export { messaging };

export const requestNotificationPermission = async (userId) => {
  if (!messaging) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    });

    // Save token to user document
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      fcmToken: token,
      notificationPrefs: { push: true, email: false, weeklyDigest: false },
    }, { merge: true });

    return token;
  } catch (error) {
    console.error('Error getting notification permission:', error);
    return null;
  }
};
```

**Step 2: Create `public/firebase-messaging-sw.js`**

```js
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
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

Note: The service worker config values need to be hardcoded (env vars don't work in service workers). These should match the real Firebase config.

**Step 3: Create `src/hooks/useNotifications.js`**

```js
import { useEffect } from 'react';
import { onMessage } from 'firebase/messaging';
import { messaging } from '../firebase';

const useNotifications = () => {
  useEffect(() => {
    if (!messaging) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      // Show in-app notification (toast)
      const { title, body } = payload.notification;
      // For now, use a simple alert. Can replace with toast library later.
      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/logo192.png' });
      }
    });

    return () => unsubscribe();
  }, []);
};

export default useNotifications;
```

**Step 4: Add notification opt-in to Dashboard**

In `src/components/dashboard/Dashboard.jsx`, add a notification opt-in section:

```jsx
import { requestNotificationPermission } from '../../firebase';

// In Dashboard component, add state:
const [notificationsEnabled, setNotificationsEnabled] = useState(
  userProfile?.notificationPrefs?.push || false
);

// Add handler:
const handleEnableNotifications = async () => {
  const token = await requestNotificationPermission(user.uid);
  if (token) {
    setNotificationsEnabled(true);
  }
};

// Add to JSX (before Quick Actions):
{!notificationsEnabled && (
  <div className="card" style={{ borderColor: 'var(--wc-gold)' }}>
    <h3 style={{ fontWeight: 700, marginBottom: '8px' }}>Enable Notifications</h3>
    <p style={{ color: 'var(--wc-text-secondary)', marginBottom: '12px' }}>
      Get notified when new quizzes drop and when results are in!
    </p>
    <button onClick={handleEnableNotifications} className="btn btn-small">
      Enable Push Notifications
    </button>
  </div>
)}
```

**Step 5: Add `useNotifications` to App**

In `src/App.jsx`, add:

```jsx
import useNotifications from './hooks/useNotifications';

// Inside App function:
useNotifications();
```

**Step 6: Update `.env.example`**

Add: `VITE_FIREBASE_VAPID_KEY=your_vapid_key_here`

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: add push notifications with FCM"
```

---

## Task 12: Email Notifications (SendGrid)

**Files:**
- Modify: `functions/index.js` — add email sending functions

**Step 1: Add SendGrid email functions to `functions/index.js`**

```js
const sgMail = require('@sendgrid/mail');

// Initialize SendGrid with API key from environment
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

const FROM_EMAIL = 'noreply@we-check.ing';

// Send email when new quiz is created
exports.emailOnQuizCreated = onDocumentCreated('quizzes/{quizId}', async (event) => {
  if (!SENDGRID_API_KEY) return;

  const quiz = event.data.data();

  // Get all users with email notifications enabled
  const usersSnap = await db.collection('users')
    .where('notificationPrefs.email', '==', true)
    .get();

  const emails = [];
  usersSnap.forEach((doc) => {
    const user = doc.data();
    if (user.email) {
      emails.push({
        to: user.email,
        from: FROM_EMAIL,
        subject: `New Quiz: ${quiz.title} — we-check.ing`,
        html: `
          <h2>New quiz available!</h2>
          <p><strong>${quiz.title}</strong></p>
          <p>Make your predictions before the deadline.</p>
          <p><a href="https://we-check.ing">Go to we-check.ing</a></p>
          <hr>
          <p style="font-size:12px;color:#999;">
            You're receiving this because you enabled email notifications on we-check.ing.
            <a href="https://we-check.ing/dashboard">Manage preferences</a>
          </p>
        `,
      });
    }
  });

  if (emails.length === 0) return;

  try {
    await Promise.all(emails.map((msg) => sgMail.send(msg)));
  } catch (error) {
    console.error('Error sending email notifications:', error);
  }
});

// Send email when scores are revealed
exports.emailOnScoresUpdated = onDocumentUpdated('quizAnswers/{answerId}', async (event) => {
  if (!SENDGRID_API_KEY) return;

  const before = event.data.before.data();
  const after = event.data.after.data();

  if (before.score !== undefined || after.score === undefined) return;

  const userId = after.userId;
  const userDoc = await db.collection('users').doc(userId).get();
  const user = userDoc.data();

  if (!user?.email || !user?.notificationPrefs?.email) return;

  const msg = {
    to: user.email,
    from: FROM_EMAIL,
    subject: `Results: ${after.quizTitle} — we-check.ing`,
    html: `
      <h2>We have checked!</h2>
      <p>You scored <strong>${after.score}/${after.totalQuestions}</strong> on "${after.quizTitle}".</p>
      <p><a href="https://we-check.ing/rankings">View Leaderboard</a></p>
      <hr>
      <p style="font-size:12px;color:#999;">
        <a href="https://we-check.ing/dashboard">Manage notification preferences</a>
      </p>
    `,
  };

  try {
    await sgMail.send(msg);
  } catch (error) {
    console.error('Error sending score email:', error);
  }
});
```

**Step 2: Set SendGrid API key in Firebase environment**

```bash
firebase functions:secrets:set SENDGRID_API_KEY
```

(Enter your SendGrid API key when prompted)

**Step 3: Add email notification toggle to Dashboard**

In the Dashboard notification section, add an email toggle alongside push:

```jsx
const handleToggleEmail = async () => {
  const newValue = !userProfile?.notificationPrefs?.email;
  const userRef = doc(db, 'users', user.uid);
  await setDoc(userRef, {
    notificationPrefs: { email: newValue },
  }, { merge: true });
};
```

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add email notifications via SendGrid"
```

---

## Task 13: Leaderboard Enhancements

**Files:**
- Modify: `src/components/pages/Rankings.jsx`

**Step 1: Add fun titles and current user highlighting**

Update `Rankings.jsx` to include:

1. Fun titles based on rank:
```jsx
const getRankTitle = (rank) => {
  switch (rank) {
    case 1: return 'Strategy Chief';
    case 2: return 'Pit Wall Genius';
    case 3: return 'Podium Regular';
    default: return null;
  }
};

// For last place:
const getLastPlaceTitle = (index, total) => {
  if (index === total - 1 && total > 1) return 'We Are Checking...';
  return null;
};
```

2. Highlight current user's row with a distinct border:
```jsx
const isCurrentUser = userData.id === user?.uid;
// Add style to tr:
style={{
  backgroundColor: isCurrentUser ? 'rgba(220, 38, 38, 0.1)' : undefined,
  borderLeft: isCurrentUser ? '3px solid var(--wc-red)' : undefined,
}}
```

3. Update table header styling for dark theme (replace inline `bg-gray-100` etc.).

**Step 2: Verify leaderboard looks correct**

```bash
npm run dev
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: enhance leaderboard with titles and user highlighting"
```

---

## Task 14: Polish - Meme Copy & Error Pages

**Files:**
- Create: `src/components/pages/NotFound.jsx`
- Modify: `src/App.jsx` — add 404 route
- Modify: Various components — update loading/error text to meme-style

**Step 1: Create `src/components/pages/NotFound.jsx`**

```jsx
import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="text-center py-16">
      <div style={{ fontSize: '6rem', marginBottom: '16px' }}>🤡</div>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--wc-text)', marginBottom: '12px' }}>
        404
      </h1>
      <p style={{ fontSize: '1.25rem', color: 'var(--wc-text-secondary)', marginBottom: '32px' }}>
        We are still checking... but this page doesn't exist.
      </p>
      <Link to="/" className="btn">
        Back to Home
      </Link>
    </div>
  );
};

export default NotFound;
```

**Step 2: Add catch-all route in `src/App.jsx`**

```jsx
import NotFound from "./components/pages/NotFound";
// As the last Route:
<Route path="*" element={<NotFound />} />
```

**Step 3: Update loading and error messages throughout components**

Examples of meme-style replacements:
- `QuizGame.jsx` "Checking authentication..." → "We are checking your credentials..."
- `QuizGame.jsx` "Loading quiz..." → "We are checking for quizzes..."
- `QuizGame.jsx` "Submitting..." → "We are checking..."
- `QuizGame.jsx` submitted message → "Answers locked in. You can still update until the pit window closes."
- `Rankings.jsx` "No quiz results available yet." → "The grid is empty. No one has checked yet."
- `Login.jsx` auth errors → humorous equivalents from locale file

**Step 4: Verify**

```bash
npm run dev
```

Navigate to `/nonexistent` → see 404 page. Check loading states in quiz and rankings.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add 404 page and meme-style copy throughout"
```

---

## Task 15: Mobile-First CSS Polish

**Files:**
- Modify: `src/styles/index.css` — responsive refinements
- Modify: `src/components/layout/Header.jsx` — hamburger menu
- Modify: `src/components/pages/Rankings.jsx` — mobile card view
- Modify: `src/components/admin/UsersList.jsx` — mobile card view

**Step 1: Convert media queries to mobile-first**

Replace `max-width` (desktop-first) with `min-width` (mobile-first) in `src/styles/index.css`:

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

**Step 2: Add hamburger menu to Header**

Add `menuOpen` state + hamburger button (hidden on desktop via CSS):

```css
.hamburger { display: flex; }
.nav-menu { display: none; }
.nav-menu.open { display: flex; flex-direction: column; }

@media (min-width: 768px) {
  .hamburger { display: none; }
  .nav-menu { display: flex; flex-direction: row; }
}
```

Close menu on route change using `useEffect` with `location`.

**Step 3: Add mobile card views for Rankings table**

In `Rankings.jsx`, add two views:
- `.desktop-only` table (hidden on mobile)
- `.mobile-only` ranking cards: rank badge, username, total score

```css
.mobile-only { display: block; }
.desktop-only { display: none; }

@media (min-width: 768px) {
  .mobile-only { display: none; }
  .desktop-only { display: block; }
}
```

Apply same pattern to `UsersList.jsx`.

**Step 4: Fix quiz options layout for mobile**

Replace `flex space-x-4` with stacking on small screens:

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

**Step 5: Ensure all tap targets are >= 44px**

Verify all buttons, links, and interactive elements have minimum 44x44px touch targets. Update padding on small elements if needed:

```css
@media (max-width: 767px) {
  .btn { min-height: 44px; }
  .nav-link { min-height: 44px; display: flex; align-items: center; }
  .option-label { min-height: 44px; }
}
```

**Step 6: Test on multiple screen sizes**

Use browser dev tools to test at: 375px, 414px, 768px, 1024px, 1440px.
Verify: no horizontal scrolling at 375px, hamburger works, cards vs tables, stacking.

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: mobile-first responsive CSS polish"
```

---

## Task 16: Firebase Analytics

**Files:**
- Modify: `src/firebase.js` — add Analytics init and event helpers
- Modify: `src/main.jsx` — move BrowserRouter here for location tracking
- Modify: `src/App.jsx` — add page view tracking
- Modify: `src/components/auth/Login.jsx` — track login/signup events
- Modify: `src/components/quiz/QuizGame.jsx` — track quiz_start and quiz_submit events
- Modify: `.env.example` — add `VITE_FIREBASE_MEASUREMENT_ID`

**Step 1: Add Analytics to `src/firebase.js`**

```js
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

Add `VITE_FIREBASE_MEASUREMENT_ID` to `.env.example` and the firebaseConfig object.

**Step 2: Add page view tracking to `src/App.jsx`**

```jsx
import { useLocation } from 'react-router-dom';
import { trackEvent } from './firebase';

// Inside App component:
const location = useLocation();
useEffect(() => {
  trackEvent('page_view', { page_path: location.pathname });
}, [location]);
```

Note: This requires `App` to be inside `<Router>`. Move `BrowserRouter` from `App.jsx` to `main.jsx` wrapping `<App />`, then use `useLocation` directly in App.

**Step 3: Add event tracking to components**

In `Login.jsx`, after successful login/signup:
```jsx
import { trackLogin, trackSignUp } from '../../firebase';
// After successful login:
trackLogin();
// After successful signup:
trackSignUp();
```

In `QuizGame.jsx`, on quiz load and submit:
```jsx
import { trackQuizStart, trackQuizSubmit } from '../../firebase';
// When quiz loads:
trackQuizStart(currentQuiz.id, currentQuiz.title);
// On submit:
trackQuizSubmit(currentQuiz.id, currentQuiz.title, Object.keys(answers).length);
```

**Step 4: Verify**

Open DevTools → Network tab → filter for `google-analytics` or `firebase`.
Navigate through app: page_view events fire per route. Login, load quiz, submit → events fire.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Firebase Analytics with page views and event tracking"
```

---

## Task 17: PWA Install Prompt

**Files:**
- Create: `src/components/pages/InstallPrompt.jsx`
- Modify: `src/App.jsx` — render InstallPrompt

**Step 1: Create `src/components/pages/InstallPrompt.jsx`**

```jsx
import React, { useState, useEffect } from 'react';

const InstallPrompt = () => {
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
    <div style={{
      position: 'fixed',
      bottom: '80px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'var(--wc-surface)',
      border: '1px solid var(--wc-border)',
      borderRadius: '12px',
      padding: '16px 24px',
      zIndex: 999,
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
    }}>
      <span style={{ color: 'var(--wc-text)', fontSize: '14px' }}>
        Install we-check.ing for quick access
      </span>
      <button onClick={handleInstall} className="btn btn-small">
        Install
      </button>
      <button
        onClick={() => setShowPrompt(false)}
        className="btn btn-small btn-secondary"
      >
        Dismiss
      </button>
    </div>
  );
};

export default InstallPrompt;
```

**Step 2: Render in `src/App.jsx`**

```jsx
import InstallPrompt from './components/pages/InstallPrompt';

// Inside return, alongside CookieConsent:
<InstallPrompt />
```

**Step 3: Verify**

Test on mobile Chrome — "Install" banner appears. App installs to home screen.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add PWA install prompt"
```

---

## Task 18: Social Sharing

**Files:**
- Create: `src/components/quiz/ShareButton.jsx`
- Modify: `src/components/quiz/QuizGame.jsx` — render ShareButton after results
- Modify: `src/components/dashboard/Dashboard.jsx` — optional share per quiz row

**Step 1: Create `src/components/quiz/ShareButton.jsx`**

```jsx
import React from 'react';

const ShareButton = ({ quizTitle, score, total }) => {
  const text = `I scored ${score}/${total} on "${quizTitle}" at we-check.ing! We are checking... can you beat me? 🤡`;
  const url = 'https://we-check.ing';

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'we-check.ing', text, url });
      } catch (e) {
        // User cancelled share, ignore
      }
    } else {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      alert('Copied to clipboard!');
    }
  };

  return (
    <button onClick={handleShare} className="btn btn-small btn-secondary">
      Share Result
    </button>
  );
};

export default ShareButton;
```

**Step 2: Add to QuizGame results section**

In `QuizGame.jsx`, after the score display in the results section:

```jsx
import ShareButton from './ShareButton';

// After score display, when quiz is closed and score is available:
{quizClosed && score !== undefined && (
  <ShareButton
    quizTitle={currentQuiz.title}
    score={score}
    total={currentQuiz.questions.length}
  />
)}
```

**Step 3: Verify**

Complete a scored quiz → see "Share Result" button → click → native share sheet on mobile, clipboard copy on desktop.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add social sharing for quiz results"
```

---

## Task 19: Final Testing & Deployment

> This was previously Task 16. Renumbered due to added tasks.

**Files:**
- Modify: `public/manifest.json` — update app name
- Verify: All routes work
- Verify: Build succeeds

**Step 1: Update manifest.json**

```json
{
  "short_name": "we-check.ing",
  "name": "we-check.ing — F1 Prediction Quiz",
  "icons": [
    { "src": "favicon.ico", "sizes": "64x64 32x32 24x24 16x16", "type": "image/x-icon" },
    { "src": "logo192.png", "type": "image/png", "sizes": "192x192" },
    { "src": "logo512.png", "type": "image/png", "sizes": "512x512" }
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#0F0F1A",
  "background_color": "#0F0F1A"
}
```

**Step 2: Run full build**

```bash
npm run build
```

Expected: No errors, `dist/` created.

**Step 3: Preview locally**

```bash
npm run preview
```

Navigate through all pages, test all flows.

**Step 4: Testing checklist**

- [ ] Landing page renders for unauthenticated users
- [ ] Sign up flow works (email + password + username)
- [ ] Login flow works
- [ ] Password reset sends email
- [ ] Dashboard shows stats after login
- [ ] Quiz game loads latest quiz
- [ ] Quiz submission works
- [ ] Rankings/leaderboard renders
- [ ] Rules page renders
- [ ] Privacy policy page renders
- [ ] Terms of service page renders
- [ ] Cookie consent banner appears on first visit
- [ ] Cookie consent is remembered after acceptance
- [ ] Language switching works for all 6 languages
- [ ] 404 page renders for unknown routes
- [ ] Mobile responsive on all pages (test at 375px, 768px, 1024px)
- [ ] Hamburger menu works on mobile
- [ ] Rankings show cards on mobile, table on desktop
- [ ] All tap targets >= 44px on mobile
- [ ] Footer links work
- [ ] Admin can create quizzes
- [ ] Admin can set answers and scores calculate
- [ ] Push notification opt-in works
- [ ] Dark theme looks correct on all pages
- [ ] Analytics events visible in Network tab (page_view, login, quiz_start, quiz_submit)
- [ ] OG meta tags present in page source
- [ ] PWA install banner appears on mobile Chrome
- [ ] Share button works after quiz scoring (native share or clipboard)
- [ ] `firebase deploy --only hosting` works
- [ ] `firebase deploy --only functions` works

**Step 5: Deploy to Firebase**

```bash
firebase deploy
```

**Step 6: Set up custom domain**

In Firebase Console → Hosting → Add custom domain → `we-check.ing`
Follow DNS verification steps.

**Step 7: Final commit**

```bash
git add -A
git commit -m "feat: finalize we-check.ing for public launch"
```

---

## Summary

| Task | Description | Estimated Steps |
|------|------------|----------------|
| 1 | CRA → Vite migration (+ postcss/tailwind config, remove test deps) | 13 |
| 2 | Project structure reorganization | 7 |
| 3 | Rebrand - colors & typography | 7 |
| 4 | Layout components (Header/Footer/Layout) | 6 |
| 5 | Password reset flow | 6 |
| 6 | Landing page + useAuth hook + SEO meta tags | 6 |
| 7 | User dashboard | 4 |
| 8 | Legal pages (Privacy, Terms, Cookie Consent) | 6 |
| 9 | i18n with 6 languages | 9 |
| 10 | Firebase Cloud Functions (+ .gitignore) | 6 |
| 11 | Push notifications (FCM) | 7 |
| 12 | Email notifications (SendGrid) | 4 |
| 13 | Leaderboard enhancements | 3 |
| 14 | Meme copy & 404 page | 5 |
| 15 | Mobile-first CSS (hamburger, card views, tap targets) | 7 |
| 16 | Firebase Analytics | 5 |
| 17 | PWA Install Prompt | 4 |
| 18 | Social Sharing | 4 |
| 19 | Testing & deployment | 7 |
| **Total** | | **118 steps** |
