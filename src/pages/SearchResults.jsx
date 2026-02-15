import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import RecipeCard from '../components/RecipeCard';
import { supabase } from '../supabaseClient';
import '../styles/SearchResults.css';

function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const searchRecipes = async () => {
      if (!query.trim()) {
        setRecipes([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Search for recipes by title (case-insensitive)
        const { data, error: searchError } = await supabase
          .from('recipes')
          .select('*')
          .or('status.eq.approved,status.is.null')
          .ilike('title', `%${query}%`)
          .order('created_at', { ascending: false });

        if (searchError) throw searchError;

        setRecipes(data || []);
      } catch (err) {
        console.error('Search error:', err);
        setError('Failed to search recipes. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    searchRecipes();
  }, [query]);

  if (loading) {
    return (
      <div className="search-results-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Searching recipes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="search-results-page">
        <div className="error-container">
          <p className="error-message">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="search-results-page">
      <div className="search-results-container">
        <div className="search-header">
          <h1>Search Results</h1>
          {query && (
            <p className="search-query">
              Showing results for: <strong>"{query}"</strong>
            </p>
          )}
          <p className="results-count">
            {recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'} found
          </p>
        </div>

        {!query ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>No search query</h3>
            <p>Please enter a search term to find recipes.</p>
          </div>
        ) : recipes.length > 0 ? (
          <div className="recipe-grid">
            {recipes.map(recipe => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">😕</div>
            <h3>No recipes found</h3>
            <p>We couldn't find any recipes matching "{query}".</p>
            <p className="empty-hint">Try different keywords or browse our categories.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchResults;