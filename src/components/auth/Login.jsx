import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginWithEmail, registerWithEmail, auth } from "../../firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is already signed in, redirect to home page (latest quiz)
        navigate("/");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleEmailChange = (e) => setEmail(e.target.value);
  const handlePasswordChange = (e) => setPassword(e.target.value);
  const handleUsernameChange = (e) => setUsername(e.target.value);

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError("Enter your email first");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      setError("");
    } catch (err) {
      setError("Could not send reset email. Check your email address.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegistering) {
        // Validate username for registration
        if (!username.trim()) {
          setError("Username is required");
          setLoading(false);
          return;
        }
        
        // Register new user with username
        await registerWithEmail(email, password, username);
        navigate("/");
      } else {
        // Login existing user
        await loginWithEmail(email, password);
        navigate("/");
      }
    } catch (error) {
      console.error("Authentication error:", error);
      setError(
        error.code === "auth/user-not-found" || error.code === "auth/wrong-password"
          ? "Invalid email or password"
          : error.code === "auth/email-already-in-use"
          ? "Email already in use"
          : "An error occurred during authentication"
      );
      setLoading(false);
    }
  };

  return (
    <div className="landing-page">
      {/* Hero */}
      <section className="landing-hero">
        <h1 className="landing-headline">The F1 quiz where nobody knows the answer</h1>
        <p className="landing-subtext">
          Born from 4 seasons of family arguments and group chat chaos. Not your usual "who won the race" trivia.
        </p>
        <button className="btn" onClick={() => document.getElementById('auth-form').scrollIntoView({ behavior: 'smooth' })}>
          Radio In
        </button>
      </section>

      {/* Pitch */}
      <section className="landing-pitch">
        <div className="pitch-card">
          <h3 className="pitch-title">Awkward questions</h3>
          <p className="pitch-text">
            "Will it be possible to spell SINGAPORE from the top-ten drivers' abbreviations?" You won't find the answer on Wikipedia.
          </p>
        </div>
        <div className="pitch-card">
          <h3 className="pitch-title">The whole grid</h3>
          <p className="pitch-text">
            Forget just the winners. This game makes you care about P14.
          </p>
        </div>
        <div className="pitch-card">
          <h3 className="pitch-title">Pure gamble</h3>
          <p className="pitch-text">
            Sometimes you know. Most times you don't. Like the sport itself.
          </p>
        </div>
        <div className="pitch-card">
          <h3 className="pitch-title">"We are checking"</h3>
          <p className="pitch-text">
            The most honest answer in F1. Here, everyone's an engineer — and nobody has the data.
          </p>
        </div>
      </section>

      {/* Testimonial */}
      <section className="landing-testimonial">
        <div className="testimonial-prefix">DRIVER:</div>
        <blockquote className="testimonial-quote">
          "Your game united our family. We discuss and quarrel about it."
        </blockquote>
      </section>

      {/* Auth form */}
      <div id="auth-form" className="max-w-md mx-auto">
      <div className="card">
        <h1 className="card-title text-center">
          {isRegistering ? "New Driver Registration" : "Radio In"}
        </h1>

        {error && (
          <div className="alert alert-error mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              required
              className="form-input"
              placeholder="Enter your email"
            />
          </div>

          {isRegistering && (
            <div className="form-group">
              <label className="form-label" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={handleUsernameChange}
                required
                className="form-input"
                placeholder="Choose a username"
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              required
              className="form-input"
              placeholder="Enter your password"
            />
          </div>

          {isRegistering && (
            <div className="form-group" style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <input
                type="checkbox"
                id="terms"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                style={{ marginTop: "3px", accentColor: "var(--wc-red)" }}
              />
              <label htmlFor="terms" className="text-secondary text-sm" style={{ lineHeight: "1.5", cursor: "pointer" }}>
                I agree to the{" "}
                <Link to="/terms" className="text-red" target="_blank" rel="noopener noreferrer">Terms of Service</Link>
                {" "}and{" "}
                <Link to="/privacy" className="text-red" target="_blank" rel="noopener noreferrer">Privacy Policy</Link>
              </label>
            </div>
          )}

          {!isRegistering && (
            <p className="text-right text-sm" style={{ marginTop: "-8px", marginBottom: "16px" }}>
              <span
                onClick={handleForgotPassword}
                className="text-blue-500"
                style={{ cursor: "pointer" }}
              >
                Forgot your password?
              </span>
            </p>
          )}

          {resetSent && (
            <div className="alert alert-success mb-4">
              Password reset email sent! Check your inbox.
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (isRegistering && !termsAccepted)}
            className={`btn btn-block ${
              loading ? "opacity-50" : ""
            }`}
          >
            {loading
              ? "Processing..."
              : isRegistering
              ? "Register"
              : "Radio In"}
          </button>

          <p className="text-center text-sm" style={{ marginTop: "16px" }}>
            {isRegistering
              ? "Already have an account? "
              : "Don't have an account? "}
            <span
              onClick={() => {
                setIsRegistering(!isRegistering);
                setTermsAccepted(false);
              }}
              className="text-blue-500"
              style={{ cursor: "pointer" }}
            >
              {isRegistering ? "Radio In" : "Register"}
            </span>
          </p>
        </form>
      </div>
      </div>
    </div>
  );
};

export default Login;