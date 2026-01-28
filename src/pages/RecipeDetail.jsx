import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { recipes as localRecipes } from "../components/data/recipes.js";
import { supabase } from "../supabase";
import "../styles/RecipeDetail.css";

function RecipeDetail() {
  const { id } = useParams();
  const localMatch = localRecipes.find((r) => r.id === Number(id));

  const [recipe, setRecipe] = useState(localMatch || null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("ingredients");
  const [checkedIngredients, setCheckedIngredients] = useState({});

  // Fetch recipe from Supabase if not local
  useEffect(() => {
    if (localMatch) return;

    const fetchRecipe = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("recipes")
          .select("*")
          .eq("id", id)
          .single();

        if (error) {
          console.error("Error fetching recipe:", error);
          setRecipe(null);
        } else {
          setRecipe(data);
        }
      } catch (err) {
        console.error("Error fetching recipe:", err);
        setRecipe(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [id, localMatch]);

  // Increment views safely
  useEffect(() => {
    if (localMatch) return;

    const incrementViews = async () => {
      try {
        await supabase.rpc("increment_recipe_views", { recipe_id: id });
      } catch (err) {
        console.error("Error incrementing views:", err);
      }
    };

    incrementViews();
  }, [id, localMatch]);

  const toggleIngredient = (index) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  if (loading) {
    return (
      <div className="recipe-detail-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading recipe...</p>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="recipe-detail-page">
        <div className="recipe-not-found">
          <h2>Recipe Not Found</h2>
          <p>Sorry, we couldn't find that recipe.</p>
          <Link to="/" className="back-btn-link">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const ingredients = Array.isArray(recipe.ingredients)
    ? recipe.ingredients
    : recipe.ingredients
    ? [recipe.ingredients]
    : [];

  const instructions = Array.isArray(recipe.instructions)
    ? recipe.instructions
    : recipe.instructions
    ? [recipe.instructions]
    : [];

  const rating = recipe.rating || 0;
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="recipe-detail-page">
      {/* Header */}
      <header className="detail-header">
        <Link to="/" className="back-btn">
          ← Back
        </Link>
        <h1 className="header-logo">CookEase</h1>
        <div className="header-actions">
          <button className="icon-btn" title="Share">
            <span>⤴</span>
          </button>
          <button className="icon-btn" title="Print">
            <span>🖨</span>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <div className="detail-hero">
        <div className="hero-container">
          <div className="hero-image">
            <img loading="lazy" src={recipe.image} alt={recipe.title} />
            <div className="rating-badge">
              <span className="rating-star">★</span>
              <span className="rating-value">{rating.toFixed(1)}</span>
            </div>
          </div>

          <div className="hero-content">
            <div className="recipe-category">
              {recipe.cuisine || "Filipino"} • {recipe.category || "Main"}
            </div>

            <h1 className="detail-title">{recipe.title}</h1>

            <div className="author-info">
              <div className="author-avatar">
                {recipe.ownerName ? recipe.ownerName[0].toUpperCase() : "U"}
              </div>
              <div className="author-details">
                <p className="author-label">Recipe by</p>
                <p className="author-name">{recipe.ownerName || "Anonymous"}</p>
              </div>
            </div>

            <p className="recipe-description">
              {recipe.description ||
                "A delicious recipe that you'll love to make and share with family and friends."}
            </p>

            {/* Info Cards */}
            <div className="info-grid">
              <div className="info-card">
                <span className="info-icon">🍽</span>
                <div className="info-content">
                  <span className="info-label">Servings</span>
                  <span className="info-value">{recipe.servings || 4}</span>
                </div>
              </div>

              <div className="info-card">
                <span className="info-icon">⏱</span>
                <div className="info-content">
                  <span className="info-label">Prep Time</span>
                  <span className="info-value">{recipe.prepTime || "15 min"}</span>
                </div>
              </div>

              <div className="info-card">
                <span className="info-icon">👨‍🍳</span>
                <div className="info-content">
                  <span className="info-label">Cook Time</span>
                  <span className="info-value">{recipe.cookTime || "30 min"}</span>
                </div>
              </div>

              <div className="info-card">
                <span className="info-icon">🔥</span>
                <div className="info-content">
                  <span className="info-label">Difficulty</span>
                  <span className="info-value">{recipe.difficulty || "Medium"}</span>
                </div>
              </div>
            </div>

            <button className="save-btn">
              <span>🔖</span> Save Recipe
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <div className="tab-container">
          <button
            className={`tab-btn ${activeTab === "ingredients" ? "active" : ""}`}
            onClick={() => setActiveTab("ingredients")}
          >
            Ingredients
          </button>
          <button
            className={`tab-btn ${activeTab === "directions" ? "active" : ""}`}
            onClick={() => setActiveTab("directions")}
          >
            Directions
          </button>
        </div>
      </div>

      {/* Content Section */}
      <div className="detail-main">
        {activeTab === "ingredients" && (
          <div className="content-card">
            <h2 className="section-title">What You'll Need</h2>
            <div className="ingredients-list">
              {ingredients.map((ingredient, index) => (
                <label
                  key={index}
                  className={`ingredient-item ${
                    checkedIngredients[index] ? "checked" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checkedIngredients[index] || false}
                    onChange={() => toggleIngredient(index)}
                  />
                  <span className="ingredient-text">{ingredient}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {activeTab === "directions" && (
          <div className="content-card">
            <h2 className="section-title">How to Make It</h2>
            <div className="instructions-list">
              {instructions.map((step, index) => (
                <div key={index} className="instruction-step">
                  <div className="step-number">{index + 1}</div>
                  <div className="step-content">
                    <p>{step}</p>
                  </div>
                </div>
              ))}
            </div>

            {recipe.notes && (
              <div className="recipe-note">
                <strong>Note:</strong> {recipe.notes}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default RecipeDetail;
