import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import "../styles/SearchByCourseCuisine.css";

function SearchByCourseCuisine() {
  const [recipes, setRecipes] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [cuisines, setCuisines] = useState([]);

  useEffect(() => {
    const fetchRecipes = async () => {
      setLoading(true);
      try {
        // Only fetch approved recipes
        const { data, error } = await supabase
          .from('recipes')
          .select('*')
          .eq('status', 'approved')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching recipes:', error);
          setRecipes([]);
        } else {
          const recipeData = data || [];
          setRecipes(recipeData);
          
          // Extract unique categories and cuisines dynamically
          const uniqueCategories = [...new Set(recipeData.map(r => r.category).filter(Boolean))];
          const uniqueCuisines = [...new Set(recipeData.map(r => r.cuisine).filter(Boolean))];
          
          setCategories(uniqueCategories.sort());
          setCuisines(uniqueCuisines.sort());
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setRecipes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, []);

  // Filtered recipes by category and cuisine
  const filteredRecipes = recipes.filter(recipe => {
    const categoryMatch = categoryFilter ? recipe.category === categoryFilter : true;
    const cuisineMatch = cuisineFilter ? recipe.cuisine === cuisineFilter : true;
    return categoryMatch && cuisineMatch;
  });

  // Clear all filters
  const clearFilters = () => {
    setCategoryFilter('');
    setCuisineFilter('');
  };

  if (loading) {
    return (
      <div className="search-course-cuisine-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading recipes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="search-course-cuisine-page">
      <div className="search-header">
        <h1>Search Recipes</h1>
        <p className="search-subtitle">Find recipes by category and cuisine</p>
      </div>

      <div className="filters-container">
        <div className="filters">
          <div className="filter-group">
            <label htmlFor="category-filter">Category</label>
            <select 
              id="category-filter"
              value={categoryFilter} 
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="cuisine-filter">Cuisine</label>
            <select 
              id="cuisine-filter"
              value={cuisineFilter} 
              onChange={(e) => setCuisineFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Cuisines</option>
              {cuisines.map(cuisine => (
                <option key={cuisine} value={cuisine}>{cuisine}</option>
              ))}
            </select>
          </div>

          {(categoryFilter || cuisineFilter) && (
            <button onClick={clearFilters} className="clear-filters-btn">
              Clear Filters
            </button>
          )}
        </div>

        <div className="results-count">
          {filteredRecipes.length} {filteredRecipes.length === 1 ? 'recipe' : 'recipes'} found
        </div>
      </div>

      <div className="recipe-grid">
        {filteredRecipes.length === 0 ? (
          <div className="no-results">
            <p className="no-results-message">No recipes match your filters.</p>
            {(categoryFilter || cuisineFilter) && (
              <button onClick={clearFilters} className="clear-btn">
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          filteredRecipes.map(recipe => (
            <div key={recipe.id} className="recipe-card">
              <Link to={`/recipe/${recipe.id}`} className="recipe-link">
                <div className="recipe-image-container">
                  <img 
                    src={recipe.image_url || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect width='300' height='200' fill='%23e0e0e0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='18' fill='%23999'%3ENo Image%3C/text%3E%3C/svg%3E"} 
                    alt={recipe.title}
                    className="recipe-image"
                  />
                  {recipe.difficulty && (
                    <div className="difficulty-badge">
                      {recipe.difficulty}
                    </div>
                  )}
                </div>
                <div className="recipe-info">
                  <h3 className="recipe-title">{recipe.title}</h3>
                  <div className="recipe-meta">
                    <span className="recipe-category">{recipe.category}</span>
                    {recipe.cuisine && (
                      <>
                        <span className="meta-separator">•</span>
                        <span className="recipe-cuisine">{recipe.cuisine}</span>
                      </>
                    )}
                  </div>
                  {(recipe.prep_time || recipe.cook_time) && (
                    <div className="recipe-time">
                      {recipe.prep_time && <span>⏱ Prep: {recipe.prep_time} min</span>}
                      {recipe.cook_time && <span>👨‍🍳 Cook: {recipe.cook_time} min</span>}
                    </div>
                  )}
                  {recipe.rating > 0 && (
                    <div className="recipe-rating">
                      <span className="star">★</span>
                      <span className="rating-value">{recipe.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default SearchByCourseCuisine;