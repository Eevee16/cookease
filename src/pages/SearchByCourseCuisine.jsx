import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import RecipeCard from '../components/RecipeCard';
import "../styles/SearchByCourseCuisine.css";

function SearchByCourseCuisine() {
  const [recipes, setRecipes] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [cuisines, setCuisines] = useState([]);

  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showCuisineDropdown, setShowCuisineDropdown] = useState(false);

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
          setCategories([]);
          setCuisines([]);
          return;
        }

        const recipeData = data || [];

        // Fetch profile data for owners to show avatars + proper names
        const ownerIds = [...new Set(recipeData.map(r => r.owner_id).filter(Boolean))];
        let ownerMap = {};
        if (ownerIds.length) {
          const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, name, email, photo_url')
            .in('id', ownerIds);

          if (profileError) {
            console.warn('Failed to load profile data for recipes:', profileError);
          } else {
            ownerMap = (profiles || []).reduce((acc, p) => {
              const firstLast = [p.first_name, p.last_name].filter(Boolean).join(' ');
              const displayName = firstLast || p.name || p.email || 'Unknown';
              acc[p.id] = {
                displayName,
                photoUrl: p.photo_url || null
              };
              return acc;
            }, {});
          }
        }

        const normalizedRecipes = recipeData.map(r => {
          const owner = ownerMap[r.owner_id];
          return {
            ...r,
            owner_name: owner?.displayName || r.owner_name || 'Unknown',
            owner_photo: owner?.photoUrl || null
          };
        });

        setRecipes(normalizedRecipes);

        // Extract unique categories and cuisines dynamically
        const uniqueCategories = [...new Set(normalizedRecipes.map(r => r.category).filter(Boolean))];
        const uniqueCuisines = [...new Set(normalizedRecipes.map(r => r.cuisine).filter(Boolean))];

        setCategories(uniqueCategories.sort());
        setCuisines(uniqueCuisines.sort());
      } catch (err) {
        console.error('Unexpected error:', err);
        setRecipes([]);
        setCategories([]);
        setCuisines([]);
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
    setShowCategoryDropdown(false);
    setShowCuisineDropdown(false);
  };

  // Close dropdowns when user clicks outside
  useEffect(() => {
    const handler = (e) => {
      const path = e.composedPath?.() || (e.path || []);
      const isOutside = !path.some(el => el?.classList?.contains?.('custom-dropdown'));
      if (isOutside) {
        setShowCategoryDropdown(false);
        setShowCuisineDropdown(false);
      }
    };

    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

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
            <label>Category</label>
            <div
              className={`custom-dropdown ${showCategoryDropdown ? 'open' : ''}`}
              onMouseEnter={() => setShowCategoryDropdown(true)}
              onMouseLeave={() => setShowCategoryDropdown(false)}
            >
              <button
                type="button"
                className="custom-dropdown-btn"
                onClick={() => setShowCategoryDropdown(prev => !prev)}
              >
                {categoryFilter || 'All Categories'}
                <span className="dropdown-caret">▾</span>
              </button>
              <div className={`custom-dropdown-content ${showCategoryDropdown ? 'show' : ''}`}>
                <button
                  type="button"
                  className="custom-dropdown-item"
                  onClick={() => { setCategoryFilter(''); setShowCategoryDropdown(false); }}
                >
                  All Categories
                </button>
                {categories.map(category => (
                  <button
                    key={category}
                    type="button"
                    className={`custom-dropdown-item ${categoryFilter === category ? 'active' : ''}`}
                    onClick={() => { setCategoryFilter(category); setShowCategoryDropdown(false); }}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="filter-group">
            <label>Cuisine</label>
            <div
              className={`custom-dropdown ${showCuisineDropdown ? 'open' : ''}`}
              onMouseEnter={() => setShowCuisineDropdown(true)}
              onMouseLeave={() => setShowCuisineDropdown(false)}
            >
              <button
                type="button"
                className="custom-dropdown-btn"
                onClick={() => setShowCuisineDropdown(prev => !prev)}
              >
                {cuisineFilter || 'All Cuisines'}
                <span className="dropdown-caret">▾</span>
              </button>
              <div className={`custom-dropdown-content ${showCuisineDropdown ? 'show' : ''}`}>
                <button
                  type="button"
                  className="custom-dropdown-item"
                  onClick={() => { setCuisineFilter(''); setShowCuisineDropdown(false); }}
                >
                  All Cuisines
                </button>
                {cuisines.map(cuisine => (
                  <button
                    key={cuisine}
                    type="button"
                    className={`custom-dropdown-item ${cuisineFilter === cuisine ? 'active' : ''}`}
                    onClick={() => { setCuisineFilter(cuisine); setShowCuisineDropdown(false); }}
                  >
                    {cuisine}
                  </button>
                ))}
              </div>
            </div>
          </div>

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
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))
        )}
      </div>
    </div>
  );
}

export default SearchByCourseCuisine;
