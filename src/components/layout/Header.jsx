import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { auth, logout, getUserProfile } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useToast } from "../ui/Toast";

const radioQuotes = [
  "Bono, my tyres are gone.",
  "No, no, no, no, no! That was so not right!",
  "FOR WHAT?!",
  "We are checking.",
  "Slow button on. Slow button on.",
  "You will not have the drink.",
  "I'm stupid. I'm stupid.",
  "Leave me alone, I know what I'm doing.",
  "Mein Gott, muss das sein?!",
  "All the time you have to leave a space!",
  "GP2 engine! GP2! Aaargh!",
  "Copy, we are looking into it.",
  "The car felt great. Much slower than before. Amazing.",
  "No power! No power!",
  "Plan D. Plan D.",
  "Is that Glock?!",
  "Gentlemen, a short view back to the past...",
  "They race me so hard.",
  "To whom it may concern...",
  "Box, box. Box, box.",
  "Karma.",
  "Now we can fight.",
  "Still we rise.",
  "What a mental guy!",
  "I will not forget this.",
  "No, you will not have the drink. No, you will not have the drink.",
  "Simply lovely, huh? Simply lovely.",
  "This guy makes us look like amateurs!",
  "Fernando is faster than you. Can you confirm you understood that message?",
  "Where is Palmer? Retired? Karma.",
  "I want to pass. I don't want to stay behind Vettel all my life.",
  "We look like a bunch of wankers.",
  "P1, Sebastian! P1!",
  "IN IN IN IN IN IN IN. Stay out! Stay out!",
  "Blue flags! Blue flags!",
  "Grazie ragazzi! Grande lavoro!",
];

const Header = () => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const addToast = useToast();
  const logoClickCount = useRef(0);
  const logoClickTimer = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          const profile = await getUserProfile(currentUser.uid);
          setUserProfile(profile);
          setIsAdmin(profile?.role === 'admin');
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const navLinkClass = (path) =>
    `nav-link ${location.pathname === path ? 'active' : ''}`;

  return (
    <header className="header">
      <div className="container header-content">
        <Link
          to="/"
          className="header-title"
          onClick={(e) => {
            logoClickCount.current += 1;
            clearTimeout(logoClickTimer.current);
            if (logoClickCount.current >= 5) {
              e.preventDefault();
              logoClickCount.current = 0;
              const quote = radioQuotes[Math.floor(Math.random() * radioQuotes.length)];
              addToast(quote, "info", 4000);
            } else if (logoClickCount.current > 1) {
              e.preventDefault();
              logoClickTimer.current = setTimeout(() => {
                logoClickCount.current = 0;
              }, 2000);
            } else {
              logoClickTimer.current = setTimeout(() => {
                logoClickCount.current = 0;
              }, 2000);
            }
          }}
        >we-check.ing</Link>

        <button
          className="menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`menu-toggle-bar ${menuOpen ? 'open' : ''}`} />
          <span className={`menu-toggle-bar ${menuOpen ? 'open' : ''}`} />
          <span className={`menu-toggle-bar ${menuOpen ? 'open' : ''}`} />
        </button>

        <div className={`header-nav ${menuOpen ? 'header-nav-open' : ''}`}>
          <nav className="nav-menu">
            <Link to="/" className={navLinkClass('/')}>Play</Link>
            <Link to="/dashboard" className={navLinkClass('/dashboard')}>Pit Wall</Link>
            <Link to="/rankings" className={navLinkClass('/rankings')}>Rankings</Link>
            <Link to="/head-to-head" className={navLinkClass('/head-to-head')}>H2H</Link>
            <Link to="/rules" className={navLinkClass('/rules')}>Briefing</Link>
            {isAdmin && (
              <>
                <Link to="/admin" className={navLinkClass('/admin')}>Admin</Link>
                <Link to="/users" className={navLinkClass('/users')}>Users</Link>
                <Link to="/admin/feedback" className={navLinkClass('/admin/feedback')}>Feedback</Link>
              </>
            )}
          </nav>

          <div className="header-user">
            {!loading && (
              <>
                {user ? (
                  <>
                    {userProfile && (
                      <span className="header-username">
                        {userProfile.username}
                        {isAdmin && <span className="header-admin-badge">Admin</span>}
                      </span>
                    )}
                    <button onClick={handleLogout} className="btn btn-small btn-secondary">
                      Radio Out
                    </button>
                  </>
                ) : (
                  location.pathname !== '/login' && (
                    <Link to="/login" className="btn btn-small">Radio In</Link>
                  )
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
