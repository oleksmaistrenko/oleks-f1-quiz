import React, { useState, useEffect } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db, auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import Skeleton from "../ui/Skeleton";

const HISTORY_PREVIEW = 5;

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [expandedQuizIndex, setExpandedQuizIndex] = useState(null);
  const [quizCache, setQuizCache] = useState({});
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
            answers: data.answers || {},
            quizId: data.quizId || null,
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
      <div className="card">
        <Skeleton width="140px" height="28px" style={{ marginBottom: "24px" }} />
        <div className="dashboard-stats">
          {[1, 2, 3].map((i) => (
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

  const maxScore = Math.max(
    ...stats.quizScores.map((q) => q.total),
    1
  );

  const handleToggleExpand = async (index, quizId) => {
    if (expandedQuizIndex === index) {
      setExpandedQuizIndex(null);
      return;
    }
    setExpandedQuizIndex(index);
    if (quizId && !quizCache[quizId]) {
      try {
        const quizDoc = await getDoc(doc(db, "quizzes", quizId));
        if (quizDoc.exists()) {
          setQuizCache((prev) => ({ ...prev, [quizId]: quizDoc.data() }));
        }
      } catch (err) {
        console.error("Error fetching quiz details:", err);
      }
    }
  };

  const historyReversed = stats.quizScores.slice().reverse();
  const historyToShow = showAllHistory
    ? historyReversed
    : historyReversed.slice(0, HISTORY_PREVIEW);
  const hasMoreHistory = historyReversed.length > HISTORY_PREVIEW;

  return (
    <div className="card">
      <h1 className="card-title">Pit Wall</h1>

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
          <h2 className="card-title card-title-sm">
            Season Progress
          </h2>
          <div className="sparkline-scroll-wrap">
            <div
              className="sparkline"
              style={{
                marginBottom: "32px",
                minWidth: stats.quizScores.length > 12
                  ? `${stats.quizScores.length * 48}px`
                  : undefined,
              }}
            >
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
                      ? q.quizTitle.slice(0, 8) + "…"
                      : q.quizTitle}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <h2 className="card-title card-title-sm" style={{ marginTop: "16px" }}>
            Quiz History
          </h2>
          {historyToShow.map((q, i) => {
            const isExpanded = expandedQuizIndex === i;
            const quizData = q.quizId ? quizCache[q.quizId] : null;
            const questions = quizData?.questions || [];

            return (
              <div key={i}>
                <div
                  className="history-item history-item-expandable"
                  onClick={() => handleToggleExpand(i, q.quizId)}
                >
                  <div className="history-item-left">
                    <span className={`history-expand-arrow${isExpanded ? " history-expand-arrow-open" : ""}`}>
                      ▶
                    </span>
                    <div>
                      <div className="font-medium">{q.quizTitle}</div>
                      <div className="text-xs text-gray-500">
                        {q.submittedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                    </div>
                  </div>
                  <div className="history-score">
                    {q.score}/{q.total}
                  </div>
                </div>
                {isExpanded && (
                  <div className="history-detail">
                    {questions.length > 0 ? (
                      questions.map((question, qIdx) => {
                        const questionId = question.id || `q${qIdx + 1}`;
                        const userAnswer = q.answers[questionId];
                        const correctAnswer = question.correctAnswer;
                        const isCorrect = correctAnswer != null && userAnswer === correctAnswer;

                        return (
                          <div
                            key={questionId}
                            className={`history-detail-row ${correctAnswer != null ? (isCorrect ? "history-detail-correct" : "history-detail-wrong") : ""}`}
                          >
                            <div className="history-detail-question">{question.text}</div>
                            <div className="history-detail-answers">
                              <span className="history-detail-user-answer">
                                {userAnswer || "—"}
                              </span>
                              {correctAnswer != null ? (
                                <span className={isCorrect ? "text-success" : "text-error"}>
                                  {isCorrect ? "✓" : `✗ ${correctAnswer}`}
                                </span>
                              ) : (
                                <span className="history-detail-pending">Pending</span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : q.quizId ? (
                      <div className="history-detail-empty">Loading questions…</div>
                    ) : (
                      <div className="history-detail-empty">Question details not available</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {hasMoreHistory && (
            <button
              className="btn btn-secondary btn-block"
              style={{ marginTop: "12px" }}
              onClick={() => setShowAllHistory(!showAllHistory)}
            >
              {showAllHistory
                ? "Show Recent"
                : `Show All ${historyReversed.length} Rounds`}
            </button>
          )}
        </>
      )}

      {stats.quizScores.length === 0 && (
        <p className="text-gray-500">
          No data yet. Complete your first race to see telemetry.
        </p>
      )}
    </div>
  );
};

export default Dashboard;
