import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { downloadRecipePDF } from "../utils/downloadRecipePDF";
import "../styles/MyRecipes.css";

function MyRecipes() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    fetchFavorites();
    const handleVisibilityChange = () => {};
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) { navigate("/login"); return; }

      const { data: savedData, error: savedError } = await supabase
        .from("saved_recipes")
        .select("recipe_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (savedError) { setRecipes([]); return; }

      const ids = (savedData || []).map((r) => r.recipe_id).filter(Boolean);
      if (ids.length === 0) { setRecipes([]); return; }

      const { data: recipeData, error: recipeError } = await supabase
        .from("recipes")
        .select("*")
        .in("id", ids);

      if (recipeError) { setRecipes([]); }
      else { setRecipes(recipeData || []); }
    } catch (err) {
      console.error("Error:", err);
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (recipeId, recipeTitle) => {
    if (!window.confirm(`Remove "${recipeTitle}" from your favorites?`)) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("saved_recipes")
        .delete()
        .eq("user_id", user.id)
        .eq("recipe_id", recipeId);
      if (error) throw error;
      setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
    } catch (err) {
      alert("Failed to remove: " + err.message);
    }
  };

  const handleDownloadPDF = async (recipe) => {
    setDownloadingId(recipe.id);
    try {
      await downloadRecipePDF(recipe);
    } catch (err) {
      alert("Failed to generate PDF: " + err.message);
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="my-recipes-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your favorites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-recipes-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>❤️ My Favorites</h1>
          <p className="subtitle">Recipes you've saved for later</p>
        </div>
      </div>

      {/* Empty or Grid */}
      {recipes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">❤️</div>
          <h2>No favorites yet</h2>
          <p>Save recipes you love and they'll appear here</p>
          <Link to="/" className="empty-action-btn">Browse Recipes</Link>
        </div>
      ) : (
        <div className="recipe-grid">
          {recipes.map((recipe) => (
            <div key={recipe.id} className={`recipe-card ${recipe.status || "pending"}`}>
              <Link to={`/recipe/${recipe.id}`} className="recipe-image-link">
                <div className="recipe-image-container">
                  <img
                    src={recipe.image_url || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect width='300' height='200' fill='%23e0e0e0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='18' fill='%23999'%3ENo Image%3C/text%3E%3C/svg%3E"}
                    alt={recipe.title}
                    className="recipe-thumb"
                    loading="lazy"
                  />
                  <div className={`status-badge ${recipe.status || "pending"}`}>
                    {recipe.status === "approved" ? "✓ Live" : recipe.status === "rejected" ? "✗ Rejected" : "⏳ Review"}
                  </div>
                </div>
              </Link>

              <div className="recipe-content">
                <Link to={`/recipe/${recipe.id}`} className="recipe-title-link">
                  <h3 className="recipe-title">{recipe.title}</h3>
                </Link>

                <div className="recipe-meta">
                  <span className="recipe-category">{recipe.category || "Uncategorized"}</span>
                  {recipe.cuisine && (
                    <><span className="separator">•</span><span className="recipe-cuisine">{recipe.cuisine}</span></>
                  )}
                </div>

                <div className="recipe-stats">
                  {recipe.rating > 0 && <span className="rating">★ {recipe.rating.toFixed(1)}</span>}
                  <span className="date">
                    {new Date(recipe.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>

                <div className="recipe-actions">
                  <Link to={`/recipe/${recipe.id}`} className="action-btn view" target="_blank">
                    👁 View
                  </Link>

                  {/* PDF Download Button */}
                  <button
                    onClick={() => handleDownloadPDF(recipe)}
                    className="action-btn pdf-download"
                    disabled={downloadingId === recipe.id}
                    title="Download as PDF"
                  >
                    {downloadingId === recipe.id ? (
                      <>⏳ Generating...</>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                          <line x1="12" y1="18" x2="12" y2="12"/>
                          <polyline points="9 15 12 18 15 15"/>
                        </svg>
                        PDF
                      </>
                    )}
                  </button>

                  <button onClick={() => handleUnsave(recipe.id, recipe.title)} className="action-btn delete">
                    🗑 Remove
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