import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "../styles/RecipeAnalytics.css";

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
      <div className="analytics-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Loading popular recipes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <div className="analytics-header-content">
          <h1>Most Viewed Recipes</h1>
          <p>Trending dishes our community is watching right now</p>
        </div>
      </div>

      <div className="analytics-main">
        {/* Tabs */}
        <div className="filters-section" style={{ gridTemplateColumns: 'repeat(3, 1fr)', maxWidth: '600px', margin: '0 auto 32px' }}>
          {["All Time", "This Week", "New & Rising"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`filter-select ${activeTab === tab ? "active" : ""}`}
              style={{
                background: activeTab === tab ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white',
                color: activeTab === tab ? 'white' : '#374151',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Recipe Grid */}
        <div className="recipe-analytics-list">
          {recipes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <h3>No popular recipes yet</h3>
              <p>Check back later for trending recipes!</p>
            </div>
          ) : (
            <div className="recipe-grid">
              {recipes.map((recipe) => (
                <Link
                  to={`/recipe/${recipe.id}`}
                  key={recipe.id}
                  className="recipe-analytics-card"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div className="recipe-image-container" style={{ position: 'relative' }}>
                    {/* Rank Badge */}
                    <div 
                      style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        background: recipe.rank <= 3 
                          ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' 
                          : 'rgba(0, 0, 0, 0.75)',
                        color: 'white',
                        padding: '8px 14px',
                        borderRadius: '20px',
                        fontSize: '14px',
                        fontWeight: '800',
                        zIndex: 10,
                        backdropFilter: 'blur(8px)'
                      }}
                    >
                      #{recipe.rank}
                    </div>

                    {recipe.image_url ? (
                      <img 
                        src={recipe.image_url} 
                        alt={recipe.title} 
                        loading="lazy"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <div className="no-image" style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                        color: '#9ca3af',
                        fontWeight: '600'
                      }}>
                        No Image
                      </div>
                    )}
                    
                    <div className="view-badge">
                      <span>👁️ {formatViews(recipe.view_count || 0)}</span>
                    </div>
                  </div>

                  <div className="recipe-info">
                    <h3>{recipe.title || "Untitled"}</h3>
                    <div className="recipe-meta">
                      <span className="badge">{recipe.category || "Uncategorized"}</span>
                      <span className="badge">{recipe.cuisine || "Global"}</span>
                      <span 
                        className="badge" 
                        style={{
                          background: recipe.difficulty === 'Easy' 
                            ? '#d1fae5' 
                            : recipe.difficulty === 'Hard' 
                            ? '#fee2e2' 
                            : '#fef3c7',
                          color: recipe.difficulty === 'Easy' 
                            ? '#064e3b' 
                            : recipe.difficulty === 'Hard' 
                            ? '#7f1d1d' 
                            : '#78350f'
                        }}
                      >
                        {recipe.difficulty || "Medium"}
                      </span>
                    </div>
                    <p className="recipe-owner">By {recipe.owner_name || "Anonymous"}</p>
                    <div className="recipe-stats">
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
    </div>
  );
};

export default Popular;