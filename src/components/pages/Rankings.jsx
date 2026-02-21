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
    scores: {}, // format: { userId_quizId: score }
    submissions: {}, // format: { userId_quizId: true } - tracks who has submitted, even without scores
    totalScores: {}, // format: { userId: totalScore }
  });
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Check for authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        // Redirect to login if not authenticated
        navigate("/login");
      } else {
        // Get user profile to check if admin
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDocSnapshot = await getDoc(userDocRef);
          if (userDocSnapshot.exists()) {
            // User profile loaded
          }
        } catch (err) {
          // Error fetching user profile
        }
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Real-time rankings listener
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
    return (
      <div className="alert alert-error">
        {error}
      </div>
    );
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

  // Get the score or status for a specific user and quiz
  const getScore = (userId, quizId) => {
    const key = `${userId}_${quizId}`;
    
    // If there's a score, return it
    if (scores[key] !== undefined) {
      return scores[key];
    }
    
    // Check if the user has submitted an answer but doesn't have a score yet
    const hasSubmitted = submissions[key];
    
    // Return a check mark if they've submitted but don't have a score
    return hasSubmitted ? "✅" : "-";
  };

  return (
    <div className="card">
      <h1 className="card-title">Leaderboard</h1>
      
      {users.length === 0 ? (
        <p>No quiz results available yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left" style={{ backgroundColor: 'var(--wc-carbon)', color: 'var(--wc-text)' }}>Rank</th>
                <th className="border p-2 text-left" style={{ backgroundColor: 'var(--wc-carbon)', color: 'var(--wc-text)' }}>Player</th>
                <th className="border p-2 text-left" style={{ backgroundColor: 'var(--wc-carbon)', color: 'var(--wc-text)' }}>Total Points</th>
                
                {/* Quiz columns */}
                {quizzes.map(quiz => (
                  <th key={quiz.id} className="border p-2 text-left" style={{ backgroundColor: 'var(--wc-carbon)', color: 'var(--wc-text)' }}>
                    {quiz.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={user.id} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                  <td className="border p-2">{index + 1}</td>
                  <td className="border p-2 font-medium">
                    {user.username}
                    {(() => {
                      const title = getRankTitle(index + 1, users.length);
                      return title ? (
                        <span className={`rank-title ${title.className}`}>{title.label}</span>
                      ) : null;
                    })()}
                  </td>
                  <td className="border p-2 font-bold" style={{ color: 'var(--wc-red)' }}>
                    {totalScores[user.id] || 0}
                  </td>
                  
                  {/* Scores for each quiz */}
                  {quizzes.map(quiz => (
                    <td key={`${user.id}_${quiz.id}`} className="border p-2 text-center">
                      {getScore(user.id, quiz.id)}
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