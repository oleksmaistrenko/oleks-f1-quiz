import React, { useState, useEffect, useMemo } from "react";
import Skeleton from "../ui/Skeleton";
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
  const [selectedQuizId, setSelectedQuizId] = useState("all");
  const [expandedQuiz, setExpandedQuiz] = useState(null);
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

  // When filtering to a single quiz, auto-expand it
  useEffect(() => {
    if (selectedQuizId !== "all") {
      setExpandedQuiz(0);
    } else {
      setExpandedQuiz(null);
    }
  }, [selectedQuizId]);

  const now = new Date();
  const closedQuizzes = quizzes.filter((quiz) => {
    const endTime = quiz.endTime instanceof Date
      ? quiz.endTime
      : quiz.endTime?.toDate?.() ?? new Date(0);
    return now >= endTime;
  });

  const answersByUserQuiz = useMemo(() => {
    const map = new Map();
    allAnswers.forEach((a) => {
      map.set(`${a.userId}_${a.quizId}`, a);
    });
    return map;
  }, [allAnswers]);

  const comparison = useMemo(() => {
    if (!player1Id || !player2Id) return null;

    const p1Name =
      allUsers.find((u) => u.id === player1Id)?.username || "Player 1";
    const p2Name =
      allUsers.find((u) => u.id === player2Id)?.username || "Player 2";

    let p1Total = 0;
    let p2Total = 0;
    let agreed = 0;
    let totalQuestions = 0;

    const quizComparisons = closedQuizzes
      .filter((quiz) => {
        if (selectedQuizId !== "all" && quiz.id !== selectedQuizId) return false;
        return answersByUserQuiz.has(`${player1Id}_${quiz.id}`)
          && answersByUserQuiz.has(`${player2Id}_${quiz.id}`);
      })
      .map((quiz) => {
        const p1Answer = answersByUserQuiz.get(`${player1Id}_${quiz.id}`);
        const p2Answer = answersByUserQuiz.get(`${player2Id}_${quiz.id}`);

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
  }, [player1Id, player2Id, allUsers, closedQuizzes, selectedQuizId, answersByUserQuiz]);

  if (loading) {
    return (
      <div className="card">
        <Skeleton width="180px" height="28px" style={{ marginBottom: "24px" }} />
        <div className="h2h-selector">
          <div className="h2h-players">
            <Skeleton height="44px" borderRadius="var(--radius-md)" style={{ flex: 1 }} />
            <span className="h2h-vs">VS</span>
            <Skeleton height="44px" borderRadius="var(--radius-md)" style={{ flex: 1 }} />
          </div>
        </div>
        <Skeleton height="100px" borderRadius="var(--radius-md)" />
      </div>
    );
  }

  const getWinnerClass = (s1, s2) => {
    if (s1 > s2) return "h2h-winner";
    if (s1 < s2) return "h2h-loser";
    return "";
  };

  return (
    <div className="card">
      <h1 className="card-title">Head to Head</h1>

      <div className="h2h-selector">
        <div className="h2h-players">
          <select
            value={player1Id}
            onChange={(e) => setPlayer1Id(e.target.value)}
          >
            <option value="">Select driver</option>
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

        {closedQuizzes.length > 0 && (
          <select
            className="h2h-round-filter"
            value={selectedQuizId}
            onChange={(e) => setSelectedQuizId(e.target.value)}
          >
            <option value="all">All Rounds</option>
            {closedQuizzes.map((quiz) => (
              <option key={quiz.id} value={quiz.id}>
                {quiz.title}
              </option>
            ))}
          </select>
        )}
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

          {/* Compact race-by-race scoreboard */}
          <div className="h2h-races">
            <div className="h2h-races-header">
              <div>{comparison.p1Name}</div>
              <div>Round</div>
              <div>{comparison.p2Name}</div>
            </div>

            {comparison.quizComparisons.map((quiz, qi) => {
              const isExpanded = expandedQuiz === qi;

              return (
                <div key={qi} className="h2h-race-block">
                  <div
                    className={`h2h-race-row ${isExpanded ? "h2h-race-row-active" : ""}`}
                    onClick={() => setExpandedQuiz(isExpanded ? null : qi)}
                  >
                    <div className={`h2h-race-score ${getWinnerClass(quiz.p1Score, quiz.p2Score)}`}>
                      {quiz.p1Score}
                    </div>
                    <div className="h2h-race-title">
                      {quiz.title}
                      <span className="h2h-race-chevron">{isExpanded ? "▲" : "▼"}</span>
                    </div>
                    <div className={`h2h-race-score ${getWinnerClass(quiz.p2Score, quiz.p1Score)}`}>
                      {quiz.p2Score}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="h2h-race-details">
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
                          <div className="h2h-question-text">
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
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : comparison ? (
        <p className="text-gray-500">
          No shared races between these drivers.
        </p>
      ) : (
        <p className="text-gray-500">Select two drivers to compare.</p>
      )}
    </div>
  );
};

export default HeadToHead;
