import React from "react";
import { Link } from "react-router-dom";

const Terms = () => {
  return (
    <div className="card">
      <h1 className="card-title">Terms of Service</h1>
      <p className="text-secondary text-sm" style={{ marginBottom: "24px" }}>
        Last updated: March 1, 2026
      </p>

      <div className="question-container">
        <div className="question-text text-red">
          Acceptance of Terms
        </div>
        <p className="text-secondary" style={{ lineHeight: "1.7" }}>
          By accessing or using we-check.ing, you agree to be bound by these Terms of Service. If you do not agree, do not use the service.
        </p>
      </div>

      <div className="question-container">
        <div className="question-text text-red">
          Eligibility
        </div>
        <p className="text-secondary" style={{ lineHeight: "1.7" }}>
          You must be at least 13 years old to use we-check.ing. By creating an account, you confirm that you meet this age requirement.
        </p>
      </div>

      <div className="question-container">
        <div className="question-text text-red">
          Accounts
        </div>
        <p className="text-secondary" style={{ lineHeight: "1.7" }}>
          You may create one account per person. You are responsible for keeping your login credentials secure and for all activity under your account. Your email address will only be used for authentication and responding to feedback — never for marketing, newsletters, or promotional communications. We reserve the right to remove accounts that violate these terms.
        </p>
      </div>

      <div className="question-container">
        <div className="question-text text-red">
          Quiz Gameplay
        </div>
        <p className="text-secondary" style={{ lineHeight: "1.7" }}>
          Quizzes are created and scored at the discretion of the site administrators. We do not guarantee the availability, accuracy, or regularity of quizzes. Points and rankings are for entertainment purposes only and carry no monetary value.
        </p>
      </div>

      <div className="question-container">
        <div className="question-text text-red">
          Not Affiliated with Formula 1
        </div>
        <p className="text-secondary" style={{ lineHeight: "1.7" }}>
          we-check.ing is an unofficial fan project and is not affiliated with, endorsed by, or connected to Formula 1, the FIA, Formula One Management, or any Formula 1 team. F1, FORMULA ONE, and related marks are trademarks of Formula One Licensing B.V.
        </p>
      </div>

      <div className="question-container">
        <div className="question-text text-red">
          Intellectual Property
        </div>
        <p className="text-secondary" style={{ lineHeight: "1.7" }}>
          The we-check.ing name, design, and original content are owned by the site operator. All Formula 1-related trademarks belong to their respective owners. You may not reproduce or redistribute any part of this service without permission.
        </p>
      </div>

      <div className="question-container">
        <div className="question-text text-red">
          Termination
        </div>
        <p className="text-secondary" style={{ lineHeight: "1.7" }}>
          We may suspend or terminate your account at any time, with or without cause, including for violation of these terms. Upon termination, your right to use the service ceases immediately.
        </p>
      </div>

      <div className="question-container">
        <div className="question-text text-red">
          Limitation of Liability
        </div>
        <p className="text-secondary" style={{ lineHeight: "1.7" }}>
          we-check.ing is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the service, including loss of data or interruption of service.
        </p>
      </div>

      <div className="question-container">
        <div className="question-text text-red">
          Changes to These Terms
        </div>
        <p className="text-secondary" style={{ lineHeight: "1.7" }}>
          We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the updated terms. We encourage you to review this page periodically.
        </p>
      </div>

      <div style={{ marginTop: "24px", textAlign: "center" }}>
        <Link to="/privacy" className="text-red" style={{ fontWeight: 600 }}>
          View Privacy Policy →
        </Link>
      </div>
    </div>
  );
};

export default Terms;
