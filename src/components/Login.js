import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loginWithEmail, registerWithEmail, auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
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
    <div className="card racing-pattern">
      <h1 className="card-title text-center">
        {isRegistering ? "Create an Account" : "Login to F1 Quiz"}
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

        <div className="flex flex-col space-y-4">
          <button
            type="submit"
            disabled={loading}
            className={`btn btn-block ${
              loading ? "opacity-50" : ""
            }`}
          >
            {loading
              ? "Processing..."
              : isRegistering
              ? "Create Account"
              : "Login"}
          </button>

          <button
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            className="btn btn-small btn-secondary"
          >
            {isRegistering
              ? "Already have an account? Login"
              : "Don't have an account? Register"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Login;