# Message from the Race Director

## Overview
Global broadcast message that admin can set/unset, displayed in real-time on the play page.

## Data Model
- Firestore document: `settings/raceDirectorMessage`
- Fields: `text` (string), `active` (boolean), `updatedAt` (timestamp)

## Admin UI (QuizAdmin page)
- Section at top of admin page
- Text input + active toggle + save button

## Player UI (QuizGame page)
- Real-time `onSnapshot` listener on the settings doc
- F1-themed banner when active and text is non-empty
- Not dismissable — visible as long as admin keeps it active

## Firestore Rules
- Admins: read/write `settings/raceDirectorMessage`
- Authenticated users: read only

## Out of scope
- Message history/log
- Per-quiz messages
- Push notifications
