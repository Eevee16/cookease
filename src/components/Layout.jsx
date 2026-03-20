import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useRoles } from "../contexts/RoleContext";
import { supabase } from "../supabaseClient";
import "../styles/Layout.css";
import "../styles/notification.css";

function Layout({ children }) {
  const { user, logout, isAdmin, isModerator } = useRoles();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showRecipesDropdown, setShowRecipesDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef(null);

  // ✅ Ban popup state
  const [banPopup, setBanPopup] = useState(null); // null | { type: "tempbanned"|"banned", until?: string, reason?: string }

  // Helper function to check if a path is active
  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    const channel = supabase
      .channel("notifications:" + user.id)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev]);
        setUnreadCount(prev => prev + 1);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target))
        setShowNotifications(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      setNotifications(data || []);
      setUnreadCount((data || []).filter(n => !n.read).length);
    } catch (err) { console.error(err); }
  };

  const markAllRead = async () => {
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const markOneRead = async (id) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const notifIcon = (type) => ({ warning: "⚠️", tempban: "🕐", ban: "🚫", success: "✅" }[type] || "🔔");
  const notifColor = (type) => ({ warning: "#f59e0b", tempban: "#ef4444", ban: "#991b1b", success: "#10b981" }[type] || "#667EAA");

  const formatTime = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const handleSearchInputKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch(e);
  };

  // ✅ Intercept Add Recipe click — check ban before navigating
  const handleAddRecipeClick = async (e) => {
    e.preventDefault();

    // Not logged in — go to login normally
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("status, ban_until, ban_reason")
        .eq("id", user.id)
        .single();

      if (profile?.status === "banned") {
        setBanPopup({ type: "banned", reason: profile.ban_reason });
        return;
      }

      if (profile?.status === "tempbanned") {
        const banUntil = new Date(profile.ban_until);
        if (banUntil > new Date()) {
          setBanPopup({ type: "tempbanned", until: profile.ban_until, reason: profile.ban_reason });
          return;
        }
        // Ban expired — let through
      }

      navigate("/add-recipe");
    } catch {
      // On error just navigate normally
      navigate("/add-recipe");
    }
  };

  return (
    <div className="app-layout">

      {/* ✅ Ban Popup */}
      {banPopup && (
        <div className="ban-popup-overlay" onClick={() => setBanPopup(null)}>
          <div className="ban-popup" onClick={e => e.stopPropagation()}>
            <div className="ban-popup-icon">
              {banPopup.type === "banned" ? "🚫" : "🕐"}
            </div>
            <h3 className="ban-popup-title">
              {banPopup.type === "banned" ? "Permanently Banned" : "Temporarily Suspended"}
            </h3>
            <p className="ban-popup-message">
              {banPopup.type === "banned"
                ? "Your account has been permanently banned. You cannot add recipes."
                : `You are suspended and cannot add recipes until:`}
            </p>
            {banPopup.type === "tempbanned" && (
              <div className="ban-popup-date">
                {new Date(banPopup.until).toLocaleDateString("en-PH", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                })}
              </div>
            )}
            {banPopup.reason && (
              <p className="ban-popup-reason">
                <strong>Reason:</strong> {banPopup.reason}
              </p>
            )}
            <p className="ban-popup-contact">
              If you believe this is a mistake, please contact support.
            </p>
            <button className="ban-popup-close-btn" onClick={() => setBanPopup(null)}>
              Close
            </button>
          </div>
        </div>
      )}

      <header className="header">
        <div className="header-content">
          
          <h1 className="logo" onClick={() => navigate(user ? "/home" : "/")} style={{ cursor: "pointer" }}>CookEase</h1>

          <form className="search-bar" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleSearchInputKeyPress}
            />
            <button type="submit">🔍</button>
          </form>

          <nav className="nav">
            <Link to="/home" className={`nav-link ${isActive('/home') ? 'active' : ''}`}>Home</Link>
            <Link to="/popular" className={`nav-link ${isActive('/popular') ? 'active' : ''}`}>Popular</Link>

            <div
              className="dropdown"
              onMouseEnter={() => setShowRecipesDropdown(true)}
              onMouseLeave={() => setShowRecipesDropdown(false)}
            >
              <button 
                className={`dropdown-btn ${(isActive('/search-course-cuisine') || isActive('/search-ingredients')) ? 'active' : ''}`}
                onClick={() => setShowRecipesDropdown(prev => !prev)}
              >
                Discover ▼
              </button>
              <div className={`dropdown-content ${showRecipesDropdown ? "show" : ""}`}>
                <Link 
                  to="/search-course-cuisine" 
                  className={isActive('/search-course-cuisine') ? 'active' : ''}
                  onClick={() => setShowRecipesDropdown(false)}
                >
                  By Course
                </Link>
                <Link 
                  to="/search-ingredients" 
                  className={isActive('/search-ingredients') ? 'active' : ''}
                  onClick={() => setShowRecipesDropdown(false)}
                >
                  By Ingredients
                </Link>
              </div>
            </div>

            {/* ✅ Add Recipe now uses onClick handler instead of plain Link */}
            <a 
              href="/add-recipe" 
              className={`add-recipe-link ${isActive('/add-recipe') ? 'active' : ''}`}
              onClick={handleAddRecipeClick}
            >
              + Add Recipe
            </a>

            {isModerator && (
              <Link 
                to="/moderator" 
                className={`moderator-link ${isActive('/moderator') ? 'active' : ''}`}
              >
                📋 Moderator
              </Link>
            )}

            {/* Notification Bell */}
            {user && (
              <div className="notif-wrapper" ref={notifRef}>
                <button
                  className="notif-btn"
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    if (!showNotifications && unreadCount > 0) markAllRead();
                  }}
                >
                  🔔
                  {unreadCount > 0 && (
                    <span className="notif-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
                  )}
                </button>

                {showNotifications && (
                  <div className="notif-dropdown">
                    <div className="notif-dropdown-header">
                      <span>Notifications</span>
                      {unreadCount > 0 && (
                        <button className="notif-clear" onClick={markAllRead}>Mark all read</button>
                      )}
                    </div>
                    <div className="notif-list">
                      {notifications.length === 0 ? (
                        <div className="notif-empty">
                          <span>🔔</span>
                          <p>No notifications yet</p>
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div
                            key={n.id}
                            className={`notif-item ${!n.read ? "unread" : ""}`}
                            onClick={() => !n.read && markOneRead(n.id)}
                          >
                            <div className="notif-icon-wrap" style={{ background: notifColor(n.type) + "22", color: notifColor(n.type) }}>
                              {notifIcon(n.type)}
                            </div>
                            <div className="notif-content">
                              <p className="notif-title">{n.title}</p>
                              <p className="notif-message">{n.message}</p>
                              <span className="notif-time">{formatTime(n.created_at)}</span>
                            </div>
                            {!n.read && <div className="notif-dot" />}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {user ? (
              <div className="user-menu">
                <button className="user-btn" onClick={() => setShowUserMenu(!showUserMenu)}>
                  👤 {user.email} ▼
                </button>

                {showUserMenu && (
                  <div className="user-dropdown">
                    <Link 
                      to="/profile" 
                      className={isActive('/profile') ? 'active' : ''}
                      onClick={() => setShowUserMenu(false)}
                    >
                      My Profile
                    </Link>
                    <Link 
                      to="/my-recipes" 
                      className={isActive('/my-recipes') ? 'active' : ''}
                      onClick={() => setShowUserMenu(false)}
                    >
                      My Recipes
                    </Link>
                    <div className="user-dropdown-divider" />
                    <Link 
                      to="/about" 
                      className={isActive('/about') ? 'active' : ''}
                      onClick={() => setShowUserMenu(false)}
                    >
                      About Us
                    </Link>
                    <Link 
                      to="/contact" 
                      className={isActive('/contact') ? 'active' : ''}
                      onClick={() => setShowUserMenu(false)}
                    >
                      Contact Us
                    </Link>
                    {isAdmin && (
                      <>
                        <div className="user-dropdown-divider" />
                        <span className="user-dropdown-section-label">Admin</span>
                        <Link 
                          to="/admin" 
                          className={isActive('/admin') ? 'active' : ''}
                          onClick={() => setShowUserMenu(false)}
                        >
                          ⚙️ Dashboard
                        </Link>
                        <Link 
                          to="/admin-approval" 
                          className={isActive('/admin-approval') ? 'active' : ''}
                          onClick={() => setShowUserMenu(false)}
                        >
                          ✅ User Approval
                        </Link>
                        <Link 
                          to="/admin-stats" 
                          className={isActive('/admin-stats') ? 'active' : ''}
                          onClick={() => setShowUserMenu(false)}
                        >
                          📊 Statistics
                        </Link>
                        <Link 
                          to="/admin-punishment" 
                          className={isActive('/admin-punishment') ? 'active' : ''}
                          onClick={() => setShowUserMenu(false)}
                        >
                          🚫 User Moderation
                        </Link>
                      </>
                    )}
                    <div className="user-dropdown-divider" />
                    <button onClick={logout}>Logout</button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className={`login-link ${isActive('/login') ? 'active' : ''}`}
                >
                  Login
                </Link>
                <Link 
                  to="/signup" 
                  className={`signup-link ${isActive('/signup') ? 'active' : ''}`}
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="main-content">{children}</main>

      <footer className="footer">
        <div className="footer-content">
          <p>&copy; 2026 CookEase. All rights reserved.</p>
          <div className="footer-links">
            <Link to="/about">About Us</Link>
            <Link to="/contact">Contact</Link>
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Layout;