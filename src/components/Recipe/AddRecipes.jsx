import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useRoles } from "../../contexts/RoleContext";
import { supabase } from "../../supabaseClient";
import imageCompression from "browser-image-compression";
import "../../styles/AddRecipes.css";

const slugify = (text = "") =>
  text.toLowerCase().trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

function AddRecipe() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useRoles();

  useEffect(() => {
    if (!loading && !user) navigate("/login", { state: { from: location } });

    // ✅ Prevent page reload on alt-tab
    const handleVisibility = () => {};
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [user, loading, navigate, location]);

  const categoryOptions = ["Breakfast","Lunch","Dinner","Dessert","Snacks","Appetizer","Soup","Salad","Beverage","Side Dish"];
  const cuisineOptions = ["Filipino","Chinese","Japanese","Korean","Thai","Vietnamese","Indian","Italian","French","American","Mexican","Spanish","Greek","Middle Eastern","African","Fusion"];
  const difficultyOptions = ["Easy", "Medium", "Hard"];

  const [formData, setFormData] = useState({
    title: "", category: "", cuisine: "", difficulty: "",
    prepTime: "", cookTime: "",
    servings: "1", // ✅ Default servings = 1
    ingredients: [],
    instructions: [""]
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // ✅ Ingredient search state
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchDebounce = useRef(null);

  // ✅ Search ingredients from DB
  useEffect(() => {
    if (!ingredientSearch.trim()) {
      setSearchResults([]);
      return;
    }
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const { data, error } = await supabase
          .from("ingredients")
          .select("id, name, image_url")
          .ilike("name", `%${ingredientSearch}%`)
          .limit(12);
        if (!error) setSearchResults(data || []);
      } catch (e) {
        console.error("Ingredient search error:", e);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  }, [ingredientSearch]);

  const addIngredientFromSearch = (ingredient) => {
    // Avoid duplicates
    const alreadyAdded = formData.ingredients.some(
      (i) => i.name?.toLowerCase() === ingredient.name.toLowerCase()
    );
    if (alreadyAdded) return;
    setFormData((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, { id: ingredient.id, name: ingredient.name, image_url: ingredient.image_url, amount: "" }]
    }));
    setIngredientSearch("");
    setSearchResults([]);
    if (fieldErrors.ingredients) setFieldErrors({ ...fieldErrors, ingredients: "" });
  };

  const removeIngredientCard = (idx) => {
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== idx)
    }));
  };

  const updateIngredientAmount = (idx, amount) => {
    setFormData((prev) => {
      const updated = [...prev.ingredients];
      updated[idx] = { ...updated[idx], amount };
      return { ...prev, ingredients: updated };
    });
  };

  if (loading) {
    return (
      <div className="add-recipe-page">
        <div className="add-recipe-main">
          <div className="add-recipe-container">
            <div className="loading-spinner"><div className="spinner"></div><p>Loading...</p></div>
          </div>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (fieldErrors[e.target.name]) setFieldErrors({ ...fieldErrors, [e.target.name]: "" });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("Please upload an image file"); return; }
    if (file.size > 10 * 1024 * 1024) { alert("Image size should be less than 10MB"); return; }
    try {
      const compressed = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1200, useWebWorker: true });
      setImageFile(compressed);
      setImagePreview(URL.createObjectURL(compressed));
    } catch (error) {
      alert("Failed to process image. Please try another file.");
    }
  };

  const handleInstructionChange = (i, v) => {
    const steps = [...formData.instructions];
    steps[i] = v;
    setFormData({ ...formData, instructions: steps });
    if (fieldErrors.instructions) setFieldErrors({ ...fieldErrors, instructions: "" });
  };

  const addInstruction = () => setFormData({ ...formData, instructions: [...formData.instructions, ""] });
  const removeInstruction = (i) => {
    if (formData.instructions.length === 1) return;
    setFormData({ ...formData, instructions: formData.instructions.filter((_, idx) => idx !== i) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFieldErrors({});

    const cleaned = {
      ...formData,
      ingredients: formData.ingredients.map(i => `${i.amount ? i.amount + " " : ""}${i.name}`.trim()),
      instructions: formData.instructions.filter(i => i.trim())
    };

    const errors = {};
    if (!cleaned.title.trim()) errors.title = "Recipe title is required";
    if (!cleaned.category) errors.category = "Please select a category";
    if (!cleaned.cuisine) errors.cuisine = "Please select a cuisine";
    if (!cleaned.difficulty) errors.difficulty = "Please select difficulty";
    if (!formData.ingredients.length) errors.ingredients = "Add at least one ingredient";
    if (!cleaned.instructions.length) errors.instructions = "Add at least one instruction step";

    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      setSubmitting(false);
      document.querySelector(".error")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    try {
      const { data: recipe, error: insertError } = await supabase
        .from("recipes")
        .insert([{
          ...cleaned,
          slug: `${slugify(cleaned.title)}-${crypto.randomUUID().slice(0, 6)}`,
          image_url: "",
          owner_id: user.id,
          owner_name: user.user_metadata?.full_name || user.email,
          rating: 0,
          status: "pending"
        }])
        .select().single();

      if (insertError) throw insertError;

      if (imageFile) {
        setUploading(true);
        try {
          const ext = imageFile.name.split(".").pop();
          const filePath = `${recipe.id}/main.${ext}`;
          const { error: uploadError } = await supabase.storage.from("recipes").upload(filePath, imageFile, { cacheControl: "3600", upsert: true });
          if (uploadError) throw uploadError;
          const { data } = supabase.storage.from("recipes").getPublicUrl(filePath);
          await supabase.from("recipes").update({ image_url: data.publicUrl }).eq("id", recipe.id);
        } finally {
          setUploading(false);
        }
      }

      alert("Recipe submitted for approval!");
      navigate("/");
    } catch (err) {
      console.error(err);
      alert("Failed to submit recipe: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="add-recipe-page">
      <div className="add-recipe-main">
        <div className="add-recipe-container">
          <div className="page-header">
            <h1 className="page-title">Add New Recipe</h1>
            <p className="page-subtitle">Share your favorite dish with the community</p>
          </div>

          <form className="recipe-form" onSubmit={handleSubmit}>

            {/* Recipe Image */}
            <div className="form-section">
              <h2>Recipe Image</h2>
              <div className="image-upload">
                <input type="file" accept="image/*" onChange={handleImageChange} id="recipe-image" style={{ display: "none" }} />
                <label htmlFor="recipe-image" className="image-upload-label">
                  {imagePreview ? (
                    <div className="image-preview-wrapper">
                      <img src={imagePreview} alt="Preview" className="image-preview" />
                      <button type="button" className="remove-image-btn" onClick={(e) => { e.preventDefault(); setImageFile(null); setImagePreview(""); }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                      <p>Click to upload recipe image</p>
                      <span>PNG, JPG up to 10MB</span>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Basic Info */}
            <div className="form-section">
              <h2>Basic Information</h2>
              <div className="form-group">
                <label htmlFor="title">Recipe Title *</label>
                <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} placeholder="e.g., Chicken Adobo" required className={fieldErrors.title ? "error-input" : ""} />
                {fieldErrors.title && <span className="error">{fieldErrors.title}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="category">Category *</label>
                  <select id="category" name="category" value={formData.category} onChange={handleChange} required className={fieldErrors.category ? "error-input" : ""}>
                    <option value="">Select category</option>
                    {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {fieldErrors.category && <span className="error">{fieldErrors.category}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="cuisine">Cuisine *</label>
                  <select id="cuisine" name="cuisine" value={formData.cuisine} onChange={handleChange} required className={fieldErrors.cuisine ? "error-input" : ""}>
                    <option value="">Select cuisine</option>
                    {cuisineOptions.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {fieldErrors.cuisine && <span className="error">{fieldErrors.cuisine}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="difficulty">Difficulty *</label>
                  <select id="difficulty" name="difficulty" value={formData.difficulty} onChange={handleChange} required className={fieldErrors.difficulty ? "error-input" : ""}>
                    <option value="">Select difficulty</option>
                    {difficultyOptions.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  {fieldErrors.difficulty && <span className="error">{fieldErrors.difficulty}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="servings">Servings <span className="field-note">Default is 1</span></label>
                  <input type="number" id="servings" name="servings" value={formData.servings} onChange={handleChange} min="1" max="100" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="prepTime">Prep Time (minutes)</label>
                  <input type="number" id="prepTime" name="prepTime" value={formData.prepTime} onChange={handleChange} placeholder="e.g., 15" min="0" max="999" />
                </div>
                <div className="form-group">
                  <label htmlFor="cookTime">Cook Time (minutes)</label>
                  <input type="number" id="cookTime" name="cookTime" value={formData.cookTime} onChange={handleChange} placeholder="e.g., 30" min="0" max="999" />
                </div>
              </div>
            </div>

            {/* ✅ Ingredients — Search + Cards */}
            <div className="form-section">
              <div className="section-header">
                <h2>Ingredients *</h2>
                <span className="item-count">{formData.ingredients.length} items</span>
              </div>
              {fieldErrors.ingredients && <span className="error">{fieldErrors.ingredients}</span>}

              {/* Search Box */}
              <div className="ingredient-search-wrapper">
                <input
                  type="text"
                  className="ingredient-search-input"
                  placeholder="🔍 Search ingredient (e.g. chicken, garlic)..."
                  value={ingredientSearch}
                  onChange={(e) => setIngredientSearch(e.target.value)}
                />
                {searchLoading && <div className="search-loading-dots">Searching...</div>}

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="ingredient-search-results">
                    {searchResults.map((ing) => (
                      <div key={ing.id} className="ingredient-result-card" onClick={() => addIngredientFromSearch(ing)}>
                        <img
                          src={ing.image_url || "/ingredients/default.jpg"}
                          alt={ing.name}
                          className="ingredient-result-img"
                          onError={(e) => { e.target.src = "/ingredients/default.jpg"; }}
                        />
                        <span className="ingredient-result-name">{ing.name}</span>
                        <span className="ingredient-result-add">+ Add</span>
                      </div>
                    ))}
                  </div>
                )}

                {ingredientSearch && !searchLoading && searchResults.length === 0 && (
                  <div className="no-ingredient-results">No ingredients found for "{ingredientSearch}"</div>
                )}
              </div>

              {/* Added Ingredient Cards */}
              {formData.ingredients.length > 0 && (
                <div className="added-ingredients-grid">
                  {formData.ingredients.map((ing, idx) => (
                    <div key={idx} className="added-ingredient-card">
                      <button type="button" className="remove-ingredient-card-btn" onClick={() => removeIngredientCard(idx)}>✕</button>
                      <img
                        src={ing.image_url || "/ingredients/default.jpg"}
                        alt={ing.name}
                        className="added-ingredient-img"
                        onError={(e) => { e.target.src = "/ingredients/default.jpg"; }}
                      />
                      <span className="added-ingredient-name">{ing.name}</span>
                      <input
                        type="text"
                        className="added-ingredient-amount"
                        placeholder="Amount (e.g. 2 cups)"
                        value={ing.amount}
                        onChange={(e) => updateIngredientAmount(idx, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="form-section">
              <div className="section-header">
                <h2>Instructions *</h2>
                <span className="item-count">{formData.instructions.filter(i => i.trim()).length} steps</span>
              </div>
              {fieldErrors.instructions && <span className="error">{fieldErrors.instructions}</span>}
              <div className="dynamic-list">
                {formData.instructions.map((instruction, index) => (
                  <div key={index} className="dynamic-field instruction-field">
                    <span className="step-number">Step {index + 1}</span>
                    <textarea value={instruction} onChange={(e) => handleInstructionChange(index, e.target.value)} placeholder={`Describe step ${index + 1}...`} rows="3" />
                    <button type="button" onClick={() => removeInstruction(index)} className="remove-btn" disabled={formData.instructions.length === 1} title="Remove step">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addInstruction} className="add-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add Step
              </button>
            </div>

            {/* Submit */}
            <div className="form-actions">
              <button type="button" onClick={() => navigate("/")} className="cancel-btn" disabled={submitting || uploading}>Cancel</button>
              <button type="submit" className="submit-btn" disabled={submitting || uploading}>
                {submitting ? (<><div className="btn-spinner"></div>Submitting...</>) :
                  uploading ? (<><div className="btn-spinner"></div>Uploading...</>) : (
                  <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>Submit Recipe</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddRecipe;