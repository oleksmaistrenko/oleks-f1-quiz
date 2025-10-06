import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { auth, logout, getUserProfile } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

const Header = () => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Fetch user profile to check if admin
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

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <header className="header">
      <div className="container header-content">
        <div className="header-title">Oleks F1 Quizz</div>
        
        <nav className="nav-menu">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            Play
          </Link>
          
          <Link to="/rankings" className={`nav-link ${location.pathname === '/rankings' ? 'active' : ''}`}>
            Rankings
          </Link>
          
          <Link to="/rules" className={`nav-link ${location.pathname === '/rules' ? 'active' : ''}`}>
            Rules
          </Link>
          
          {!loading && (
            <>
              {user ? (
                <div className="flex items-center" style={{ marginLeft: '20px' }}>
                  {isAdmin && (
                    <div className="nav-menu">
                      <Link to="/admin" className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}>
                        Admin
                      </Link>
                      <Link to="/users" className={`nav-link ${location.pathname === '/users' ? 'active' : ''}`}>
                        Users
                      </Link>
                    </div>
                  )}
                  {userProfile && (
                    <span className="text-sm" style={{ marginLeft: '20px' }}>
                      {userProfile.username} 
                      {isAdmin && <span className="ml-1 text-xs" style={{background: 'var(--f1-accent)', padding: '2px 4px', borderRadius: '3px'}}>Admin</span>}
                    </span>
                  )}
                  <button 
                    onClick={handleLogout}
                    className="btn btn-small"
                    style={{ marginLeft: '20px' }}>
                    Logout
                  </button>
                </div>
              ) : (
                <Link to="/login" className="btn">
                  Login
                </Link>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;