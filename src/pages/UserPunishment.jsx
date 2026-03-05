import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useRoles } from "../contexts/RoleContext";
import "../styles/UserPunishment.css";

// Helper to get display name from any profile shape
const getDisplayName = (u) => u?.full_name || u?.username || u?.name || u?.display_name || null;

function UserPunishment() {
  const { isAdmin } = useRoles();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(null);
  const [profileColumns, setProfileColumns] = useState([]);

  useEffect(() => {
    if (!isAdmin) { navigate("/"); return; }
    fetchUsers();
  }, [isAdmin]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const users = data || [];
      // Log columns to help debug name field
      if (users.length > 0) {
        console.log("Profile columns:", Object.keys(users[0]));
        setProfileColumns(Object.keys(users[0]));
      }
      setUsers(users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sendNotification = async (userId, type, title, message) => {
    try {
      await supabase.from("notifications").insert([{
        user_id: userId,
        type,
        title,
        message,
        read: false,
      }]);
    } catch (err) {
      console.error("Notification error:", err);
    }
  };

  const handlePunish = async (action, reason, duration = null) => {
    if (!selected) return;
    try {
      if (action === "warn") {
        await supabase.from("profiles").update({
          warning_count: (selected.warning_count || 0) + 1,
          warning: reason
        }).eq("id", selected.id);
        await sendNotification(
          selected.id,
          "warning",
          "⚠️ You have received a warning",
          `Reason: ${reason}`
        );
      } else if (action === "tempban") {
        const until = new Date();
        until.setDate(until.getDate() + (duration || 7));
        await supabase.from("profiles").update({
          status: "tempbanned",
          ban_until: until.toISOString(),
          ban_reason: reason
        }).eq("id", selected.id);
        await sendNotification(
          selected.id,
          "tempban",
          `🕐 Your account has been temporarily suspended for ${duration} day${duration > 1 ? "s" : ""}`,
          `Reason: ${reason}. Your access will be restored on ${until.toLocaleDateString()}.`
        );
      } else if (action === "permban") {
        await supabase.from("profiles").update({
          status: "banned",
          ban_reason: reason
        }).eq("id", selected.id);
        await sendNotification(
          selected.id,
          "ban",
          "🚫 Your account has been permanently banned",
          `Reason: ${reason}. If you believe this is a mistake, contact support.`
        );
      } else if (action === "removerecipes") {
        await supabase.from("recipes").update({ status: "removed" }).eq("owner_id", selected.id);
        await sendNotification(
          selected.id,
          "warning",
          "🗑️ Your recipes have been removed",
          "All your submitted recipes have been removed by an administrator due to policy violations."
        );
      }
      setModal(null);
      setSelected(null);
      fetchUsers();
    } catch (err) {
      console.error("Punishment error:", err);
      alert("Action failed: " + err.message);
    }
  };

  const filtered = users.filter(u => {
    const name = getDisplayName(u) || "";
    const email = u.email || "";
    const q = search.toLowerCase();
    return name.toLowerCase().includes(q) || email.toLowerCase().includes(q);
  });

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "—";
  const statusColor = { active: "#10b981", tempbanned: "#f59e0b", banned: "#ef4444" };

  return (
    <div className="punishment-page">
      <div className="punishment-header">
        <div>
          <h1>User Management</h1>
          <p>Issue warnings, bans, and manage user content</p>
        </div>
        <input
          className="punishment-search"
          placeholder="🔍 Search users..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="punishment-legend">
        <span className="legend-item"><span className="dot warn"></span> Warning</span>
        <span className="legend-item"><span className="dot tempban"></span> Temp Ban</span>
        <span className="legend-item"><span className="dot permban"></span> Permanent Ban</span>
        <span className="legend-item"><span className="dot recipes"></span> Remove Recipes</span>
      </div>

      {loading ? (
        <div className="punishment-loading">Loading users...</div>
      ) : filtered.length === 0 ? (
        <div className="punishment-empty">No users found.</div>
      ) : (
        <div className="punishment-table-wrap">
          <div className="punishment-table-header">
            <span>User</span>
            <span>Email</span>
            <span>Status</span>
            <span>Warnings</span>
            <span>Joined</span>
            <span>Actions</span>
          </div>
          {filtered.map(user => (
            <div className="punishment-row" key={user.id}>
              <div className="punishment-user">
                <div className="punishment-avatar">
                  {(getDisplayName(user) || user.email || "U")[0].toUpperCase()}
                </div>
                <div>
                  <span className="punishment-name">
                    {getDisplayName(user) || <span style={{ color: "#9ca3af", fontStyle: "italic" }}>No name</span>}
                  </span>
                  {user.warning_count > 0 && (
                    <span className="warning-badge">⚠️ {user.warning_count}</span>
                  )}
                </div>
              </div>
              <span className="punishment-email">{user.email}</span>
              <span className="punishment-status" style={{ color: statusColor[user.status] || "#6b7280" }}>
                {user.status || "active"}
              </span>
              <span className={`punishment-warnings ${(user.warning_count || 0) >= 2 ? "high" : ""}`}>
                {user.warning_count || 0}
              </span>
              <span className="punishment-date">{formatDate(user.created_at)}</span>
              <div className="punishment-actions">
                <button className="punish-btn warn" onClick={() => { setSelected(user); setModal("warn"); }} title="Issue Warning">⚠️</button>
                <button className="punish-btn tempban" onClick={() => { setSelected(user); setModal("tempban"); }} title="Temp Ban">🕐</button>
                <button className="punish-btn permban" onClick={() => { setSelected(user); setModal("permban"); }} title="Permanent Ban">🚫</button>
                <button className="punish-btn recipes" onClick={() => { setSelected(user); setModal("recipes"); }} title="Remove Recipes">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && selected && (
        <PunishmentModal
          user={selected}
          action={modal}
          onConfirm={handlePunish}
          onClose={() => { setModal(null); setSelected(null); }}
        />
      )}
    </div>
  );
}

function PunishmentModal({ user, action, onConfirm, onClose }) {
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState(7);
  const displayName = getDisplayName(user) || user.email;

  const configs = {
    warn: { title: "Issue Warning", color: "#f59e0b", icon: "⚠️", desc: `Send a warning to ${displayName}.` },
    tempban: { title: "Temporary Ban", color: "#ef4444", icon: "🕐", desc: `Temporarily restrict ${displayName} from the platform.` },
    permban: { title: "Permanent Ban", color: "#7f1d1d", icon: "🚫", desc: `Permanently ban ${displayName}. Can be reversed by an admin.` },
    recipes: { title: "Remove All Recipes", color: "#6b7280", icon: "🗑️", desc: `Remove all recipes submitted by ${displayName}.` },
  };

  const c = configs[action];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ borderTop: `5px solid ${c.color}` }}>
          <span className="modal-icon">{c.icon}</span>
          <h3>{c.title}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <p className="modal-desc">{c.desc}</p>
        {action === "tempban" && (
          <div className="modal-field">
            <label>Ban Duration (days)</label>
            <select value={duration} onChange={e => setDuration(Number(e.target.value))}>
              {[1, 3, 7, 14, 30].map(d => <option key={d} value={d}>{d} day{d > 1 ? "s" : ""}</option>)}
            </select>
          </div>
        )}
        {action !== "recipes" && (
          <div className="modal-field">
            <label>Reason *</label>
            <textarea placeholder="Explain the reason..." value={reason} onChange={e => setReason(e.target.value)} rows="3" />
          </div>
        )}
        <div className="modal-actions">
          <button className="modal-cancel" onClick={onClose}>Cancel</button>
          <button
            className="modal-confirm"
            style={{ background: c.color }}
            onClick={() => {
              if (action !== "recipes" && !reason.trim()) { alert("Please provide a reason."); return; }
              onConfirm(action, reason, duration);
            }}
          >
            Confirm {c.title}
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserPunishment;