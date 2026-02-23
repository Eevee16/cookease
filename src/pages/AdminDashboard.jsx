import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useRoles } from "../contexts/RoleContext";
import { supabase } from "../supabaseClient";
import "../styles/AdminDashboard.css";

function AdminDashboard() {
  const { isAdmin, loading: roleLoading } = useRoles();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      alert("Access denied. Admins only.");
      navigate("/");
    }
  }, [isAdmin, roleLoading, navigate]);

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, role, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error("Error fetching users:", err);
      alert("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, currentRole, newRole) => {
    if (currentRole === newRole) return;
    if (!window.confirm(`Change this user's role to "${newRole}"?`)) return;
    setActionLoading(userId);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId);
      if (error) throw error;
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      alert("Failed to update role: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users
    .filter((u) => {
      if (activeTab === "all") return true;
      if (activeTab === "moderators") return u.role === "moderator";
      if (activeTab === "admins") return u.role === "admin";
      return !u.role || u.role === "user";
    })
    .filter((u) =>
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const stats = {
    total: users.length,
    regular: users.filter((u) => !u.role || u.role === "user").length,
    moderators: users.filter((u) => u.role === "moderator").length,
    admins: users.filter((u) => u.role === "admin").length,
  };

  const getRoleBadgeClass = (role) => {
    if (role === "admin") return "role-badge admin";
    if (role === "moderator") return "role-badge moderator";
    return "role-badge user";
  };

  if (roleLoading || loading) {
    return (
      <div className="admin-dashboard">
        <div className="admin-loading">
          <div className="admin-spinner"></div>
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-content">
          <div>
            <h1>⚙️ Admin Dashboard</h1>
            <p className="admin-subtitle">Manage users and roles</p>
          </div>
          <Link to="/" className="admin-back-btn">← Back to Home</Link>
        </div>
      </header>

      <div className="admin-main">
        {/* Stats */}
        <div className="admin-stats">
          <div className="admin-stat-card">
            <span className="admin-stat-number">{stats.total}</span>
            <span className="admin-stat-label">Total Users</span>
          </div>
          <div className="admin-stat-card regular">
            <span className="admin-stat-number">{stats.regular}</span>
            <span className="admin-stat-label">Regular Users</span>
          </div>
          <div className="admin-stat-card moderator">
            <span className="admin-stat-number">{stats.moderators}</span>
            <span className="admin-stat-label">Moderators</span>
          </div>
          <div className="admin-stat-card admin-card">
            <span className="admin-stat-number">{stats.admins}</span>
            <span className="admin-stat-label">Admins</span>
          </div>
        </div>

        {/* Search + Tabs */}
        <div className="admin-controls">
          <input
            type="text"
            placeholder="🔍 Search by email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="admin-search"
          />
          <div className="admin-tabs">
            {[
              { key: "all", label: `All (${stats.total})` },
              { key: "regular", label: `Users (${stats.regular})` },
              { key: "moderators", label: `Moderators (${stats.moderators})` },
              { key: "admins", label: `Admins (${stats.admins})` },
            ].map((tab) => (
              <button
                key={tab.key}
                className={`admin-tab-btn ${activeTab === tab.key ? "active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* User Table */}
        {filteredUsers.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon">👤</div>
            <p>No users found</p>
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Current Role</th>
                  <th>Joined</th>
                  <th>Change Role</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td className="user-email">{u.email || "—"}</td>
                    <td>
                      <span className={getRoleBadgeClass(u.role)}>
                        {u.role || "user"}
                      </span>
                    </td>
                    <td className="user-date">
                      {u.created_at
                        ? new Date(u.created_at).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="role-actions">
                      {u.role !== "user" && u.role !== null && (
                        <button
                          className="role-btn demote"
                          disabled={actionLoading === u.id}
                          onClick={() => handleRoleChange(u.id, u.role, "user")}
                        >
                          {actionLoading === u.id ? "..." : "→ User"}
                        </button>
                      )}
                      {u.role !== "moderator" && (
                        <button
                          className="role-btn promote-mod"
                          disabled={actionLoading === u.id}
                          onClick={() => handleRoleChange(u.id, u.role, "moderator")}
                        >
                          {actionLoading === u.id ? "..." : "→ Moderator"}
                        </button>
                      )}
                      {u.role !== "admin" && (
                        <button
                          className="role-btn promote-admin"
                          disabled={actionLoading === u.id}
                          onClick={() => handleRoleChange(u.id, u.role, "admin")}
                        >
                          {actionLoading === u.id ? "..." : "→ Admin"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;