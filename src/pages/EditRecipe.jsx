import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import { useRoles } from "../contexts/RoleContext";
import "../styles/EditRecipe.css";

function EditRecipe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userData } = useRoles();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  // Only columns that exist in the schema:
  // title, cuisine, category, difficulty, servings, prepTime, cookTime,
  // ingredients, instructions, image_url, status, owner_id, owner_name,
  // rating, rejection_reason, slug, view_count, views, created_at, id
  const [form, setForm] = useState({
    title: "",
    cuisine: "",
    category: "",
    difficulty: "",
    servings: "",
    prepTime: "",
    cookTime: "",
    instructions: "",
    image_url: "",
  });

  // Ingredient builder
  const [ingredientList, setIngredientList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [ingQty, setIngQty] = useState("");
  const [ingUnit, setIngUnit] = useState("");
  const [ingPrep, setIngPrep] = useState("");
  const searchRef = useRef(null);

  const UNITS = ["", "cup", "cups", "tbsp", "tsp", "oz", "lb", "g", "kg", "ml", "l", "piece", "pieces", "pinch", "dash", "clove", "cloves", "slice", "slices"];

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Load recipe
  useEffect(() => {
    const fetchRecipe = async () => {
      setLoading(true);
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();

        const { data, error } = await supabase.from("recipes").select("*").eq("id", id).single();
        if (error) {
          console.error("Supabase fetch error:", error);
          setError(`Failed to load recipe: ${error.message}`);
          setLoading(false);
          return;
        }
        if (!data) { setError("Recipe not found."); setLoading(false); return; }

        const currentUserId = userData?.id || authUser?.id;
        if (!currentUserId) { setError("Please log in to edit recipes."); setLoading(false); return; }
        if (data.owner_id !== currentUserId) { setError("You don't have permission to edit this recipe."); setLoading(false); return; }
        if (data.status === "approved") { setError("This recipe has already been approved and cannot be edited."); setLoading(false); return; }

        // Parse existing ingredients
        let rawIngredients = [];
        if (Array.isArray(data.ingredients)) rawIngredients = data.ingredients;
        else if (typeof data.ingredients === "string") {
          try { const p = JSON.parse(data.ingredients); rawIngredients = Array.isArray(p) ? p : data.ingredients.split("\n"); }
          catch { rawIngredients = data.ingredients.split("\n"); }
        }
        setIngredientList(rawIngredients.filter(Boolean).map(raw => ({
          raw, name: raw, qty: "", unit: "", prep: "", image_url: null
        })));

        // Parse existing instructions
        let parsedInstructions = "";
        if (Array.isArray(data.instructions)) parsedInstructions = data.instructions.join("\n");
        else if (typeof data.instructions === "string") {
          try { const p = JSON.parse(data.instructions); parsedInstructions = Array.isArray(p) ? p.join("\n") : data.instructions; }
          catch { parsedInstructions = data.instructions; }
        }

        setForm({
          title: data.title || "",
          cuisine: data.cuisine || "",
          category: data.category || "",
          difficulty: data.difficulty || "",
          servings: data.servings || "",
          prepTime: data.prepTime || "",
          cookTime: data.cookTime || "",
          instructions: parsedInstructions,
          image_url: data.image_url || "",
        });
      } catch (e) {
        console.error("fetchRecipe exception:", e);
        setError("Failed to load recipe: " + e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchRecipe();
  }, [id, userData]);

  // Live ingredient search
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); setShowDropdown(false); return; }
    const timeout = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const { data, error } = await supabase
          .from("ingredients")
          .select("name, image_url")
          .ilike("name", `%${searchQuery}%`)
          .limit(8);
        if (!error && data) { setSearchResults(data); setShowDropdown(true); }
      } catch (e) { console.error(e); }
      finally { setSearchLoading(false); }
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const handleSelectIngredient = (ing) => {
    setSelectedIngredient(ing);
    setSearchQuery(ing.name);
    setShowDropdown(false);
  };

  const handleAddIngredient = () => {
    const name = selectedIngredient?.name || searchQuery.trim();
    if (!name) return;
    const parts = [ingQty, ingUnit, name, ingPrep ? `(${ingPrep})` : ""].filter(Boolean).join(" ").trim();
    setIngredientList(prev => [...prev, {
      raw: parts, name, qty: ingQty, unit: ingUnit, prep: ingPrep,
      image_url: selectedIngredient?.image_url || null,
    }]);
    setSearchQuery(""); setSelectedIngredient(null);
    setIngQty(""); setIngUnit(""); setIngPrep("");
  };

  const handleRemoveIngredient = (index) => setIngredientList(prev => prev.filter((_, i) => i !== index));

  const handleMoveIngredient = (index, dir) => {
    setIngredientList(prev => {
      const next = [...prev];
      const swap = index + dir;
      if (swap < 0 || swap >= next.length) return next;
      [next[index], next[swap]] = [next[swap], next[index]];
      return next;
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg("");
    try {
      const ingredientsArray = ingredientList.map(i => i.raw).filter(Boolean);
      const instructionsArray = form.instructions.split("\n").map(s => s.trim()).filter(Boolean);

      const { error } = await supabase.from("recipes").update({
        title: form.title,
        cuisine: form.cuisine,
        category: form.category,
        difficulty: form.difficulty,
        servings: parseInt(form.servings) || null,
        prepTime: form.prepTime ? parseInt(form.prepTime) : null,
        cookTime: form.cookTime ? parseInt(form.cookTime) : null,
        ingredients: ingredientsArray,
        instructions: instructionsArray,
        image_url: form.image_url,
      }).eq("id", id);

      if (error) throw error;
      setSuccessMsg("✅ Recipe updated successfully!");
      setTimeout(() => navigate(`/recipe/${id}`), 1500);
    } catch (err) {
      setError("Failed to save: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="edit-page">
      <div className="loading-container"><div className="loading-spinner"></div><p>Loading recipe...</p></div>
    </div>
  );

  if (error) return (
    <div className="edit-page">
      <div className="edit-error-box">
        <span className="edit-error-icon">⚠️</span>
        <h2>{error}</h2>
        <button className="edit-back-btn" onClick={() => navigate(-1)}>← Go Back</button>
      </div>
    </div>
  );

  return (
    <div className="edit-page">
      <header className="edit-header">
        <button onClick={() => navigate(-1)} className="edit-back-btn">← Back</button>
        <h1 className="edit-header-logo">CookEase</h1>
        <div className="edit-status-badge">⏳ Pending</div>
      </header>

      <div className="edit-container">
        <div className="edit-title-row">
          <h2 className="edit-page-title">✏️ Edit Recipe</h2>
          <p className="edit-page-subtitle">This recipe is pending approval. You can still make changes.</p>
        </div>

        {successMsg && <div className="edit-success">{successMsg}</div>}

        <form onSubmit={handleSubmit} className="edit-form">

          {/* Basic Info */}
          <div className="edit-section">
            <h3 className="edit-section-title">📋 Basic Information</h3>
            <div className="edit-grid-2">
              <div className="edit-field">
                <label>Recipe Title *</label>
                <input name="title" value={form.title} onChange={handleChange} required placeholder="e.g. Chicken Souvlaki" />
              </div>
              <div className="edit-field">
                <label>Image URL</label>
                <input name="image_url" value={form.image_url} onChange={handleChange} placeholder="https://..." />
              </div>
            </div>
          </div>

          {/* Classification */}
          <div className="edit-section">
            <h3 className="edit-section-title">🏷️ Classification</h3>
            <div className="edit-grid-3">
              <div className="edit-field">
                <label>Cuisine</label>
                <input name="cuisine" value={form.cuisine} onChange={handleChange} placeholder="e.g. Greek, Italian" />
              </div>
              <div className="edit-field">
                <label>Category</label>
                <input name="category" value={form.category} onChange={handleChange} placeholder="e.g. Main Course, Dessert" />
              </div>
              <div className="edit-field">
                <label>Difficulty</label>
                <select name="difficulty" value={form.difficulty} onChange={handleChange}>
                  <option value="">Select...</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>
          </div>

          {/* Time & Servings */}
          <div className="edit-section">
            <h3 className="edit-section-title">⏱️ Time & Servings</h3>
            <div className="edit-grid-3">
              <div className="edit-field">
                <label>Servings</label>
                <input type="number" name="servings" value={form.servings} onChange={handleChange} placeholder="e.g. 4" min="1" />
              </div>
              <div className="edit-field">
                <label>Prep Time (minutes)</label>
                <input type="number" name="prepTime" value={form.prepTime} onChange={handleChange} placeholder="e.g. 30" min="0" />
              </div>
              <div className="edit-field">
                <label>Cook Time (minutes)</label>
                <input type="number" name="cookTime" value={form.cookTime} onChange={handleChange} placeholder="e.g. 15" min="0" />
              </div>
            </div>
          </div>

          {/* Ingredients with search */}
          <div className="edit-section">
            <h3 className="edit-section-title">🥗 Ingredients</h3>
            <p className="edit-field-hint">Search for an ingredient, set the quantity and unit, then click Add.</p>

            <div className="ing-builder">
              <div className="ing-search-wrap" ref={searchRef}>
                <input
                  className="ing-search-input"
                  type="text"
                  placeholder="🔍 Search ingredient..."
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setSelectedIngredient(null); }}
                  onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                />
                {searchLoading && <span className="ing-search-spinner">⏳</span>}
                {showDropdown && searchResults.length > 0 && (
                  <ul className="ing-dropdown">
                    {searchResults.map((r, i) => (
                      <li key={i} className="ing-dropdown-item" onMouseDown={() => handleSelectIngredient(r)}>
                        {r.image_url && <img src={r.image_url} alt={r.name} className="ing-dropdown-img" />}
                        <span>{r.name}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <input className="ing-qty-input" type="text" placeholder="Qty (e.g. 2)" value={ingQty} onChange={e => setIngQty(e.target.value)} />
              <select className="ing-unit-select" value={ingUnit} onChange={e => setIngUnit(e.target.value)}>
                {UNITS.map(u => <option key={u} value={u}>{u || "— unit —"}</option>)}
              </select>
              <input className="ing-prep-input" type="text" placeholder="Prep (e.g. chopped)" value={ingPrep} onChange={e => setIngPrep(e.target.value)} />
              <button type="button" className="ing-add-btn" onClick={handleAddIngredient}>+ Add</button>
            </div>

            {ingredientList.length > 0 && (
              <div className="ing-list">
                {ingredientList.map((ing, i) => (
                  <div key={i} className="ing-list-item">
                    <div className="ing-list-img-wrap">
                      {ing.image_url
                        ? <img src={ing.image_url} alt={ing.name} className="ing-list-img" onError={e => e.target.style.display = "none"} />
                        : <span className="ing-list-img-fallback">🥄</span>
                      }
                    </div>
                    <span className="ing-list-text">{ing.raw}</span>
                    <div className="ing-list-actions">
                      <button type="button" className="ing-move-btn" onClick={() => handleMoveIngredient(i, -1)} disabled={i === 0} title="Move up">↑</button>
                      <button type="button" className="ing-move-btn" onClick={() => handleMoveIngredient(i, 1)} disabled={i === ingredientList.length - 1} title="Move down">↓</button>
                      <button type="button" className="ing-remove-btn" onClick={() => handleRemoveIngredient(i)} title="Remove">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {ingredientList.length === 0 && (
              <p className="ing-empty">No ingredients added yet. Use the search above to add some.</p>
            )}
          </div>

          {/* Instructions */}
          <div className="edit-section">
            <h3 className="edit-section-title">📋 Directions</h3>
            <p className="edit-field-hint">One step per line. Numbers are added automatically.</p>
            <div className="edit-field">
              <textarea
                name="instructions"
                value={form.instructions}
                onChange={handleChange}
                rows={10}
                placeholder={"Preheat oven to 180°C.\nMix all dry ingredients together.\nAdd wet ingredients and stir until combined."}
              />
            </div>
          </div>

          {/* Image Preview */}
          {form.image_url && (
            <div className="edit-section">
              <h3 className="edit-section-title">🖼️ Image Preview</h3>
              <div className="edit-image-preview">
                <img src={form.image_url} alt="Recipe preview" onError={e => { e.target.style.display = "none"; }} />
              </div>
            </div>
          )}

          {error && <div className="edit-error-inline">⚠️ {error}</div>}

          <div className="edit-actions">
            <button type="button" className="edit-cancel-btn" onClick={() => navigate(-1)}>Cancel</button>
            <button type="submit" className="edit-save-btn" disabled={saving}>
              {saving ? "⏳ Saving..." : "💾 Save Changes"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default EditRecipe;