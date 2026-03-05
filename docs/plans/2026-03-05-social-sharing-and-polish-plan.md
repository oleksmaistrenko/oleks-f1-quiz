# Social Sharing & UX Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add shareable result image cards, invite-a-friend flow, OG meta tags, skeleton loaders, and mobile UX improvements.

**Architecture:** Client-side Canvas for image generation, Web Share API for native sharing with clipboard fallback, reusable Skeleton component for loading states, CSS-only mobile fixes for sticky columns and touch targets.

**Tech Stack:** React 19, HTML Canvas API, Web Share API, CSS custom properties

---

### Task 1: Add OG Meta Tags to index.html

**Files:**
- Modify: `index.html`

**Step 1: Add OG and Twitter card meta tags**

Replace the existing `<head>` content with OG tags added after the existing `<meta name="description">` tag:

```html
<!-- Open Graph -->
<meta property="og:type" content="website" />
<meta property="og:url" content="https://we-check.ing" />
<meta property="og:title" content="we-check.ing — The F1 Prediction Quiz" />
<meta property="og:description" content="Predict. Score. Win. The F1 quiz where nobody knows the answer." />
<meta property="og:image" content="https://we-check.ing/og-image.png" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="we-check.ing — The F1 Prediction Quiz" />
<meta name="twitter:description" content="Predict. Score. Win. The F1 quiz where nobody knows the answer." />
<meta name="twitter:image" content="https://we-check.ing/og-image.png" />
```

**Step 2: Create a placeholder OG image**

Create a simple 1200x630 placeholder at `public/og-image.png`. This can be replaced with a designed asset later. For now, generate it via Canvas in a one-off script or use a solid color card with text.

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds, `dist/index.html` contains the OG tags.

**Step 4: Commit**

```bash
git add index.html public/og-image.png
git commit -m "feat: add Open Graph and Twitter Card meta tags"
```

---

### Task 2: Create ShareCard component (Canvas image generation)

**Files:**
- Create: `src/components/ui/ShareCard.jsx`

**Step 1: Build the ShareCard component**

The component receives props: `quizTitle`, `score`, `totalQuestions`, `answers` (object like `{q1: "Yes", q2: "No"}`), `correctAnswers` (array of correct answers or null), `username`, `rank` (optional).

