import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy, doc, getDoc } from "firebase/firestore";
import { db, auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const Rankings = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rankingsData, setRankingsData] = useState({
    users: [],
    quizzes: [],
    scores: {},
    submissions: {},
    totalScores: {},
  });
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        navigate("/login");
      } else {
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          await getDoc(userDocRef);
        } catch (err) {
          // Error fetching user profile
        }
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    setError(null);

    const quizzesQuery = query(collection(db, "quizzes"), orderBy("createdAt", "desc"));
    const answersQuery = query(collection(db, "quizAnswers"));

    let quizzesData = [];
    let answersDataArr = [];

    const processData = () => {
      const userMap = new Map();
      const scoreMap = new Map();
      const submissionMap = new Map();
      const totalScoreMap = new Map();

      answersDataArr.forEach((answerData) => {
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

      setRankingsData({ users, quizzes: quizzesData, scores, submissions, totalScores });
      setLoading(false);
    };

    const unsubQuizzes = onSnapshot(quizzesQuery, (snapshot) => {
      quizzesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        title: doc.data().title,
        ...doc.data(),
      }));
      processData();
    });

    const unsubAnswers = onSnapshot(answersQuery, (snapshot) => {
      answersDataArr = snapshot.docs.map((doc) => doc.data());
      processData();
    });

    return () => {
      unsubQuizzes();
      unsubAnswers();
    };
  }, [user]);

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  const { users, quizzes, scores, submissions, totalScores } = rankingsData;

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

  const getScore = (userId, quizId) => {
    const key = `${userId}_${quizId}`;

    if (scores[key] !== undefined) {
      return scores[key];
    }

    const hasSubmitted = submissions[key];
    return hasSubmitted ? "\u2705" : "\u2014";
  };

  return (
    <div className="card">
      <h1 className="card-title">Championship Standings</h1>

      {users.length === 0 ? (
        <p className="text-secondary">No telemetry available yet.</p>
      ) : (
        <div className="rankings-table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Driver</th>
                <th>Total</th>
                {quizzes.map(quiz => (
                  <th key={quiz.id}>{quiz.title}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, index) => (
                <tr key={u.id}>
                  <td className="font-semibold" style={{ width: "40px" }}>
                    {index + 1}
                  </td>
                  <td className="font-medium" style={{ whiteSpace: "nowrap" }}>
                    {u.username}
                    {(() => {
                      const title = getRankTitle(index + 1, users.length);
                      return title ? (
                        <span className={`rank-title ${title.className}`}>{title.label}</span>
                      ) : null;
                    })()}
                  </td>
                  <td className="font-bold" style={{ color: "var(--wc-red)", fontFamily: "'JetBrains Mono', monospace" }}>
                    {totalScores[u.id] || 0}
                  </td>
                  {quizzes.map(quiz => (
                    <td
                      key={`${u.id}_${quiz.id}`}
                      style={{ textAlign: "center", fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {getScore(u.id, quiz.id)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Rankings;
