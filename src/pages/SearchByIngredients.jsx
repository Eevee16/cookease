import { useState, useEffect } from 'react';
import RecipeCard from '../components/recipeCard';
import { supabase } from '../supabaseClient'; // Make sure your Supabase client is set up
import '../styles/SearchByIngredients.css';

function SearchByIngredients() {
  const [recipes, setRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [allIngredients, setAllIngredients] = useState([]);
  const [ingredientImages, setIngredientImages] = useState({});

  // --- Local fallback images ---
  const localImages = {
    chicken: '/images/ingredients/chicken.jpg',
    'chicken breast': '/images/ingredients/chicken-breast.jpg',
    beef: '/images/ingredients/beef.jpg',
    'ground beef': '/images/ingredients/ground-beef.jpg',
    pork: '/images/ingredients/pork.jpg',
    bacon: '/images/ingredients/bacon.jpg',
    salmon: '/images/ingredients/salmon.jpg',
    onion: '/images/ingredients/onion.jpg',
    garlic: '/images/ingredients/garlic.jpg',
    tomato: '/images/ingredients/tomato.jpg',
    potato: '/images/ingredients/potato.jpg',
    carrot: '/images/ingredients/carrot.jpg',
    broccoli: '/images/ingredients/broccoli.jpg',
    'bell pepper': '/images/ingredients/bell-pepper.jpg',
    'green onion': '/images/ingredients/green-onion.jpg',
    spinach: '/images/ingredients/spinach.jpg',
    mushroom: '/images/ingredients/mushroom.jpg',
    rice: '/images/ingredients/rice.jpg',
    pasta: '/images/ingredients/pasta.jpg',
    bread: '/images/ingredients/bread.jpg',
    flour: '/images/ingredients/flour.jpg',
    milk: '/images/ingredients/milk.jpg',
    butter: '/images/ingredients/butter.jpg',
    cheese: '/images/ingredients/cheese.jpg',
    yogurt: '/images/ingredients/yogurt.jpg',
    salt: '/images/ingredients/salt.jpg',
    'black pepper': '/images/ingredients/black-pepper.jpg',
    'olive oil': '/images/ingredients/olive-oil.jpg',
    default: '/images/ingredients/default.jpg'
  };

  // --- Fetch recipes from Supabase ---
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const { data: recipesData, error } = await supabase
          .from('recipes')
          .select('*');

        if (error) throw error;

        const recipesList = recipesData.map(r => ({ ...r, id: r.id }));
        setRecipes(recipesList);
        setFilteredRecipes(recipesList);
        extractIngredients(recipesList);
      } catch (err) {
        console.error('Error fetching recipes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, []);

  // --- Extract unique ingredients ---
  const extractIngredients = (recipesList) => {
    const ingredientsSet = new Set();

    recipesList.forEach(recipe => {
      if (Array.isArray(recipe.ingredients)) {
        recipe.ingredients.forEach(ing => {
          const cleaned = ing
            .toLowerCase()
            .replace(/[0-9]/g, '')
            .replace(
              /cup|tablespoon|teaspoon|pound|ounce|gram|kg|lb|oz|tbsp|tsp|cups|tablespoons|teaspoons|pounds|ounces|grams/gi,
              ''
            )
            .replace(/minced|chopped|diced|sliced|crushed|ground|fresh|dried|cooked/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
          if (cleaned.length > 2) ingredientsSet.add(cleaned);
        });
      }
    });

    setAllIngredients(Array.from(ingredientsSet).sort());
  };

  // --- Fetch ingredient images from Supabase ---
  useEffect(() => {
    const fetchIngredientImages = async () => {
      try {
        const { data: ingData, error } = await supabase
          .from('ingredients')
          .select('*');

        if (error) throw error;

        const imagesMap = {};
        ingData.forEach(item => {
          if (item.name && item.image) imagesMap[item.name.toLowerCase()] = item.image;
        });

        setIngredientImages(imagesMap);
      } catch (err) {
        console.error('Error fetching ingredient images:', err);
      }
    };

    fetchIngredientImages();
  }, []);

  // --- Filter recipes when ingredients are selected ---
  useEffect(() => {
    if (selectedIngredients.length === 0) {
      setFilteredRecipes(recipes);
      return;
    }

    const filtered = recipes.filter(recipe =>
      Array.isArray(recipe.ingredients) &&
      selectedIngredients.every(sel =>
        recipe.ingredients.some(ing => ing.toLowerCase().includes(sel.toLowerCase()))
      )
    );

    setFilteredRecipes(filtered);
  }, [selectedIngredients, recipes]);

  // --- Toggle ingredient selection ---
  const toggleIngredient = (ingredient) => {
    setSelectedIngredients(prev =>
      prev.includes(ingredient) ? prev.filter(i => i !== ingredient) : [...prev, ingredient]
    );
  };

  const clearAll = () => {
    setSelectedIngredients([]);
    setSearchTerm('');
  };

  // --- Get image for ingredient ---
  const getIngredientImage = (ingredient) => {
    const lower = ingredient.toLowerCase();
    if (ingredientImages[lower]) return ingredientImages[lower];
    return `/images/ingredients/${lower.replace(/\s+/g, '-')}.jpg`;
  };

  // --- Filter ingredients by search ---
  const filteredIngredientsList = allIngredients.filter(ing =>
    ing.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="search-ingredients-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading ingredients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="search-ingredients-page">
      <main className="search-main">
        <div className="search-container">
          <div className="search-title-section">
            <h1 className="page-title">Search by Ingredients</h1>
            <p className="page-subtitle">
              Select the ingredients you have, and we'll show you recipes you can make!
            </p>
          </div>

          <div className="search-content">
            {/* Ingredient Selector */}
            <div className="ingredient-selector">
              <div className="selector-header">
                <h2>Available Ingredients</h2>
                <span className="ingredient-count">{allIngredients.length} total</span>
              </div>

              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search ingredients..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="ingredient-search"
                />
              </div>

              {selectedIngredients.length > 0 && (
                <div className="selected-section">
                  <div className="selected-header">
                    <h3>Selected ({selectedIngredients.length})</h3>
                    <button className="clear-btn" onClick={clearAll}>Clear All</button>
                  </div>
                  <div className="selected-chips">
                    {selectedIngredients.map(ing => (
                      <div key={ing} className="selected-chip">
                        <span>{ing}</span>
                        <button onClick={() => toggleIngredient(ing)} className="chip-remove">✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ingredient Cards */}
              <div className="ingredients-grid">
                {filteredIngredientsList.length > 0 ? (
                  filteredIngredientsList.map(ing => (
                    <div
                      key={ing}
                      className={`ingredient-card ${selectedIngredients.includes(ing) ? 'selected' : ''}`}
                      onClick={() => toggleIngredient(ing)}
                    >
                      <div className="ingredient-image">
                        <img
                          src={getIngredientImage(ing)}
                          alt={ing}
                          loading="lazy"
                          onError={e => e.currentTarget.src = localImages.default}
                        />
                        {selectedIngredients.includes(ing) && (
                          <div className="selected-overlay">
                            <span className="check-icon">✓</span>
                          </div>
                        )}
                      </div>
                      <div className="ingredient-name"><span>{ing}</span></div>
                    </div>
                  ))
                ) : (
                  <p className="no-results">No ingredients found</p>
                )}
              </div>
            </div>

            {/* Recipe Results */}
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
                  <p>Try selecting different ingredients or fewer ingredients.</p>
                  <button className="clear-btn-alt" onClick={clearAll}>Clear Selection</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default SearchByIngredients;
