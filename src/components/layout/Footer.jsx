import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";

const Footer = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  return (
    <footer className="footer">
      <div className="container footer-content">
        <span className="footer-copy">&copy; 2026 we-check.ing</span>
        <nav className="footer-links">
          <Link to="/terms" className="footer-link">Terms</Link>
          <span className="footer-separator">&middot;</span>
          <Link to="/privacy" className="footer-link">Privacy</Link>
          {user && (
            <>
              <span className="footer-separator">&middot;</span>
              <Link to="/feedback" className="footer-link">Feedback</Link>
            </>
          )}
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
