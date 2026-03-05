import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import "../styles/AdminApproval.css";

function AdminApproval() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let query = supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (filter !== "all") query = query.eq("approval_status", filter);
      const { data, error } = await query;
      if (error) throw error;
      setPendingUsers(data || []);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      await supabase.from("profiles").update({ approval_status: "approved" }).eq("id", userId);
      fetchUsers();
    } catch (err) { console.error(err); }
  };

  const handleReject = async (userId) => {
    try {
      await supabase.from("profiles").update({ approval_status: "rejected" }).eq("id", userId);
      fetchUsers();
    } catch (err) { console.error(err); }
  };

  const statusColor = { approved: "#10b981", rejected: "#ef4444", pending: "#f59e0b" };

  return (
    <div className="admin-approval-page">
      <div className="admin-approval-header">
        <div>
          <h1>User Approval</h1>
          <p>Review and verify new user registrations</p>
        </div>
      </div>

      {/* How it works info box */}
      <div className="approval-info-box">
        <h3>💡 How User Approval Works</h3>
        <div className="approval-info-grid">
          <div className="approval-info-item">
            <span>1️⃣</span>
            <div>
              <strong>User Registers</strong>
              <p>New users sign up and their account is marked as "pending" until reviewed.</p>
            </div>
          </div>
          <div className="approval-info-item">
            <span>2️⃣</span>
            <div>
              <strong>Admin Reviews</strong>
              <p>Check their profile info, email domain, and registration date to verify legitimacy.</p>
            </div>
          </div>
          <div className="approval-info-item">
            <span>3️⃣</span>
            <div>
              <strong>Approve or Reject</strong>
              <p>Approved users get full access. Rejected users are blocked from posting recipes.</p>
            </div>
          </div>
        </div>
        <p className="approval-note">⚠️ Requires an <code>approval_status</code> column in your <code>profiles</code> table with values: <code>pending</code>, <code>approved</code>, <code>rejected</code>.</p>
      </div>

      <div className="approval-filters">
        {["pending", "approved", "rejected", "all"].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`approval-filter-btn ${filter === f ? "active" : ""}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="approval-loading">Loading users...</div>
      ) : pendingUsers.length === 0 ? (
        <div className="approval-empty">
          <span>✅</span>
          <p>No {filter === "all" ? "" : filter} users found.</p>
        </div>
      ) : (
        <div className="approval-table-wrap">
          <table className="approval-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Joined</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingUsers.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="approval-user-cell">
                      <div className="approval-avatar">{(u.full_name || u.email || "?")[0].toUpperCase()}</div>
                      <span>{u.full_name || "No name"}</span>
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td>
                    <span className="approval-status-badge" style={{ background: statusColor[u.approval_status] + "22", color: statusColor[u.approval_status] }}>
                      {u.approval_status || "pending"}
                    </span>
                  </td>
                  <td>
                    <div className="approval-actions">
                      {u.approval_status !== "approved" && (
                        <button className="approval-btn approve" onClick={() => handleApprove(u.id)}>✓ Approve</button>
                      )}
                      {u.approval_status !== "rejected" && (
                        <button className="approval-btn reject" onClick={() => handleReject(u.id)}>✕ Reject</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminApproval;