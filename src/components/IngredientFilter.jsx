import { useState, useEffect } from 'react';
import '../styles/IngredientFilter.css';

function IngredientFilter({ recipes, onFilteredRecipes }) {
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [allIngredients, setAllIngredients] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  // Extract all unique ingredients from recipes
  useEffect(() => {
    const ingredientsSet = new Set();
    
    recipes.forEach(recipe => {
      if (Array.isArray(recipe.ingredients)) {
        recipe.ingredients.forEach(ingredient => {
          // Clean up ingredient text (remove quantities, get main ingredient)
          const cleaned = ingredient
            .toLowerCase()
            .replace(/[0-9]/g, '') // Remove numbers
            .replace(/cup|tablespoon|teaspoon|pound|ounce|gram|kg|lb|oz|tbsp|tsp/gi, '')
            .replace(/minced|chopped|diced|sliced|crushed|ground/gi, '')
            .trim();
          
          if (cleaned) {
            ingredientsSet.add(cleaned);
          }
        });
      }
    });

    const sortedIngredients = Array.from(ingredientsSet).sort();
    setAllIngredients(sortedIngredients);
  }, [recipes]);

  // Filter recipes based on selected ingredients
  useEffect(() => {
    if (selectedIngredients.length === 0) {
      onFilteredRecipes(recipes);
      return;
    }

    const filtered = recipes.filter(recipe => {
      if (!Array.isArray(recipe.ingredients)) return false;

      return selectedIngredients.every(selectedIng => {
        return recipe.ingredients.some(recipeIng => {
          return recipeIng.toLowerCase().includes(selectedIng.toLowerCase());
        });
      });
    });

    onFilteredRecipes(filtered);
  }, [selectedIngredients, recipes, onFilteredRecipes]);

  const toggleIngredient = (ingredient) => {
    if (selectedIngredients.includes(ingredient)) {
      setSelectedIngredients(selectedIngredients.filter(i => i !== ingredient));
    } else {
      setSelectedIngredients([...selectedIngredients, ingredient]);
    }
  };

  const clearAll = () => {
    setSelectedIngredients([]);
    setSearchTerm('');
  };

  const filteredIngredients = allIngredients.filter(ingredient =>
    ingredient.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="ingredient-filter">
      <div className="filter-header">
        <button 
          className="filter-toggle"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="filter-icon">🔍</span>
          <span>Filter by Ingredients</span>
          {selectedIngredients.length > 0 && (
            <span className="filter-count">{selectedIngredients.length}</span>
          )}
          <span className={`arrow ${isOpen ? 'open' : ''}`}>▼</span>
        </button>

        {selectedIngredients.length > 0 && (
          <button className="clear-btn" onClick={clearAll}>
            Clear All
          </button>
        )}
      </div>

      {isOpen && (
        <div className="filter-content">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search ingredients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ingredient-search"
            />
          </div>

          {selectedIngredients.length > 0 && (
            <div className="selected-ingredients">
              <p className="selected-label">Selected:</p>
              <div className="selected-chips">
                {selectedIngredients.map(ingredient => (
                  <div key={ingredient} className="ingredient-chip selected">
                    <span>{ingredient}</span>
                    <button
                      onClick={() => toggleIngredient(ingredient)}
                      className="chip-remove"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="ingredients-list">
            {filteredIngredients.length > 0 ? (
              filteredIngredients.map(ingredient => (
                <div
                  key={ingredient}
                  className={`ingredient-chip ${
                    selectedIngredients.includes(ingredient) ? 'selected' : ''
                  }`}
                  onClick={() => toggleIngredient(ingredient)}
                >
                  <span className="chip-checkbox">
                    {selectedIngredients.includes(ingredient) ? '✓' : '○'}
                  </span>
                  <span>{ingredient}</span>
                </div>
              ))
            ) : (
              <p className="no-results">No ingredients found</p>
            )}
          </div>

          <div className="filter-footer">
            <p className="results-count">
              Showing {recipes.length} recipe{recipes.length !== 1 ? 's' : ''}
              {selectedIngredients.length > 0 && ` with selected ingredients`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default IngredientFilter;