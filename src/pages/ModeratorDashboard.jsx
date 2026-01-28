import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useRoles } from "../contexts/RoleContext";
import { supabase } from "../supabase";
import "../styles/ModeratorDashboard.css";

function ModeratorDashboard() {
  const { isModerator, userData, loading: roleLoading } = useRoles();
  const navigate = useNavigate();

  const [pendingRecipes, setPendingRecipes] = useState([]);
  const [approvedRecipes, setApprovedRecipes] = useState([]);
  const [rejectedRecipes, setRejectedRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Redirect if not moderator
  useEffect(() => {
    if (!roleLoading && !isModerator) {
      alert("Access denied. Moderators only.");
      navigate("/");
    }
  }, [isModerator, roleLoading, navigate]);

  // Fetch recipes
  useEffect(() => {
    if (isModerator) fetchRecipes();
  }, [isModerator]);

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      const { data: allRecipes, error } = await supabase
        .from("recipes")
        .select("*")
        .order("createdAt", { ascending: false });

      if (error) throw error;

      setPendingRecipes(allRecipes.filter(r => !r.status || r.status === "pending"));
      setApprovedRecipes(allRecipes.filter(r => r.status === "approved"));
      setRejectedRecipes(allRecipes.filter(r => r.status === "rejected"));
    } catch (err) {
      console.error("Error fetching recipes:", err);
      alert("Failed to load recipes");
    } finally {
      setLoading(false);
    }
  };

  // Approve recipe
  const handleApprove = async (recipeId) => {
    if (!userData) {
      alert("You must be logged in to approve recipes");
      return;
    }

    try {
      const { error } = await supabase
        .from("recipes")
        .update({
          status: "approved",
          reviewedBy: userData.id,
          reviewedAt: new Date().toISOString(),
          rejectionReason: "",
        })
        .eq("id", recipeId);

      if (error) throw error;

      alert("Recipe approved");
      fetchRecipes();
    } catch (err) {
      console.error("Error approving recipe:", err);
      alert("Failed to approve recipe");
    }
  };

  // Reject recipe
  const handleReject = (recipeId) => setSelectedRecipe(recipeId);

  const confirmReject = async () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }

    try {
      const { error } = await supabase
        .from("recipes")
        .update({
          status: "rejected",
          reviewedBy: userData.id,
          reviewedAt: new Date().toISOString(),
          rejectionReason: rejectionReason.trim(),
        })
        .eq("id", selectedRecipe);

      if (error) throw error;

      alert("Recipe rejected");
      setSelectedRecipe(null);
      setRejectionReason("");
      fetchRecipes();
    } catch (err) {
      console.error("Error rejecting recipe:", err);
      alert("Failed to reject recipe");
    }
  };

  // Delete recipe
  const handleDelete = async (recipeId) => {
    if (!window.confirm("Permanently delete this recipe?")) return;

    try {
      const { error } = await supabase.from("recipes").delete().eq("id", recipeId);
      if (error) throw error;

      alert("Recipe deleted");
      fetchRecipes();
    } catch (err) {
      console.error("Error deleting recipe:", err);
      alert("Failed to delete recipe");
    }
  };

  if (roleLoading || loading) {
    return (
      <div className="moderator-dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isModerator) return null;

  const currentRecipes =
    activeTab === "pending"
      ? pendingRecipes
      : activeTab === "approved"
      ? approvedRecipes
      : rejectedRecipes;

  return (
    <div className="moderator-dashboard">
      <header className="moderator-header">
        <div className="moderator-header-content">
          <h1>Moderator Dashboard</h1>
          <Link to="/" className="back-btn">← Back to Home</Link>
        </div>
      </header>

      <div className="moderator-main">
        <div className="stats-cards">
          <div className="stat-card pending">
            <h3>Pending Review</h3>
            <p className="stat-number">{pendingRecipes.length}</p>
          </div>
          <div className="stat-card approved">
            <h3>Approved</h3>
            <p className="stat-number">{approvedRecipes.length}</p>
          </div>
          <div className="stat-card rejected">
            <h3>Rejected</h3>
            <p className="stat-number">{rejectedRecipes.length}</p>
          </div>
        </div>

        <div className="moderator-tabs">
          {["pending", "approved", "rejected"].map(tab => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="moderator-section">
          {currentRecipes.length === 0 ? (
            <div className="empty-state">
              <p>No {activeTab} recipes</p>
            </div>
          ) : (
            <div className="recipes-table">
              <table>
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Title</th>
                    <th>Owner</th>
                    <th>Submitted</th>
                    {activeTab === "rejected" && <th>Reason</th>}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRecipes.map(recipe => (
                    <tr key={recipe.id}>
                      <td>
                        <img
                          src={recipe.image || "https://via.placeholder.com/100"}
                          alt={recipe.title}
                          className="recipe-thumbnail"
                        />
                      </td>
                      <td>{recipe.title}</td>
                      <td>{recipe.ownerName || "Unknown"}</td>
                      <td>{recipe.createdAt ? new Date(recipe.createdAt).toLocaleDateString() : "N/A"}</td>
                      {activeTab === "rejected" && (
                        <td>{recipe.rejectionReason || "No reason provided"}</td>
                      )}
                      <td className="action-buttons">
                        <Link to={`/recipe/${recipe.id}`} target="_blank" className="btn-view">
                          View
                        </Link>

                        {activeTab !== "approved" && (
                          <button onClick={() => handleApprove(recipe.id)} className="btn-approve">
                            ✓ Approve
                          </button>
                        )}

                        <button onClick={() => handleReject(recipe.id)} className="btn-reject">
                          ✕ Reject
                        </button>

                        <button onClick={() => handleDelete(recipe.id)} className="btn-delete">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selectedRecipe && (
        <div className="modal-overlay" onClick={() => setSelectedRecipe(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Reject Recipe</h3>
            <textarea
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              rows="4"
              placeholder="Reason for rejection..."
            />
            <div className="modal-actions">
              <button onClick={() => setSelectedRecipe(null)} className="btn-cancel">
                Cancel
              </button>
              <button onClick={confirmReject} className="btn-confirm-reject">
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ModeratorDashboard;
