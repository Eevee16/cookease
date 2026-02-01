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
  const [actionLoading, setActionLoading] = useState(false);

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
        .order("created_at", { ascending: false });

      if (error) throw error;

      setPendingRecipes(allRecipes.filter(r => !r.status || r.status === "pending"));
      setApprovedRecipes(allRecipes.filter(r => r.status === "approved"));
      setRejectedRecipes(allRecipes.filter(r => r.status === "rejected"));
    } catch (err) {
      console.error("Error fetching recipes:", err);
      alert("Failed to load recipes. Please refresh the page.");
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

    if (actionLoading) return; // Prevent multiple clicks
    
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("recipes")
        .update({
          status: "approved"
        })
        .eq("id", recipeId);

      if (error) throw error;

      alert("✓ Recipe approved successfully!");
      await fetchRecipes();
    } catch (err) {
      console.error("Error approving recipe:", err);
      alert("Failed to approve recipe: " + (err.message || "Unknown error"));
    } finally {
      setActionLoading(false);
    }
  };

  // Reject recipe
  const handleReject = (recipeId) => {
    setSelectedRecipe(recipeId);
    setRejectionReason("");
  };

  const confirmReject = async () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }

    if (actionLoading) return;
    
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("recipes")
        .update({
          status: "rejected",
          rejection_reason: rejectionReason.trim()
        })
        .eq("id", selectedRecipe);

      if (error) throw error;

      alert("✗ Recipe rejected");
      setSelectedRecipe(null);
      setRejectionReason("");
      await fetchRecipes();
    } catch (err) {
      console.error("Error rejecting recipe:", err);
      alert("Failed to reject recipe: " + (err.message || "Unknown error"));
    } finally {
      setActionLoading(false);
    }
  };

  // Delete recipe
  const handleDelete = async (recipeId, recipeTitle) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${recipeTitle}"?\n\nThis action cannot be undone.`)) {
      return;
    }

    if (actionLoading) return;
    
    setActionLoading(true);
    try {
      // Delete the recipe image from storage first (if exists)
      const recipe = [...pendingRecipes, ...approvedRecipes, ...rejectedRecipes].find(r => r.id === recipeId);
      
      if (recipe && recipe.image_url) {
        // Extract file path from URL
        const urlParts = recipe.image_url.split('/recipes/');
        if (urlParts[1]) {
          const filePath = urlParts[1].split('?')[0]; // Remove query params
          await supabase.storage.from('recipes').remove([filePath]);
        }
      }

      // Delete the recipe from database
      const { error } = await supabase.from("recipes").delete().eq("id", recipeId);
      if (error) throw error;

      alert("🗑 Recipe deleted successfully");
      await fetchRecipes();
    } catch (err) {
      console.error("Error deleting recipe:", err);
      alert("Failed to delete recipe: " + (err.message || "Unknown error"));
    } finally {
      setActionLoading(false);
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
            <p className="stat-label">
              {pendingRecipes.length === 1 ? 'recipe' : 'recipes'} waiting
            </p>
          </div>
          <div className="stat-card approved">
            <h3>Approved</h3>
            <p className="stat-number">{approvedRecipes.length}</p>
            <p className="stat-label">
              {approvedRecipes.length === 1 ? 'recipe' : 'recipes'} live
            </p>
          </div>
          <div className="stat-card rejected">
            <h3>Rejected</h3>
            <p className="stat-number">{rejectedRecipes.length}</p>
            <p className="stat-label">
              {rejectedRecipes.length === 1 ? 'recipe' : 'recipes'} declined
            </p>
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
              <span className="tab-count">
                ({tab === "pending" ? pendingRecipes.length : 
                  tab === "approved" ? approvedRecipes.length : 
                  rejectedRecipes.length})
              </span>
            </button>
          ))}
        </div>

        <div className="moderator-section">
          {currentRecipes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <p className="empty-message">No {activeTab} recipes</p>
              {activeTab === "pending" && (
                <p className="empty-hint">New recipe submissions will appear here</p>
              )}
            </div>
          ) : (
            <div className="recipes-table-container">
              <table className="recipes-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Title</th>
                    <th>Category</th>
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
                          src={recipe.image_url || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23e0e0e0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%23999'%3ENo Image%3C/text%3E%3C/svg%3E"}
                          alt={recipe.title}
                          className="recipe-thumbnail"
                          loading="lazy"
                        />
                      </td>
                      <td className="recipe-title-cell">
                        <strong>{recipe.title}</strong>
                      </td>
                      <td>
                        <span className="category-badge">
                          {recipe.category || "N/A"}
                        </span>
                      </td>
                      <td>{recipe.owner_name || "Unknown"}</td>
                      <td>
                        {recipe.created_at ? new Date(recipe.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        }) : "N/A"}
                      </td>
                      {activeTab === "rejected" && (
                        <td className="rejection-reason">
                          {recipe.rejection_reason || "No reason provided"}
                        </td>
                      )}
                      <td className="action-buttons">
                        <Link 
                          to={`/recipe/${recipe.id}`} 
                          target="_blank" 
                          className="btn-view"
                          title="View recipe in new tab"
                        >
                          👁 View
                        </Link>

                        {activeTab !== "approved" && (
                          <button 
                            onClick={() => handleApprove(recipe.id)} 
                            className="btn-approve"
                            disabled={actionLoading}
                            title="Approve this recipe"
                          >
                            ✓ Approve
                          </button>
                        )}

                        {activeTab !== "rejected" && (
                          <button 
                            onClick={() => handleReject(recipe.id)} 
                            className="btn-reject"
                            disabled={actionLoading}
                            title="Reject this recipe"
                          >
                            ✕ Reject
                          </button>
                        )}

                        <button 
                          onClick={() => handleDelete(recipe.id, recipe.title)} 
                          className="btn-delete"
                          disabled={actionLoading}
                          title="Delete this recipe permanently"
                        >
                          🗑 Delete
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

      {/* Rejection Modal */}
      {selectedRecipe && (
        <div className="modal-overlay" onClick={() => !actionLoading && setSelectedRecipe(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Reject Recipe</h3>
            <p className="modal-description">
              Please provide a clear reason for rejecting this recipe. 
              This will help the user improve their submission.
            </p>
            <textarea
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              rows="4"
              placeholder="Example: Recipe instructions are incomplete, or image quality is too low..."
              className="rejection-textarea"
              disabled={actionLoading}
            />
            <div className="modal-actions">
              <button 
                onClick={() => setSelectedRecipe(null)} 
                className="btn-cancel"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button 
                onClick={confirmReject} 
                className="btn-confirm-reject"
                disabled={actionLoading || !rejectionReason.trim()}
              >
                {actionLoading ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ModeratorDashboard;