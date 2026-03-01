# Landing Page Design — we-check.ing

**Date:** 2026-03-01
**Approach:** Replace login page with story + login form

## Structure

Single page at `/login`. Story sections above the existing auth form.

### Section 1: Hero

**Headline:** "The F1 quiz where nobody knows the answer"
**Subtext:** "Born from 4 seasons of family arguments and group chat chaos. Not your usual 'who won the race' trivia."
**CTA:** "Radio In" button — scrolls to login form

### Section 2: Pitch (3 cards)

1. **"Awkward questions"** — "Will it be possible to spell SINGAPORE from the top-ten drivers' abbreviations?" You won't find the answer on Wikipedia.
2. **"The whole grid"** — Forget just the winners. This game makes you care about P14.
3. **"Pure gamble"** — Sometimes you know. Most times you don't. Like the sport itself.

### Section 3: Testimonial

Styled as team radio transmission:
> DRIVER: "Your game united our family. We discuss and quarrel about it."

### Section 4: Login/Register form

Existing form, unchanged.

## Technical Scope

- Modify: `src/components/auth/Login.jsx` — add story sections above form
- Modify: `src/styles/App.css` — hero, pitch cards, testimonial styles
- No new routes, components, or structural changes
