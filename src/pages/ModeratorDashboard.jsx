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

    if (actionLoading) return;
    
    setActionLoading(true);
    try {
      console.log("Attempting to approve recipe:", recipeId);
      console.log("Current user:", userData);

      // Try the update
      const { data, error } = await supabase
        .from("recipes")
        .update({ 
          status: "approved",
          rejection_reason: null
        })
        .eq("id", recipeId)
        .select();

      console.log("Update result - data:", data);
      console.log("Update result - error:", error);

      if (error) {
        // Check if it's a permission error
        if (error.code === "42501" || error.message.includes("permission")) {
          throw new Error("Permission denied. Please check your moderator permissions in Supabase RLS policies.");
        }
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error("Recipe not found or you don't have permission to update it. Check Supabase RLS policies.");
      }

      alert("✓ Recipe approved successfully!");
      await fetchRecipes();
    } catch (err) {
      console.error("Error approving recipe:", err);
      alert("Failed to approve recipe:\n\n" + err.message + "\n\nCheck the console for details.");
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

    if (!userData) {
      alert("You must be logged in to reject recipes");
      return;
    }

    if (actionLoading) return;
    
    setActionLoading(true);
    try {
      console.log("Attempting to reject recipe:", selectedRecipe);
      
      const { data, error } = await supabase
        .from("recipes")
        .update({
          status: "rejected",
          rejection_reason: rejectionReason.trim()
        })
        .eq("id", selectedRecipe)
        .select();

      console.log("Reject result - data:", data);
      console.log("Reject result - error:", error);

      if (error) {
        if (error.code === "42501" || error.message.includes("permission")) {
          throw new Error("Permission denied. Please check your moderator permissions in Supabase RLS policies.");
        }
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error("Recipe not found or you don't have permission to update it. Check Supabase RLS policies.");
      }

      alert("✗ Recipe rejected");
      setSelectedRecipe(null);
      setRejectionReason("");
      await fetchRecipes();
    } catch (err) {
      console.error("Error rejecting recipe:", err);
      alert("Failed to reject recipe:\n\n" + err.message + "\n\nCheck the console for details.");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete recipe
  const handleDelete = async (recipeId, recipeTitle) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${recipeTitle}"?\n\nThis action cannot be undone.`)) {
      return;
    }

    if (!userData) {
      alert("You must be logged in to delete recipes");
      return;
    }

    if (actionLoading) return;
    
    setActionLoading(true);
    try {
      console.log("Attempting to delete recipe:", recipeId);

      // Find the recipe to get image info
      const recipe = [...pendingRecipes, ...approvedRecipes, ...rejectedRecipes]
        .find(r => r.id === recipeId);
      
      // Try to delete the image from storage if it exists
      if (recipe && recipe.image_url) {
        try {
          const urlParts = recipe.image_url.split("/recipes/");
          if (urlParts[1]) {
            const filePath = urlParts[1].split("?")[0];
            console.log("Attempting to delete image:", filePath);
            
            const { error: storageError } = await supabase.storage
              .from("recipes")
              .remove([filePath]);
            
            if (storageError) {
              console.warn("Could not delete image:", storageError);
            }
          }
        } catch (imgErr) {
          console.warn("Error during image deletion:", imgErr);
        }
      }

      // Delete the recipe from database
      const { data, error } = await supabase
        .from("recipes")
        .delete()
        .eq("id", recipeId)
        .select();

      console.log("Delete result - data:", data);
      console.log("Delete result - error:", error);

      if (error) {
        if (error.code === "42501" || error.message.includes("permission")) {
          throw new Error("Permission denied. Please check your moderator permissions in Supabase RLS policies.");
        }
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error("Recipe not found or you don't have permission to delete it. Check Supabase RLS policies.");
      }

      alert("🗑 Recipe deleted successfully");
      await fetchRecipes();
    } catch (err) {
      console.error("Error deleting recipe:", err);
      alert("Failed to delete recipe:\n\n" + err.message + "\n\nCheck the console for details.");
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
              <span className="tab-count">
                (
                {tab === "pending"
                  ? pendingRecipes.length
                  : tab === "approved"
                  ? approvedRecipes.length
                  : rejectedRecipes.length}
                )
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
                          src={
                            recipe.image_url ||
                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23e0e0e0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%23999'%3ENo Image%3C/text%3E%3C/svg%3E"
                          }
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
                        {recipe.created_at
                          ? new Date(recipe.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric"
                            })
                          : "N/A"}
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
                        >
                          👁 View
                        </Link>

                        {activeTab !== "approved" && (
                          <button
                            onClick={() => handleApprove(recipe.id)}
                            className="btn-approve"
                            disabled={actionLoading}
                          >
                            ✓ Approve
                          </button>
                        )}

                        {activeTab !== "rejected" && (
                          <button
                            onClick={() => handleReject(recipe.id)}
                            className="btn-reject"
                            disabled={actionLoading}
                          >
                            ✕ Reject
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(recipe.id, recipe.title)}
                          className="btn-delete"
                          disabled={actionLoading}
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

      {selectedRecipe && (
        <div className="modal-overlay" onClick={() => !actionLoading && setSelectedRecipe(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Reject Recipe</h3>
            <p className="modal-description">
              Please provide a clear reason for rejecting this recipe.
            </p>
            <textarea
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              rows="4"
              className="rejection-textarea"
              placeholder="Enter rejection reason..."
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