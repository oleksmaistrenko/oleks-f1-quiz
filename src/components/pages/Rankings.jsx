import React, { useState, useEffect, useRef } from "react";
import { collection, onSnapshot, query, orderBy, doc, getDoc, getDocs } from "firebase/firestore";
import { db, auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import Skeleton from "../ui/Skeleton";

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
  const [showRaceColumns, setShowRaceColumns] = useState(false);
  const navigate = useNavigate();
  const usersLoadedRef = useRef(false);

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
    usersLoadedRef.current = false;

    const quizzesQuery = query(collection(db, "quizzes"), orderBy("createdAt", "desc"));
    const answersQuery = query(collection(db, "quizAnswers"));

    let quizzesData = [];
    let answersDataArr = [];
    let usersMap = new Map();

    getDocs(collection(db, "users")).then((snapshot) => {
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        usersMap.set(doc.id, { username: data.username || "Unknown", elite: data.elite === true });
      });
      usersLoadedRef.current = true;
      processData();
    });

    const processData = () => {
      if (!usersLoadedRef.current) return;
      const userMap = new Map();
      const scoreMap = new Map();
      const submissionMap = new Map();
      const totalScoreMap = new Map();

      answersDataArr.forEach((answerData) => {
        const userId = answerData.userId;
        const quizId = answerData.quizId;
        const userInfo = usersMap.get(userId);
        const username = userInfo?.username || answerData.username || "Unknown";
        const elite = userInfo?.elite || false;
        const hasScore = answerData.score !== undefined;
        const score = hasScore ? answerData.score : 0;

        if (!userMap.has(userId)) {
          userMap.set(userId, { id: userId, username, elite });
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
      <div className="card">
        <Skeleton width="220px" height="28px" style={{ marginBottom: "24px" }} />
        <div className="rankings-table-wrap">
          <table>
            <thead>
              <tr>
                <th className="rankings-col-rank"><Skeleton width="20px" height="12px" /></th>
                <th className="rankings-col-driver"><Skeleton width="50px" height="12px" /></th>
                <th className="rankings-col-total"><Skeleton width="36px" height="12px" /></th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <tr key={i}>
                  <td className="rankings-col-rank"><Skeleton width="20px" height="16px" /></td>
                  <td className="rankings-col-driver"><Skeleton width={`${80 + i * 15}px`} height="16px" /></td>
                  <td className="rankings-col-total"><Skeleton width="32px" height="16px" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

  const truncateTitle = (title, max) => {
    const chars = [...title];
    return chars.length > max ? chars.slice(0, max).join("") + "…" : title;
  };

  return (
    <div className="card">
      <h1 className="card-title">Championship Standings</h1>

      {users.length === 0 ? (
        <p className="text-secondary">No telemetry available yet.</p>
      ) : (
        <>
          <div className="rankings-table-wrap">
            <table>
              <thead>
                <tr>
                  <th className="rankings-col-rank">#</th>
                  <th className="rankings-col-driver">Driver</th>
                  <th className="rankings-col-total">Total</th>
                  {showRaceColumns && quizzes.map(quiz => (
                    <th key={quiz.id} className="rankings-col-race" title={quiz.title}>
                      {truncateTitle(quiz.title, 12)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, index) => (
                  <tr key={u.id}>
                    <td className="font-semibold rankings-col-rank">
                      {index + 1}
                    </td>
                    <td className="font-medium rankings-col-driver">
                      {u.elite && <span style={{ color: "var(--wc-gold)", marginRight: "4px" }}>★</span>}{u.username}
                      {(() => {
                        const title = getRankTitle(index + 1, users.length);
                        return title ? (
                          <span className={`rank-title ${title.className}`}>{title.label}</span>
                        ) : null;
                      })()}
                    </td>
                    <td className="font-bold rankings-col-total" style={{ color: "var(--wc-red)", fontFamily: "'JetBrains Mono', monospace" }}>
                      {totalScores[u.id] || 0}
                    </td>
                    {showRaceColumns && quizzes.map(quiz => (
                      <td
                        key={`${u.id}_${quiz.id}`}
                        className="rankings-col-race"
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

          {quizzes.length > 0 && (
            <button
              className="btn btn-secondary btn-block"
              style={{ marginTop: "16px" }}
              onClick={() => setShowRaceColumns(!showRaceColumns)}
            >
              {showRaceColumns
                ? "Hide Race Breakdown"
                : `Show Race Breakdown (${quizzes.length} rounds)`}
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default Rankings;
