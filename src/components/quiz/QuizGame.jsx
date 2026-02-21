import React, { useState, useEffect } from "react";
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
      addToast(`Answer changed to ${selectedAnswer}`, "info", 2000);
    } else if (!previousAnswer) {
      addToast(`Locked in: ${selectedAnswer}`, "success", 2000);
    }
  };

  // Check for authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        // Redirect to login if not authenticated
        navigate("/login");
      } else {
        // Fetch user profile to get username
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
      if (authLoading || !user) return; // Don't fetch if not authenticated yet

      try {
        setLoading(true);
        let quizDoc;

        if (id) {
          // Fetch specific quiz by ID
          quizDoc = await getDoc(doc(db, "quizzes", id));

          if (!quizDoc.exists()) {
            setError("Quiz not found");
            setLoading(false);
            return;
          }
        } else {
          // Fetch the latest quiz if no ID is provided (sorted by creation time)
          const querySnapshot = await getDocs(
            query(
              collection(db, "quizzes"), 
              // Order by creation time, descending (newest first)
              // Add index in Firebase console if needed: collection 'quizzes', field 'createdAt' descending
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

        // Convert Firestore timestamp to Date object
        const endTime =
          quizData.endTime instanceof Date
            ? quizData.endTime
            : quizData.endTime.toDate();

        const now = new Date();
        const quizEnded = now >= endTime;

        setCurrentQuiz({
          id: quizDoc.id,
          title: quizData.title,
          timeLimit: endTime,
          questions: quizData.questions.map((q, index) => ({
            id: `q${index + 1}`,
            text: q.text,
            options: q.options,
            // Only include correctAnswer if quiz has ended and answers are set
            correctAnswer: quizEnded ? q.correctAnswer : null,
          })),
        });

        // Check if user has already submitted answers for this quiz
        if (user) {
          try {
            const userAnswersRef = doc(
              db,
              "quizAnswers",
              `${user.uid}_${quizDoc.id}`,
            );
            const userAnswersSnap = await getDoc(userAnswersRef);

            if (userAnswersSnap.exists()) {
              // User has already submitted answers for this quiz
              const userAnswersData = userAnswersSnap.data();
              setAnswers(userAnswersData.answers || {});
              if (userAnswersData.score !== undefined) {
                setScore(userAnswersData.score);
              }
              setSubmitted(true);
            }
          } catch (err) {
            console.error("Error checking existing answers:", err);
          }
        }

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
        setTimeRemaining("Quiz closed");

        if (!submitted) {
          handleSubmit();
        }
      } else {
        const diff = timeLimit - now;
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        
        if (hours > 0) {
          setTimeRemaining(`${hours}h ${minutes}m ${seconds}s remaining`);
        } else {
          setTimeRemaining(`${minutes}m ${seconds}s remaining`);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuiz, submitted]);

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
      addToast("You'll be notified about new quizzes!", "success");
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
      addToast("Reminder set! We'll nudge you before it closes.", "success");
    } catch (e) {
      console.error("Error setting reminder:", e);
      addToast("Couldn't set reminder. Try again.", "error");
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

      // Hold the overlay for dramatic effect
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSubmitted(true);
      setShowChecking(false);
      addToast("Predictions locked in!", "success", 3000);

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
    } catch (error) {
      console.error("Error submitting answers:", error);
      setShowChecking(false);
      addToast("Failed to submit. Please try again.", "error", 5000);
    }
  };

  // Handle when authentication is loading or user not authenticated
  if (authLoading) {
    return (
      <div className="max-w-md mx-auto my-8 p-6 bg-white rounded shadow text-center">
        <p>Checking authentication...</p>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  if (loading) {
    return (
      <div className="max-w-md mx-auto my-8 p-6 bg-white rounded shadow text-center">
        <p>Loading quiz...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-8 p-6 bg-white rounded shadow text-center text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  if (!currentQuiz) {
    return (
      <div className="max-w-md mx-auto my-8 p-6 bg-white rounded shadow text-center">
        <p>No quiz available. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="card">
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
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h1 className="card-title">{currentQuiz.title}</h1>
          <div className="timer">
            {quizClosed ? (
              <span style={{ color: 'var(--wc-red)' }}>{timeRemaining}</span>
            ) : (
              <span>{timeRemaining}</span>
            )}
          </div>
        </div>

        {userProfile && (
          <div className="text-sm text-gray-600">
            Playing as:{" "}
            <span className="font-medium">{userProfile.username}</span>
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
                <div className="flex space-x-4">
                  {question.options.map((option) => (
                    <div key={option} className="option-item flex-1">
                      <label
                        className={`option-label ${
                          answers[question.id] === option
                            ? "bg-blue-50 border-l-4 border-l-[var(--wc-red)]"
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

          <button
            onClick={handleSubmit}
            disabled={showChecking}
            className={`btn btn-block ${showChecking ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {submitted ? "Update Answers" : "Submit Answers"}
          </button>
          
          {submitted && !showChecking && (
            <div className="alert alert-success" style={{ marginTop: '16px' }}>
              Predictions submitted. You can still edit until the quiz closes.
            </div>
          )}

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
        </>
      ) : (
        <div className="results">
          <div className="text-2xl font-bold mb-4">
            Your answers have been submitted
          </div>
          
          {quizClosed && (
            <div className="score mb-4">
              {score} / {currentQuiz.questions.length}
            </div>
          )}
          <div className="space-y-4">
            {currentQuiz.questions.map((question, index) => (
              <div key={question.id} className="question-container">
                <p className="question-text">
                  {index + 1}. {question.text}
                </p>
                <p className="mt-2">
                  Your answer:
                  <span className="ml-1 font-medium">
                    {answers[question.id] || "Not answered"}
                  </span>
                </p>
                {question.correctAnswer ? (
                  <p style={{ color: "var(--wc-red)" }} className="font-medium mt-1">
                    Correct answer: {question.correctAnswer}
                  </p>
                ) : quizClosed ? (
                  <p className="text-gray-500 font-medium mt-1">
                    The correct answer will be revealed by the administrator
                  </p>
                ) : null}
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
              </div>
            ))}
          </div>
        </div>
      )}
      {showChecking && (
        <CheckingOverlay
          message="We are checking..."
          subtext="Submitting your predictions"
        />
      )}
    </div>
  );
};

export default QuizGame;
