import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabase";
import "../styles/MyRecipes.css";

function MyRecipes() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [deleteLoading, setDeleteLoading] = useState(null);

  useEffect(() => {
    fetchMyRecipes();
  }, []);

  const fetchMyRecipes = async () => {
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error("Not logged in:", userError);
        navigate("/login");
        return;
      }

      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching recipes:", error);
      } else {
        setRecipes(data || []);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (recipeId, recipeTitle) => {
    if (!window.confirm(`Delete "${recipeTitle}"? This action cannot be undone.`)) {
      return;
    }

    setDeleteLoading(recipeId);
    try {
      // Get recipe to find image
      const recipe = recipes.find(r => r.id === recipeId);
      
      // Delete image from storage if exists
      if (recipe && recipe.image_url) {
        const urlParts = recipe.image_url.split('/recipes/');
        if (urlParts[1]) {
          const filePath = urlParts[1].split('?')[0];
          await supabase.storage.from('recipes').remove([filePath]);
        }
      }

      // Delete recipe from database
      const { error } = await supabase
        .from("recipes")
        .delete()
        .eq("id", recipeId);

      if (error) throw error;

      alert("Recipe deleted successfully");
      setRecipes(recipes.filter(r => r.id !== recipeId));
    } catch (err) {
      console.error("Error deleting recipe:", err);
      alert("Failed to delete recipe: " + err.message);
    } finally {
      setDeleteLoading(null);
    }
  };

  const filteredRecipes = filter === "all" 
    ? recipes 
    : recipes.filter(r => r.status === filter);

  const stats = {
    total: recipes.length,
    approved: recipes.filter(r => r.status === "approved").length,
    pending: recipes.filter(r => r.status === "pending").length,
    rejected: recipes.filter(r => r.status === "rejected").length,
  };

  if (loading) {
    return (
      <div className="my-recipes-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your recipes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-recipes-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>My Recipes</h1>
          <p className="subtitle">Manage all your submitted recipes</p>
        </div>
        <Link to="/add-recipe" className="add-recipe-btn">
          ➕ Add New Recipe
        </Link>
      </div>

      {/* Stats */}
      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-number">{stats.total}</span>
          <span className="stat-label">Total</span>
        </div>
        <div className="stat-item approved">
          <span className="stat-number">{stats.approved}</span>
          <span className="stat-label">Approved</span>
        </div>
        <div className="stat-item pending">
          <span className="stat-number">{stats.pending}</span>
          <span className="stat-label">Pending</span>
        </div>
        <div className="stat-item rejected">
          <span className="stat-number">{stats.rejected}</span>
          <span className="stat-label">Rejected</span>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-section">
        <button 
          className={`filter-btn ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All ({stats.total})
        </button>
        <button 
          className={`filter-btn ${filter === "approved" ? "active" : ""}`}
          onClick={() => setFilter("approved")}
        >
          Approved ({stats.approved})
        </button>
        <button 
          className={`filter-btn ${filter === "pending" ? "active" : ""}`}
          onClick={() => setFilter("pending")}
        >
          Pending ({stats.pending})
        </button>
        {stats.rejected > 0 && (
          <button 
            className={`filter-btn ${filter === "rejected" ? "active" : ""}`}
            onClick={() => setFilter("rejected")}
          >
            Rejected ({stats.rejected})
          </button>
        )}
      </div>

      {/* Recipes List */}
      {filteredRecipes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🍳</div>
          <h2>No {filter === "all" ? "" : filter} recipes</h2>
          {filter === "all" ? (
            <>
              <p>You haven't created any recipes yet</p>
              <Link to="/add-recipe" className="empty-action-btn">
                Create Your First Recipe
              </Link>
            </>
          ) : (
            <p>You don't have any {filter} recipes</p>
          )}
        </div>
      ) : (
        <div className="recipe-grid">
          {filteredRecipes.map((recipe) => (
            <div key={recipe.id} className={`recipe-card ${recipe.status || 'pending'}`}>
              <Link to={`/recipe/${recipe.id}`} className="recipe-image-link">
                <div className="recipe-image-container">
                  <img 
                    src={recipe.image_url || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect width='300' height='200' fill='%23e0e0e0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='18' fill='%23999'%3ENo Image%3C/text%3E%3C/svg%3E"}
                    alt={recipe.title}
                    className="recipe-thumb"
                    loading="lazy"
                  />
                  <div className={`status-badge ${recipe.status || 'pending'}`}>
                    {recipe.status === 'approved' ? '✓ Live' : 
                     recipe.status === 'rejected' ? '✗ Rejected' : 
                     '⏳ Review'}
                  </div>
                </div>
              </Link>

              <div className="recipe-content">
                <Link to={`/recipe/${recipe.id}`} className="recipe-title-link">
                  <h3 className="recipe-title">{recipe.title}</h3>
                </Link>
                
                <div className="recipe-meta">
                  <span className="recipe-category">{recipe.category || 'Uncategorized'}</span>
                  {recipe.cuisine && (
                    <>
                      <span className="separator">•</span>
                      <span className="recipe-cuisine">{recipe.cuisine}</span>
                    </>
                  )}
                </div>

                <div className="recipe-stats">
                  {recipe.rating > 0 && (
                    <span className="rating">★ {recipe.rating.toFixed(1)}</span>
                  )}
                  <span className="date">
                    {new Date(recipe.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>

                {recipe.status === 'rejected' && recipe.rejection_reason && (
                  <div className="rejection-message">
                    <strong>Rejection reason:</strong>
                    <p>{recipe.rejection_reason}</p>
                  </div>
                )}

                <div className="recipe-actions">
                  <Link 
                    to={`/recipe/${recipe.id}`} 
                    className="action-btn view"
                    target="_blank"
                  >
                    👁 View
                  </Link>
                  {/* Note: Add edit functionality later if needed */}
                  <button 
                    onClick={() => handleDelete(recipe.id, recipe.title)}
                    className="action-btn delete"
                    disabled={deleteLoading === recipe.id}
                  >
                    {deleteLoading === recipe.id ? '⏳' : '🗑'} Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyRecipes;