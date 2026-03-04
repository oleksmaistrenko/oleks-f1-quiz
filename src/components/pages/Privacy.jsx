import React from "react";
import { Link } from "react-router-dom";

const Privacy = () => {
  return (
    <div className="card">
      <h1 className="card-title">Privacy Policy</h1>
      <p className="text-secondary text-sm" style={{ marginBottom: "24px" }}>
        Last updated: March 1, 2026
      </p>

      <div className="question-container">
        <div className="question-text text-red">
          What We Collect
        </div>
        <p className="text-secondary" style={{ lineHeight: "1.7" }}>
          When you use we-check.ing, we collect the following information:
        </p>
        <ul className="text-secondary" style={{ lineHeight: "1.7", paddingLeft: "20px", marginTop: "8px" }}>
          <li><strong>Email address</strong> — used for account creation and login</li>
          <li><strong>Username</strong> — chosen by you, displayed in rankings and quizzes</li>
          <li><strong>Quiz answers and scores</strong> — your predictions and calculated results</li>
          <li><strong>Usage data</strong> — collected via Firebase Analytics (page views, feature usage, device type)</li>
        </ul>
      </div>

      <div className="question-container">
        <div className="question-text text-red">
          How We Use It
        </div>
        <p className="text-secondary" style={{ lineHeight: "1.7" }}>
          Your data is used to operate the quiz game: managing your account, recording your predictions, calculating scores, displaying leaderboards, and improving the service through analytics.
        </p>
      </div>

      <div className="question-container">
        <div className="question-text text-red">
          Data Storage
        </div>
        <p className="text-secondary" style={{ lineHeight: "1.7" }}>
          Your data is stored in Firebase (Google Cloud Platform). Firebase handles authentication and database storage. Data is processed in accordance with{" "}
          <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer" className="text-red">
            Google's privacy practices
          </a>.
        </p>
      </div>

      <div className="question-container">
        <div className="question-text text-red">
          Third Parties
        </div>
        <p className="text-secondary" style={{ lineHeight: "1.7" }}>
          We use Firebase (Google) as our data processor for authentication, database, and analytics. We do not sell, rent, or share your personal data with any other third parties.
        </p>
      </div>

      <div className="question-container">
        <div className="question-text text-red">
          Cookies
        </div>
        <p className="text-secondary" style={{ lineHeight: "1.7" }}>
          we-check.ing uses cookies for authentication (keeping you logged in) and analytics (Firebase Analytics). These are essential for the service to function. By using the service, you consent to the use of these cookies.
        </p>
      </div>

      <div className="question-container">
        <div className="question-text text-red">
          Data Retention
        </div>
        <p className="text-secondary" style={{ lineHeight: "1.7" }}>
          Your data is retained for as long as your account is active. If you wish to have your data deleted, contact us and we will remove your account and associated data.
        </p>
      </div>

      <div className="question-container">
        <div className="question-text text-red">
          Your Rights
        </div>
        <p className="text-secondary" style={{ lineHeight: "1.7" }}>
          You have the right to access, correct, or request deletion of your personal data. To exercise these rights, contact us at the email below. We will respond to your request within a reasonable timeframe.
        </p>
      </div>

      <div className="question-container">
        <div className="question-text text-red">
          Children
        </div>
        <p className="text-secondary" style={{ lineHeight: "1.7" }}>
          we-check.ing is not intended for children under 13. We do not knowingly collect personal data from children under 13. If you believe a child has provided us with personal data, please contact us.
        </p>
      </div>

      <div className="question-container">
        <div className="question-text text-red">
          Changes to This Policy
        </div>
        <p className="text-secondary" style={{ lineHeight: "1.7" }}>
          We may update this policy from time to time. Changes will be reflected on this page with an updated date. Continued use of the service after changes constitutes acceptance of the updated policy.
        </p>
      </div>

      <div style={{ marginTop: "24px", textAlign: "center" }}>
        <Link to="/terms" className="text-red" style={{ fontWeight: 600 }}>
          ← View Terms of Service
        </Link>
      </div>
    </div>
  );
};

export default Privacy;
