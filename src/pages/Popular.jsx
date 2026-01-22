import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  doc,
  updateDoc,
  increment,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

import '../styles/Popular.css';

const Popular = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isNavigatingRef = useRef(false); // ✅ MUST be inside component

  const [activeTab, setActiveTab] = useState('All Time');
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPopularRecipes = async () => {
      try {
        const q = query(
          collection(db, 'recipes'),
          orderBy('views', 'desc'),
          limit(12)
        );

        const snapshot = await getDocs(q);
        const recipesData = snapshot.docs.map((docSnap, index) => ({
          id: docSnap.id,
          ...docSnap.data(),
          rank: index + 1,
        }));

        setRecipes(recipesData);
      } catch (error) {
        console.error('Error fetching popular recipes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPopularRecipes();
  }, []);

  // ✅ ONE increment ONLY
  const handleRecipeClick = async (id) => {
    // HARD LOCK (prevents Strict Mode + double clicks)
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;

    const sessionKey = `viewed_recipe_${id}`;

    try {
      if (!sessionStorage.getItem(sessionKey)) {
        sessionStorage.setItem(sessionKey, 'true');

        const recipeRef = doc(db, 'recipes', id);
        await updateDoc(recipeRef, {
          views: increment(1),
        });
}

    } catch (error) {
      console.error('Error updating views:', error);
      sessionStorage.removeItem(sessionKey);
    } finally {
      navigate(`/recipe/${id}`);
    }
  };

  const formatViews = (num) => {
    if (!num) return '0';
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  if (loading) {
    return <div className="loading">Loading popular recipes...</div>;
  }

  return (
    <div className="popular-page-wrapper">
      <div className="popular-container">
        <div className="popular-header">
          <h2 className="popular-title">Most Viewed Recipes</h2>
          <p className="popular-subtitle">
            Trending dishes our community is watching right now
          </p>
        </div>

        <div className="popular-tabs">
          {['All Time', 'This Week', 'New & Rising'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`tab-button ${activeTab === tab ? 'active' : ''}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="popular-grid">
          {recipes.length === 0 ? (
            <div className="empty-state">
              <p>No recipes available yet.</p>
            </div>
          ) : (
            recipes.map((recipe) => {
              const safeRecipe = {
                id: recipe.id,
                title: recipe.title || 'Untitled',
                image: recipe.image || '/images/placeholder.png',
                ingredients: Array.isArray(recipe.ingredients)
                  ? recipe.ingredients
                  : [],
                difficulty: recipe.difficulty || 'Medium',
                views: recipe.views || 0,
                rank: recipe.rank,
              };

              return (
                <div
                  key={safeRecipe.id}
                  className="recipe-card"
                  onClick={() => handleRecipeClick(safeRecipe.id)}
                >
                  <div className={`rank-badge rank-${safeRecipe.rank}`}>
                    #{safeRecipe.rank}
                  </div>

                  <div className="recipe-image">
                    <img src={safeRecipe.image} alt={safeRecipe.title} />
                  </div>

                  <div className="recipe-content">
                    <h3 className="recipe-title">{safeRecipe.title}</h3>

                    <p className="recipe-ingredients">
                      {safeRecipe.ingredients.slice(0, 3).join(', ')}
                      {safeRecipe.ingredients.length > 3 && '...'}
                    </p>

                    <div className="recipe-card-footer">
                      <span>{formatViews(safeRecipe.views)} views</span>
                      <span
                        className={`recipe-difficulty difficulty-${safeRecipe.difficulty.toLowerCase()}`}
                      >
                        {safeRecipe.difficulty}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Popular;
