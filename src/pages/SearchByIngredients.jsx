import { useState, useEffect } from 'react';
import RecipeCard from '../components/RecipeCard';
import { supabase } from '../supabaseClient';
import '../styles/SearchByIngredients.css';

function SearchByIngredients() {
  const [recipes, setRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [allIngredients, setAllIngredients] = useState([]);

  // Fetch recipes from Supabase
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        // Fetch only approved recipes (or all if no status field exists)
        const { data: recipesData, error } = await supabase
          .from('recipes')
          .select('*')
          .or('status.eq.approved,status.is.null'); // Show approved OR recipes without status

        if (error) throw error;

        console.log('Fetched recipes:', recipesData); // Debug log

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

  // Extract unique ingredients
  const extractIngredients = (recipesList) => {
    console.log('Extracting ingredients from:', recipesList); // Debug log
    
    const ingredientsSet = new Set();
    
    recipesList.forEach(recipe => {
      console.log('Recipe ingredients:', recipe.title, recipe.ingredients); // Debug log
      
      // Check if ingredients is an array or a string that needs parsing
      let ingredientsList = recipe.ingredients;
      
      // If it's a string, try to parse it as JSON
      if (typeof ingredientsList === 'string') {
        try {
          ingredientsList = JSON.parse(ingredientsList);
        } catch (e) {
          // If it's not JSON, split by newline or comma
          ingredientsList = ingredientsList.split(/\n|,/).map(i => i.trim()).filter(Boolean);
        }
      }
      
      if (Array.isArray(ingredientsList)) {
        ingredientsList.forEach(ing => {
          const cleaned = ing
            .toLowerCase()
            .replace(/[0-9]/g, '')
            .replace(/½|¼|¾|⅓|⅔|⅛|⅜|⅝|⅞/g, '') // Remove fractions
            .replace(
              /cup|tablespoon|teaspoon|pound|ounce|gram|kg|lb|oz|tbsp|tsp|cups|tablespoons|teaspoons|pounds|ounces|grams/gi,
              ''
            )
            .replace(/minced|chopped|diced|sliced|crushed|ground|fresh|dried|cooked|peeled|trimmed/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
          if (cleaned.length > 2) {
            ingredientsSet.add(cleaned);
          }
        });
      }
    });
    
    const ingredientsArray = Array.from(ingredientsSet).sort();
    console.log('Extracted ingredients:', ingredientsArray); // Debug log
    setAllIngredients(ingredientsArray);
  };

  // Filter recipes when ingredients are selected
  useEffect(() => {
    if (selectedIngredients.length === 0) {
      setFilteredRecipes(recipes);
      return;
    }
    
    const filtered = recipes.filter(recipe => {
      let ingredientsList = recipe.ingredients;
      
      // Handle string ingredients
      if (typeof ingredientsList === 'string') {
        try {
          ingredientsList = JSON.parse(ingredientsList);
        } catch (e) {
          ingredientsList = ingredientsList.split(/\n|,/).map(i => i.trim()).filter(Boolean);
        }
      }
      
      if (!Array.isArray(ingredientsList)) return false;
      
      return selectedIngredients.every(sel =>
        ingredientsList.some(ing => ing.toLowerCase().includes(sel.toLowerCase()))
      );
    });
    
    setFilteredRecipes(filtered);
  }, [selectedIngredients, recipes]);

  // Toggle ingredient selection
  const toggleIngredient = (ingredient) => {
    setSelectedIngredients(prev =>
      prev.includes(ingredient) ? prev.filter(i => i !== ingredient) : [...prev, ingredient]
    );
  };

  const clearAll = () => {
    setSelectedIngredients([]);
    setSearchTerm('');
  };

  // Get image for ingredient
  const getIngredientImage = (ingredient) => {
    const lower = ingredient.toLowerCase().trim();
    
    // Map ingredient names to exact filenames
    const imageMap = {
      'chicken': 'chicken.jpg',
      'chicken breast': 'chicken.jpg',
      'beef': 'beef.jpg',
      'ground beef': 'ground-beef.jpg',
      'pork': 'pork.jpg',
      'pork belly': 'pork-belly.jpg',
      'ground pork': 'ground-pork.jpg',
      'bacon': 'bacon.jpg',
      'fish': 'fish.jpg',
      'salmon': 'fish.jpg',
      'fish sauce': 'fish-sauce.jpg',
      'onion': 'onion.jpg',
      'garlic': 'garlic.jpg',
      'ginger': 'ginger.jpg',
      'tomato': 'tomato.jpg',
      'potato': 'potatoes.jpg',
      'potatoes': 'potatoes.jpg',
      'carrot': 'carrots.jpg',
      'carrots': 'carrots.jpg',
      'broccoli': 'broccoli.jpg',
      'bell pepper': 'bell-peppers.jpg',
      'bell peppers': 'bell-peppers.jpg',
      'pepper': 'pepper.jpg',
      'chili': 'chili.jpg',
      'green onion': 'green-onion.jpg',
      'green onions': 'green-onion.jpg',
      'spinach': 'spinach.jpg',
      'mushroom': 'mushroom.jpg',
      'mushrooms': 'mushroom.jpg',
      'rice': 'rice.jpg',
      'pasta': 'pasta.jpg',
      'bread': 'bread.jpg',
      'flour': 'flour.jpg',
      'milk': 'milk.jpg',
      'butter': 'butter.jpg',
      'cheese': 'cheese.jpg',
      'egg': 'egg.jpg',
      'eggs': 'egg.jpg',
      'salt': 'salt.jpg',
      'cooking oil': 'cooking-oil.jpg',
      'oil': 'cooking-oil.jpg',
      'olive oil': 'olive-oil.jpg',
      'calamansi': 'calamansi.jpg',
      'lemongrass': 'lemongrass.jpg',
      'malunggay leaves': 'malunggay-leaves.jpg',
      'malunggay': 'malunggay-leaves.jpg',
      'green papaya': 'green-papaya.jpg',
      'papaya': 'green-papaya.jpg'
    };
    
    // Try exact match
    if (imageMap[lower]) {
      return `/images/ingredients/${imageMap[lower]}`;
    }
    
    // Try partial match
    for (const [key, filename] of Object.entries(imageMap)) {
      if (lower.includes(key) || key.includes(lower)) {
        return `/images/ingredients/${filename}`;
      }
    }
    
    // Default fallback
    return '/images/ingredients/default.jpg';
  };

  // Filter ingredients by search
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
                    <h3>Selected Ingredients ({selectedIngredients.length})</h3>
                    <button className="clear-btn" onClick={clearAll}>Clear All</button>
                  </div>
                  <div className="ingredients-grid">
                    {selectedIngredients.map(ing => {
                      const imgSrc = getIngredientImage(ing);
                      return (
                        <div
                          key={ing}
                          className="ingredient-card selected"
                          onClick={() => toggleIngredient(ing)}
                        >
                          <div className="ingredient-image">
                            <img
                              src={imgSrc}
                              alt={ing}
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.src = '/images/ingredients/default.jpg';
                              }}
                            />
                            <div className="selected-overlay">
                              <span className="check-icon">✓</span>
                            </div>
                          </div>
                          <div className="ingredient-name"><span>{ing}</span></div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Ingredient Cards */}
              <div className="ingredients-grid">
                {filteredIngredientsList.length > 0 ? (
                  filteredIngredientsList.map(ing => {
                    const imgSrc = getIngredientImage(ing);
                    return (
                      <div
                        key={ing}
                        className={`ingredient-card ${selectedIngredients.includes(ing) ? 'selected' : ''}`}
                        onClick={() => toggleIngredient(ing)}
                      >
                        <div className="ingredient-image">
                          <img
                            src={imgSrc}
                            alt={ing}
                            loading="lazy"
                            onError={(e) => {
                              console.error(`Failed to load image for "${ing}". Tried path: ${imgSrc}`);
                              e.currentTarget.src = '/images/ingredients/default.jpg';
                            }}
                          />
                          {selectedIngredients.includes(ing) && (
                            <div className="selected-overlay">
                              <span className="check-icon">✓</span>
                            </div>
                          )}
                        </div>
                        <div className="ingredient-name"><span>{ing}</span></div>
                      </div>
                    );
                  })
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