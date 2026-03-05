import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  limit,
  orderBy,
  setDoc,
  updateDoc,
  where,
  Timestamp,
} from "firebase/firestore";
import { db, auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import CheckingOverlay from "../ui/CheckingOverlay";
import ShareCard from "../ui/ShareCard";
import Skeleton from "../ui/Skeleton";
import { useToast } from "../ui/Toast";
import { getNextRace, getDaysUntil } from "../../data/f1-calendar-2026";

const QuizGame = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const submittedRef = useRef(false);
  const [score, setScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState("");
  const [quizClosed, setQuizClosed] = useState(false);
  const [showChecking, setShowChecking] = useState(false);
  const [distribution, setDistribution] = useState({});
  const [showNotifPrompt, setShowNotifPrompt] = useState(false);
  const [reminderSet, setReminderSet] = useState(false);
  const addToast = useToast();
  const nextRace = getNextRace();
  // Handle answer selection
  const handleAnswerSelect = (questionId, selectedAnswer) => {
    const previousAnswer = answers[questionId];
    setAnswers({
      ...answers,
      [questionId]: selectedAnswer,
    });

    if (previousAnswer && previousAnswer !== selectedAnswer) {
      addToast(`Understood, changing to ${selectedAnswer}`, "info", 2000);
    } else if (!previousAnswer) {
      addToast(`Copy. ${selectedAnswer}.`, "success", 2000);
    }
  };

  // Check for authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        navigate("/login");
      } else {
        try {
          const userProfileRef = doc(db, "users", currentUser.uid);
          const profileSnap = await getDoc(userProfileRef);

          if (profileSnap.exists()) {
            setUserProfile(profileSnap.data());
          }
        } catch (err) {
          console.error("Error fetching user profile:", err);
        }
      }

      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  // Fetch quiz data
  useEffect(() => {
    const fetchQuiz = async () => {
      if (authLoading || !user) return;

      try {
        setLoading(true);
        let quizDoc;

        if (id) {
          quizDoc = await getDoc(doc(db, "quizzes", id));

          if (!quizDoc.exists()) {
            setError("Quiz not found");
            setLoading(false);
            return;
          }
        } else {
          const querySnapshot = await getDocs(
            query(
              collection(db, "quizzes"),
              orderBy("createdAt", "desc"),
              limit(1)
            )
          );

          if (querySnapshot.empty) {
            setError("No quizzes found");
            setLoading(false);
            return;
          }

          quizDoc = querySnapshot.docs[0];
        }

        const quizData = quizDoc.data();

        const endTime =
          quizData.endTime instanceof Date
            ? quizData.endTime
            : quizData.endTime.toDate();

        const now = new Date();
        const quizEnded = now >= endTime;

        if (quizEnded) {
          setQuizClosed(true);
          setTimeRemaining("Chequered flag");
        }

        if (user) {
          try {
            const userAnswersRef = doc(
              db,
              "quizAnswers",
              `${user.uid}_${quizDoc.id}`,
            );
            const userAnswersSnap = await getDoc(userAnswersRef);

            if (userAnswersSnap.exists()) {
              const userAnswersData = userAnswersSnap.data();
              setAnswers(userAnswersData.answers || {});
              if (userAnswersData.score !== undefined) {
                setScore(userAnswersData.score);
              }
              setSubmitted(true);
              submittedRef.current = true;
            }
          } catch (err) {
            console.error("Error checking existing answers:", err);
          }
        }

        setCurrentQuiz({
          id: quizDoc.id,
          title: quizData.title,
          timeLimit: endTime,
          questions: quizData.questions.map((q, index) => ({
            id: `q${index + 1}`,
            text: q.text,
            options: q.options,
            correctAnswer: quizEnded ? q.correctAnswer : null,
          })),
        });

        setLoading(false);
      } catch (error) {
        console.error("Error fetching quiz:", error);
        setError("Error loading quiz data");
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [id, authLoading, user]);

  // Calculate remaining time
  useEffect(() => {
    if (!currentQuiz) return;

    const timer = setInterval(() => {
      const now = new Date();
      const timeLimit = new Date(currentQuiz.timeLimit);

      if (now >= timeLimit) {
        setQuizClosed(true);
        clearInterval(timer);
        setTimeRemaining("Chequered flag");

        if (!submittedRef.current) {
          handleSubmit();
        }
      } else {
        const diff = timeLimit - now;
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);

        if (hours > 0) {
          setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
        } else {
          setTimeRemaining(`${minutes}m ${seconds}s`);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuiz]);

  // Fetch answer distribution when quiz is closed
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

  // Notification opt-in handlers
  const handleNotifOptIn = async () => {
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { notificationOptIn: true });
      addToast("Copy, we'll radio you for every race", "success");
    } catch (e) {
      console.error("Error saving notification preference:", e);
    }
    setShowNotifPrompt(false);
  };

  const handleNotifDismiss = () => {
    setShowNotifPrompt(false);
  };

  // Remind me handler
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
      addToast("Slow button on. We'll radio you.", "success");
    } catch (e) {
      console.error("Error setting reminder:", e);
      addToast("Lost comms. Try again.", "error");
    }
  };

  // Submit quiz to Firebase
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

      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSubmitted(true);
      submittedRef.current = true;
      setShowChecking(false);
      addToast("Copy, we are checking", "success", 3000);

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const alreadyOptedIn = userDoc.exists() && userDoc.data().notificationOptIn === true;
        if (!alreadyOptedIn) {
          const userAnswersQuery = query(
            collection(db, "quizAnswers"),
            where("userId", "==", user.uid)
          );
          const userAnswersSnapshot = await getDocs(userAnswersQuery);
          if (userAnswersSnapshot.size <= 1) {
            setShowNotifPrompt(true);
          }
        }
      } catch (e) {
        // Non-critical
      }
    } catch (error) {
      console.error("Error submitting answers:", error);
      setShowChecking(false);
      addToast("No radio. Try again.", "error", 5000);
    }
  };

  if (authLoading || (!user && !error) || loading) {
    return (
      <div className="card">
        <Skeleton width="100%" height="4px" borderRadius="0" style={{ marginBottom: "20px" }} />
        <Skeleton width="200px" height="28px" style={{ marginBottom: "8px" }} />
        <Skeleton width="140px" height="16px" style={{ marginBottom: "32px" }} />
        {[1, 2, 3].map((i) => (
          <div key={i} className="question-container">
            <Skeleton width={`${50 + i * 10}%`} height="18px" style={{ marginBottom: "12px" }} />
            <div className="flex gap-3">
              <Skeleton height="44px" borderRadius="var(--radius-md)" style={{ flex: 1 }} />
              <Skeleton height="44px" borderRadius="var(--radius-md)" style={{ flex: 1 }} />
            </div>
          </div>
        ))}
        <Skeleton height="48px" borderRadius="var(--radius-md)" style={{ marginTop: "16px" }} />
      </div>
    );
  }

  if (error || !currentQuiz) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
        <div className="transmission-bar">
          <div className="transmission-bar-closed" />
        </div>
        <div style={{ fontSize: "var(--fs-hero)", marginBottom: "16px", opacity: 0.6 }}>
          &#x1F3CE;
        </div>
        <h2 className="card-title" style={{ marginBottom: "8px" }}>
          Radio silence
        </h2>
        <p className="text-secondary" style={{ marginBottom: "24px" }}>
          No active transmissions. Stand by for the next race weekend.
        </p>
        {nextRace && (
          <div className="next-race-banner">
            <div className="next-race-info">
              <span className="next-race-label">Next Race Weekend</span>
              <span className="next-race-name">{nextRace.name}</span>
              <span className="next-race-location">{nextRace.location}</span>
            </div>
            <div className="next-race-countdown-wrap">
              <div className="next-race-countdown">
                {getDaysUntil(nextRace.date)}
              </div>
              <div className="next-race-countdown-label">days away</div>
            </div>
          </div>
        )}
        <button onClick={() => navigate("/")} className="btn" style={{ marginTop: "16px" }}>
          Back to Pit Wall
        </button>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="transmission-bar">
        <div className={quizClosed ? "transmission-bar-closed" : "transmission-bar-live"} />
      </div>
      {nextRace && (
        <div className="next-race-banner">
          <div className="next-race-info">
            <span className="next-race-label">Next Race Weekend</span>
            <span className="next-race-name">{nextRace.name}</span>
            <span className="next-race-location">{nextRace.location}</span>
          </div>
          <div className="next-race-countdown-wrap">
            <div className="next-race-countdown">
              {getDaysUntil(nextRace.date)}
            </div>
            <div className="next-race-countdown-label">days away</div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="quiz-header-row">
          <h1 className="card-title" style={{ marginBottom: 0 }}>{currentQuiz.title}</h1>
          <div className="quiz-header-meta">
            <div className="timer">
              <span style={quizClosed ? { color: 'var(--wc-red)' } : undefined}>
                {timeRemaining}
              </span>
            </div>
            <span className={`live-badge ${quizClosed ? 'live-badge-closed' : 'live-badge-active'}`}>
              {quizClosed ? 'Closed' : 'Live'}
            </span>
          </div>
        </div>

        {userProfile && (
          <div className="text-sm text-secondary">
            <span className="font-semibold">{userProfile.username}</span>, it's lights out and away we go
          </div>
        )}
      </div>

      {!quizClosed ? (
        <>
          {currentQuiz.questions.map((question, index) => (
            <div key={question.id} className="question-container">
              <p className="question-text">
                {index + 1}. {question.text}
              </p>
              <div className="options-list">
                <div className="flex gap-3">
                  {question.options.map((option) => (
                    <div key={option} className="option-item flex-1">
                      <label
                        className={`option-label ${
                          answers[question.id] === option
                            ? "option-selected"
                            : ""
                        }`}
                      >
                        <input
                          type="radio"
                          name={question.id}
                          value={option}
                          checked={answers[question.id] === option}
                          onChange={() =>
                            handleAnswerSelect(question.id, option)
                          }
                          className="option-input"
                        />
                        <span className="font-medium">{option}</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* Stable action area — all conditional buttons live here */}
          <div className="quiz-actions">
            <button
              onClick={handleSubmit}
              disabled={showChecking}
              className="btn btn-block"
            >
              {submitted ? "Change Predictions" : "Lock In Predictions"}
            </button>

            {submitted && !showChecking && (
              <div className="alert alert-success" style={{ margin: 0 }}>
                Received. Change of plan still possible before lights out.
              </div>
            )}

            {!submitted && !reminderSet && (
              <button
                onClick={handleRemindMe}
                className="btn btn-secondary btn-block"
              >
                Remind Me Before Deadline
              </button>
            )}

            {reminderSet && (
              <div className="alert alert-success" style={{ margin: 0 }}>
                Slow button on. 2 hours before the flag.
              </div>
            )}

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
                    Copy, Notify Me
                  </button>
                  <button className="btn btn-secondary" onClick={handleNotifDismiss}>
                    Not now
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="results">
          <div className="text-2xl font-bold mb-4 text-center">
            Transmission received
          </div>

          <div className="score">
            {score} / {currentQuiz.questions.length}
          </div>

          <ShareCard
            quizTitle={currentQuiz.title}
            score={score}
            totalQuestions={currentQuiz.questions.length}
            answers={answers}
            correctAnswers={currentQuiz.questions.map((q) => q.correctAnswer)}
            username={userProfile?.username || "Driver"}
          />

          <div className="space-y-4">
            {currentQuiz.questions.map((question, index) => (
              <div key={question.id} className="question-container">
                <p className="question-text">
                  {index + 1}. {question.text}
                </p>
                <p className="mt-2">
                  Your answer:{" "}
                  <span className="font-semibold">
                    {answers[question.id] || "Not answered"}
                  </span>
                </p>
                {question.correctAnswer ? (
                  <p className="text-red font-semibold mt-1">
                    Correct answer: {question.correctAnswer}
                  </p>
                ) : quizClosed ? (
                  <p className="text-secondary font-medium mt-1">
                    The correct answer will be revealed by the administrator
                  </p>
                ) : null}
                {distribution[question.id] && distribution[question.id].total > 0 && (
                  <div className="mt-2">
                    <div className="text-xs text-secondary mb-1">
                      Grid predictions ({distribution[question.id].total} drivers)
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
              </div>
            ))}
          </div>
        </div>
      )}

      {showChecking && (
        <CheckingOverlay
          message="We are checking..."
          subtext="Stand by for confirmation"
        />
      )}
    </div>
  );
};

export default QuizGame;
