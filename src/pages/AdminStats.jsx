import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import "../styles/AdminStats.css";

function AdminStats() {
  const [stats, setStats] = useState(null);
  const [recentRecipes, setRecentRecipes] = useState([]);
  const [topViewed, setTopViewed] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const [
          { count: totalRecipes },
          { count: approvedRecipes },
          { count: pendingRecipes },
          { count: totalUsers },
          { data: topRecipes },
          { data: recent },
          { count: totalVotes },
        ] = await Promise.all([
          supabase.from("recipes").select("*", { count: "exact", head: true }),
          supabase.from("recipes").select("*", { count: "exact", head: true }).eq("status", "approved"),
          supabase.from("recipes").select("*", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("recipes").select("id, title, view_count, owner_name").eq("status", "approved").order("view_count", { ascending: false }).limit(5),
          supabase.from("recipes").select("id, title, status, created_at, owner_name").order("created_at", { ascending: false }).limit(5),
          supabase.from("votes").select("*", { count: "exact", head: true }),
        ]);

        setStats({ totalRecipes, approvedRecipes, pendingRecipes, totalUsers, totalVotes });
        setTopViewed(topRecipes || []);
        setRecentRecipes(recent || []);
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="stats-loading">Loading statistics...</div>;

  const cards = [
    { label: "Total Recipes", value: stats?.totalRecipes ?? 0, icon: "📖", color: "#667EAA" },
    { label: "Approved Recipes", value: stats?.approvedRecipes ?? 0, icon: "✅", color: "#10b981" },
    { label: "Pending Review", value: stats?.pendingRecipes ?? 0, icon: "⏳", color: "#f59e0b" },
    { label: "Total Users", value: stats?.totalUsers ?? 0, icon: "👥", color: "#8b5cf6" },
    { label: "Total Votes", value: stats?.totalVotes ?? 0, icon: "▲", color: "#ec4899" },
    { label: "Approval Rate", value: stats?.totalRecipes ? `${Math.round((stats.approvedRecipes / stats.totalRecipes) * 100)}%` : "0%", icon: "📊", color: "#06b6d4" },
  ];

  return (
    <div className="stats-page">
      <div className="stats-header">
        <h1>Platform Statistics</h1>
        <p>Real-time overview of CookEase activity</p>
      </div>

      <div className="stats-cards">
        {cards.map((c, i) => (
          <div className="stats-card" key={i} style={{ borderTop: `4px solid ${c.color}` }}>
            <div className="stats-card-icon">{c.icon}</div>
            <div className="stats-card-value">{c.value}</div>
            <div className="stats-card-label">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="stats-tables">
        <div className="stats-table-section">
          <h2>🔥 Most Viewed Recipes</h2>
          <table className="stats-table">
            <thead><tr><th>#</th><th>Recipe</th><th>Author</th><th>Views</th></tr></thead>
            <tbody>
              {topViewed.map((r, i) => (
                <tr key={r.id}>
                  <td>{i + 1}</td>
                  <td>{r.title}</td>
                  <td>{r.owner_name || "—"}</td>
                  <td>👁️ {r.view_count || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="stats-table-section">
          <h2>🆕 Recent Submissions</h2>
          <table className="stats-table">
            <thead><tr><th>Recipe</th><th>Author</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {recentRecipes.map((r) => (
                <tr key={r.id}>
                  <td>{r.title}</td>
                  <td>{r.owner_name || "—"}</td>
                  <td>
                    <span className={`stats-status ${r.status}`}>{r.status}</span>
                  </td>
                  <td>{new Date(r.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminStats;