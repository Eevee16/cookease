import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "../firebase/config";
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import RecipeCard from '../components/RecipeCard';
import '../styles/App.css';

function HomePage() {
  const { user } = useAuth();

  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const fetchRecipes = async () => {
    try {
      // Approved recipes
      const approvedQuery = query(
        collection(db, "recipes"),
        where("status", "==", "approved"),
        orderBy("createdAt", "desc")
      );

      // Done recipes
      const doneQuery = query(
        collection(db, "recipes"),
        where("status", "==", "done"),
        orderBy("createdAt", "desc")
      );

      const [approvedSnap, doneSnap] = await Promise.all([
        getDocs(approvedQuery),
        getDocs(doneQuery)
      ]);

      const approved = approvedSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const done = doneSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Combine both
      setRecipes([...approved, ...done]);
    } catch (err) {
      console.error("Failed to load recipes:", err);
    }
  };

  fetchRecipes();
}, []);


  if (loading) {
    return <div className="loading">Loading recipes...</div>;
  }

  return (
    <div className="home-page">
      <div className="recipe-container">
        <h2 className="section-title">Discover Recipes</h2>

        <div className="recipe-grid">
          {recipes.length === 0 ? (
            <div className="empty-state">
              <p>No recipes available yet.</p>

              {user && (
                <Link to="/add-recipe" className="btn-primary">
                  Add a Recipe
                </Link>
              )}
            </div>
          ) : (
            recipes.map(recipe => {
              const safeRecipe = {
                id: recipe.id,
                title: recipe.title || 'Untitled',
                image: recipe.image || '/images/placeholder.png',
                ingredients: Array.isArray(recipe.ingredients)
                  ? recipe.ingredients
                  : [],
                rating:
                  typeof recipe.rating === 'number' ? recipe.rating : 0,
                difficulty: recipe.difficulty || 'N/A',
              };

              return (
                <RecipeCard
                  key={safeRecipe.id}
                  recipe={safeRecipe}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default HomePage;
