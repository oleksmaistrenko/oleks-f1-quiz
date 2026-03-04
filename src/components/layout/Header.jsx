import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { auth, logout, getUserProfile } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";

const Header = () => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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
        <Link to="/" className="header-title">we-check.ing</Link>

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
