import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';
import { useModerator } from '../contexts/ModeratorContext'; // ✅ ADD THIS
import '../styles/Layout.css';

function Layout({ children }) {
  const { user, logout } = useAuth();
  const { isAdmin } = useAdmin();
  const { isModerator } = useModerator(); // ✅ ADD THIS
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showRecipesDropdown, setShowRecipesDropdown] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      alert('Logged out successfully!');
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="app-layout">
      {/* Header Navigation */}
      <header className="header">
        <div className="header-content">
          <button className="menu-btn">☰</button>
          <h1 className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            CookEase
          </h1>

          <div className="search-bar">
            <input type="text" placeholder="Search" />
            <button>🔍</button>
          </div>

          <nav className="nav">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="popular">Popular</Link>

            <div
              className="dropdown"
              onMouseEnter={() => setShowRecipesDropdown(true)}
              onMouseLeave={() => setShowRecipesDropdown(false)}
            >
              <button className="dropdown-btn">Discover ▼</button>

              <div className={`dropdown-content ${showRecipesDropdown ? "show" : ""}`}>
                <a href="#course">By Course</a>
                <Link to="/search-ingredients">By Ingredients</Link>
              </div>
            </div>


            <a href="#about" className="nav-link">About Us</a>

            <Link to="/add-recipe" className="add-recipe-link">
              + Add Recipe
            </Link>

            {/* ✅ MODERATOR LINK */}
            {isModerator && (
              <Link to="/moderator" className="moderator-link">
                📋 Moderator
              </Link>
            )}

            {/* ✅ ADMIN LINK */}
            {isAdmin && (
              <Link to="/admin" className="admin-link">
                ⚙️ Admin
              </Link>
            )}

            {user ? (
              <div className="user-menu">
                <button
                  className="user-btn"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  👤 {user.displayName || user.email || 'User'} ▼
                </button>

                {showUserMenu && (
                  <div className="user-dropdown">
                    <Link to="/profile" onClick={() => setShowUserMenu(false)}>
                      My Profile
                    </Link>
                    <Link to="/my-recipes" onClick={() => setShowUserMenu(false)}>
                      My Recipes
                    </Link>
                    <button onClick={handleLogout}>Logout</button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="login-link">Login</Link>
                <Link to="/signup" className="signup-link">Sign Up</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {children}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <p>&copy; 2026 CookEase. All rights reserved.</p>
          <div className="footer-links">
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
            <a href="#contact">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
