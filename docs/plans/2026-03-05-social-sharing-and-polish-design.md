# Social Sharing & UX Polish — Design

**Date:** 2026-03-05
**Status:** Approved

## Goals

1. Let users share quiz results as image cards and links to social networks
2. Make it easy to invite friends to join the league
3. Improve mobile experience and replace loading spinners with skeletons

---

## 1. Share Results

### Image Card (Canvas-based)

A `ShareCard` component generates a styled PNG image from an off-screen HTML Canvas.

**Card layout:**
- Dark carbon background (`--wc-carbon`) with red accent line
- "we-check.ing" branding top-left
- Quiz title (e.g., "Australian GP")
- Prediction grid: colored squares in a row — green (correct), red (wrong), gray (unanswered) — Wordle-style, no actual answers revealed
- Score in large text (e.g., "7/10")
- Username and rank position (e.g., "oleks · #2")
- Tagline: "Think you can beat this?"
- "we-check.ing" URL at bottom

**Triggers:**
- "Share Your Result" button on the post-submission / closed quiz view in `QuizGame.jsx`
- Optional share button on Dashboard quiz history items

**Actions:**
- **Download** — saves the PNG to device
- **Share** — uses `navigator.share()` (Web Share API) with the image blob + text. Falls back to clipboard copy of the link on unsupported browsers.

### OG Meta Tags

Add static Open Graph tags to `index.html`:
- `og:title` — "we-check.ing — The F1 Prediction Quiz"
- `og:description` — "Predict. Score. Win. The F1 quiz where nobody knows the answer."
- `og:image` — static branded preview image (needs a designed asset, ~1200x630)
- `og:url` — "https://we-check.ing"
- Twitter card tags (summary_large_image)

No dynamic per-user OG (would require server-side rendering).

---

## 2. Invite Friends

### "Challenge a Friend" Button

**Placement:**
- Post-submission screen in QuizGame (below the share card)
- Dashboard page (below stats)

**Behavior:**
- Uses Web Share API with text: "I scored {score}/{total} on the {quizTitle} quiz! Can you beat me?" + URL
- Fallback: copies URL to clipboard with toast confirmation
- Styled as `btn-secondary`

**No referral tracking** — unnecessary at current scale (10-50 users).

---

## 3. UX Polish

### Mobile Improvements

**Rankings table:**
- Horizontal scroll container
- Sticky first two columns (rank + driver name) so they stay visible while scrolling race columns

**Touch targets:**
- Audit all buttons, selects, and interactive elements for 44px minimum height
- Particularly: H2H player selects, quiz option labels, nav links

**H2H selects:**
- Full-width on mobile (stack vertically below ~480px)

### Skeleton Loaders

**Reusable `Skeleton` component:**
- Renders placeholder shapes with CSS pulse animation
- Props: `width`, `height`, `variant` (text, circle, rect)

**Pages to update:**
- **Rankings** — skeleton table rows (rank, name, score columns)
- **Dashboard** — skeleton stat cards + sparkline placeholder
- **HeadToHead** — skeleton selector + empty comparison placeholder

Replace the generic `<div className="loading-spinner">` on these three pages.

---

## Technical Notes

- Canvas image generation is fully client-side, no server dependency
- Web Share API is well-supported on mobile (iOS Safari, Chrome Android) — desktop fallback to clipboard
- Skeleton CSS uses a single `@keyframes pulse` animation, no JS needed
- All changes are additive — no breaking changes to existing functionality
