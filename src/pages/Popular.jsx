import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "../styles/Popular.css";

const Popular = () => {
  const [activeTab, setActiveTab] = useState("All Time");
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch popular recipes (only approved)
  useEffect(() => {
    const fetchPopularRecipes = async () => {
      try {
        const { data, error } = await supabase
          .from("recipes")
          .select("*")
          .eq("status", "approved")
          .order("view_count", { ascending: false })
          .limit(12);

        if (error) throw error;

        console.log("Fetched recipes:", data); // Debug log

        const recipesData = data.map((recipe, index) => ({
          ...recipe,
          rank: index + 1,
        }));

        setRecipes(recipesData);
      } catch (err) {
        console.error("Error fetching popular recipes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPopularRecipes();
  }, []);

  const formatViews = (num) => {
    if (!num) return "0";
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  if (loading) {
    return (
      <div className="popular-page">
        <div className="popular-loading">
          <div className="popular-spinner"></div>
          <p className="popular-loading-text">Loading popular recipes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="popular-page">
      <div className="popular-header">
        <div className="popular-header-content">
          <h1>Most Viewed Recipes</h1>
          <p>Trending dishes our community is watching right now</p>
        </div>
      </div>

      <div className="popular-main">
        {/* Tabs */}
        <div className="popular-tabs">
          {["All Time", "This Week", "New & Rising"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`popular-tab ${activeTab === tab ? "active" : ""}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Recipe Grid */}
        {recipes.length === 0 ? (
          <div className="popular-empty">
            <div className="popular-empty-icon">📊</div>
            <h3>No popular recipes yet</h3>
            <p>Check back later for trending recipes!</p>
          </div>
        ) : (
          <div className="popular-grid">
            {recipes.map((recipe) => (
              <Link
                to={`/recipe/${recipe.id}`}
                key={recipe.id}
                className="popular-card"
              >
                <div className="popular-image-container">
                  {/* Rank Badge */}
                  <div className={`rank-badge ${recipe.rank <= 3 ? 'top-three' : ''}`}>
                    #{recipe.rank}
                  </div>

                  {recipe.image_url ? (
                    <img 
                      src={recipe.image_url} 
                      alt={recipe.title} 
                      loading="lazy"
                      onError={(e) => {
                        console.log("Image failed to load:", recipe.image_url);
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  
                  <div 
                    className="no-image" 
                    style={{ display: recipe.image_url ? 'none' : 'flex' }}
                  >
                    No Image
                  </div>
                  
                  <div className="view-badge">
                    👁️ {formatViews(recipe.view_count || 0)}
                  </div>
                </div>

                <div className="popular-info">
                  <h3 className="popular-title">{recipe.title || "Untitled"}</h3>
                  
                  <div className="popular-badges">
                    <span className="badge category">{recipe.category || "Uncategorized"}</span>
                    <span className="badge cuisine">{recipe.cuisine || "Global"}</span>
                    <span className={`badge difficulty ${(recipe.difficulty || 'Medium').toLowerCase()}`}>
                      {recipe.difficulty || "Medium"}
                    </span>
                  </div>
                  
                  <p className="popular-owner">By {recipe.owner_name || "Anonymous"}</p>
                  
                  <div className="popular-stats">
                    <span>⏱️ {(recipe.prep_time || 0) + (recipe.cook_time || 0)} min</span>
                    <span>🍽️ {recipe.servings || 4} servings</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Popular;