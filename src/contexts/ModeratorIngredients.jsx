import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import "../../styles/ModeratorIngredients.css";

function ModeratorIngredients() {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ Add ingredient modal state
  const [showModal, setShowModal] = useState(false);
  const [newIngredient, setNewIngredient] = useState({ name: "", image_url: "" });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("ingredients")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      setIngredients(data || []);
    } catch (err) {
      console.error("Error fetching ingredients:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setModalError("Please upload an image file."); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setModalError("");
  };

  const handleAddIngredient = async () => {
    setModalError("");
    if (!newIngredient.name.trim()) { setModalError("Ingredient name is required."); return; }
    setSaving(true);

    try {
      let image_url = "";

      // Upload image if provided
      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const fileName = `${newIngredient.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("ingredients")
          .upload(fileName, imageFile, { cacheControl: "3600", upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("ingredients")
          .getPublicUrl(fileName);
        image_url = urlData.publicUrl;
      }

      // Insert ingredient
      const { data, error } = await supabase
        .from("ingredients")
        .insert([{ name: newIngredient.name.trim(), image_url }])
        .select()
        .single();

      if (error) throw error;

      setIngredients((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setShowModal(false);
      setNewIngredient({ name: "", image_url: "" });
      setImageFile(null);
      setImagePreview("");
    } catch (err) {
      console.error("Error adding ingredient:", err);
      setModalError("Failed to add ingredient: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteIngredient = async (id, name) => {
    if (!window.confirm(`Delete ingredient "${name}"?`)) return;
    try {
      const { error } = await supabase.from("ingredients").delete().eq("id", id);
      if (error) throw error;
      setIngredients((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      alert("Failed to delete: " + err.message);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setNewIngredient({ name: "", image_url: "" });
    setImageFile(null);
    setImagePreview("");
    setModalError("");
  };

  const filtered = ingredients.filter((i) =>
    i.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mod-ingredients-page">
      {/* Header */}
      <div className="mod-ingredients-header">
        <div>
          <h1>🥕 Manage Ingredients</h1>
          <p className="mod-subtitle">{ingredients.length} ingredients in database</p>
        </div>
        {/* ✅ Add Ingredient Button */}
        <button className="add-ingredient-btn" onClick={() => setShowModal(true)}>
          ➕ Add Ingredient
        </button>
      </div>

      {/* Search */}
      <div className="mod-search-box">
        <input
          type="text"
          placeholder="🔍 Search ingredients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mod-search-input"
        />
      </div>

      {/* Ingredient Grid */}
      {loading ? (
        <div className="mod-loading">
          <div className="mod-spinner"></div>
          <p>Loading ingredients...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="mod-empty">
          <p>No ingredients found{searchTerm ? ` for "${searchTerm}"` : ""}.</p>
        </div>
      ) : (
        <div className="mod-ingredient-grid">
          {filtered.map((ing) => (
            <div key={ing.id} className="mod-ingredient-card">
              <img
                src={ing.image_url || "/ingredients/default.jpg"}
                alt={ing.name}
                className="mod-ingredient-img"
                onError={(e) => { e.target.src = "/ingredients/default.jpg"; }}
              />
              <span className="mod-ingredient-name">{ing.name}</span>
              <button
                className="mod-delete-btn"
                onClick={() => handleDeleteIngredient(ing.id, ing.name)}
                title="Delete ingredient"
              >
                🗑
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ✅ Add Ingredient Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Ingredient</h2>
              <button className="modal-close-btn" onClick={closeModal}>✕</button>
            </div>

            <div className="modal-body">
              {/* Name */}
              <div className="modal-form-group">
                <label>Ingredient Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Garlic"
                  value={newIngredient.name}
                  onChange={(e) => { setNewIngredient({ ...newIngredient, name: e.target.value }); setModalError(""); }}
                  className="modal-input"
                />
              </div>

              {/* Image */}
              <div className="modal-form-group">
                <label>Image (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  id="ingredient-img-upload"
                  style={{ display: "none" }}
                />
                <label htmlFor="ingredient-img-upload" className="modal-img-upload-label">
                  {imagePreview ? (
                    <img src={imagePreview} alt="preview" className="modal-img-preview" />
                  ) : (
                    <div className="modal-img-placeholder">
                      <span>📷</span>
                      <p>Click to upload image</p>
                    </div>
                  )}
                </label>
              </div>

              {modalError && <p className="modal-error">⚠ {modalError}</p>}
            </div>

            <div className="modal-footer">
              <button className="modal-cancel-btn" onClick={closeModal} disabled={saving}>Cancel</button>
              <button className="modal-save-btn" onClick={handleAddIngredient} disabled={saving}>
                {saving ? "Adding..." : "Add Ingredient"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ModeratorIngredients;