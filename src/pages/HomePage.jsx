import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

import RecipeCard from '../components/RecipeCard';
// 🔹 REMOVE THIS - we don't need it on homepage anymore
// import IngredientFilter from '../components/IngredientFilter';

import '../styles/App.css';

function HomePage() {
  const { user, logout } = useAuth();

  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const q = query(
          collection(db, 'recipes'),
          orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        const recipesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setRecipes(recipesData);
      } catch (error) {
        console.error('Error fetching recipes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      alert('Logged out successfully!');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading recipes...</div>;
  }

  return (
    <div className="app">
      {/* ===== HEADER ===== */}
      <header className="header">
        <div className="header-content">
          <button className="menu-btn">☰</button>
          <h1 className="logo">CookEase</h1>

          <div className="search-bar">
            <input type="text" placeholder="Search" />
            <button>🔍</button>
          </div>

          <nav className="nav">
            <Link to="/">Home</Link>
            <a href="#popular">Popular</a>

            <div className="dropdown">
              <button className="dropdown-btn">Recipes ▼</button>
              <div className="dropdown-content">
                <a href="#course">By Course</a>
                {/* 🔹 CHANGED THIS LINE */}
                <Link to="/search-ingredients">By Ingredients</Link>
              </div>
            </div>

            <a href="#about">About Us</a>

            <Link to="/add-recipe" className="add-recipe-link">
              + Add Recipe
            </Link>

            {user ? (
              <div className="user-menu">
                <button
                  className="user-btn"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  👤 {user.displayName || 'User'} ▼
                </button>

                {showUserMenu && (
                  <div className="user-dropdown">
                    <Link to="/profile" onClick={() => setShowUserMenu(false)}>
                      My Profile
                    </Link>
                    <Link to="/my-recipes" onClick={() => setShowUserMenu(false)}>
                      My Recipes
                    </Link>
                    <button onClick={handleLogout}>Logout</button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="login-link">Login</Link>
                <Link to="/signup" className="signup-link">Sign Up</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* ===== MAIN ===== */}
      <main className="main">
        {/* 🔹 REMOVED IngredientFilter - it's now on its own page */}
        
        {/* 🔹 Recipe Grid */}
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
                ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
                rating: typeof recipe.rating === 'number' ? recipe.rating : 0,
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
      </main>
    </div>
  );
}

export default HomePage;