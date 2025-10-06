import React from "react";

const Rules = () => {
  return (
    <div className="card">
      <h1 className="card-title">F1 Quiz Rules</h1>
      
      <div className="rules-container">
        <div className="rule-section">
          <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--f1-red)' }}>How to Play</h2>
          <p className="mb-4">
            Before each race, you'll receive three Yes/No questions about the approaching race.
          </p>
          <p className="mb-4">
            You must select either "Yes" or "No" for each question before the quiz deadline.
          </p>
          <p className="mb-4">
            After the race, the answers are evaluated and you receive +1 point for each correct answer.
          </p>
          <p className="mb-4">
            The player with the most accumulated points across all quizzes wins the championship!
          </p>
        </div>

        <div className="rule-section mt-8">
          <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--f1-red)' }}>Tips</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>You can edit your answers any time before the quiz deadline</li>
            <li>The leaderboard updates after each race once the quiz is scored</li>
            <li>Stay informed about F1 news to increase your chances of correct predictions</li>
            <li>Check back regularly for new quizzes before each race weekend</li>
          </ul>
        </div>

        <div className="mt-8 p-4 bg-gray-100 rounded-md">
          <h2 className="text-lg font-bold mb-2">Remember:</h2>
          <p>The person with the most points wins the quiz!</p>
        </div>
      </div>
    </div>
  );
};

export default Rules;