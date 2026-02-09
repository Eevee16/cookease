import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { Link } from "react-router-dom";
import "../styles/RecipeAnalytics.css";

function RecipeAnalytics() {
  const [recipes, setRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: "all",
    cuisine: "all",
    sortBy: "views",
    searchTerm: ""
  });
  const [stats, setStats] = useState({
    totalRecipes: 0,
    totalViews: 0,
    avgViewsPerRecipe: 0,
    mostViewedRecipe: null
  });

  // Fetch recipes with view counts
  useEffect(() => {
    fetchRecipes();
  }, []);

  // Apply filters whenever recipes or filters change
  useEffect(() => {
    applyFilters();
  }, [recipes, filters]);

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("status", "approved")
        .order("view_count", { ascending: false });

      if (error) throw error;

      setRecipes(data || []);
      calculateStats(data || []);
    } catch (err) {
      console.error("Error fetching recipes:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const totalViews = data.reduce((sum, recipe) => sum + (recipe.view_count || 0), 0);
    const avgViews = data.length > 0 ? Math.round(totalViews / data.length) : 0;
    const mostViewed = data.length > 0 ? data[0] : null;

    setStats({
      totalRecipes: data.length,
      totalViews,
      avgViewsPerRecipe: avgViews,
      mostViewedRecipe: mostViewed
    });
  };

  const applyFilters = () => {
    let filtered = [...recipes];

    // Category filter
    if (filters.category !== "all") {
      filtered = filtered.filter(r => r.category === filters.category);
    }

    // Cuisine filter
    if (filters.cuisine !== "all") {
      filtered = filtered.filter(r => r.cuisine === filters.cuisine);
    }

    // Search filter
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.title?.toLowerCase().includes(term) ||
        r.ingredients?.some(ing => ing.toLowerCase().includes(term))
      );
    }

    // Sort
    switch (filters.sortBy) {
      case "views":
        filtered.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
        break;
      case "title":
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "recent":
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      default:
        break;
    }

    setFilteredRecipes(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Get unique categories and cuisines for filters
  const categories = ["all", ...new Set(recipes.map(r => r.category).filter(Boolean))];
  const cuisines = ["all", ...new Set(recipes.map(r => r.cuisine).filter(Boolean))];

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <div className="analytics-header-content">
          <h1>Recipe Analytics</h1>
          <p>Track recipe performance and engagement</p>
        </div>
      </div>

      <div className="analytics-main">
        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>Total Recipes</h3>
              <p className="stat-value">{stats.totalRecipes}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">👁️</div>
            <div className="stat-content">
              <h3>Total Views</h3>
              <p className="stat-value">{stats.totalViews.toLocaleString()}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <h3>Avg Views/Recipe</h3>
              <p className="stat-value">{stats.avgViewsPerRecipe}</p>
            </div>
          </div>

          <div className="stat-card featured">
            <div className="stat-icon">🏆</div>
            <div className="stat-content">
              <h3>Most Viewed</h3>
              <p className="stat-value-small">{stats.mostViewedRecipe?.title || "N/A"}</p>
              <p className="stat-subtext">{stats.mostViewedRecipe?.view_count || 0} views</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-group">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search recipes or ingredients..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-group">
            <label>Category</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange("category", e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === "all" ? "All Categories" : cat}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Cuisine</label>
            <select
              value={filters.cuisine}
              onChange={(e) => handleFilterChange("cuisine", e.target.value)}
            >
              {cuisines.map(cui => (
                <option key={cui} value={cui}>
                  {cui === "all" ? "All Cuisines" : cui}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Sort By</label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange("sortBy", e.target.value)}
            >
              <option value="views">Most Viewed</option>
              <option value="title">Alphabetical</option>
              <option value="recent">Most Recent</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="results-info">
          <p>Showing {filteredRecipes.length} of {recipes.length} recipes</p>
        </div>

        {/* Recipe List */}
        <div className="recipe-analytics-list">
          {filteredRecipes.length === 0 ? (
            <div className="empty-state">
              <p>No recipes found matching your filters</p>
            </div>
          ) : (
            <div className="recipe-grid">
              {filteredRecipes.map((recipe) => (
                <Link 
                  to={`/recipe/${recipe.id}`} 
                  key={recipe.id} 
                  className="recipe-analytics-card"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div className="recipe-image-container">
                    {recipe.image_url ? (
                      <img src={recipe.image_url} alt={recipe.title} loading="lazy" />
                    ) : (
                      <div className="no-image">No Image</div>
                    )}
                    <div className="view-badge">
                      <span>👁️ {recipe.view_count || 0}</span>
                    </div>
                  </div>
                  
                  <div className="recipe-info">
                    <h3>{recipe.title}</h3>
                    <div className="recipe-meta">
                      <span className="badge">{recipe.category}</span>
                      <span className="badge">{recipe.cuisine}</span>
                    </div>
                    <p className="recipe-owner">By {recipe.owner_name}</p>
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
}

export default RecipeAnalytics;