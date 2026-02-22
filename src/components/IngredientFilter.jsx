import { useState, useEffect } from "react";
import "../styles/IngredientFilter.css";

const getIngredientImage = (ingredient) => {
  const imageMap = {
    chicken: "/ingredients/chicken.jpg",
    beef: "/ingredients/beef.jpg",
    pork: "/ingredients/pork.jpg",
    egg: "/ingredients/egg.jpg",
    onion: "/ingredients/onion.jpg",
    garlic: "/ingredients/garlic.jpg",
    tomato: "/ingredients/tomato.jpg",
    rice: "/ingredients/rice.jpg",
    cheese: "/ingredients/cheese.jpg",
    milk: "/ingredients/milk.jpg",
  };
  return imageMap[ingredient] || "/ingredients/default.jpg";
};

function IngredientFilter({ recipes = [], onFilteredRecipes }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [allIngredients, setAllIngredients] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!Array.isArray(recipes)) return;
    const ingredientsSet = new Set();
    recipes.forEach((recipe) => {
      recipe?.ingredients?.forEach((ingredient) => {
        const cleaned = ingredient
          .toLowerCase()
          .replace(/[0-9]/g, "")
          .replace(/cup|tablespoon|teaspoon|pound|ounce|gram|kg|lb|oz|tbsp|tsp/gi, "")
          .replace(/minced|chopped|diced|sliced|crushed|ground/gi, "")
          .trim();
        if (cleaned) ingredientsSet.add(cleaned);
      });
    });
    setAllIngredients([...ingredientsSet].sort());
  }, [recipes]);

  useEffect(() => {
    if (typeof onFilteredRecipes !== "function") return;
    if (!searchTerm) { onFilteredRecipes(recipes); return; }
    const filtered = recipes.filter((recipe) =>
      recipe?.ingredients?.some((ing) => ing.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    onFilteredRecipes(filtered);
  }, [searchTerm, recipes, onFilteredRecipes]);

  const filteredIngredients = allIngredients.filter((ingredient) =>
    ingredient.includes(searchTerm.toLowerCase())
  );

  return (
    <div className="ingredient-filter">
      <div className="filter-header">
        <button className="filter-toggle" type="button" onClick={() => setIsOpen((prev) => !prev)}>
          <span className="filter-icon">🔍</span>
          <span>Filter by Ingredients</span>
          <span className={`arrow ${isOpen ? "open" : ""}`}>▼</span>
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

          {searchTerm && filteredIngredients.length > 0 && (
            <div className="ingredient-image-grid">
              {filteredIngredients.slice(0, 8).map((ingredient) => (
                <div
                  key={ingredient}
                  className="ingredient-card"
                  onClick={() => setSearchTerm(ingredient)}
                >
                  <img
                    src={getIngredientImage(ingredient)}
                    alt={ingredient}
                    className="ingredient-card-img"
                    onError={(e) => { e.target.src = "/ingredients/default.jpg"; }}
                  />
                  <span className="ingredient-card-label">{ingredient}</span>
                </div>
              ))}
            </div>
          )}

          <div className="filter-footer">
            <p className="results-count">
              Showing {recipes.length} recipe{recipes.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default IngredientFilter;