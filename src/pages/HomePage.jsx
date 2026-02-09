import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { Link } from "react-router-dom";
import { useRoles } from "../contexts/RoleContext";
import RecipeCard from "../components/RecipeCard";
import "../styles/App.css";

function HomePage() {
  const { userData } = useRoles();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: "all",
    cuisine: "all",
    difficulty: "all"
  });
  const [filteredRecipes, setFilteredRecipes] = useState([]);

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true);

        // Fetch approved and done recipes
        const { data, error } = await supabase
          .from("recipes")
          .select("*")
          .in("status", ["approved", "done"])
          .order("created_at", { ascending: false });

        if (error) throw error;

        setRecipes(data || []);
        setFilteredRecipes(data || []);
      } catch (err) {
        console.error("Failed to load recipes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...recipes];

    if (filters.category !== "all") {
      filtered = filtered.filter(r => r.category === filters.category);
    }

    if (filters.cuisine !== "all") {
      filtered = filtered.filter(r => r.cuisine === filters.cuisine);
    }

    if (filters.difficulty !== "all") {
      filtered = filtered.filter(r => r.difficulty === filters.difficulty);
    }

    setFilteredRecipes(filtered);
  }, [recipes, filters]);

  const categories = ["all", ...new Set(recipes.map(r => r.category).filter(Boolean))];
  const cuisines = ["all", ...new Set(recipes.map(r => r.cuisine).filter(Boolean))];

  if (loading) {
    return (
      <div className="home-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Loading delicious recipes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1>Discover Amazing Recipes</h1>
          <p>Find and share your favorite dishes with the community</p>
          {userData && (
            <Link to="/add-recipe" className="btn-add-recipe">
              + Add Your Recipe
            </Link>
          )}
        </div>
      </div>

      <div className="recipe-container">
        {/* Filters */}
        {recipes.length > 0 && (
          <div className="filters-bar">
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="filter-select"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === "all" ? "All Categories" : cat}
                </option>
              ))}
            </select>

            <select
              value={filters.cuisine}
              onChange={(e) => setFilters({ ...filters, cuisine: e.target.value })}
              className="filter-select"
            >
              {cuisines.map(cui => (
                <option key={cui} value={cui}>
                  {cui === "all" ? "All Cuisines" : cui}
                </option>
              ))}
            </select>

            <select
              value={filters.difficulty}
              onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
              className="filter-select"
            >
              <option value="all">All Levels</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        )}

        {/* Results Info */}
        {recipes.length > 0 && (
          <div className="results-info">
            <h2 className="section-title">
              {filteredRecipes.length === recipes.length
                ? `All Recipes (${recipes.length})`
                : `Found ${filteredRecipes.length} of ${recipes.length} recipes`}
            </h2>
          </div>
        )}

        {/* Recipe Grid */}
        <div className="recipe-grid">
          {filteredRecipes.length === 0 ? (
            <div className="empty-state">
              {recipes.length === 0 ? (
                <>
                  <div className="empty-icon">🍳</div>
                  <h3>No recipes available yet</h3>
                  <p>Be the first to share a delicious recipe!</p>
                  {userData && (
                    <Link to="/add-recipe" className="btn-primary">
                      Add a Recipe
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <div className="empty-icon">🔍</div>
                  <h3>No recipes found</h3>
                  <p>Try adjusting your filters</p>
                  <button 
                    onClick={() => setFilters({ category: "all", cuisine: "all", difficulty: "all" })}
                    className="btn-secondary"
                  >
                    Clear Filters
                  </button>
                </>
              )}
            </div>
          ) : (
            filteredRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default HomePage;