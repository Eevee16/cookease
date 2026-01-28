import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import "../styles/SearchByCourseCuisine.css";

function SearchByCourseCuisine() {
  const [recipes, setRecipes] = useState([]);
  const [courseFilter, setCourseFilter] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecipes = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('recipes')
          .select('*');

        if (error) {
          console.error('Error fetching recipes:', error);
          setRecipes([]);
        } else {
          setRecipes(data || []);
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

  // Filtered recipes by course and cuisine
  const filteredRecipes = recipes.filter(recipe => {
    const courseMatch = courseFilter ? recipe.course === courseFilter : true;
    const cuisineMatch = cuisineFilter ? recipe.cuisine === cuisineFilter : true;
    return courseMatch && cuisineMatch;
  });

  if (loading) {
    return <div className="search-course-cuisine-page"><p>Loading recipes...</p></div>;
  }

  return (
    <div className="search-course-cuisine-page">
      <h2>Search Recipes by Course & Cuisine</h2>

      <div className="filters">
        <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}>
          <option value="">All Courses</option>
          <option value="Breakfast">Breakfast</option>
          <option value="Lunch">Lunch</option>
          <option value="Dinner">Dinner</option>
          <option value="Snack">Snack</option>
          <option value="Dessert">Dessert</option>
        </select>

        <select value={cuisineFilter} onChange={(e) => setCuisineFilter(e.target.value)}>
          <option value="">All Cuisines</option>
          <option value="Italian">Italian</option>
          <option value="Mexican">Mexican</option>
          <option value="Indian">Indian</option>
          <option value="Chinese">Chinese</option>
          <option value="American">American</option>
          {/* Add more cuisines if needed */}
        </select>
      </div>

      <div className="recipe-grid">
        {filteredRecipes.length === 0 ? (
          <p>No recipes match your filters.</p>
        ) : (
          filteredRecipes.map(recipe => (
            <div key={recipe.id} className="recipe-card">
              <Link to={`/recipe/${recipe.id}`}>
                <img src={recipe.image || '/images/placeholder.png'} alt={recipe.title} />
                <h3>{recipe.title}</h3>
                <p>{recipe.course} | {recipe.cuisine}</p>
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default SearchByCourseCuisine;
