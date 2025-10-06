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
  Timestamp,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

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
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Handle answer selection
  const handleAnswerSelect = (questionId, selectedAnswer) => {
    setAnswers({
      ...answers,
      [questionId]: selectedAnswer,
    });
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

  // Submit quiz to Firebase
  const handleSubmit = async () => {
    if (!currentQuiz || !user) return;

    try {
      setSubmitting(true);
      setSubmitError(null);

      // Create a document ID using user ID and quiz ID to ensure one submission per user per quiz
      const answersDocId = `${user.uid}_${currentQuiz.id}`;

      // Prepare answers data
      const answersData = {
        userId: user.uid,
        username: userProfile?.username || "Unknown",
        quizId: currentQuiz.id,
        quizTitle: currentQuiz.title,
        answers: answers,
        submittedAt: Timestamp.now(),
      };

      // Save to Firestore
      await setDoc(doc(db, "quizAnswers", answersDocId), answersData);

      setSubmitted(true);
      setSubmitting(false);
    } catch (error) {
      console.error("Error submitting answers:", error);
      setSubmitError("Failed to submit answers. Please try again.");
      setSubmitting(false);
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
    <div className="card racing-pattern">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h1 className="card-title">{currentQuiz.title}</h1>
          <div className="timer">
            {quizClosed ? (
              <span style={{ color: 'var(--f1-red)' }}>{timeRemaining}</span>
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
                            ? "bg-blue-50 border-l-4 border-l-[var(--f1-red)]"
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

          {submitError && (
            <div className="alert alert-error">
              {submitError}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={`btn btn-block ${
              submitting ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {submitting ? "Submitting..." : submitted ? "Update Answers" : "Submit Answers"}
          </button>
          
          {submitted && (
            <div className="mt-4 p-3 bg-green-100 rounded-md text-green-800 text-center">
              Your answers have been submitted. You can still edit them until the quiz closes.
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
                  <p style={{ color: "var(--f1-red)" }} className="font-medium mt-1">
                    Correct answer: {question.correctAnswer}
                  </p>
                ) : quizClosed ? (
                  <p className="text-gray-500 font-medium mt-1">
                    The correct answer will be revealed by the administrator
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizGame;
