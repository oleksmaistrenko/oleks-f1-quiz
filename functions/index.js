const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { getFirestore } = require("firebase-admin/firestore");
const { initializeApp } = require("firebase-admin/app");

initializeApp();
const db = getFirestore();

// When quiz questions are updated (answers set), recalculate all scores
exports.calculateScores = onDocumentWritten("quizzes/{quizId}", async (event) => {
  const after = event.data?.after?.data();
  if (!after) return; // Document deleted

  const quizId = event.params.quizId;
  const questions = after.questions || [];

  // Check if correct answers are set
  const hasAnswers = questions.some(
    (q) => q.correctAnswer !== null && q.correctAnswer !== undefined && q.correctAnswer !== ""
  );

  if (!hasAnswers) return;

  // Get all user submissions for this quiz
  const answersSnapshot = await db
    .collection("quizAnswers")
    .where("quizId", "==", quizId)
    .get();

  const batch = db.batch();

  answersSnapshot.forEach((answerDoc) => {
    const userData = answerDoc.data();
    const userAnswers = userData.answers || {};
    let score = 0;

    questions.forEach((question, index) => {
      const questionId = `q${index + 1}`;
      if (
        userAnswers[questionId] &&
        question.correctAnswer &&
        userAnswers[questionId] === question.correctAnswer
      ) {
        score += 1;
      }
    });

    batch.update(answerDoc.ref, {
      score,
      totalQuestions: questions.length,
    });
  });

  await batch.commit();
  console.log(
    `Calculated scores for ${answersSnapshot.size} submissions on quiz ${quizId}`
  );
});
