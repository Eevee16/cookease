import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { recipes as localRecipes } from "../components/data/recipes.js";
import { supabase } from "../supabaseClient";
import { useRoles } from "../contexts/RoleContext";
import { downloadRecipePDF } from "../utils/downloadRecipePDF";
import "../styles/RecipeDetail.css";
import "../styles/votes.css";

function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userData, user } = useRoles();
  const localMatch = localRecipes.find((r) => r.id === Number(id));
  const hasTrackedView = useRef(false);

  const [recipe, setRecipe] = useState(localMatch || null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("ingredients");
  const [checkedIngredients, setCheckedIngredients] = useState({});
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [ingredientImages, setIngredientImages] = useState({});

  const [upvotes, setUpvotes] = useState(0);
  const [downvotes, setDownvotes] = useState(0);
  const [userVote, setUserVote] = useState(null);
  const [voteLoading, setVoteLoading] = useState(false);
  const [ownerPhoto, setOwnerPhoto] = useState(null);

  useEffect(() => {
    if (localMatch) return;
    const fetchRecipe = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from("recipes").select("*").eq("id", id).single();
        if (error) setRecipe(null);
        else setRecipe(data);
      } catch { setRecipe(null); }
      finally { setLoading(false); }
    };
    fetchRecipe();
  }, [id, localMatch]);

  // Fetch owner profile photo
  useEffect(() => {
    if (!recipe || !recipe.owner_id) return;
    
    const fetchOwnerProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("photo_url")
          .eq("id", recipe.owner_id)
          .single();
        
        if (!error && data) {
          setOwnerPhoto(data.photo_url);
        }
      } catch (err) {
        console.error("Error fetching owner profile:", err);
      }
    };
    
    fetchOwnerProfile();
  }, [recipe]);

  useEffect(() => {
    if (!recipe) return;
    const fetchIngredientImages = async () => {
      try {
        const { data, error } = await supabase.from("ingredients").select("name, image_url");
        if (error || !data) return;
        const map = {};
        data.forEach(ing => { map[ing.name.toLowerCase()] = ing.image_url; });
        setIngredientImages(map);
      } catch (e) { console.error("Error fetching ingredient images:", e); }
    };
    fetchIngredientImages();
  }, [recipe]);

  useEffect(() => {
    const checkIfSaved = async () => {
      try {
        const { data: { user: u } } = await supabase.auth.getUser();
        if (!u || !id) return;
        const { data, error } = await supabase.from("saved_recipes").select("id").eq("user_id", u.id).eq("recipe_id", id).maybeSingle();
        if (!error && data) setIsSaved(true);
      } catch (err) { console.error("Error checking saved:", err); }
    };
    checkIfSaved();
  }, [id]);

  useEffect(() => {
    const fetchVotes = async () => {
      try {
        const { data, error } = await supabase.from("votes").select("vote_type, user_id").eq("recipe_id", id);
        if (error) throw error;
        setUpvotes(data.filter(v => v.vote_type === "up").length);
        setDownvotes(data.filter(v => v.vote_type === "down").length);
        if (user) {
          const mine = data.find(v => v.user_id === user.id);
          setUserVote(mine?.vote_type || null);
        }
      } catch (e) { console.error("Error fetching votes:", e); }
    };
    if (id) fetchVotes();
  }, [id, user]);

  useEffect(() => {
    if (!id) return;
    if (localMatch && typeof localMatch.id === "number") return;
    const sessionKey = `viewed_recipe_${id}`;
    if (sessionStorage.getItem(sessionKey)) return;
    if (hasTrackedView.current) return;
    hasTrackedView.current = true;
    const trackView = async () => {
      try {
        const { error } = await supabase.rpc("increment_view_count", { recipe_id: id });
        if (error) {
          const { data } = await supabase.from("recipes").select("view_count").eq("id", id).single();
          await supabase.from("recipes").update({ view_count: (data?.view_count || 0) + 1 }).eq("id", id);
        }
        sessionStorage.setItem(sessionKey, "true");
      } catch (err) {
        console.error("View tracking error:", err);
        hasTrackedView.current = false;
      }
    };
    trackView();
  }, [id, localMatch]);

  const handleVote = async (type) => {
    if (!user) { alert("Please log in to vote."); return; }
    if (voteLoading) return;
    setVoteLoading(true);
    try {
      if (userVote === type) {
        await supabase.from("votes").delete().eq("recipe_id", id).eq("user_id", user.id);
        setUserVote(null);
        type === "up" ? setUpvotes(v => v - 1) : setDownvotes(v => v - 1);
      } else {
        await supabase.from("votes").upsert({ user_id: user.id, recipe_id: id, vote_type: type }, { onConflict: "user_id,recipe_id" });
        if (userVote === "up") setUpvotes(v => v - 1);
        if (userVote === "down") setDownvotes(v => v - 1);
        type === "up" ? setUpvotes(v => v + 1) : setDownvotes(v => v + 1);
        setUserVote(type);
      }
    } catch (err) { console.error("Vote error:", err); }
    finally { setVoteLoading(false); }
  };

  const toggleIngredient = (index) => setCheckedIngredients(prev => ({ ...prev, [index]: !prev[index] }));

  const handleSaveRecipe = async () => {
    setSaveLoading(true);
    try {
      const { data: { user: u }, error: userError } = await supabase.auth.getUser();
      if (userError || !u) { alert("Please log in to save recipes."); navigate("/login"); return; }
      if (isSaved) {
        const { error } = await supabase.from("saved_recipes").delete().eq("user_id", u.id).eq("recipe_id", id);
        if (error) throw error;
        setIsSaved(false);
      } else {
        const { error } = await supabase.from("saved_recipes").insert([{ user_id: u.id, recipe_id: id }]);
        if (error) throw error;
        setIsSaved(true);
      }
    } catch (err) { alert("Something went wrong: " + err.message); }
    finally { setSaveLoading(false); }
  };

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try { await downloadRecipePDF(recipe); }
    catch (err) { alert("Failed to generate PDF: " + err.message); }
    finally { setPdfLoading(false); }
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

  const parseList = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data.filter(i => i && i.trim());
    if (typeof data === "string") {
      try { const p = JSON.parse(data); if (Array.isArray(p)) return p.filter(i => i && i.trim()); } catch (e) {}
      return data.split(/\n|\\n/).map(i => i.trim()).filter(Boolean).map(i => i.replace(/^\d+\.\s*/, ""));
    }
    return [];
  };

  // Full ingredient parser with quantity, unit, prep
  const parseIngredient = (str) => {
    if (!str) return { raw: str, name: str, qty: "", unit: "", prep: "" };

    const prepMatch = str.match(/\(([^)]+)\)\s*$/);
    const prep = prepMatch ? prepMatch[1] : "";
    const withoutPrep = str.replace(/\s*\([^)]+\)\s*$/, "").trim();

    const units = ["cup", "cups", "tbsp", "tsp", "tablespoon", "tablespoons", "teaspoon", "teaspoons",
                   "oz", "lb", "g", "kg", "ml", "l", "piece", "pieces", "pinch", "dash", "clove", "cloves"];

    let qty = "";
    let unit = "";
    let name = withoutPrep;

    const qtyMatch = withoutPrep.match(/^([\d\/\.\s]+)\s*([a-z]+)?\s*(.+)$/i);
    if (qtyMatch) {
      qty = qtyMatch[1].trim();
      const potentialUnit = qtyMatch[2] ? qtyMatch[2].toLowerCase() : "";
      if (units.includes(potentialUnit)) {
        unit = potentialUnit;
        name = qtyMatch[3].trim();
      } else {
        name = (qtyMatch[2] + " " + qtyMatch[3]).trim();
      }
    }

    for (const knownName of Object.keys(ingredientImages)) {
      if (name.toLowerCase().includes(knownName)) {
        name = knownName.charAt(0).toUpperCase() + knownName.slice(1);
        break;
      }
    }

    return { raw: str, name, qty, unit, prep };
  };

  const getIngredientImage = (name) => {
    const key = name?.toLowerCase();
    for (const k of Object.keys(ingredientImages)) {
      if (key?.includes(k) || k?.includes(key)) return ingredientImages[k];
    }
    return null;
  };

  if (loading) return (
    <div className="recipe-detail-page">
      <div className="loading-container"><div className="loading-spinner"></div><p>Loading recipe...</p></div>
    </div>
  );

  if (!recipe) return (
    <div className="recipe-detail-page">
      <div className="recipe-not-found">
        <div className="not-found-icon">🔍</div>
        <h2>Recipe Not Found</h2>
        <p>Sorry, we couldn't find that recipe.</p>
        <Link to="/" className="back-btn-link">← Back to Home</Link>
      </div>
    </div>
  );

  const ingredients = parseList(recipe.ingredients);
  const instructions = parseList(recipe.instructions);
  const rating = recipe.rating || 0;
  const baseServings = recipe.servings || 4;
  const isOwner = userData && recipe.owner_id === userData.id;
  const canEdit = isOwner && (recipe.status === "pending" || recipe.status === null || recipe.status === undefined);
  const netVotes = upvotes - downvotes;

  return (
    <div className="recipe-detail-page">
      <header className="detail-header">
        <button onClick={() => navigate(-1)} className="back-btn">← Back</button>
        <h1 className="header-logo">CookEase</h1>
        <div className="header-actions">
          <button className="icon-btn" title="Share" onClick={handleShare}><span>↗️</span></button>
          <button className="icon-btn" title="Print" onClick={() => window.print()}><span>🖨️</span></button>
            {isOwner && (
              canEdit ? (
                <Link to={`/edit-recipe/${recipe.id}`} className="icon-btn" title="Edit Recipe">
                  <span>✏️</span>
                </Link>
              ) : (
                <button className="icon-btn icon-btn-disabled" title="Cannot edit — recipe is already approved" disabled>
                  <span>🔒</span>
                </button>
              )
)}
        </div>
      </header>

      <div className="detail-hero">
        <div className="hero-container">

          {/* LEFT: Image + compact vote strip beneath */}
          <div className="hero-image-col">
            <div className="hero-image">
              <img loading="lazy"
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

            {/* Compact vote strip with labels */}
            <div className="image-vote-row">
              <div className="detail-vote-box">
                <div className="vote-col">
                  <button className={`detail-vote-btn upvote ${userVote === "up" ? "active" : ""}`} onClick={() => handleVote("up")} disabled={voteLoading}>▲ {upvotes}</button>
                  <span className="vote-col-label">Helpful</span>
                </div>
                <div className="net-votes-col">
                  <span className={`net-votes ${netVotes > 0 ? "positive" : netVotes < 0 ? "negative" : ""}`}>{netVotes > 0 ? `+${netVotes}` : netVotes}</span>
                  <span className="vote-col-label">Score</span>
                </div>
                <div className="vote-col">
                  <button className={`detail-vote-btn downvote ${userVote === "down" ? "active" : ""}`} onClick={() => handleVote("down")} disabled={voteLoading}>▼ {downvotes}</button>
                  <span className="vote-col-label">Not for me</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Recipe info + save/pdf buttons */}
          <div className="hero-content">
            <div className="recipe-category">{recipe.cuisine || "World"} • {recipe.category || "Main Course"}</div>
            <h1 className="detail-title">{recipe.title}</h1>
            <div className="author-info">
              {ownerPhoto ? (
                <img 
                  src={ownerPhoto} 
                  alt={recipe.owner_name || "User"} 
                  className="author-avatar-image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className="author-avatar" 
                style={{ display: ownerPhoto ? 'none' : 'flex' }}
              >
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
            <div className="info-grid">
              <div className="info-card"><span className="info-icon">🍽</span><div className="info-content"><span className="info-label">Servings</span><span className="info-value">{baseServings}</span></div></div>
              <div className="info-card"><span className="info-icon">⏱</span><div className="info-content"><span className="info-label">Prep Time</span><span className="info-value">{formatTime(recipe.prepTime || recipe.prep_time)}</span></div></div>
              <div className="info-card"><span className="info-icon">👨‍🍳</span><div className="info-content"><span className="info-label">Cook Time</span><span className="info-value">{formatTime(recipe.cookTime || recipe.cook_time)}</span></div></div>
              <div className="info-card"><span className="info-icon">🔥</span><div className="info-content"><span className="info-label">Difficulty</span><span className="info-value">{recipe.difficulty || "Medium"}</span></div></div>
            </div>

            {/* Save + PDF — original style */}
            <div className="recipe-btn-row">
              <button className={`save-btn ${isSaved ? "saved" : ""}`} onClick={handleSaveRecipe} disabled={saveLoading}>
                {saveLoading ? "⏳ Saving..." : isSaved ? "✓ Saved" : "🔖 Save Recipe"}
              </button>
              {isSaved && (
                <button className="pdf-btn" onClick={handleDownloadPDF} disabled={pdfLoading}>
                  {pdfLoading ? "⏳ Generating..." : "⬇ PDF"}
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      <div className="tab-navigation">
        <div className="tab-container">
          <button className={`tab-btn ${activeTab === "ingredients" ? "active" : ""}`} onClick={() => setActiveTab("ingredients")}>Ingredients</button>
          <button className={`tab-btn ${activeTab === "directions" ? "active" : ""}`} onClick={() => setActiveTab("directions")}>Directions</button>
          {recipe.notes && <button className={`tab-btn ${activeTab === "notes" ? "active" : ""}`} onClick={() => setActiveTab("notes")}>Notes</button>}
        </div>
      </div>

      <div className="detail-main">
        {activeTab === "ingredients" && (
          <div className="content-card">
            <h2 className="section-title">What You'll Need</h2>
            <div className="ingredients-table-container">
              <table className="ingredients-table">
                <thead>
                  <tr>
                    <th className="col-check"></th>
                    <th className="col-ingredient">Ingredient</th>
                    <th className="col-quantity">Quantity</th>
                    <th className="col-unit">Unit</th>
                    <th className="col-prep">Preparation</th>
                  </tr>
                </thead>
                <tbody>
                  {ingredients.length > 0 ? (
                    ingredients.map((ingredient, index) => {
                      const parsed = parseIngredient(ingredient);
                      const imgUrl = getIngredientImage(parsed.name);
                      return (
                        <tr
                          key={index}
                          className={checkedIngredients[index] ? "checked" : ""}
                          onClick={() => toggleIngredient(index)}
                        >
                          <td className="col-check">
                            <input
                              type="checkbox"
                              checked={checkedIngredients[index] || false}
                              onChange={() => toggleIngredient(index)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td className="col-ingredient">
                            <div className="ingredient-cell">
                              <div className="ingredient-img-wrap">
                                {imgUrl ? (
                                  <img
                                    src={imgUrl}
                                    alt={parsed.name}
                                    className="ingredient-thumb"
                                    onError={(e) => {
                                      e.target.style.display = "none";
                                      e.target.nextSibling.style.display = "flex";
                                    }}
                                  />
                                ) : null}
                                <div className="ingredient-thumb-fallback" style={{ display: imgUrl ? "none" : "flex" }}>🥄</div>
                              </div>
                              <span className="ingredient-name">{parsed.name}</span>
                            </div>
                          </td>
                          <td className="col-quantity">{parsed.qty || "—"}</td>
                          <td className="col-unit">{parsed.unit || "—"}</td>
                          <td className="col-prep">{parsed.prep || "—"}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr><td colSpan="5" className="no-ingredients">No ingredients listed</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "directions" && (
          <div className="content-card">
            <h2 className="section-title">How to Make It</h2>
            <div className="instructions-list">
              {instructions.length > 0 ? instructions.map((step, index) => (
                <div key={index} className="instruction-step">
                  <div className="step-number">{index + 1}</div>
                  <div className="step-content"><p>{step}</p></div>
                </div>
              )) : <p className="no-items">No instructions provided</p>}
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