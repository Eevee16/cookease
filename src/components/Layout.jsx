import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useRoles } from "../contexts/RoleContext";
import "../styles/Layout.css";

function Layout({ children }) {
  const { user, logout, isAdmin, isModerator } = useRoles();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showRecipesDropdown, setShowRecipesDropdown] = useState(false);

  return (
    <div className="app-layout">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <button className="menu-btn">☰</button>

          <h1
            className="logo"
            onClick={() => navigate("/")}
            style={{ cursor: "pointer" }}
          >
            CookEase
          </h1>

          <div className="search-bar">
            <input type="text" placeholder="Search" />
            <button>🔍</button>
          </div>

          {/* Navigation */}
          <nav className="nav">
            <Link to="/">Home</Link>
            <Link to="/popular">Popular</Link>

            <div
              className="dropdown"
              onMouseEnter={() => setShowRecipesDropdown(true)}
              onMouseLeave={() => setShowRecipesDropdown(false)}
            >
              <button className="dropdown-btn">Discover ▼</button>
              <div className={`dropdown-content ${showRecipesDropdown ? "show" : ""}`}>
                <Link to="/search-course-cuisine">By Course</Link>
                <Link to="/search-ingredients">By Ingredients</Link>
              </div>
            </div>

            <Link to="/add-recipe" className="add-recipe-link">
              + Add Recipe
            </Link>

            {/* Moderator/Admin Links */}
            {isModerator && <Link to="/moderator">📋 Moderator</Link>}
            {isAdmin && <Link to="/admin">⚙️ Admin</Link>}

            {/* User Dropdown */}
            {user ? (
              <div className="user-menu">
                <button onClick={() => setShowUserMenu(!showUserMenu)}>
                  👤 {user.email} ▼
                </button>

                {showUserMenu && (
                  <div className="user-dropdown">
                    <Link to="/profile" onClick={() => setShowUserMenu(false)}>
                      My Profile
                    </Link>
                    <Link to="/my-recipes" onClick={() => setShowUserMenu(false)}>
                      My Recipes
                    </Link>
                    <button onClick={logout}>Logout</button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login">Login</Link>
                <Link to="/signup">Sign Up</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">{children}</main>

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
