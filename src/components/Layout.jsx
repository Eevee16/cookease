import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useRoles } from "../contexts/RoleContext";
import { supabase } from "../supabaseClient";
import "../styles/Layout.css";
import "../styles/notification.css";

function Layout({ children }) {
  const { user, logout, isAdmin, isModerator } = useRoles();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showRecipesDropdown, setShowRecipesDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef(null);

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

  return (
    <div className="app-layout">
      <header className="header">
        <div className="header-content">
          <button className="menu-btn">☰</button>
          <h1 className="logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>CookEase</h1>

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
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/popular" className="nav-link">Popular</Link>

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

            <Link to="/add-recipe" className="add-recipe-link">+ Add Recipe</Link>
            {isModerator && <Link to="/moderator" className="moderator-link">📋 Moderator</Link>}

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
                    <Link to="/profile" onClick={() => setShowUserMenu(false)}>My Profile</Link>
                    <Link to="/my-recipes" onClick={() => setShowUserMenu(false)}>My Recipes</Link>
                    <div className="user-dropdown-divider" />
                    <Link to="/about" onClick={() => setShowUserMenu(false)}>About Us</Link>
                    <Link to="/contact" onClick={() => setShowUserMenu(false)}>Contact Us</Link>
                    {isAdmin && (
                      <>
                        <div className="user-dropdown-divider" />
                        <span className="user-dropdown-section-label">Admin</span>
                        <Link to="/admin" onClick={() => setShowUserMenu(false)}>⚙️ Dashboard</Link>
                        <Link to="/admin-approval" onClick={() => setShowUserMenu(false)}>✅ User Approval</Link>
                        <Link to="/admin-stats" onClick={() => setShowUserMenu(false)}>📊 Statistics</Link>
                        <Link to="/admin-punishment" onClick={() => setShowUserMenu(false)}>🚫 User Moderation</Link>
                      </>
                    )}
                    <div className="user-dropdown-divider" />
                    <button onClick={logout}>Logout</button>
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