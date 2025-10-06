import React, { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, doc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
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
            const userData = userDocSnapshot.data();
            console.log(`User role: ${userData.role}`);
          }
        } catch (err) {
          console.error("Error fetching user profile:", err);
        }
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Fetch rankings data
  useEffect(() => {
    const fetchRankings = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch all quizzes
        const quizzesQuery = query(collection(db, "quizzes"), orderBy("createdAt", "desc"));
        const quizzesSnapshot = await getDocs(quizzesQuery);
        
        const quizzes = quizzesSnapshot.docs.map(doc => ({
          id: doc.id,
          title: doc.data().title,
          ...doc.data()
        }));

        // Fetch all user answers
        const answersQuery = query(collection(db, "quizAnswers"));
        const answersSnapshot = await getDocs(answersQuery);

        // Process answers
        const userMap = new Map(); // Track unique users
        const scoreMap = new Map(); // Track scores by user_quiz
        const submissionMap = new Map(); // Track submissions by user_quiz
        const totalScoreMap = new Map(); // Track total scores by user

        console.log(`Found ${answersSnapshot.size} answer documents in rankings`);
        
        answersSnapshot.forEach(answerDoc => {
          const answerData = answerDoc.data();
          const userId = answerData.userId;
          const quizId = answerData.quizId;
          const username = answerData.username || "Unknown";
          const hasScore = answerData.score !== undefined;
          const score = hasScore ? answerData.score : 0;
          
          console.log(`User ${username} (${userId}) scored ${hasScore ? score : 'no score yet'} on quiz ${quizId}`);
          
          // Track unique users
          if (!userMap.has(userId)) {
            userMap.set(userId, { id: userId, username });
          }
          
          // Track submissions for everyone who has answered
          const key = `${userId}_${quizId}`;
          submissionMap.set(key, true);
          
          // Only track scores if they have a score (not just a submission)
          if (hasScore) {
            scoreMap.set(key, score);
            
            // Update total score for user (only for scored quizzes)
            const currentTotal = totalScoreMap.get(userId) || 0;
            const newTotal = currentTotal + score;
            console.log(`Adding ${score} to ${currentTotal} for total of ${newTotal}`);
            totalScoreMap.set(userId, newTotal);
          }
        });

        // Convert maps to arrays/objects for state
        const users = Array.from(userMap.values())
          .sort((a, b) => {
            // Sort by total score descending
            const totalA = totalScoreMap.get(a.id) || 0;
            const totalB = totalScoreMap.get(b.id) || 0;
            return totalB - totalA;
          });

        const scores = {};
        scoreMap.forEach((score, key) => {
          scores[key] = score;
        });

        const submissions = {};
        submissionMap.forEach((value, key) => {
          submissions[key] = value;
        });

        const totalScores = {};
        totalScoreMap.forEach((score, userId) => {
          totalScores[userId] = score;
        });

        setRankingsData({
          users,
          quizzes,
          scores,
          submissions,
          totalScores,
        });

        setLoading(false);
      } catch (error) {
        console.error("Error fetching rankings:", error);
        setError("Failed to load rankings data");
        setLoading(false);
      }
    };

    fetchRankings();
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
                <th className="border p-2 text-left" style={{ backgroundColor: 'var(--f1-black)', color: 'var(--f1-white)' }}>Rank</th>
                <th className="border p-2 text-left" style={{ backgroundColor: 'var(--f1-black)', color: 'var(--f1-white)' }}>Player</th>
                <th className="border p-2 text-left" style={{ backgroundColor: 'var(--f1-black)', color: 'var(--f1-white)' }}>Total Points</th>
                
                {/* Quiz columns */}
                {quizzes.map(quiz => (
                  <th key={quiz.id} className="border p-2 text-left" style={{ backgroundColor: 'var(--f1-black)', color: 'var(--f1-white)' }}>
                    {quiz.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={user.id} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                  <td className="border p-2">{index + 1}</td>
                  <td className="border p-2 font-medium">{user.username}</td>
                  <td className="border p-2 font-bold" style={{ color: 'var(--f1-red)' }}>
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