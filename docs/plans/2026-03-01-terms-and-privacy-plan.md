# Terms of Service & Privacy Policy Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Terms of Service and Privacy Policy pages, require acceptance at registration, and add a site-wide footer with legal links.

**Architecture:** Two new static page components (`Terms.jsx`, `Privacy.jsx`) following the existing `Rules.jsx` card-based pattern. A new `Footer.jsx` layout component. Login form updated with a required checkbox that gates registration. Firestore user document extended with `termsAcceptedAt` timestamp.

**Tech Stack:** React 19, React Router DOM 6, Firebase Auth + Firestore, custom CSS design system (dark cockpit theme)

---

### Task 1: Create Terms of Service page

**Files:**
- Create: `src/components/pages/Terms.jsx`

**Step 1: Create the Terms component**

Create `src/components/pages/Terms.jsx` following the same structure as `src/components/pages/Rules.jsx` (card layout, `question-container` sections). The page is a static content page with no auth requirement.

```jsx
import React from "react";
import { Link } from "react-router-dom";

const Terms = () => {
  return (
    <div className="card">
      <h1 className="card-title">Terms of Service</h1>
      <p className="text-secondary text-sm" style={{ marginBottom: "24px" }}>
        Last updated: March 1, 2026
      </p>

      <div className="question-container">
        <div className="question-text text-red" style={{ fontSize: "16px" }}>
          Acceptance of Terms
        </div>
        <p className="text-secondary" style={{ lineHeight: "1.7" }}>
          By accessing or using we-check.ing, you agree to be bound by these Terms of Service. If you do not agree, do not use the service.
        </p>
      </div>

      <div className="question-container">
        <div className="question-text text-red" style={{ fontSize: "16px" }}>
          Eligibility
        </div>
        <p className="text-secondary" style={{ lineHeight: "1.7" }}>
          You must be at least 13 years old to use we-check.ing. By creating an account, you confirm that you meet this age requirement.
        </p>
      </div>

      <div className="question-container">
        <div className="question-text text-red" style={{ fontSize: "16px" }}>
          Accounts
        </div>
        <p className="text-secondary" style={{ lineHeight: "1.7" }}>
          You may create one account per person. You are responsible for keeping your login credentials secure and for all activity under your account. We reserve the right to remove accounts that violate these terms.
        </p>
      </div>

      <div className="question-container">
        <div className="question-text text-red" style={{ fontSize: "16px" }}>
          Quiz Gameplay
        </div>
        <p className="text-secondary" style={{ lineHeight: "1.7" }}>
          Quizzes are created and scored at the discretion of the site administrators. We do not guarantee the availability, accuracy, or regularity of quizzes. Points and rankings are for entertainment purposes only and carry no monetary value.
        </p>
      </div>

      <div className="question-container">
        <div className="question-text text-red" style={{ fontSize: "16px" }}>
          Not Affiliated with Formula 1
        </div>
        <p className="text-secondary" style={{ lineHeight: "1.7" }}>
          we-check.ing is an unofficial fan project and is not affiliated with, endorsed by, or connected to Formula 1, the FIA, Formula One Management, or any Formula 1 team. F1, FORMULA ONE, and related marks are trademarks of Formula One Licensing B.V.
        </p>
      </div>

      <div className="question-container">
        <div className="question-text text-red" style={{ fontSize: "16px" }}>
          Intellectual Property
        </div>
        <p className="text-secondary" style={{ lineHeight: "1.7" }}>
          The we-check.ing name, design, and original content are owned by the site operator. All Formula 1-related trademarks belong to their respective owners. You may not reproduce or redistribute any part of this service without permission.
        </p>
      </div>

      <div className="question-container">
        <div className="question-text text-red" style={{ fontSize: "16px" }}>
          Termination
        </div>
        <p className="text-secondary" style={{ lineHeight: "1.7" }}>
          We may suspend or terminate your account at any time, with or without cause, including for violation of these terms. Upon termination, your right to use the service ceases immediately.
        </p>
      </div>

      <div className="question-container">
        <div className="question-text text-red" style={{ fontSize: "16px" }}>
          Limitation of Liability
        </div>
        <p className="text-secondary" style={{ lineHeight: "1.7" }}>
          we-check.ing is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the service, including loss of data or interruption of service.
        </p>
      </div>

      <div className="question-container">
        <div className="question-text text-red" style={{ fontSize: "16px" }}>
          Changes to These Terms
        </div>
        <p className="text-secondary" style={{ lineHeight: "1.7" }}>
          We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the updated terms. We encourage you to review this page periodically.
        </p>
      </div>

      <div className="question-container">
        <div className="question-text text-red" style={{ fontSize: "16px" }}>
          Contact
        </div>
        <p className="text-secondary" style={{ lineHeight: "1.7" }}>
          If you have questions about these terms, contact us at{" "}
          <a href="mailto:hello@we-check.ing" className="text-red">hello@we-check.ing</a>.
        </p>
      </div>

      <div style={{ marginTop: "24px", textAlign: "center" }}>
        <Link to="/privacy" className="text-red" style={{ fontWeight: 600, fontSize: "14px" }}>
          View Privacy Policy →
        </Link>
      </div>
    </div>
  );
};

export default Terms;
```

**Step 2: Verify manually**

Run: `npm run dev`
Navigate to the app — the component isn't routed yet, but it should compile without errors.

**Step 3: Commit**

```bash
git add src/components/pages/Terms.jsx
git commit -m "feat: add Terms of Service page component"
```

---

### Task 2: Create Privacy Policy page

**Files:**
- Create: `src/components/pages/Privacy.jsx`

**Step 1: Create the Privacy component**

Create `src/components/pages/Privacy.jsx` following the same pattern as Terms.jsx.

```jsx
import React from "react";
import { Link } from "react-router-dom";

const Privacy = () => {
  return (
    <div className="card">
      <h1 className="card-title">Privacy Policy</h1>
      <p className="text-secondary text-sm" style={{ marginBottom: "24px" }}>
        Last updated: March 1, 2026
      </p>

      <div className="question-container">
        <div className="question-text text-red" style={{ fontSize: "16px" }}>
          What We Collect
        </div>
        <p className="text-secondary" style={{ lineHeight: "1.7" }}>
          When you use we-check.ing, we collect the following information:
        </p>
        <ul className="text-secondary" style={{ lineHeight: "1.7", paddingLeft: "20px", marginTop: "8px" }}>
          <li><strong>Email address</strong> — used for account creation and login</li>
          <li><strong>Username</strong> — chosen by you, displayed in rankings and quizzes</li>
          <li><strong>Quiz answers and scores</strong> — your predictions and calculated results</li>
          <li><strong>Usage data</strong> — collected via Firebase Analytics (page views, feature usage, device type)</li>
        </ul>
      </div>

      <div className="question-container">
        <div className="question-text text-red" style={{ fontSize: "16px" }}>
          How We Use It
        </div>
        <p className="text-secondary" style={{ lineHeight: "1.7" }}>
          Your data is used to operate the quiz game: managing your account, recording your predictions, calculating scores, displaying leaderboards, and improving the service through analytics.
        </p>
      </div>

      <div className="question-container">
        <div className="question-text text-red" style={{ fontSize: "16px" }}>
          Data Storage
        </div>
        <p className="text-secondary" style={{ lineHeight: "1.7" }}>
          Your data is stored in Firebase (Google Cloud Platform). Firebase handles authentication and database storage. Data is processed in accordance with{" "}
          <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer" className="text-red">
            Google's privacy practices
          </a>.
        </p>
      </div>

      <div className="question-container">
        <div className="question-text text-red" style={{ fontSize: "16px" }}>
          Third Parties
        </div>
        <p className="text-secondary" style={{ lineHeight: "1.7" }}>
          We use Firebase (Google) as our data processor for authentication, database, and analytics. We do not sell, rent, or share your personal data with any other third parties.
        </p>
      </div>

      <div className="question-container">
        <div className="question-text text-red" style={{ fontSize: "16px" }}>
          Cookies
        </div>
        <p className="text-secondary" style={{ lineHeight: "1.7" }}>
          we-check.ing uses cookies for authentication (keeping you logged in) and analytics (Firebase Analytics). These are essential for the service to function. By using the service, you consent to the use of these cookies.
        </p>
      </div>

      <div className="question-container">
        <div className="question-text text-red" style={{ fontSize: "16px" }}>
          Data Retention
        </div>
        <p className="text-secondary" style={{ lineHeight: "1.7" }}>
          Your data is retained for as long as your account is active. If you wish to have your data deleted, contact us and we will remove your account and associated data.
        </p>
      </div>

      <div className="question-container">
        <div className="question-text text-red" style={{ fontSize: "16px" }}>
          Your Rights
        </div>
        <p className="text-secondary" style={{ lineHeight: "1.7" }}>
          You have the right to access, correct, or request deletion of your personal data. To exercise these rights, contact us at the email below. We will respond to your request within a reasonable timeframe.
        </p>
      </div>

      <div className="question-container">
        <div className="question-text text-red" style={{ fontSize: "16px" }}>
          Children
        </div>
        <p className="text-secondary" style={{ lineHeight: "1.7" }}>
          we-check.ing is not intended for children under 13. We do not knowingly collect personal data from children under 13. If you believe a child has provided us with personal data, please contact us.
        </p>
      </div>

      <div className="question-container">
        <div className="question-text text-red" style={{ fontSize: "16px" }}>
          Changes to This Policy
        </div>
        <p className="text-secondary" style={{ lineHeight: "1.7" }}>
          We may update this policy from time to time. Changes will be reflected on this page with an updated date. Continued use of the service after changes constitutes acceptance of the updated policy.
        </p>
      </div>

      <div className="question-container">
        <div className="question-text text-red" style={{ fontSize: "16px" }}>
          Contact
        </div>
        <p className="text-secondary" style={{ lineHeight: "1.7" }}>
          For privacy-related questions or data requests, contact us at{" "}
          <a href="mailto:hello@we-check.ing" className="text-red">hello@we-check.ing</a>.
        </p>
      </div>

      <div style={{ marginTop: "24px", textAlign: "center" }}>
        <Link to="/terms" className="text-red" style={{ fontWeight: 600, fontSize: "14px" }}>
          ← View Terms of Service
        </Link>
      </div>
    </div>
  );
};

export default Privacy;
```

**Step 2: Commit**

```bash
git add src/components/pages/Privacy.jsx
git commit -m "feat: add Privacy Policy page component"
```

---

### Task 3: Add routes for Terms and Privacy

**Files:**
- Modify: `src/App.jsx:1-43`

**Step 1: Add imports and routes**

In `src/App.jsx`, add two imports at the top (after the Dashboard import, line 11):

```jsx
import Terms from "./components/pages/Terms";
import Privacy from "./components/pages/Privacy";
```

Add two routes inside `<Routes>` (after the Dashboard route, line 33):

```jsx
<Route path="/terms" element={<Terms />} />
<Route path="/privacy" element={<Privacy />} />
```

**Step 2: Verify manually**

Run: `npm run dev`
Navigate to `http://localhost:3000/terms` — should see the Terms of Service page styled in dark cockpit theme.
Navigate to `http://localhost:3000/privacy` — should see the Privacy Policy page.
Both pages should be accessible without logging in.

**Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat: add /terms and /privacy routes"
```

---

### Task 4: Create Footer component

**Files:**
- Create: `src/components/layout/Footer.jsx`
- Modify: `src/styles/App.css` (append footer styles at end)

**Step 1: Create the Footer component**

Create `src/components/layout/Footer.jsx`:

```jsx
import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-content">
        <span className="footer-copy">© 2026 we-check.ing</span>
        <nav className="footer-links">
          <Link to="/terms" className="footer-link">Terms</Link>
          <span className="footer-separator">·</span>
          <Link to="/privacy" className="footer-link">Privacy</Link>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
```

**Step 2: Add footer styles**

Append the following to the end of `src/styles/App.css` (before the closing responsive media queries — or at the very end of the file):

```css
/* ── Footer ───────────────────────────────── */
.footer {
    border-top: 1px solid var(--wc-border);
    padding: 20px 0;
    margin-top: auto;
}

.footer-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.footer-copy {
    font-size: 12px;
    color: var(--wc-text-muted);
}

.footer-links {
    display: flex;
    align-items: center;
    gap: 8px;
}

.footer-link {
    font-size: 12px;
    color: var(--wc-text-secondary);
    text-decoration: none;
    transition: color var(--duration-fast);
}

.footer-link:hover {
    color: var(--wc-text);
}

.footer-separator {
    color: var(--wc-text-muted);
    font-size: 12px;
}
```

**Step 3: Commit**

```bash
git add src/components/layout/Footer.jsx src/styles/App.css
git commit -m "feat: add footer component with terms and privacy links"
```

---

### Task 5: Render Footer in App.jsx

**Files:**
- Modify: `src/App.jsx`

**Step 1: Import Footer and render below main**

Add import at the top of `src/App.jsx`:

```jsx
import Footer from "./components/layout/Footer";
```

Add `<Footer />` after the closing `</main>` tag (line 36), before the closing `</div>`:

```jsx
          </main>
          <Footer />
        </div>
```

**Step 2: Verify manually**

Run: `npm run dev`
Footer should appear at the bottom of every page with "© 2026 we-check.ing" on the left and "Terms · Privacy" links on the right. Links should navigate to the correct pages.

**Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat: render footer in app layout"
```

---

### Task 6: Add terms acceptance checkbox to Login

**Files:**
- Modify: `src/components/auth/Login.jsx`

**Step 1: Add state and checkbox**

In `Login.jsx`, add a new state variable after line 13 (`const [resetSent, setResetSent] = useState(false);`):

```jsx
const [termsAccepted, setTermsAccepted] = useState(false);
```

Add `Link` to the import from react-router-dom (line 2):

```jsx
import { useNavigate, Link } from "react-router-dom";
```

Add the checkbox markup after the password field's closing `</div>` (after line 141), inside the `{isRegistering && (...)}` check. Add a new conditional block:

```jsx
{isRegistering && (
  <div className="form-group" style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
    <input
      type="checkbox"
      id="terms"
      checked={termsAccepted}
      onChange={(e) => setTermsAccepted(e.target.checked)}
      style={{ marginTop: "3px", accentColor: "var(--wc-red)" }}
    />
    <label htmlFor="terms" className="text-secondary" style={{ fontSize: "13px", lineHeight: "1.5", cursor: "pointer" }}>
      I agree to the{" "}
      <Link to="/terms" className="text-red" target="_blank">Terms of Service</Link>
      {" "}and{" "}
      <Link to="/privacy" className="text-red" target="_blank">Privacy Policy</Link>
    </label>
  </div>
)}
```

**Step 2: Disable submit button when checkbox unchecked**

Update the button's `disabled` condition (line 161) from:

```jsx
disabled={loading}
```

to:

```jsx
disabled={loading || (isRegistering && !termsAccepted)}
```

**Step 3: Reset checkbox state when toggling modes**

In the existing toggle span's `onClick` (line 179), update to also reset the checkbox:

```jsx
onClick={() => {
  setIsRegistering(!isRegistering);
  setTermsAccepted(false);
}}
```

**Step 4: Verify manually**

Run: `npm run dev`
1. Navigate to `/login`
2. Click "Register" — checkbox should appear below the password field
3. "Create Account" button should be disabled until checkbox is checked
4. Clicking "Terms of Service" and "Privacy Policy" links should open the pages in new tabs
5. Switching back to "Login" mode should hide the checkbox

**Step 5: Commit**

```bash
git add src/components/auth/Login.jsx
git commit -m "feat: add terms acceptance checkbox to registration form"
```

---

### Task 7: Store termsAcceptedAt in Firestore

**Files:**
- Modify: `src/firebase.js:47-52`

**Step 1: Add termsAcceptedAt field**

In `src/firebase.js`, in the `registerWithEmail` function, update the `setDoc` call (line 47-52) to include a `termsAcceptedAt` field:

Change:

```jsx
  await setDoc(userRef, {
    email: email,
    username: username,
    createdAt: new Date(),
    role: isFirstUser ? "admin" : "user"
  });
```

To:

```jsx
  await setDoc(userRef, {
    email: email,
    username: username,
    createdAt: new Date(),
    termsAcceptedAt: new Date(),
    role: isFirstUser ? "admin" : "user"
  });
```

**Step 2: Verify manually**

Register a test account. Check the Firestore console — the user document should have a `termsAcceptedAt` field with a timestamp.

**Step 3: Commit**

```bash
git add src/firebase.js
git commit -m "feat: store termsAcceptedAt timestamp on user registration"
```

---

### Task 8: Final verification

**Step 1: Full flow test**

Run: `npm run dev`

Verify the complete flow:
1. `/terms` — accessible without login, all sections display correctly
2. `/privacy` — accessible without login, all sections display correctly
3. Cross-links work (Terms → Privacy and Privacy → Terms)
4. Footer visible on all pages with working links
5. Registration: checkbox appears, blocks form submission until checked, links open in new tabs
6. Login mode: checkbox hidden
7. Successful registration stores `termsAcceptedAt` in Firestore

**Step 2: Build check**

Run: `npm run build`
Verify no build errors.

**Step 3: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: address any issues found during final verification"
```
