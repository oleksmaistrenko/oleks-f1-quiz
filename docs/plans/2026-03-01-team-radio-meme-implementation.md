# Team Radio Meme Integration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Weave the "we are checking" F1 team radio meme throughout the app via copy changes and visual motifs.

**Architecture:** String replacements in 7 component files, CSS additions to App.css, minor Toast component enhancement. No new routes, pages, or structural changes.

**Tech Stack:** React JSX (string changes), CSS (visual motifs)

---

### Task 1: QuizGame copy — toasts and buttons

**Files:**
- Modify: `src/components/quiz/QuizGame.jsx`

**Step 1: Update toast messages**

Replace these strings in `handleAnswerSelect`:
- Line 53: `"Answer changed to ${selectedAnswer}"` → `"Understood, changing to ${selectedAnswer}"`
- Line 55: `` `Locked in: ${selectedAnswer}` `` → `` `Copy. ${selectedAnswer}.` ``

Replace in `handleNotifOptIn`:
- Line 250: `"You'll be notified about new quizzes!"` → `"Copy, we'll radio you for every race"`

Replace in `handleRemindMe`:
- Line 273: `"Reminder set! We'll nudge you before it closes."` → `"Slow button on. We'll radio you."`
- Line 276: `"Couldn't set reminder. Try again."` → `"Lost comms. Try again."`

Replace in `handleSubmit`:
- Line 303: `"Predictions locked in!"` → `"Copy, we are checking"`
- Line 320: `"Failed to submit. Please try again."` → `"No radio. Try again."`

**Step 2: Update button labels**

- Line 459: `{submitted ? "Update Answers" : "Submit Answers"}` → `{submitted ? "Change Predictions" : "Lock In Predictions"}`
- Line 473: `"Remind me before it closes"` → `"Slow Button On"`
- Line 492: `"Yes, notify me"` → `"Copy, Notify Me"`
- Line 372: `"Back to Dashboard"` → `"Back to Pit Wall"`

**Step 3: Update status text**

- Line 186: `"Quiz closed"` → `"Chequered flag"`
- Lines 351-355: Empty state title `"No quizzes right now"` → `"Radio silence"`, subtext `"The paddock is empty. Check back before the next race weekend!"` → `"No active transmissions. Stand by for the next race weekend."`
- Lines 408-411: `Playing as` → `{userProfile.username}, do you copy?`
- Line 464: `"Predictions submitted. You can still edit until the quiz closes."` → `"Copy. You can change predictions until the chequered flag."`
- Line 479: `"Reminder set for 2 hours before deadline."` → `"Slow button on. 2 hours before the flag."`
- Line 571: CheckingOverlay subtext `"Submitting your predictions"` → `"Stand by for confirmation"`

**Step 4: Verify build**

Run: `npm run build`
Expected: Clean build, no errors

**Step 5: Commit**

```bash
git add src/components/quiz/QuizGame.jsx
git commit -m "feat: team radio copy in QuizGame — toasts, buttons, status text"
```

---

### Task 2: Header and Login copy

**Files:**
- Modify: `src/components/layout/Header.jsx`
- Modify: `src/components/auth/Login.jsx`

**Step 1: Update Header button labels**

In `Header.jsx`:
- Line 76: `"Logout"` → `"Radio Out"`
- Line 82: `"Login"` → `"Radio In"`

**Step 2: Update Login page copy**

In `Login.jsx`:
- Line 85: `"Login to we-check.ing"` → `"Radio In"` and `"Create an Account"` → `"New Driver Registration"`
- Line 167-171: Submit button text: `"Create Account"` → `"Register"` and `"Login"` → `"Radio In"`
- Line 183: Toggle link text: `"Login"` → `"Radio In"` (only the clickable span, keep "Already have an account?")

**Step 3: Verify build**

Run: `npm run build`
Expected: Clean build

**Step 4: Commit**

```bash
git add src/components/layout/Header.jsx src/components/auth/Login.jsx
git commit -m "feat: team radio copy in Header and Login — Radio In/Out"
```

---

### Task 3: Page title copy changes

**Files:**
- Modify: `src/components/pages/Dashboard.jsx`
- Modify: `src/components/pages/Rankings.jsx`
- Modify: `src/components/pages/HeadToHead.jsx`
- Modify: `src/components/pages/Rules.jsx`

**Step 1: Dashboard**

- Line 107: `"Your Dashboard"` → `"Pit Wall"`
- Line 173: `"No quiz results yet. Play your first quiz to see your stats!"` → `"No data yet. Complete your first race to see telemetry."`

**Step 2: Rankings**

- Line 164: `"Leaderboard"` → `"Championship Standings"`
- Line 167: `"No quiz results available yet."` → `"No telemetry available yet."`
- Line 175: Table header `"Player"` → `"Driver"` (matches the radio flavor)

**Step 3: HeadToHead**

- Line 153: `"Head to Head"` → keep as is (already good)
- Line 160: `"Select player"` → `"Select driver"`
- Line 174: `"Select opponent"` → `"Select opponent"`
- Line 291: `"No shared quizzes found between these players."` → `"No shared races between these drivers."`
- Line 294: `"Select two players to compare."` → `"Select two drivers to compare."`

**Step 4: Rules**

- Line 7: `"How It Works"` → `"Race Briefing"`

**Step 5: Update nav link text**

In `Header.jsx`:
- Line 53: Nav link `"Dashboard"` → `"Pit Wall"`
- Line 56: Nav link `"Rules"` → `"Briefing"`

**Step 6: Verify build**

Run: `npm run build`
Expected: Clean build

**Step 7: Commit**

```bash
git add src/components/pages/Dashboard.jsx src/components/pages/Rankings.jsx src/components/pages/HeadToHead.jsx src/components/pages/Rules.jsx src/components/layout/Header.jsx
git commit -m "feat: team radio page titles — Pit Wall, Championship Standings, Race Briefing"
```

---

### Task 4: Toast radio prefix ("ENGINEER:")

**Files:**
- Modify: `src/components/ui/Toast.jsx`
- Modify: `src/styles/App.css`

**Step 1: Add ENGINEER prefix to Toast component**

In `Toast.jsx`, update the toast rendering (line 33-36) to prefix messages:

```jsx
<div
  key={toast.id}
  className={`toast toast-${toast.type} ${toast.exiting ? "toast-exit" : ""}`}
>
  <span className="toast-prefix">ENGINEER:</span> {toast.message}
</div>
```

**Step 2: Add toast-prefix CSS**

In `App.css`, add after the `.toast-info` rule (around line 804):

```css
.toast-prefix {
    color: var(--wc-text-muted);
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-right: 6px;
}
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Clean build

**Step 4: Commit**

```bash
git add src/components/ui/Toast.jsx src/styles/App.css
git commit -m "feat: ENGINEER prefix on toast notifications"
```

---

### Task 5: Radio transmission bar on quiz card

**Files:**
- Modify: `src/components/quiz/QuizGame.jsx`
- Modify: `src/styles/App.css`

**Step 1: Add CSS for transmission bar**

In `App.css`, add after the `.quiz-actions` block (around line 428):

```css
/* Radio transmission bar — active quiz indicator */
.transmission-bar {
    height: 3px;
    border-radius: 2px;
    margin-bottom: var(--space-md);
    overflow: hidden;
    background-color: var(--wc-border);
}

.transmission-bar-live {
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, var(--wc-red), var(--wc-gold), var(--wc-red));
    background-size: 200% 100%;
    animation: transmission-pulse 2s ease-in-out infinite;
}

.transmission-bar-closed {
    width: 100%;
    height: 100%;
    background-color: var(--wc-text-muted);
    opacity: 0.3;
}

@keyframes transmission-pulse {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
}
```

**Step 2: Add transmission bar to QuizGame**

In `QuizGame.jsx`, add right after `<div className="card">` (line 380), before the next-race-banner:

```jsx
<div className="transmission-bar">
  <div className={quizClosed ? "transmission-bar-closed" : "transmission-bar-live"} />
</div>
```

Also add it in the error/empty state card (line 347), right after the opening `<div className="card" ...>`:

```jsx
<div className="transmission-bar">
  <div className="transmission-bar-closed" />
</div>
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Clean build

**Step 4: Commit**

```bash
git add src/components/quiz/QuizGame.jsx src/styles/App.css
git commit -m "feat: radio transmission bar on quiz card"
```

---

### Task 6: Live/Closed badge next to timer

**Files:**
- Modify: `src/components/quiz/QuizGame.jsx`
- Modify: `src/styles/App.css`

**Step 1: Add CSS for live badge**

In `App.css`, add after the `.timer` rules (around line 444):

```css
/* Live/Closed badge */
.live-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    padding: 4px 10px;
    border-radius: var(--radius-sm);
    margin-left: 8px;
}

.live-badge-active {
    background-color: var(--wc-red-dim);
    color: var(--wc-red);
}

.live-badge-active::before {
    content: "";
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: var(--wc-red);
    animation: live-dot-pulse 1.5s ease-in-out infinite;
}

@keyframes live-dot-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
}

.live-badge-closed {
    background-color: rgba(160, 160, 176, 0.08);
    color: var(--wc-text-muted);
}
```

**Step 2: Add badge to timer area in QuizGame**

In `QuizGame.jsx`, update the timer section (around lines 400-404). Replace the timer div with:

```jsx
<div className="flex items-center gap-2">
  <div className="timer">
    <span style={quizClosed ? { color: 'var(--wc-red)' } : undefined}>
      {timeRemaining}
    </span>
  </div>
  <span className={`live-badge ${quizClosed ? 'live-badge-closed' : 'live-badge-active'}`}>
    {quizClosed ? 'Closed' : 'Live'}
  </span>
</div>
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Clean build

**Step 4: Commit**

```bash
git add src/components/quiz/QuizGame.jsx src/styles/App.css
git commit -m "feat: LIVE/CLOSED badge next to quiz timer"
```

---

### Task 7: Enhanced checking overlay

**Files:**
- Modify: `src/styles/App.css`

**Step 1: Add scanline texture to overlay**

In `App.css`, update the `.checking-overlay` rule (line 833) to add a scanline effect:

```css
.checking-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(10, 10, 18, 0.94);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 500;
    animation: overlay-fade-in 0.3s var(--ease-out);
    backdrop-filter: blur(4px);
}

/* Scanline texture overlay */
.checking-overlay::after {
    content: "";
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(255, 255, 255, 0.015) 2px,
        rgba(255, 255, 255, 0.015) 4px
    );
    pointer-events: none;
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Clean build

**Step 3: Commit**

```bash
git add src/styles/App.css
git commit -m "feat: scanline texture on checking overlay"
```

---

### Task 8: Final verification

**Step 1: Full build**

Run: `npm run build`
Expected: Clean build, no errors, no warnings

**Step 2: Review all changes**

Run: `git diff --stat HEAD~7`
Expected: Changes in 7 files:
- `src/components/quiz/QuizGame.jsx`
- `src/components/layout/Header.jsx`
- `src/components/auth/Login.jsx`
- `src/components/pages/Dashboard.jsx`
- `src/components/pages/Rankings.jsx`
- `src/components/pages/HeadToHead.jsx`
- `src/components/pages/Rules.jsx`
- `src/components/ui/Toast.jsx`
- `src/styles/App.css`
