import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  query,
  where,
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
