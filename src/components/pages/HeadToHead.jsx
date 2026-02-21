import React, { useState, useEffect } from "react";
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

  const getComparison = () => {
    if (!player1Id || !player2Id) return null;

    const p1Name =
      allUsers.find((u) => u.id === player1Id)?.username || "Player 1";
    const p2Name =
      allUsers.find((u) => u.id === player2Id)?.username || "Player 2";

    let p1Total = 0;
    let p2Total = 0;
    let agreed = 0;
    let totalQuestions = 0;

    const quizComparisons = quizzes
      .filter((quiz) => {
        const p1Answer = allAnswers.find(
          (a) => a.userId === player1Id && a.quizId === quiz.id
        );
        const p2Answer = allAnswers.find(
          (a) => a.userId === player2Id && a.quizId === quiz.id
        );
        return p1Answer && p2Answer;
      })
      .map((quiz) => {
        const p1Answer = allAnswers.find(
          (a) => a.userId === player1Id && a.quizId === quiz.id
        );
        const p2Answer = allAnswers.find(
          (a) => a.userId === player2Id && a.quizId === quiz.id
        );

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
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  const comparison = getComparison();

  return (
    <div className="card">
      <h1 className="card-title">Head to Head</h1>

      <div className="h2h-selector">
        <select
          value={player1Id}
          onChange={(e) => setPlayer1Id(e.target.value)}
        >
          <option value="">Select player</option>
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

          {comparison.quizComparisons.map((quiz, qi) => (
            <div key={qi} className="question-container" style={{ marginBottom: "16px" }}>
              <div className="question-text" style={{ marginBottom: "12px" }}>
                {quiz.title}
              </div>
              <div
                className="h2h-quiz-row"
                style={{
                  borderBottom: "2px solid var(--wc-border)",
                  fontWeight: 700,
                  fontSize: "12px",
                  color: "var(--wc-text-secondary)",
                  textTransform: "uppercase",
                }}
              >
                <div style={{ textAlign: "center" }}>{comparison.p1Name}</div>
                <div style={{ textAlign: "center" }}>Question</div>
                <div style={{ textAlign: "center" }}>{comparison.p2Name}</div>
              </div>
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
                  <div className="text-sm" style={{ textAlign: "center" }}>
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
              <div
                className="h2h-quiz-row"
                style={{ fontWeight: 700, borderTop: "2px solid var(--wc-border)" }}
              >
                <div style={{ textAlign: "center", color: "var(--wc-red)" }}>
                  {quiz.p1Score}
                </div>
                <div
                  style={{
                    textAlign: "center",
                    color: "var(--wc-text-secondary)",
                    fontSize: "12px",
                  }}
                >
                  Score
                </div>
                <div style={{ textAlign: "center", color: "var(--wc-red)" }}>
                  {quiz.p2Score}
                </div>
              </div>
            </div>
          ))}
        </>
      ) : comparison ? (
        <p className="text-gray-500">
          No shared quizzes found between these players.
        </p>
      ) : (
        <p className="text-gray-500">Select two players to compare.</p>
      )}
    </div>
  );
};

export default HeadToHead;
