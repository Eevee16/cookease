import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { recipes as localRecipes } from "../components/data/recipes.js";
import { supabase } from "../supabaseClient";
import { useRoles } from "../contexts/RoleContext";
import { downloadRecipePDF } from "../utils/downloadRecipePDF";
import "../styles/RecipeDetail.css";

function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userData } = useRoles();
  const localMatch = localRecipes.find((r) => r.id === Number(id));

  const hasTrackedView = useRef(false);

  const [recipe, setRecipe] = useState(localMatch || null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("ingredients");
  const [checkedIngredients, setCheckedIngredients] = useState({});
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [servingsMultiplier, setServingsMultiplier] = useState(1);

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
        if (error) { setRecipe(null); }
        else { setRecipe(data); }
      } catch (err) {
        setRecipe(null);
      } finally {
        setLoading(false);
      }
    };
    fetchRecipe();
  }, [id, localMatch]);

  // Check if already saved
  useEffect(() => {
    const checkIfSaved = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !id) return;
        const { data, error } = await supabase
          .from("saved_recipes")
          .select("id")
          .eq("user_id", user.id)
          .eq("recipe_id", id)
          .maybeSingle();
        if (!error && data) setIsSaved(true);
      } catch (err) {
        console.error("Error checking saved status:", err);
      }
    };
    checkIfSaved();
  }, [id]);

  // Track recipe view
  useEffect(() => {
    if (localMatch || !id || hasTrackedView.current) return;
    const trackRecipeView = async () => {
      const sessionKey = `viewed_recipe_${id}`;
      if (sessionStorage.getItem(sessionKey)) return;
      try {
        const { data: recipeData, error: fetchError } = await supabase
          .from("recipes")
          .select("view_count")
          .eq("id", id)
          .single();
        if (fetchError) throw fetchError;
        const { error: updateError } = await supabase
          .from("recipes")
          .update({ view_count: (recipeData.view_count || 0) + 1 })
          .eq("id", id);
        if (!updateError) {
          sessionStorage.setItem(sessionKey, "true");
          hasTrackedView.current = true;
        }
      } catch (err) {
        console.error("Error tracking view:", err);
      }
    };
    trackRecipeView();
  }, [id, localMatch]);

  const toggleIngredient = (index) => {
    setCheckedIngredients((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  // Save / Unsave
  const handleSaveRecipe = async () => {
    setSaveLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) { alert("Please log in to save recipes."); navigate("/login"); return; }

      if (isSaved) {
        const { error } = await supabase
          .from("saved_recipes")
          .delete()
          .eq("user_id", user.id)
          .eq("recipe_id", id);
        if (error) throw error;
        setIsSaved(false);
      } else {
        const { error } = await supabase
          .from("saved_recipes")
          .insert([{ user_id: user.id, recipe_id: id }]);
        if (error) throw error;
        setIsSaved(true);
      }
    } catch (err) {
      alert("Something went wrong: " + err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  // Download PDF — only available when saved
  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      await downloadRecipePDF(recipe);
    } catch (err) {
      alert("Failed to generate PDF: " + err.message);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: recipe.title, text: `Check out this recipe: ${recipe.title}`, url }); }
      catch (err) { console.log("Share failed:", err); }
    } else {
      navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    }
  };

  const handlePrint = () => window.print();

  const adjustServings = (increment) => {
    const newMultiplier = servingsMultiplier + increment;
    if (newMultiplier >= 0.5 && newMultiplier <= 10) setServingsMultiplier(newMultiplier);
  };

  const formatTime = (minutes) => {
    if (!minutes) return "N/A";
    if (typeof minutes === "string" && minutes.includes("min")) return minutes;
    const numMinutes = parseInt(minutes);
    if (isNaN(numMinutes)) return "N/A";
    if (numMinutes < 60) return `${numMinutes} min`;
    const hours = Math.floor(numMinutes / 60);
    const mins = numMinutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const parseIngredients = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data.filter((i) => i && i.trim());
    if (typeof data === "string") {
      try { const p = JSON.parse(data); if (Array.isArray(p)) return p.filter((i) => i && i.trim()); } catch (e) {}
      return data.split(/\n|\\n/).map((i) => i.trim()).filter(Boolean).map((i) => i.replace(/^\d+\.\s*/, ""));
    }
    return [];
  };

  const parseInstructions = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data.filter((i) => i && i.trim());
    if (typeof data === "string") {
      try { const p = JSON.parse(data); if (Array.isArray(p)) return p.filter((i) => i && i.trim()); } catch (e) {}
      return data.split(/\n|\\n/).map((i) => i.trim()).filter(Boolean).map((i) => i.replace(/^\d+\.\s*/, ""));
    }
    return [];
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
          <div className="not-found-icon">🔍</div>
          <h2>Recipe Not Found</h2>
          <p>Sorry, we couldn't find that recipe.</p>
          <Link to="/" className="back-btn-link">← Back to Home</Link>
        </div>
      </div>
    );
  }

  const ingredients = parseIngredients(recipe.ingredients);
  const instructions = parseInstructions(recipe.instructions);
  const rating = recipe.rating || 0;
  const baseServings = recipe.servings || 4;
  const adjustedServings = Math.round(baseServings * servingsMultiplier);
  const isOwner = userData && recipe.owner_id === userData.id;

  return (
    <div className="recipe-detail-page">
      {/* Header */}
      <header className="detail-header">
        <button onClick={() => navigate(-1)} className="back-btn">← Back</button>
        <h1 className="header-logo">CookEase</h1>
        <div className="header-actions">
          <button className="icon-btn" title="Share" onClick={handleShare}><span>⤴</span></button>
          <button className="icon-btn" title="Print" onClick={handlePrint}><span>🖨</span></button>
          {isOwner && (
            <Link to={`/edit-recipe/${recipe.id}`} className="icon-btn" title="Edit Recipe"><span>✏️</span></Link>
          )}
        </div>
      </header>

      {/* Hero */}
      <div className="detail-hero">
        <div className="hero-container">
          <div className="hero-image">
            <img
              loading="lazy"
              src={recipe.image_url || recipe.image || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400'%3E%3Crect width='600' height='400' fill='%23e0e0e0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='24' fill='%23999'%3ENo Image%3C/text%3E%3C/svg%3E"}
              alt={recipe.title}
            />
            {rating > 0 && (
              <div className="rating-badge">
                <span className="rating-star">★</span>
                <span className="rating-value">{rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          <div className="hero-content">
            <div className="recipe-category">
              {recipe.cuisine || "World"} • {recipe.category || "Main Course"}
            </div>

            <h1 className="detail-title">{recipe.title}</h1>

            <div className="author-info">
              <div className="author-avatar">
                {recipe.owner_name ? recipe.owner_name[0].toUpperCase() : "U"}
              </div>
              <div className="author-details">
                <p className="author-label">Recipe by</p>
                <p className="author-name">{recipe.owner_name || "Anonymous"}</p>
              </div>
            </div>

            <p className="recipe-description">
              {recipe.description || "A delicious recipe that you'll love to make and share with family and friends."}
            </p>

            {/* Info Cards */}
            <div className="info-grid">
              <div className="info-card">
                <span className="info-icon">🍽</span>
                <div className="info-content">
                  <span className="info-label">Servings</span>
                  <div className="servings-adjuster">
                    <button onClick={() => adjustServings(-0.5)} className="servings-btn" disabled={servingsMultiplier <= 0.5}>−</button>
                    <span className="info-value">{adjustedServings}</span>
                    <button onClick={() => adjustServings(0.5)} className="servings-btn" disabled={servingsMultiplier >= 10}>+</button>
                  </div>
                </div>
              </div>
              <div className="info-card">
                <span className="info-icon">⏱</span>
                <div className="info-content">
                  <span className="info-label">Prep Time</span>
                  <span className="info-value">{formatTime(recipe.prepTime || recipe.prep_time)}</span>
                </div>
              </div>
              <div className="info-card">
                <span className="info-icon">👨‍🍳</span>
                <div className="info-content">
                  <span className="info-label">Cook Time</span>
                  <span className="info-value">{formatTime(recipe.cookTime || recipe.cook_time)}</span>
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

            {/* Save + Download PDF buttons */}
            <div className="recipe-btn-row">
              <button
                className={`save-btn ${isSaved ? "saved" : ""}`}
                onClick={handleSaveRecipe}
                disabled={saveLoading}
              >
                {saveLoading ? "⏳ Saving..." : isSaved ? "✓ Saved" : "🔖 Save Recipe"}
              </button>

            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-navigation">
        <div className="tab-container">
          <button className={`tab-btn ${activeTab === "ingredients" ? "active" : ""}`} onClick={() => setActiveTab("ingredients")}>Ingredients</button>
          <button className={`tab-btn ${activeTab === "directions" ? "active" : ""}`} onClick={() => setActiveTab("directions")}>Directions</button>
          {recipe.notes && (
            <button className={`tab-btn ${activeTab === "notes" ? "active" : ""}`} onClick={() => setActiveTab("notes")}>Notes</button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="detail-main">
        {activeTab === "ingredients" && (
          <div className="content-card">
            <div className="section-header">
              <h2 className="section-title">What You'll Need</h2>
              {servingsMultiplier !== 1 && (
                <button className="reset-servings-btn" onClick={() => setServingsMultiplier(1)}>
                  Reset to original ({baseServings} servings)
                </button>
              )}
            </div>
            <div className="ingredients-list">
              {ingredients.length > 0 ? (
                ingredients.map((ingredient, index) => (
                  <label key={index} className={`ingredient-item ${checkedIngredients[index] ? "checked" : ""}`}>
                    <input type="checkbox" checked={checkedIngredients[index] || false} onChange={() => toggleIngredient(index)} />
                    <span className="ingredient-text">{ingredient}</span>
                  </label>
                ))
              ) : (
                <p className="no-items">No ingredients listed</p>
              )}
            </div>
          </div>
        )}

        {activeTab === "directions" && (
          <div className="content-card">
            <h2 className="section-title">How to Make It</h2>
            <div className="instructions-list">
              {instructions.length > 0 ? (
                instructions.map((step, index) => (
                  <div key={index} className="instruction-step">
                    <div className="step-number">{index + 1}</div>
                    <div className="step-content"><p>{step}</p></div>
                  </div>
                ))
              ) : (
                <p className="no-items">No instructions provided</p>
              )}
            </div>
          </div>
        )}

        {activeTab === "notes" && recipe.notes && (
          <div className="content-card">
            <h2 className="section-title">Cook's Notes</h2>
            <div className="recipe-note"><p>{recipe.notes}</p></div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RecipeDetail;