```jsx
import React, { useRef, useCallback } from "react";

const CARD_WIDTH = 600;
const CARD_HEIGHT = 400;

const ShareCard = ({ quizTitle, score, totalQuestions, answers, correctAnswers, username, rank }) => {
  const canvasRef = useRef(null);

  const generateImage = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Background
    ctx.fillStyle = "#0C0C12";
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

    // Red accent line at top
    ctx.fillStyle = "#E83838";
    ctx.fillRect(0, 0, CARD_WIDTH, 4);

    // Branding
    ctx.fillStyle = "#9090A8";
    ctx.font = "500 14px 'Inter', sans-serif";
    ctx.fillText("we-check.ing", 32, 40);

    // Quiz title
    ctx.fillStyle = "#EDEDF0";
    ctx.font = "700 28px 'Inter', sans-serif";
    ctx.fillText(quizTitle, 32, 90);

    // Prediction grid — colored squares
    const gridY = 130;
    const squareSize = 28;
    const gap = 8;
    const questionKeys = Object.keys(answers).sort();

    questionKeys.forEach((key, i) => {
      const idx = parseInt(key.replace("q", "")) - 1;
      const userAnswer = answers[key];
      const correct = correctAnswers?.[idx];

      if (!correct) {
        ctx.fillStyle = "#28282F"; // gray — no result yet
      } else if (userAnswer === correct) {
        ctx.fillStyle = "#2DD55B"; // green — correct
      } else {
        ctx.fillStyle = "#E83838"; // red — wrong
      }

      const x = 32 + i * (squareSize + gap);
      ctx.beginPath();
      ctx.roundRect(x, gridY, squareSize, squareSize, 4);
      ctx.fill();
    });

    // Score
    ctx.fillStyle = "#EDEDF0";
    ctx.font = "800 64px 'Inter', sans-serif";
    const scoreText = `${score}/${totalQuestions}`;
    ctx.fillText(scoreText, 32, 260);

    // Username and rank
    ctx.fillStyle = "#9090A8";
    ctx.font = "500 18px 'Inter', sans-serif";
    const userLine = rank ? `${username} · #${rank}` : username;
    ctx.fillText(userLine, 32, 295);

    // Tagline
    ctx.fillStyle = "#9090A8";
    ctx.font = "italic 500 16px 'Inter', sans-serif";
    ctx.fillText("Think you can beat this?", 32, 345);

    // URL at bottom
    ctx.fillStyle = "#E83838";
    ctx.font = "700 14px 'Inter', sans-serif";
    ctx.fillText("we-check.ing", 32, 380);

    return canvas;
  }, [quizTitle, score, totalQuestions, answers, correctAnswers, username, rank]);

  const handleDownload = () => {
    const canvas = generateImage();
    const link = document.createElement("a");
    link.download = `we-check-ing-${quizTitle.replace(/\s+/g, "-").toLowerCase()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleShare = async () => {
    const canvas = generateImage();
    const shareText = `I scored ${score}/${totalQuestions} on the ${quizTitle} quiz! Can you beat me? 🏎️`;
    const shareUrl = "https://we-check.ing";

    try {
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      const file = new File([blob], "result.png", { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          text: shareText,
          url: shareUrl,
          files: [file],
        });
        return;
      }
    } catch (err) {
      if (err.name === "AbortError") return;
    }

    // Fallback: copy link
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      // Toast handled by parent
    } catch {
      // Silent fail
    }
  };

  return (
    <div className="share-card">
      <canvas
        ref={canvasRef}
        width={CARD_WIDTH}
        height={CARD_HEIGHT}
        style={{ display: "none" }}
      />
      <div className="share-card-actions">
        <button className="btn btn-secondary" onClick={handleDownload}>
          Download Card
        </button>
        <button className="btn" onClick={handleShare}>
          Share Result
        </button>
      </div>
    </div>
  );
};

export default ShareCard;
```

**Step 2: Add CSS for share-card**

Add to `src/styles/App.css`:

```css
/* ── Share Card ───────────────────────────── */
.share-card {
    margin-top: var(--space-md);
}

.share-card-actions {
    display: flex;
    gap: 12px;
}

.share-card-actions .btn {
    flex: 1;
}
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds with no errors.

**Step 4: Commit**

```bash
git add src/components/ui/ShareCard.jsx src/styles/App.css
git commit -m "feat: add ShareCard component for canvas-based result sharing"
```

---

### Task 3: Integrate ShareCard into QuizGame

**Files:**
- Modify: `src/components/quiz/QuizGame.jsx`

**Step 1: Import ShareCard**

Add import at top of file:
```jsx
import ShareCard from "../ui/ShareCard";
```

**Step 2: Add ShareCard to the closed-quiz results view**

In the `quizClosed` section (the `else` branch of the ternary around line 516), after the score display (`<div className="score">`) and before the question list (`<div className="space-y-4">`), add:

```jsx
<ShareCard
  quizTitle={currentQuiz.title}
  score={score}
  totalQuestions={currentQuiz.questions.length}
  answers={answers}
  correctAnswers={currentQuiz.questions.map((q) => q.correctAnswer)}
  username={userProfile?.username || "Driver"}
/>
```

**Step 3: Add "Challenge a Friend" button below ShareCard**

After the ShareCard, add an invite button:

```jsx
<button
  className="btn btn-secondary btn-block"
  style={{ marginTop: "12px" }}
  onClick={async () => {
    const text = `I scored ${score}/${currentQuiz.questions.length} on the ${currentQuiz.title} quiz! Can you beat me? 🏎️\nhttps://we-check.ing`;
    if (navigator.share) {
      try {
        await navigator.share({ text, url: "https://we-check.ing" });
      } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      addToast("Link copied!", "success", 2000);
    }
  }}
>
  Challenge a Friend
</button>
```

**Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 5: Commit**

```bash
git add src/components/quiz/QuizGame.jsx
git commit -m "feat: integrate ShareCard and Challenge a Friend into quiz results"
```

---

### Task 4: Create Skeleton component

**Files:**
- Create: `src/components/ui/Skeleton.jsx`

**Step 1: Build the Skeleton component**

```jsx
import React from "react";

const Skeleton = ({ width, height = "16px", borderRadius = "var(--radius-sm)", style = {} }) => (
  <div
    className="skeleton"
    style={{
      width: width || "100%",
      height,
      borderRadius,
      ...style,
    }}
  />
);

export default Skeleton;
```

**Step 2: Add skeleton CSS with pulse animation**

Add to `src/styles/App.css` after the loading section (~line 1489):

```css
/* ── Skeleton Loaders ─────────────────────── */
.skeleton {
    background: linear-gradient(90deg, var(--wc-surface) 25%, var(--wc-surface-hover) 50%, var(--wc-surface) 75%);
    background-size: 200% 100%;
    animation: skeleton-pulse 1.5s ease-in-out infinite;
}

@keyframes skeleton-pulse {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add src/components/ui/Skeleton.jsx src/styles/App.css
git commit -m "feat: add reusable Skeleton loader component"
```

---

### Task 5: Replace spinner with skeleton in Rankings

**Files:**
- Modify: `src/components/pages/Rankings.jsx`

**Step 1: Import Skeleton**

```jsx
import Skeleton from "../ui/Skeleton";
```

**Step 2: Replace the loading spinner block**

Replace:
```jsx
if (loading) {
  return (
    <div className="loading">
      <div className="loading-spinner"></div>
    </div>
  );
}
```

With:
```jsx
if (loading) {
  return (
    <div className="card">
      <Skeleton width="220px" height="28px" style={{ marginBottom: "24px" }} />
      <div className="rankings-table-wrap">
        <table>
          <thead>
            <tr>
              <th className="rankings-col-rank"><Skeleton width="20px" height="12px" /></th>
              <th className="rankings-col-driver"><Skeleton width="50px" height="12px" /></th>
              <th className="rankings-col-total"><Skeleton width="36px" height="12px" /></th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }).map((_, i) => (
              <tr key={i}>
                <td className="rankings-col-rank"><Skeleton width="20px" height="16px" /></td>
                <td className="rankings-col-driver"><Skeleton width={`${100 + Math.random() * 60}px`} height="16px" /></td>
                <td className="rankings-col-total"><Skeleton width="32px" height="16px" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add src/components/pages/Rankings.jsx
git commit -m "feat: replace Rankings spinner with skeleton loader"
```

---

### Task 6: Replace spinner with skeleton in Dashboard

**Files:**
- Modify: `src/components/pages/Dashboard.jsx`

**Step 1: Import Skeleton**

```jsx
import Skeleton from "../ui/Skeleton";
```

**Step 2: Replace the loading spinner block**

Replace:
```jsx
if (loading) {
  return (
    <div className="loading">
      <div className="loading-spinner"></div>
    </div>
  );
}
```

With:
```jsx
if (loading) {
  return (
    <div className="card">
      <Skeleton width="140px" height="28px" style={{ marginBottom: "24px" }} />
      <div className="dashboard-stats">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="stat-card">
            <Skeleton width="48px" height="32px" style={{ marginBottom: "8px" }} />
            <Skeleton width="80px" height="14px" />
          </div>
        ))}
      </div>
      <Skeleton width="160px" height="22px" style={{ marginTop: "24px", marginBottom: "16px" }} />
      <Skeleton height="120px" borderRadius="var(--radius-md)" style={{ marginBottom: "32px" }} />
    </div>
  );
}
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add src/components/pages/Dashboard.jsx
git commit -m "feat: replace Dashboard spinner with skeleton loader"
```

---

### Task 7: Replace spinner with skeleton in HeadToHead

**Files:**
- Modify: `src/components/pages/HeadToHead.jsx`

**Step 1: Import Skeleton**

```jsx
import Skeleton from "../ui/Skeleton";
```

**Step 2: Replace the loading spinner block**

Replace:
```jsx
if (loading) {
  return (
    <div className="loading">
      <div className="loading-spinner"></div>
    </div>
  );
}
```

With:
```jsx
if (loading) {
  return (
    <div className="card">
      <Skeleton width="180px" height="28px" style={{ marginBottom: "24px" }} />
      <div className="h2h-selector">
        <div className="h2h-players">
          <Skeleton height="44px" borderRadius="var(--radius-md)" style={{ flex: 1 }} />
          <span className="h2h-vs">VS</span>
          <Skeleton height="44px" borderRadius="var(--radius-md)" style={{ flex: 1 }} />
        </div>
      </div>
      <Skeleton height="100px" borderRadius="var(--radius-md)" />
    </div>
  );
}
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add src/components/pages/HeadToHead.jsx
git commit -m "feat: replace HeadToHead spinner with skeleton loader"
```

---

### Task 8: Mobile UX — sticky driver column and touch targets

**Files:**
- Modify: `src/styles/App.css`

**Step 1: Make the driver column sticky alongside rank**

Add after the existing `.rankings-col-rank` sticky styles (~line 886):

```css
.rankings-col-driver {
    white-space: nowrap;
    position: sticky;
    left: 36px;
    z-index: 2;
    background-color: var(--wc-surface);
}

thead .rankings-col-driver {
    background-color: var(--wc-carbon);
    z-index: 3;
}

tbody tr:hover .rankings-col-driver {
    background-color: var(--wc-surface-hover);
}
```

Note: remove the existing `.rankings-col-driver { white-space: nowrap; }` rule at line 886-888 since it's now merged into the new rule.

**Step 2: Ensure minimum touch targets on mobile**

Add inside the existing `@media (max-width: 767px)` block:

```css
/* Touch target minimums */
.h2h-selector select,
.btn,
.option-label {
    min-height: 44px;
}

/* H2H selects: stack vertically on narrow screens */
.h2h-players {
    flex-direction: column;
}

.h2h-vs {
    font-size: var(--fs-body);
}
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add src/styles/App.css
git commit -m "feat: sticky driver column in Rankings and mobile touch target improvements"
```

---

### Task 9: Final verification

**Step 1: Clean build**

Run: `npm run build`
Expected: Build succeeds with no warnings.

**Step 2: Visual check**

Run: `npm run dev`

Verify:
- Rankings page shows skeleton loader, then data with sticky rank + driver columns on scroll
- Dashboard shows skeleton loader with stat card placeholders
- HeadToHead shows skeleton loader with selector placeholders
- Quiz results (closed quiz) show ShareCard with Download + Share buttons
- Challenge a Friend button works (opens share sheet on mobile, copies to clipboard on desktop)
- Mobile: touch targets are at least 44px, H2H selects stack vertically on narrow screens

**Step 3: Commit any final adjustments**

```bash
git add -A
git commit -m "chore: final polish and verification"
```
