import { useState, useEffect } from 'react';
import RecipeCard from '../components/RecipeCard';
import { supabase } from '../supabaseClient';
import { useRoles } from '../contexts/RoleContext';
import '../styles/SearchByIngredients.css';

function SearchByIngredients() {
  const { isModerator } = useRoles();
  const [recipes, setRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [loadingRecipes, setLoadingRecipes] = useState(true);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [allIngredients, setAllIngredients] = useState([]);

  // Moderator add panel
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [newName, setNewName] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => { fetchIngredients(); }, []);

  const fetchIngredients = async () => {
    try {
      const { data, error } = await supabase
        .from('ingredients')
        .select('id, name, image_url')
        .order('name', { ascending: true });
      if (!error) setAllIngredients(data || []);
    } catch (err) { console.error('Error fetching ingredients:', err); }
  };

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const { data, error } = await supabase
          .from('recipes').select('*').in('status', ['approved', 'done']);
        if (error) throw error;
        setRecipes(data || []);
        setFilteredRecipes(data || []);
      } catch (err) { console.error('Error fetching recipes:', err); }
      finally { setLoadingRecipes(false); }
    };
    fetchRecipes();
  }, []);

  useEffect(() => {
    if (selectedIngredients.length === 0) { setFilteredRecipes(recipes); return; }
    const filtered = recipes.filter(recipe => {
      let list = recipe.ingredients;
      if (typeof list === 'string') {
        try { list = JSON.parse(list); }
        catch (e) { list = list.split(/\n|,/).map(i => i.trim()).filter(Boolean); }
      }
      if (!Array.isArray(list)) return false;
      return selectedIngredients.every(sel =>
        list.some(ing => ing.toLowerCase().includes(sel.toLowerCase()))
      );
    });
    setFilteredRecipes(filtered);
  }, [selectedIngredients, recipes]);

  const toggleIngredient = (name) => {
    setSelectedIngredients(prev =>
      prev.includes(name) ? prev.filter(i => i !== name) : [...prev, name]
    );
  };

  const clearAll = () => { setSelectedIngredients([]); setSearchTerm(''); };

  const selectedIngredientObjects = allIngredients.filter(ing =>
    selectedIngredients.includes(ing.name)
  );

  const unselectedIngredients = allIngredients.filter(ing =>
    !selectedIngredients.includes(ing.name) &&
    ing.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Add ingredient handlers
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setModalError('');
  };

  const handleAddIngredient = async () => {
    setModalError('');
    if (!newName.trim()) { setModalError('Name is required.'); return; }
    setSaving(true);
    try {
      let image_url = '';
      if (imageFile) {
        const ext = imageFile.name.split('.').pop();
        const fileName = `${newName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('ingredients').upload(fileName, imageFile, { cacheControl: '3600', upsert: true });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('ingredients').getPublicUrl(fileName);
        image_url = urlData.publicUrl;
      }
      const { data, error } = await supabase
        .from('ingredients')
        .insert([{ name: newName.trim(), image_url }])
        .select().single();
      if (error) throw error;
      setAllIngredients(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName('');
      setImageFile(null);
      setImagePreview('');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      setModalError('Failed: ' + err.message);
    } finally { setSaving(false); }
  };

  const closePanel = () => {
    setShowAddPanel(false);
    setNewName(''); setImageFile(null);
    setImagePreview(''); setModalError(''); setSaveSuccess(false);
  };

  if (loadingRecipes) {
    return (
      <div className="search-ingredients-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="search-ingredients-page">
      <main className="search-main">
        <div className="search-title-section">
          <h1 className="page-title">Search by Ingredients</h1>
          <p className="page-subtitle">Select the ingredients you have and we'll find matching recipes!</p>
        </div>

        <div className="search-content">
          {/* Left — Ingredient Selector */}
          <div className="ingredient-selector">
            <div className="selector-header">
              <h2>Ingredients</h2>
              <div className="selector-header-right">
                {selectedIngredients.length > 0 && (
                  <button className="clear-btn" onClick={clearAll}>Clear ({selectedIngredients.length})</button>
                )}
                {isModerator && (
                  <button className="mod-add-btn" onClick={() => setShowAddPanel(v => !v)} title="Add Ingredient">
                    ➕ Add
                  </button>
                )}
              </div>
            </div>

            {/* ✅ Moderator compact add panel */}
            {showAddPanel && (
              <div className="add-ingredient-panel">
                <div className="add-panel-header">
                  <span>Add New Ingredient</span>
                  <button className="panel-close" onClick={closePanel}>✕</button>
                </div>
                <input
                  type="text"
                  placeholder="Ingredient name *"
                  value={newName}
                  onChange={(e) => { setNewName(e.target.value); setModalError(''); }}
                  className="panel-input"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  id="panel-img-upload"
                  style={{ display: 'none' }}
                />
                <label htmlFor="panel-img-upload" className="panel-img-label">
                  {imagePreview
                    ? <img src={imagePreview} alt="preview" className="panel-img-preview" />
                    : <div className="panel-img-placeholder"><span>📷</span><p>Click to upload image</p></div>
                  }
                </label>
                {modalError && <p className="panel-error">⚠ {modalError}</p>}
                {saveSuccess && <p className="panel-success">✓ Ingredient added!</p>}
                <button
                  className="panel-save-btn"
                  onClick={handleAddIngredient}
                  disabled={saving}
                >
                  {saving ? 'Adding...' : 'Add Ingredient'}
                </button>
              </div>
            )}

            <div className="search-box">
              <input
                type="text"
                placeholder="Search ingredients..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="ingredient-search"
              />
            </div>

            {/* ✅ Isolated selected section */}
            {selectedIngredientObjects.length > 0 && (
              <div className="selected-section">
                <p className="selected-section-label">Selected</p>
                <div className="ingredients-grid">
                  {selectedIngredientObjects.map(ing => (
                    <div
                      key={ing.id}
                      className="ingredient-card selected"
                      onClick={() => toggleIngredient(ing.name)}
                    >
                      <div className="ingredient-image">
                        <img
                          src={ing.image_url || '/ingredients/default.jpg'}
                          alt={ing.name}
                          loading="lazy"
                          onError={(e) => { e.currentTarget.src = '/ingredients/default.jpg'; }}
                        />
                        <div className="selected-overlay">
                          <span className="check-icon">✓</span>
                        </div>
                      </div>
                      <div className="ingredient-name"><span>{ing.name}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Unselected ingredients */}
            {selectedIngredientObjects.length > 0 && (
              <p className="available-label">Available</p>
            )}
            <div className="ingredients-grid scrollable">
              {unselectedIngredients.length > 0 ? (
                unselectedIngredients.map(ing => (
                  <div
                    key={ing.id}
                    className="ingredient-card"
                    onClick={() => toggleIngredient(ing.name)}
                  >
                    <div className="ingredient-image">
                      <img
                        src={ing.image_url || '/ingredients/default.jpg'}
                        alt={ing.name}
                        loading="lazy"
                        onError={(e) => { e.currentTarget.src = '/ingredients/default.jpg'; }}
                      />
                    </div>
                    <div className="ingredient-name"><span>{ing.name}</span></div>
                  </div>
                ))
              ) : (
                searchTerm && <p className="no-results">No ingredients found for "{searchTerm}"</p>
              )}
            </div>
          </div>

          {/* Right — Recipe Results */}
          <div className="recipe-results">
            <div className="results-header">
              <h2>Recipes</h2>
              <span className="results-count">{filteredRecipes.length} found</span>
            </div>

            {selectedIngredients.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🥘</div>
                <h3>Select ingredients to get started</h3>
                <p>Choose from the ingredients on the left to find recipes you can make.</p>
              </div>
            ) : filteredRecipes.length > 0 ? (
              <div className="recipe-grid">
                {filteredRecipes.map(recipe => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">😕</div>
                <h3>No recipes found</h3>
                <p>Try selecting different or fewer ingredients.</p>
                <button className="clear-btn-alt" onClick={clearAll}>Clear Selection</button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default SearchByIngredients;