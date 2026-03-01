# "We Are Checking" — Team Radio Meme Integration

**Date:** 2026-03-01
**Approach:** B — Pit Wall (copy + visual motifs)
**Audience:** Casual F1 fans
**Tone:** Full F1 team radio flavor

## Copy Changes

### Buttons & Actions

| Location | Current | New |
|---|---|---|
| Submit (first time) | Submit Answers | Lock In Predictions |
| Submit (already submitted) | Update Answers | Change Predictions |
| Reminder button | Remind me before it closes | Slow Button On |
| Notification opt-in | Yes, notify me | Copy, Notify Me |
| Notification dismiss | Not now | Not Now |
| Login (header) | Login | Radio In |
| Logout (header) | Logout | Radio Out |
| Login page title | Login to we-check.ing | Radio In |
| Register page title | Create an Account | New Driver Registration |
| Login submit button | Login | Radio In |
| Register submit button | Create Account | Register |
| Back to dashboard | Back to Dashboard | Back to Pit Wall |

### Toasts

| Trigger | Current | New |
|---|---|---|
| Answer selected | Locked in: Yes | Copy. {answer}. |
| Answer changed | Answer changed to No | Understood, changing to {answer} |
| Submit success | Predictions locked in! | Copy, we are checking |
| Submit fail | Failed to submit. Please try again. | No radio. Try again. |
| Reminder set | Reminder set! We'll nudge you... | Slow button on. We'll radio you. |
| Reminder fail | Couldn't set reminder. Try again. | Lost comms. Try again. |
| Notif opt-in | You'll be notified about new quizzes! | Copy, we'll radio you for every race |

### Status Text

| Location | Current | New |
|---|---|---|
| Playing as | Playing as {name} | {name}, do you copy? |
| Quiz closed timer | Quiz closed | Chequered flag |
| Submitted alert | Predictions submitted. You can still edit... | Copy. You can change predictions until the chequered flag. |
| Reminder set alert | Reminder set for 2 hours before deadline. | Slow button on. 2 hours before the flag. |

### Empty States

| Location | Current | New |
|---|---|---|
| No quizzes title | No quizzes right now | Radio silence |
| No quizzes subtext | The paddock is empty... | No active transmissions. Stand by for the next race weekend. |
| Dashboard empty | No quiz results yet... | No data yet. Complete your first race to see telemetry. |
| H2H no shared | No shared quizzes found... | No shared races between these drivers. |
| H2H select | Select two players to compare. | Select two drivers to compare. |
| Rankings empty | No quiz results available yet. | No telemetry available yet. |

### Page Titles

| Page | Current | New |
|---|---|---|
| Dashboard | Your Dashboard | Pit Wall |
| Leaderboard | Leaderboard | Championship Standings |
| Rules | How It Works | Race Briefing |

## Visual Motifs

### 1. Radio transmission bar
3-4px animated bar at top of quiz card when live. Subtle pulse animation. Dims when quiz is closed.

### 2. Toast radio prefix
Toasts prefixed with "ENGINEER:" in muted color.

### 3. Enhanced checking overlay
Add CSS scanline/noise texture. Change subtext to "Stand by for confirmation".

### 4. Live badge
Red dot + "LIVE" next to timer when quiz is open. Dim "CLOSED" when ended.

## Scope

- ~20 string replacements across 5 components
- CSS additions: transmission bar, toast prefix, overlay texture, live badge
- Minor CheckingOverlay component tweak
- No new pages, routes, or structural changes
