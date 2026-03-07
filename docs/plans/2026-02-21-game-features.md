# Game Features Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add engagement mechanics, social features, and technical improvements to the we-check.ing prediction quiz game.

**Architecture:** All features are pure frontend React components + CSS, except for the Cloud Function (Task 12) and real-time listeners (Task 10). No new npm dependencies are needed — we use CSS animations, React state, and existing Firebase SDK. New components go in feature directories under `src/components/`. Shared UI primitives (Toast, Overlay) go in `src/components/ui/`.

**Tech Stack:** React 19, Vite, Firebase Firestore/Auth, CSS custom properties, CSS animations

**Firestore collections (existing):**
- `users` — `{ email, username, role, createdAt }`
- `quizzes` — `{ title, endTime, questions[], createdAt }`
- `quizAnswers` — `{ userId, username, quizId, quizTitle, answers{}, score?, totalQuestions?, submittedAt }`

**No testing infrastructure exists** — CRA test deps were removed in the Vite migration. Each task includes manual verification steps.

---

### Task 1: Toast Notification Component

**Why:** Multiple later features (answer lock-in, notifications opt-in, remind me) need a toast system. Build this first.

**Files:**
- Create: `src/components/ui/Toast.jsx`
- Modify: `src/styles/index.css` (add toast styles + animations)

**Step 1: Add toast CSS to index.css**

Append to `src/styles/index.css`:

```css
/* Toast notifications */
.toast-container {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.toast {
    background-color: var(--wc-surface);
    border: 1px solid var(--wc-border);
    border-radius: 8px;
    padding: 12px 20px;
    color: var(--wc-text);
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    animation: toast-in 0.3s ease-out;
    max-width: 320px;
}

.toast-success {
    border-left: 4px solid var(--wc-success);
}

.toast-error {
    border-left: 4px solid var(--wc-error);
}

.toast-info {
    border-left: 4px solid var(--wc-gold);
}

.toast-exit {
    animation: toast-out 0.3s ease-in forwards;
}

@keyframes toast-in {
    from {
        opacity: 0;
        transform: translateX(100%);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

@keyframes toast-out {
    from {
        opacity: 1;
        transform: translateX(0);
    }
    to {
        opacity: 0;
        transform: translateX(100%);
    }
}
```

**Step 2: Create Toast.jsx**

```jsx
import React, { useState, useEffect, useCallback, createContext, useContext } from "react";

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info", duration = 3000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, exiting: false }]);

    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
      );
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 300);
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast toast-${toast.type} ${toast.exiting ? "toast-exit" : ""}`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
```

**Step 3: Wrap App with ToastProvider**

In `src/App.jsx`, import `{ ToastProvider }` from `./components/ui/Toast` and wrap the `<Router>` contents:

```jsx
import { ToastProvider } from "./components/ui/Toast";

function App() {
  return (
    <Router>
      <ToastProvider>
        <div className="min-h-screen">
          <Header />
          <main className="main-content">
            <div className="container">
              <Routes>
                {/* ... existing routes ... */}
              </Routes>
            </div>
          </main>
        </div>
      </ToastProvider>
    </Router>
  );
}
```

**Step 4: Verify**

Run: `npm run dev`
Open browser, inspect React DevTools — confirm ToastProvider is in the component tree. No visual change yet (toasts are triggered programmatically).

**Step 5: Commit**

```bash
git add src/components/ui/Toast.jsx src/styles/index.css src/App.jsx
git commit -m "feat: add toast notification system"
```

---

### Task 2: "We Are Checking..." Loading Overlay

**Why:** Brand-defining moment. Shows a dramatic overlay with checkered-flag spinner and "We are checking..." text when submitting answers and when revealing correct answers.

**Files:**
- Create: `src/components/ui/CheckingOverlay.jsx`
- Modify: `src/styles/index.css` (add overlay + checkered animation styles)
- Modify: `src/components/quiz/QuizGame.jsx` (use overlay on submit + result reveal)

**Step 1: Add overlay CSS to index.css**

Append to `src/styles/index.css`:

```css
/* "We are checking..." overlay */
.checking-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(15, 15, 26, 0.92);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 500;
    animation: overlay-fade-in 0.3s ease-out;
}

@keyframes overlay-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
}

.checking-spinner {
    width: 80px;
    height: 80px;
    border: 6px solid var(--wc-border);
    border-top: 6px solid var(--wc-red);
    border-right: 6px solid var(--wc-gold);
    border-radius: 50%;
    animation: checking-spin 0.8s linear infinite;
    margin-bottom: 24px;
}

@keyframes checking-spin {
    to { transform: rotate(360deg); }
}

.checking-text {
    font-size: 24px;
    font-weight: 700;
    color: var(--wc-text);
    text-transform: uppercase;
    letter-spacing: 2px;
    animation: checking-pulse 1.5s ease-in-out infinite;
}

@keyframes checking-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

.checking-subtext {
    font-size: 14px;
    color: var(--wc-text-secondary);
    margin-top: 8px;
}
```

**Step 2: Create CheckingOverlay.jsx**

```jsx
import React from "react";

const CheckingOverlay = ({ message = "We are checking...", subtext = "" }) => {
  return (
    <div className="checking-overlay">
      <div className="checking-spinner"></div>
      <div className="checking-text">{message}</div>
      {subtext && <div className="checking-subtext">{subtext}</div>}
    </div>
  );
};

export default CheckingOverlay;
```

**Step 3: Integrate into QuizGame.jsx**

In `src/components/quiz/QuizGame.jsx`:

a) Import the overlay at the top:
```jsx
import CheckingOverlay from "../ui/CheckingOverlay";
```

b) Add a new state variable for the overlay:
```jsx
const [showChecking, setShowChecking] = useState(false);
```

c) Modify `handleSubmit` to show the overlay for 2 seconds before confirming:
```jsx
const handleSubmit = async () => {
    if (!currentQuiz || !user) return;

    try {
      setShowChecking(true);

      const answersDocId = `${user.uid}_${currentQuiz.id}`;
      const answersData = {
        userId: user.uid,
        username: userProfile?.username || "Unknown",
        quizId: currentQuiz.id,
        quizTitle: currentQuiz.title,
        answers: answers,
        submittedAt: Timestamp.now(),
      };

      await setDoc(doc(db, "quizAnswers", answersDocId), answersData);

      // Hold the overlay for dramatic effect
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSubmitted(true);
      setShowChecking(false);
    } catch (error) {
      console.error("Error submitting answers:", error);
      setSubmitError("Failed to submit answers. Please try again.");
      setShowChecking(false);
    }
  };
```

d) Remove the old `submitting` state and its references. Replace the submit button disabled logic:
```jsx
<button
  onClick={handleSubmit}
  disabled={showChecking}
  className={`btn btn-block ${showChecking ? "opacity-50 cursor-not-allowed" : ""}`}
>
  {submitted ? "Update Answers" : "Submit Answers"}
</button>
```

e) Add the overlay render at the bottom of the return, just before the closing `</div>`:
```jsx
{showChecking && (
  <CheckingOverlay
    message="We are checking..."
    subtext="Submitting your predictions"
  />
)}
```

**Step 4: Verify**

Run: `npm run dev`
Open the quiz, select answers, click "Submit Answers". You should see a full-screen dark overlay with a red/gold spinning circle and pulsing "WE ARE CHECKING..." text for ~1.5 seconds, then it disappears and the success message shows.

**Step 5: Commit**

```bash
git add src/components/ui/CheckingOverlay.jsx src/styles/index.css src/components/quiz/QuizGame.jsx
git commit -m "feat: add 'we are checking' loading overlay on submit"
```

---

### Task 3: Answer Lock-in Confirmation Toast

**Why:** Currently, clicking Yes/No silently changes the answer. Add a toast so the user knows their selection registered.

**Files:**
- Modify: `src/components/quiz/QuizGame.jsx`

**Step 1: Import and use the toast**

In `QuizGame.jsx`, add import:
```jsx
import { useToast } from "../ui/Toast";
```

Inside the component, get the toast function:
```jsx
const addToast = useToast();
```

**Step 2: Modify `handleAnswerSelect`**

Replace the existing `handleAnswerSelect`:
```jsx
const handleAnswerSelect = (questionId, selectedAnswer) => {
    const previousAnswer = answers[questionId];
    setAnswers({
      ...answers,
      [questionId]: selectedAnswer,
    });

    if (previousAnswer && previousAnswer !== selectedAnswer) {
      addToast(`Answer changed to ${selectedAnswer}`, "info", 2000);
    } else if (!previousAnswer) {
      addToast(`Locked in: ${selectedAnswer}`, "success", 2000);
    }
  };
```

**Step 3: Verify**

Run: `npm run dev`
Open quiz, click "Yes" on a question — toast appears bottom-right saying "Locked in: Yes". Click "No" on the same question — toast says "Answer changed to No". Toast slides in from right and auto-dismisses after 2 seconds.

**Step 4: Commit**

```bash
git add src/components/quiz/QuizGame.jsx
git commit -m "feat: add answer lock-in confirmation toasts"
```

---

### Task 4: Optimistic UI for Answer Submission

**Why:** The "Submitting..." state feels sluggish. Mark the answer as saved immediately, sync in background, show toast on success/failure.

**Files:**
- Modify: `src/components/quiz/QuizGame.jsx`

**Step 1: Modify handleSubmit for optimistic flow**

The overlay from Task 2 already provides visual feedback. Now also add a success toast after the overlay closes:

In `handleSubmit`, after `setShowChecking(false)`:
```jsx
addToast("Predictions locked in!", "success", 3000);
```

And in the catch block, after `setShowChecking(false)`:
```jsx
addToast("Failed to submit. Please try again.", "error", 5000);
```

**Step 2: Remove the old inline success/error messages**

Remove the `submitError` state and the inline `{submitError && ...}` JSX block.
Remove the old green success `<div>` that says "Your answers have been submitted...".

Replace with a simpler inline note:
```jsx
{submitted && !showChecking && (
  <div className="alert alert-success" style={{ marginTop: '16px' }}>
    Predictions submitted. You can still edit until the quiz closes.
  </div>
)}
```

**Step 3: Verify**

Run: `npm run dev`
Submit answers — overlay shows, then success toast appears. If you disconnect network and submit, error toast should appear.

**Step 4: Commit**

```bash
git add src/components/quiz/QuizGame.jsx
git commit -m "feat: optimistic UI with toast feedback on submit"
```

---

### Task 5: Post-Quiz Answer Distribution

**Why:** After a quiz closes, show what % of players chose Yes vs No for each question. Drives engagement and sharing.

**Files:**
- Modify: `src/components/quiz/QuizGame.jsx`
- Modify: `src/styles/index.css` (add distribution bar styles)

**Step 1: Add distribution bar CSS**

Append to `src/styles/index.css`:

```css
/* Answer distribution bars */
.distribution-bar {
    display: flex;
    height: 28px;
    border-radius: 4px;
    overflow: hidden;
    margin-top: 8px;
    font-size: 12px;
    font-weight: 600;
}

.distribution-segment {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--wc-text);
    transition: width 0.6s ease-out;
    min-width: 0;
}

.distribution-segment-yes {
    background-color: var(--wc-red);
}

.distribution-segment-no {
    background-color: var(--wc-border);
}
```

**Step 2: Fetch answer distribution data in QuizGame.jsx**

After the quiz data is fetched and `quizClosed` is true, fetch all answers for this quiz to compute distribution.

Add a new state:
```jsx
const [distribution, setDistribution] = useState({});
```

Add a new useEffect after the quiz fetch effect:
```jsx
useEffect(() => {
    if (!currentQuiz || !quizClosed) return;

    const fetchDistribution = async () => {
      try {
        const answersQuery = query(
          collection(db, "quizAnswers"),
          where("quizId", "==", currentQuiz.id)
        );
        const snapshot = await getDocs(answersQuery);

        const dist = {};
        currentQuiz.questions.forEach((q) => {
          dist[q.id] = { Yes: 0, No: 0, total: 0 };
        });

        snapshot.forEach((answerDoc) => {
          const data = answerDoc.data();
          const userAnswers = data.answers || {};
          Object.entries(userAnswers).forEach(([qId, answer]) => {
            if (dist[qId] && (answer === "Yes" || answer === "No")) {
              dist[qId][answer]++;
              dist[qId].total++;
            }
          });
        });

        setDistribution(dist);
      } catch (err) {
        console.error("Error fetching distribution:", err);
      }
    };

    fetchDistribution();
  }, [currentQuiz, quizClosed]);
```

Add `where` and `query` to the Firestore imports at the top:
```jsx
import { doc, getDoc, collection, getDocs, query, where, limit, orderBy, setDoc, Timestamp } from "firebase/firestore";
```

**Step 3: Render distribution bars in the closed-quiz results view**

In the `quizClosed` section, after each question's correct answer display, add:

```jsx
{distribution[question.id] && distribution[question.id].total > 0 && (
  <div style={{ marginTop: '8px' }}>
    <div className="text-xs text-gray-500" style={{ marginBottom: '4px' }}>
      Community predictions ({distribution[question.id].total} votes)
    </div>
    <div className="distribution-bar">
      <div
        className="distribution-segment distribution-segment-yes"
        style={{
          width: `${Math.round((distribution[question.id].Yes / distribution[question.id].total) * 100)}%`,
        }}
      >
        {distribution[question.id].Yes > 0 &&
          `Yes ${Math.round((distribution[question.id].Yes / distribution[question.id].total) * 100)}%`}
      </div>
      <div
        className="distribution-segment distribution-segment-no"
        style={{
          width: `${Math.round((distribution[question.id].No / distribution[question.id].total) * 100)}%`,
        }}
      >
        {distribution[question.id].No > 0 &&
          `No ${Math.round((distribution[question.id].No / distribution[question.id].total) * 100)}%`}
      </div>
    </div>
  </div>
)}
```

**Step 4: Verify**

Run: `npm run dev`
Open a quiz that has closed and has answers from multiple users. Below each question you should see a red/gray bar showing the Yes/No split with percentages.

**Step 5: Commit**

```bash
git add src/components/quiz/QuizGame.jsx src/styles/index.css
git commit -m "feat: show answer distribution bars after quiz closes"
```

---

### Task 6: Fun Ranking Titles

**Why:** Personality. Top players get fun F1-themed titles on the leaderboard.

**Files:**
- Modify: `src/components/pages/Rankings.jsx`
- Modify: `src/styles/index.css` (add ranking title styles)

**Step 1: Add ranking title CSS**

Append to `src/styles/index.css`:

```css
/* Ranking titles */
.rank-title {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 2px 6px;
    border-radius: 3px;
    display: inline-block;
    margin-left: 8px;
}

.rank-title-1 {
    background-color: rgba(245, 158, 11, 0.2);
    color: var(--wc-gold);
}

.rank-title-2 {
    background-color: rgba(192, 192, 192, 0.15);
    color: #C0C0C0;
}

.rank-title-3 {
    background-color: rgba(205, 127, 50, 0.15);
    color: #CD7F32;
}

.rank-title-default {
    background-color: rgba(160, 160, 176, 0.1);
    color: var(--wc-text-secondary);
}
```

**Step 2: Add ranking title logic in Rankings.jsx**

Add this helper function inside the `Rankings` component, before the return:

```jsx
const getRankTitle = (rank, totalUsers) => {
    const titles = {
      1: { label: "Strategy Chief", className: "rank-title-1" },
      2: { label: "Pit Wall Genius", className: "rank-title-2" },
      3: { label: "Smooth Operator", className: "rank-title-3" },
    };

    if (titles[rank]) return titles[rank];

    if (rank === totalUsers && totalUsers > 3) {
      return { label: "Backmarker", className: "rank-title-default" };
    }

    if (rank <= Math.ceil(totalUsers * 0.25)) {
      return { label: "Points Finisher", className: "rank-title-default" };
    }

    return null;
  };
```

**Step 3: Render titles in the table**

In the user row, after the username cell:

Replace:
```jsx
<td className="border p-2 font-medium">{user.username}</td>
```

With:
```jsx
<td className="border p-2 font-medium">
  {user.username}
  {(() => {
    const title = getRankTitle(index + 1, users.length);
    return title ? (
      <span className={`rank-title ${title.className}`}>{title.label}</span>
    ) : null;
  })()}
</td>
```

**Step 4: Verify**

Run: `npm run dev`
Go to Rankings. First place should show gold "STRATEGY CHIEF" badge, second shows silver "PIT WALL GENIUS", third shows bronze "SMOOTH OPERATOR". Last place shows "BACKMARKER".

**Step 5: Commit**

```bash
git add src/components/pages/Rankings.jsx src/styles/index.css
git commit -m "feat: add fun ranking titles to leaderboard"
```

---

### Task 7: Head-to-Head Comparisons

**Why:** Social competition. Let users compare their prediction history against another player.

**Files:**
- Create: `src/components/pages/HeadToHead.jsx`
- Modify: `src/App.jsx` (add route)
- Modify: `src/components/layout/Header.jsx` (add nav link)
- Modify: `src/styles/index.css` (add h2h styles)

**Step 1: Add head-to-head CSS**

Append to `src/styles/index.css`:

```css
/* Head-to-head comparison */
.h2h-selector {
    display: flex;
    gap: 16px;
    margin-bottom: 24px;
    align-items: center;
    flex-wrap: wrap;
}

.h2h-selector select {
    padding: 10px 16px;
    border: 2px solid var(--wc-border);
    border-radius: 8px;
    background-color: var(--wc-bg);
    color: var(--wc-text);
    font-family: "Inter", sans-serif;
    font-size: 14px;
    flex: 1;
    min-width: 150px;
}

.h2h-vs {
    font-size: 20px;
    font-weight: 700;
    color: var(--wc-red);
    text-transform: uppercase;
}

.h2h-summary {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 16px;
    margin-bottom: 24px;
    text-align: center;
}

.h2h-player {
    padding: 16px;
    background-color: var(--wc-carbon);
    border-radius: 8px;
    border: 1px solid var(--wc-border);
}

.h2h-player-name {
    font-weight: 700;
    font-size: 18px;
    margin-bottom: 8px;
}

.h2h-stat {
    font-size: 32px;
    font-weight: 700;
    font-family: "JetBrains Mono", monospace;
}

.h2h-stat-label {
    font-size: 12px;
    color: var(--wc-text-secondary);
    text-transform: uppercase;
    margin-top: 4px;
}

.h2h-agreed {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

.h2h-quiz-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8px;
    padding: 12px;
    border-bottom: 1px solid var(--wc-border);
    align-items: center;
}

.h2h-quiz-row:last-child {
    border-bottom: none;
}

.h2h-answer {
    text-align: center;
    padding: 4px 8px;
    border-radius: 4px;
    font-weight: 600;
    font-size: 13px;
}

.h2h-answer-correct {
    background-color: rgba(34, 197, 94, 0.15);
    color: var(--wc-success);
}

.h2h-answer-wrong {
    background-color: rgba(239, 68, 68, 0.15);
    color: var(--wc-error);
}

.h2h-answer-na {
    color: var(--wc-text-secondary);
}
```

**Step 2: Create HeadToHead.jsx**

```jsx
import React, { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db, auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const HeadToHead = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [allAnswers, setAllAnswers] = useState([]);
  const [player1Id, setPlayer1Id] = useState("");
  const [player2Id, setPlayer2Id] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        navigate("/login");
      } else {
        setUser(currentUser);
        setPlayer1Id(currentUser.uid);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        const usersSnapshot = await getDocs(collection(db, "users"));
        const usersList = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAllUsers(usersList);

        const quizzesSnapshot = await getDocs(
          query(collection(db, "quizzes"), orderBy("createdAt", "desc"))
        );
        const quizList = quizzesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setQuizzes(quizList);

        const answersSnapshot = await getDocs(collection(db, "quizAnswers"));
        const answersList = answersSnapshot.docs.map((doc) => doc.data());
        setAllAnswers(answersList);

        setLoading(false);
      } catch (err) {
        console.error("Error fetching h2h data:", err);
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const getComparison = () => {
    if (!player1Id || !player2Id) return null;

    const p1Name =
      allUsers.find((u) => u.id === player1Id)?.username || "Player 1";
    const p2Name =
      allUsers.find((u) => u.id === player2Id)?.username || "Player 2";

    let p1Total = 0;
    let p2Total = 0;
    let agreed = 0;
    let totalQuestions = 0;

    const quizComparisons = quizzes
      .filter((quiz) => {
        const p1Answer = allAnswers.find(
          (a) => a.userId === player1Id && a.quizId === quiz.id
        );
        const p2Answer = allAnswers.find(
          (a) => a.userId === player2Id && a.quizId === quiz.id
        );
        return p1Answer && p2Answer;
      })
      .map((quiz) => {
        const p1Answer = allAnswers.find(
          (a) => a.userId === player1Id && a.quizId === quiz.id
        );
        const p2Answer = allAnswers.find(
          (a) => a.userId === player2Id && a.quizId === quiz.id
        );

        const p1Score = p1Answer?.score ?? 0;
        const p2Score = p2Answer?.score ?? 0;
        p1Total += p1Score;
        p2Total += p2Score;

        const questions = quiz.questions || [];
        const questionDetails = questions.map((q, i) => {
          const qId = `q${i + 1}`;
          const p1Ans = p1Answer?.answers?.[qId];
          const p2Ans = p2Answer?.answers?.[qId];
          const correct = q.correctAnswer;

          if (p1Ans && p2Ans) {
            totalQuestions++;
            if (p1Ans === p2Ans) agreed++;
          }

          return {
            text: q.text,
            p1Ans,
            p2Ans,
            correct,
          };
        });

        return {
          title: quiz.title,
          p1Score,
          p2Score,
          questions: questionDetails,
        };
      });

    return {
      p1Name,
      p2Name,
      p1Total,
      p2Total,
      agreed,
      totalQuestions,
      quizComparisons,
    };
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  const comparison = getComparison();

  return (
    <div className="card">
      <h1 className="card-title">Head to Head</h1>

      <div className="h2h-selector">
        <select
          value={player1Id}
          onChange={(e) => setPlayer1Id(e.target.value)}
        >
          <option value="">Select player</option>
          {allUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.username}{u.id === user?.uid ? " (you)" : ""}
            </option>
          ))}
        </select>

        <span className="h2h-vs">VS</span>

        <select
          value={player2Id}
          onChange={(e) => setPlayer2Id(e.target.value)}
        >
          <option value="">Select opponent</option>
          {allUsers
            .filter((u) => u.id !== player1Id)
            .map((u) => (
              <option key={u.id} value={u.id}>
                {u.username}
              </option>
            ))}
        </select>
      </div>

      {comparison && comparison.quizComparisons.length > 0 ? (
        <>
          <div className="h2h-summary">
            <div className="h2h-player">
              <div className="h2h-player-name">{comparison.p1Name}</div>
              <div className="h2h-stat" style={{ color: "var(--wc-red)" }}>
                {comparison.p1Total}
              </div>
              <div className="h2h-stat-label">Total Points</div>
            </div>

            <div className="h2h-agreed">
              <div className="h2h-stat" style={{ color: "var(--wc-gold)" }}>
                {comparison.totalQuestions > 0
                  ? `${comparison.agreed}/${comparison.totalQuestions}`
                  : "-"}
              </div>
              <div className="h2h-stat-label">Agreed</div>
            </div>

            <div className="h2h-player">
              <div className="h2h-player-name">{comparison.p2Name}</div>
              <div className="h2h-stat" style={{ color: "var(--wc-red)" }}>
                {comparison.p2Total}
              </div>
              <div className="h2h-stat-label">Total Points</div>
            </div>
          </div>

          {comparison.quizComparisons.map((quiz, qi) => (
            <div key={qi} className="question-container" style={{ marginBottom: "16px" }}>
              <div className="question-text" style={{ marginBottom: "12px" }}>
                {quiz.title}
              </div>
              <div
                className="h2h-quiz-row"
                style={{
                  borderBottom: "2px solid var(--wc-border)",
                  fontWeight: 700,
                  fontSize: "12px",
                  color: "var(--wc-text-secondary)",
                  textTransform: "uppercase",
                }}
              >
                <div style={{ textAlign: "center" }}>{comparison.p1Name}</div>
                <div style={{ textAlign: "center" }}>Question</div>
                <div style={{ textAlign: "center" }}>{comparison.p2Name}</div>
              </div>
              {quiz.questions.map((q, i) => (
                <div key={i} className="h2h-quiz-row">
                  <div
                    className={`h2h-answer ${
                      !q.p1Ans
                        ? "h2h-answer-na"
                        : q.correct && q.p1Ans === q.correct
                        ? "h2h-answer-correct"
                        : q.correct
                        ? "h2h-answer-wrong"
                        : ""
                    }`}
                  >
                    {q.p1Ans || "-"}
                  </div>
                  <div className="text-sm" style={{ textAlign: "center" }}>
                    {q.text}
                  </div>
                  <div
                    className={`h2h-answer ${
                      !q.p2Ans
                        ? "h2h-answer-na"
                        : q.correct && q.p2Ans === q.correct
                        ? "h2h-answer-correct"
                        : q.correct
                        ? "h2h-answer-wrong"
                        : ""
                    }`}
                  >
                    {q.p2Ans || "-"}
                  </div>
                </div>
              ))}
              <div
                className="h2h-quiz-row"
                style={{ fontWeight: 700, borderTop: "2px solid var(--wc-border)" }}
              >
                <div style={{ textAlign: "center", color: "var(--wc-red)" }}>
                  {quiz.p1Score}
                </div>
                <div
                  style={{
                    textAlign: "center",
                    color: "var(--wc-text-secondary)",
                    fontSize: "12px",
                  }}
                >
                  Score
                </div>
                <div style={{ textAlign: "center", color: "var(--wc-red)" }}>
                  {quiz.p2Score}
                </div>
              </div>
            </div>
          ))}
        </>
      ) : comparison ? (
        <p className="text-gray-500">
          No shared quizzes found between these players.
        </p>
      ) : (
        <p className="text-gray-500">Select two players to compare.</p>
      )}
    </div>
  );
};

export default HeadToHead;
```

**Step 3: Add route to App.jsx**

Import:
```jsx
import HeadToHead from "./components/pages/HeadToHead";
```

Add route alongside existing routes:
```jsx
<Route path="/head-to-head" element={<HeadToHead />} />
```

**Step 4: Add nav link to Header.jsx**

Add after the Rankings link:
```jsx
<Link to="/head-to-head" className={`nav-link ${location.pathname === '/head-to-head' ? 'active' : ''}`}>
  H2H
</Link>
```

**Step 5: Verify**

Run: `npm run dev`
Click "H2H" in nav. Select yourself and another player. Should see a side-by-side comparison with total points, agreement count, and per-quiz answer breakdowns with green/red highlighting for correct/wrong.

**Step 6: Commit**

```bash
git add src/components/pages/HeadToHead.jsx src/App.jsx src/components/layout/Header.jsx src/styles/index.css
git commit -m "feat: add head-to-head player comparison page"
```

---

### Task 8: Season Progress Visualization

**Why:** Users want to see their score trajectory across the season.

**Files:**
- Create: `src/components/pages/Dashboard.jsx`
- Modify: `src/App.jsx` (add route)
- Modify: `src/components/layout/Header.jsx` (add nav link)
- Modify: `src/styles/index.css` (add sparkline/dashboard styles)

**Step 1: Add dashboard CSS**

Append to `src/styles/index.css`:

```css
/* Dashboard / Season progress */
.dashboard-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 24px;
}

@media (max-width: 640px) {
    .dashboard-stats {
        grid-template-columns: 1fr;
    }
}

.stat-card {
    background-color: var(--wc-carbon);
    border: 1px solid var(--wc-border);
    border-radius: 8px;
    padding: 16px;
    text-align: center;
}

.stat-value {
    font-size: 32px;
    font-weight: 700;
    font-family: "JetBrains Mono", monospace;
    color: var(--wc-red);
}

.stat-label {
    font-size: 12px;
    color: var(--wc-text-secondary);
    text-transform: uppercase;
    margin-top: 4px;
}

/* CSS-only sparkline bar chart */
.sparkline {
    display: flex;
    align-items: flex-end;
    gap: 4px;
    height: 120px;
    padding: 8px 0;
}

.sparkline-bar {
    flex: 1;
    background-color: var(--wc-red);
    border-radius: 2px 2px 0 0;
    min-height: 4px;
    position: relative;
    transition: height 0.4s ease-out;
}

.sparkline-bar:hover {
    background-color: var(--wc-gold);
}

.sparkline-bar-label {
    position: absolute;
    bottom: -20px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 10px;
    color: var(--wc-text-secondary);
    white-space: nowrap;
}

.sparkline-bar-value {
    position: absolute;
    top: -18px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 11px;
    font-weight: 700;
    color: var(--wc-text);
}

/* Quiz history list */
.history-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid var(--wc-border);
}

.history-item:last-child {
    border-bottom: none;
}

.history-score {
    font-family: "JetBrains Mono", monospace;
    font-weight: 700;
    color: var(--wc-red);
}
```

**Step 2: Create Dashboard.jsx**

```jsx
import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db, auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPoints: 0,
    quizzesPlayed: 0,
    accuracy: 0,
    quizScores: [],
  });
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        navigate("/login");
      } else {
        setUser(currentUser);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      try {
        setLoading(true);

        const answersSnapshot = await getDocs(
          query(
            collection(db, "quizAnswers"),
            where("userId", "==", user.uid)
          )
        );

        let totalPoints = 0;
        let totalCorrect = 0;
        let totalQuestions = 0;
        const quizScores = [];

        answersSnapshot.forEach((doc) => {
          const data = doc.data();
          const score = data.score ?? 0;
          const total = data.totalQuestions ?? 0;

          totalPoints += score;
          totalCorrect += score;
          totalQuestions += total;

          quizScores.push({
            quizTitle: data.quizTitle || "Untitled",
            score,
            total,
            submittedAt: data.submittedAt?.toDate?.() || new Date(),
          });
        });

        quizScores.sort((a, b) => a.submittedAt - b.submittedAt);

        setStats({
          totalPoints,
          quizzesPlayed: quizScores.length,
          accuracy:
            totalQuestions > 0
              ? Math.round((totalCorrect / totalQuestions) * 100)
              : 0,
          quizScores,
        });

        setLoading(false);
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  const maxScore = Math.max(
    ...stats.quizScores.map((q) => q.total),
    1
  );

  return (
    <div className="card">
      <h1 className="card-title">Your Dashboard</h1>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-value">{stats.totalPoints}</div>
          <div className="stat-label">Total Points</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.quizzesPlayed}</div>
          <div className="stat-label">Quizzes Played</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.accuracy}%</div>
          <div className="stat-label">Accuracy</div>
        </div>
      </div>

      {stats.quizScores.length > 0 && (
        <>
          <h2
            className="font-bold mb-4"
            style={{ fontSize: "16px", textTransform: "uppercase" }}
          >
            Season Progress
          </h2>
          <div className="sparkline" style={{ marginBottom: "32px" }}>
            {stats.quizScores.map((q, i) => (
              <div
                key={i}
                className="sparkline-bar"
                style={{
                  height: `${(q.score / maxScore) * 100}%`,
                }}
                title={`${q.quizTitle}: ${q.score}/${q.total}`}
              >
                <div className="sparkline-bar-value">{q.score}</div>
                <div className="sparkline-bar-label">
                  {q.quizTitle.length > 8
                    ? q.quizTitle.slice(0, 8) + "..."
                    : q.quizTitle}
                </div>
              </div>
            ))}
          </div>

          <h2
            className="font-bold mb-4"
            style={{
              fontSize: "16px",
              textTransform: "uppercase",
              marginTop: "16px",
            }}
          >
            Quiz History
          </h2>
          {stats.quizScores
            .slice()
            .reverse()
            .map((q, i) => (
              <div key={i} className="history-item">
                <div>
                  <div className="font-medium">{q.quizTitle}</div>
                  <div className="text-xs text-gray-500">
                    {q.submittedAt.toLocaleDateString()}
                  </div>
                </div>
                <div className="history-score">
                  {q.score}/{q.total}
                </div>
              </div>
            ))}
        </>
      )}

      {stats.quizScores.length === 0 && (
        <p className="text-gray-500">
          No quiz results yet. Play your first quiz to see your stats!
        </p>
      )}
    </div>
  );
};

export default Dashboard;
```

**Step 3: Add route to App.jsx**

Import:
```jsx
import Dashboard from "./components/pages/Dashboard";
```

Add route:
```jsx
<Route path="/dashboard" element={<Dashboard />} />
```

**Step 4: Add nav link to Header.jsx**

Add after the "Play" link:
```jsx
<Link to="/dashboard" className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>
  Dashboard
</Link>
```

**Step 5: Verify**

Run: `npm run dev`
Click "Dashboard" in nav. Should see three stat cards (Total Points, Quizzes Played, Accuracy %) and a bar chart showing score per quiz, plus a history list below.

**Step 6: Commit**

```bash
git add src/components/pages/Dashboard.jsx src/App.jsx src/components/layout/Header.jsx src/styles/index.css
git commit -m "feat: add user dashboard with season progress chart"
```

---

### Task 9: F1 Calendar Integration

**Why:** Show upcoming race weekends and tie quizzes to the F1 calendar. Countdown creates anticipation.

**Files:**
- Create: `src/data/f1-calendar-2026.js`
- Modify: `src/components/quiz/QuizGame.jsx` (show next race banner)
- Modify: `src/styles/index.css` (next race banner styles)

**Step 1: Create F1 2026 calendar data**

Create `src/data/f1-calendar-2026.js`:

```js
// 2026 F1 Calendar (dates are approximate — update when official calendar is confirmed)
const f1Calendar2026 = [
  { round: 1, name: "Australian Grand Prix", location: "Melbourne", date: "2026-03-15" },
  { round: 2, name: "Chinese Grand Prix", location: "Shanghai", date: "2026-03-29" },
  { round: 3, name: "Japanese Grand Prix", location: "Suzuka", date: "2026-04-05" },
  { round: 4, name: "Bahrain Grand Prix", location: "Sakhir", date: "2026-04-19" },
  { round: 5, name: "Saudi Arabian Grand Prix", location: "Jeddah", date: "2026-05-03" },
  { round: 6, name: "Miami Grand Prix", location: "Miami", date: "2026-05-17" },
  { round: 7, name: "Emilia Romagna Grand Prix", location: "Imola", date: "2026-05-31" },
  { round: 8, name: "Monaco Grand Prix", location: "Monte Carlo", date: "2026-06-07" },
  { round: 9, name: "Spanish Grand Prix", location: "Barcelona", date: "2026-06-21" },
  { round: 10, name: "Canadian Grand Prix", location: "Montreal", date: "2026-06-28" },
  { round: 11, name: "Austrian Grand Prix", location: "Spielberg", date: "2026-07-12" },
  { round: 12, name: "British Grand Prix", location: "Silverstone", date: "2026-07-19" },
  { round: 13, name: "Belgian Grand Prix", location: "Spa", date: "2026-08-02" },
  { round: 14, name: "Hungarian Grand Prix", location: "Budapest", date: "2026-08-09" },
  { round: 15, name: "Dutch Grand Prix", location: "Zandvoort", date: "2026-08-30" },
  { round: 16, name: "Italian Grand Prix", location: "Monza", date: "2026-09-06" },
  { round: 17, name: "Azerbaijan Grand Prix", location: "Baku", date: "2026-09-20" },
  { round: 18, name: "Singapore Grand Prix", location: "Marina Bay", date: "2026-10-04" },
  { round: 19, name: "United States Grand Prix", location: "Austin", date: "2026-10-18" },
  { round: 20, name: "Mexico City Grand Prix", location: "Mexico City", date: "2026-10-25" },
  { round: 21, name: "Brazilian Grand Prix", location: "Sao Paulo", date: "2026-11-08" },
  { round: 22, name: "Las Vegas Grand Prix", location: "Las Vegas", date: "2026-11-22" },
  { round: 23, name: "Qatar Grand Prix", location: "Lusail", date: "2026-11-29" },
  { round: 24, name: "Abu Dhabi Grand Prix", location: "Yas Marina", date: "2026-12-06" },
];

export const getNextRace = () => {
  const now = new Date();
  return f1Calendar2026.find((race) => new Date(race.date) > now) || null;
};

export const getDaysUntil = (dateStr) => {
  const now = new Date();
  const target = new Date(dateStr);
  const diff = target - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export default f1Calendar2026;
```

**Step 2: Add next-race banner CSS**

Append to `src/styles/index.css`:

```css
/* Next race banner */
.next-race-banner {
    background: linear-gradient(135deg, var(--wc-carbon) 0%, var(--wc-surface) 100%);
    border: 1px solid var(--wc-border);
    border-left: 4px solid var(--wc-red);
    border-radius: 8px;
    padding: 16px 20px;
    margin-bottom: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.next-race-info {
    display: flex;
    flex-direction: column;
}

.next-race-label {
    font-size: 11px;
    text-transform: uppercase;
    color: var(--wc-text-secondary);
    letter-spacing: 1px;
}

.next-race-name {
    font-size: 18px;
    font-weight: 700;
    margin-top: 2px;
}

.next-race-location {
    font-size: 13px;
    color: var(--wc-text-secondary);
    margin-top: 2px;
}

.next-race-countdown {
    font-family: "JetBrains Mono", monospace;
    font-size: 24px;
    font-weight: 700;
    color: var(--wc-gold);
}

.next-race-countdown-label {
    font-size: 11px;
    color: var(--wc-text-secondary);
    text-align: right;
}
```

**Step 3: Show banner in QuizGame.jsx**

Import at top of QuizGame.jsx:
```jsx
import { getNextRace, getDaysUntil } from "../../data/f1-calendar-2026";
```

Add inside the component, before the quiz content return:
```jsx
const nextRace = getNextRace();
```

In the JSX, right after the opening `<div className="card">` and before the quiz title section, add:
```jsx
{nextRace && (
  <div className="next-race-banner">
    <div className="next-race-info">
      <span className="next-race-label">Next Race Weekend</span>
      <span className="next-race-name">{nextRace.name}</span>
      <span className="next-race-location">{nextRace.location}</span>
    </div>
    <div style={{ textAlign: "right" }}>
      <div className="next-race-countdown">
        {getDaysUntil(nextRace.date)}
      </div>
      <div className="next-race-countdown-label">days away</div>
    </div>
  </div>
)}
```

**Step 4: Verify**

Run: `npm run dev`
Open the quiz page. Above the quiz, you should see a banner showing the next upcoming F1 race with a countdown in days.

**Step 5: Commit**

```bash
git add src/data/f1-calendar-2026.js src/components/quiz/QuizGame.jsx src/styles/index.css
git commit -m "feat: add F1 calendar integration with next-race banner"
```

---

### Task 10: Firestore Real-Time Listeners

**Why:** Replace one-time `getDocs` with `onSnapshot` for the leaderboard and quiz game so data updates live.

**Files:**
- Modify: `src/components/pages/Rankings.jsx` (switch to onSnapshot)
- Modify: `src/components/quiz/QuizGame.jsx` (switch quiz fetch to onSnapshot)

**Step 1: Convert Rankings.jsx to use onSnapshot**

Replace the `getDocs` import with `onSnapshot`:
```jsx
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
```

Replace the `fetchRankings` useEffect with a real-time listener:

```jsx
useEffect(() => {
    if (!user) return;

    setLoading(true);
    setError(null);

    // Listen to quizzes
    const quizzesQuery = query(collection(db, "quizzes"), orderBy("createdAt", "desc"));
    const answersQuery = query(collection(db, "quizAnswers"));

    let quizzes = [];
    let answersData = [];

    const processData = () => {
      const userMap = new Map();
      const scoreMap = new Map();
      const submissionMap = new Map();
      const totalScoreMap = new Map();

      answersData.forEach((answerData) => {
        const userId = answerData.userId;
        const quizId = answerData.quizId;
        const username = answerData.username || "Unknown";
        const hasScore = answerData.score !== undefined;
        const score = hasScore ? answerData.score : 0;

        if (!userMap.has(userId)) {
          userMap.set(userId, { id: userId, username });
        }

        const key = `${userId}_${quizId}`;
        submissionMap.set(key, true);

        if (hasScore) {
          scoreMap.set(key, score);
          const currentTotal = totalScoreMap.get(userId) || 0;
          totalScoreMap.set(userId, currentTotal + score);
        }
      });

      const users = Array.from(userMap.values()).sort((a, b) => {
        const totalA = totalScoreMap.get(a.id) || 0;
        const totalB = totalScoreMap.get(b.id) || 0;
        return totalB - totalA;
      });

      const scores = {};
      scoreMap.forEach((score, key) => { scores[key] = score; });

      const submissions = {};
      submissionMap.forEach((value, key) => { submissions[key] = value; });

      const totalScores = {};
      totalScoreMap.forEach((score, userId) => { totalScores[userId] = score; });

      setRankingsData({ users, quizzes, scores, submissions, totalScores });
      setLoading(false);
    };

    const unsubQuizzes = onSnapshot(quizzesQuery, (snapshot) => {
      quizzes = snapshot.docs.map((doc) => ({
        id: doc.id,
        title: doc.data().title,
        ...doc.data(),
      }));
      processData();
    });

    const unsubAnswers = onSnapshot(answersQuery, (snapshot) => {
      answersData = snapshot.docs.map((doc) => doc.data());
      processData();
    });

    return () => {
      unsubQuizzes();
      unsubAnswers();
    };
  }, [user]);
```

Remove `getDocs` from the import if no longer used. Keep `doc` and `getDoc` since the auth effect still uses them.

**Step 2: Verify Rankings**

Run: `npm run dev`
Open Rankings in two browser tabs. In one tab, go to admin and set answers on a quiz. The Rankings tab should update automatically without refreshing.

**Step 3: Commit**

```bash
git add src/components/pages/Rankings.jsx
git commit -m "feat: switch leaderboard to real-time Firestore listeners"
```

---

### Task 11: Push Notification Opt-In (After First Quiz)

**Why:** Contextual opt-in after the user's first quiz completion converts better than on-load prompts.

**Files:**
- Modify: `src/components/quiz/QuizGame.jsx` (show opt-in prompt after first submit)
- Modify: `src/styles/index.css` (notification prompt styles)

**Note:** Full push notification delivery requires Firebase Cloud Messaging setup (service worker, VAPID key, Cloud Functions). This task implements just the **opt-in UI prompt** and stores the preference in Firestore. The actual notification delivery pipeline is a separate infrastructure task.

**Step 1: Add notification prompt CSS**

Append to `src/styles/index.css`:

```css
/* Notification opt-in prompt */
.notif-prompt {
    background: linear-gradient(135deg, var(--wc-carbon) 0%, var(--wc-surface) 100%);
    border: 1px solid var(--wc-gold);
    border-radius: 8px;
    padding: 20px;
    margin-top: 20px;
    text-align: center;
}

.notif-prompt-title {
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 8px;
}

.notif-prompt-text {
    font-size: 14px;
    color: var(--wc-text-secondary);
    margin-bottom: 16px;
}

.notif-prompt-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
}
```

**Step 2: Add opt-in logic to QuizGame.jsx**

Add a new state:
```jsx
const [showNotifPrompt, setShowNotifPrompt] = useState(false);
```

Import `updateDoc`:
```jsx
import { doc, getDoc, collection, getDocs, query, where, limit, orderBy, setDoc, updateDoc, Timestamp } from "firebase/firestore";
```

After the submit success (inside `handleSubmit`, after `setSubmitted(true)` and `setShowChecking(false)`), add:

```jsx
// Check if this is the user's first quiz — show notification opt-in
try {
  const userAnswersQuery = query(
    collection(db, "quizAnswers"),
    where("userId", "==", user.uid)
  );
  const userAnswersSnapshot = await getDocs(userAnswersQuery);
  if (userAnswersSnapshot.size <= 1) {
    setShowNotifPrompt(true);
  }
} catch (e) {
  // Silently ignore — non-critical
}
```

Add opt-in handlers:
```jsx
const handleNotifOptIn = async () => {
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { notificationOptIn: true });
      addToast("You'll be notified about new quizzes!", "success");
    } catch (e) {
      console.error("Error saving notification preference:", e);
    }
    setShowNotifPrompt(false);
  };

  const handleNotifDismiss = () => {
    setShowNotifPrompt(false);
  };
```

Render the prompt in the JSX, after the submit button area (inside the `!quizClosed` block):
```jsx
{showNotifPrompt && (
  <div className="notif-prompt">
    <div className="notif-prompt-title">
      Want to know when results are in?
    </div>
    <div className="notif-prompt-text">
      Get notified when new quizzes drop and when your scores are ready.
    </div>
    <div className="notif-prompt-actions">
      <button className="btn btn-accent" onClick={handleNotifOptIn}>
        Yes, notify me
      </button>
      <button className="btn btn-secondary" onClick={handleNotifDismiss}>
        Not now
      </button>
    </div>
  </div>
)}
```

**Step 3: Verify**

Run: `npm run dev`
As a user with no previous quiz submissions, submit a quiz. After the "We are checking..." overlay, a gold-bordered prompt should appear asking about notifications. Clicking "Yes" should store `notificationOptIn: true` in the user's Firestore document and show a success toast.

**Step 4: Commit**

```bash
git add src/components/quiz/QuizGame.jsx src/styles/index.css
git commit -m "feat: add contextual notification opt-in after first quiz"
```

---

### Task 12: "Remind Me" Button for Open Quizzes

**Why:** If a user visits but doesn't answer, offer a reminder.

**Files:**
- Modify: `src/components/quiz/QuizGame.jsx`

**Note:** Like Task 11, this stores the reminder preference. Actual delivery requires Cloud Functions with a scheduled trigger — that's a separate infrastructure task.

**Step 1: Add remind-me logic**

Add state:
```jsx
const [reminderSet, setReminderSet] = useState(false);
```

Add handler:
```jsx
const handleRemindMe = async () => {
    try {
      const reminderDocId = `${user.uid}_${currentQuiz.id}`;
      await setDoc(doc(db, "reminders", reminderDocId), {
        userId: user.uid,
        quizId: currentQuiz.id,
        quizTitle: currentQuiz.title,
        remindAt: new Date(currentQuiz.timeLimit.getTime() - 2 * 60 * 60 * 1000),
        createdAt: Timestamp.now(),
      });
      setReminderSet(true);
      addToast("Reminder set! We'll nudge you before it closes.", "success");
    } catch (e) {
      console.error("Error setting reminder:", e);
      addToast("Couldn't set reminder. Try again.", "error");
    }
  };
```

**Step 2: Render button**

In the quiz JSX, inside the `!quizClosed` block, after the submit button and before the notification prompt, add:

```jsx
{!submitted && !reminderSet && (
  <button
    onClick={handleRemindMe}
    className="btn btn-secondary btn-block"
    style={{ marginTop: '12px' }}
  >
    Remind me before it closes
  </button>
)}

{reminderSet && (
  <div className="alert alert-success" style={{ marginTop: '12px' }}>
    Reminder set for 2 hours before deadline.
  </div>
)}
```

**Step 3: Verify**

Run: `npm run dev`
Open an active quiz without answering. Below the submit button, there should be a "Remind me before it closes" button. Clicking it should show a success toast and replace the button with a confirmation message. Check Firestore — a document should appear in the `reminders` collection.

**Step 4: Commit**

```bash
git add src/components/quiz/QuizGame.jsx
git commit -m "feat: add 'remind me' button for open quizzes"
```

---

### Task 13: Score Calculation Cloud Function

**Why:** Moving score calculation server-side prevents any admin client from writing arbitrary scores.

**Files:**
- Create: `functions/index.js`
- Create: `functions/package.json`
- Modify: `src/components/quiz/QuizAdmin.jsx` (remove client-side score calculation, just update quiz answers)

**Note:** This requires Firebase CLI and Cloud Functions setup. If not already initialized, run `firebase init functions` first.

**Step 1: Initialize Cloud Functions (if needed)**

Run:
```bash
cd /home/ubuntu/oleks-f1-quiz && ls functions/ 2>/dev/null || echo "Functions not initialized"
```

If not initialized:
```bash
firebase init functions
# Select JavaScript, install dependencies
```

**Step 2: Create the Cloud Function**

Write `functions/index.js`:

```js
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { getFirestore } = require("firebase-admin/firestore");
const { initializeApp } = require("firebase-admin/app");

initializeApp();
const db = getFirestore();

// When quiz questions are updated (answers set), recalculate all scores
exports.calculateScores = onDocumentWritten("quizzes/{quizId}", async (event) => {
  const after = event.data?.after?.data();
  if (!after) return; // Document deleted

  const quizId = event.params.quizId;
  const questions = after.questions || [];

  // Check if correct answers are set
  const hasAnswers = questions.some(
    (q) => q.correctAnswer !== null && q.correctAnswer !== undefined && q.correctAnswer !== ""
  );

  if (!hasAnswers) return;

  // Get all user submissions for this quiz
  const answersSnapshot = await db
    .collection("quizAnswers")
    .where("quizId", "==", quizId)
    .get();

  const batch = db.batch();

  answersSnapshot.forEach((answerDoc) => {
    const userData = answerDoc.data();
    const userAnswers = userData.answers || {};
    let score = 0;

    questions.forEach((question, index) => {
      const questionId = `q${index + 1}`;
      if (
        userAnswers[questionId] &&
        question.correctAnswer &&
        userAnswers[questionId] === question.correctAnswer
      ) {
        score += 1;
      }
    });

    batch.update(answerDoc.ref, {
      score,
      totalQuestions: questions.length,
    });
  });

  await batch.commit();
  console.log(
    `Calculated scores for ${answersSnapshot.size} submissions on quiz ${quizId}`
  );
});
```

**Step 3: Update functions/package.json**

Ensure it has:
```json
{
  "name": "we-checking-functions",
  "engines": { "node": "18" },
  "main": "index.js",
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^5.0.0"
  }
}
```

**Step 4: Simplify QuizAdmin.jsx**

In `handleSetAnswers`, remove all the client-side score calculation logic. Replace with just updating the quiz document (the Cloud Function will handle scoring):

```jsx
const handleSetAnswers = async (quizId, updatedQuestions) => {
    try {
      const quizRef = doc(db, "quizzes", quizId);
      await updateDoc(quizRef, { questions: updatedQuestions });

      // Refresh quiz list
      const querySnapshot = await getDocs(collection(db, "quizzes"));
      const updatedQuizzes = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        const hasAnswers = data.questions &&
          data.questions.some(q => q.correctAnswer !== null && q.correctAnswer !== undefined && q.correctAnswer !== "");
        return {
          id: doc.id,
          ...data,
          endTime: data.endTime instanceof Timestamp ? data.endTime.toDate() : new Date(data.endTime),
          questionCount: data.questions ? data.questions.length : 0,
          hasAnswers: hasAnswers
        };
      });

      setQuizzes(updatedQuizzes);
      setShowAnswersForm(false);
      setSelectedQuiz(null);

      alert("Answers saved! Scores will be calculated automatically.");
    } catch (error) {
      console.error("Error updating quiz answers:", error);
      alert("Failed to update answers. Please try again.");
    }
  };
```

Remove the `where` import from Firestore imports in QuizAdmin.jsx since it's no longer used there.

**Step 5: Deploy the function**

```bash
cd /home/ubuntu/oleks-f1-quiz && firebase deploy --only functions
```

**Step 6: Verify**

In the admin panel, set answers on a quiz. Check Firestore — the `quizAnswers` documents should have their `score` and `totalQuestions` fields updated automatically by the Cloud Function (check the Cloud Functions logs in Firebase Console).

**Step 7: Commit**

```bash
git add functions/ src/components/quiz/QuizAdmin.jsx
git commit -m "feat: move score calculation to Cloud Function"
```

---

## Execution Order Summary

| Task | Feature | Dependencies |
|------|---------|-------------|
| 1 | Toast system | None |
| 2 | "We are checking..." overlay | None |
| 3 | Answer lock-in toasts | Task 1 |
| 4 | Optimistic UI | Tasks 1, 2 |
| 5 | Answer distribution bars | None |
| 6 | Fun ranking titles | None |
| 7 | Head-to-head comparisons | None |
| 8 | Dashboard + season progress | None |
| 9 | F1 calendar banner | None |
| 10 | Real-time listeners | None |
| 11 | Notification opt-in UI | Task 1 |
| 12 | "Remind me" button | Tasks 1, 2 |
| 13 | Cloud Function scoring | None |

**Parallelizable groups:**
- Tasks 1+2 (then 3+4 depend on them)
- Tasks 5, 6, 7, 8, 9, 10, 13 are all independent
- Tasks 11, 12 depend on Task 1
