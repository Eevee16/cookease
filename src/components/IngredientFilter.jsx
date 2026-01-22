import { useState, useEffect } from 'react';
import '../styles/IngredientFilter.css';
import IngredientFilter from './IngredientFilter';

const publicRecipes = [
  { id: 1, ingredients: ['chicken', 'onion', 'garlic', 'rice'] },
  { id: 2, ingredients: ['beef', 'egg', 'tomato'] },
  { id: 3, ingredients: ['pork', 'onion', 'cheese'] },
];

// userRecipes can come from your app's state or API
const userRecipes = [
  /* user specific recipe objects */
];

function ParentComponent({ isLoggedIn }) {
  // Select which recipes to show
  const recipesToShow = isLoggedIn ? userRecipes : publicRecipes;

  const handleFilteredRecipes = (filteredRecipes) => {
    // Do something with filtered recipes (optional)
    console.log('Filtered recipes:', filteredRecipes);
  };

  return (
    <IngredientFilter
      recipes={recipesToShow}
      onFilteredRecipes={handleFilteredRecipes}
    />
  );
}

/* 🔹 IMAGE MAP */
const ingredientImageMap = {
  chicken: '/ingredients/chicken.jpg',
  beef: '/ingredients/beef.jpg',
  pork: '/ingredients/pork.jpg',
  egg: '/ingredients/egg.jpg',
  onion: '/ingredients/onion.jpg',
  garlic: '/ingredients/garlic.jpg',
  tomato: '/ingredients/tomato.jpg',
  rice: '/ingredients/rice.jpg',
  cheese: '/ingredients/cheese.jpg',
  milk: '/ingredients/milk.jpg',
};

function IngredientFilter({ recipes, onFilteredRecipes }) {
  // rest of your logic here
}

const getIngredientImage = (ingredient) =>
  ingredientImageMap[ingredient] || '/ingredients/default.jpg';

function IngredientFilter({ recipes, onFilteredRecipes }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [allIngredients, setAllIngredients] = useState([]);
  const [isOpen, setIsOpen] = useState(false);



  /* 🔹 Extract ingredients */
  useEffect(() => {
    const ingredientsSet = new Set();

    recipes.forEach(recipe => {
      recipe.ingredients?.forEach(ingredient => {
        const cleaned = ingredient
          .toLowerCase()
          .replace(/[0-9]/g, '')
          .replace(/cup|tablespoon|teaspoon|pound|ounce|gram|kg|lb|oz|tbsp|tsp/gi, '')
          .replace(/minced|chopped|diced|sliced|crushed|ground/gi, '')
          .trim();

        if (cleaned) ingredientsSet.add(cleaned);
      });
    });

    setAllIngredients(Array.from(ingredientsSet).sort());
  }, [recipes]);

  /* 🔹 Filter recipes by SEARCH ONLY */
  useEffect(() => {
    if (!searchTerm) {
      onFilteredRecipes(recipes);
      return;
    }

    const filtered = recipes.filter(recipe =>
      recipe.ingredients?.some(ing =>
        ing.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

    onFilteredRecipes(filtered);
  }, [searchTerm, recipes, onFilteredRecipes]);

  const filteredIngredients = allIngredients.filter(ingredient =>
    ingredient.includes(searchTerm.toLowerCase())
  );

  return (
    <div className="ingredient-filter">
      <div className="filter-header">
        <button className="filter-toggle" onClick={() => setIsOpen(!isOpen)}>
          <span className="filter-icon">🔍</span>
          <span>Filter by Ingredients</span>
          <span className={`arrow ${isOpen ? 'open' : ''}`}>▼</span>
        </button>
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

          {/* 🔹 IMAGE SEARCH RESULTS ONLY */}
          {searchTerm && filteredIngredients.length > 0 && (
            <div className="ingredient-image-grid">
              {filteredIngredients.slice(0, 8).map(ingredient => (
                <div
                  key={ingredient}
                  className="ingredient-card"
                  onClick={() => setSearchTerm(ingredient)}
                >
                  <img
                    src={getIngredientImage(ingredient)}
                    alt={ingredient}
                    className="ingredient-card-img"
                  />
                  <span className="ingredient-card-label">{ingredient}</span>
                </div>
              ))}
            </div>
          )}

          <div className="filter-footer">
            <p className="results-count">
              Showing {recipes.length} recipe{recipes.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default IngredientFilter;
