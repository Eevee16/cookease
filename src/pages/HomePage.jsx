import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import RecipeCard from '../components/recipeCard.jsx';
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
        
        const querySnapshot = await getDocs(q);
        const recipesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setRecipes(recipesData);
        console.log('Fetched recipes:', recipesData);
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
      <header className="header">
        <div className="header-content">
          <button className="menu-btn">☰</button>
          <h1 className="logo">CookEase</h1>
          <div className="search-bar">
            <input type="text" placeholder="Search" />
            <button>🔍</button>
          </div>
          <nav className="nav">
            <a href="#home">Home</a>
            <a href="#popular">Popular</a>
            <div className="dropdown">
              <button className="dropdown-btn">Recipes ▼</button>
              <div className="dropdown-content">
                <a href="#course">By Course</a>
                <a href="#ingredients">By Ingredients</a>
              </div>
            </div>
            <a href="#about">About Us</a>
            
            {user ? (
              <>
                <Link to="/add-recipe" className="add-recipe-link">
                  + Add Recipe
                </Link>
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
                      <button onClick={handleLogout}>
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="login-link">
                  Login
                </Link>
                <Link to="/signup" className="signup-link">
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="main">
        <div className="recipe-grid">
          {recipes.length === 0 ? (
            <div className="empty-state">
              <p>No recipes yet. Be the first to add one!</p>
              {user && (
                <Link to="/add-recipe" className="btn-primary">
                  Add Your First Recipe
                </Link>
              )}
            </div>
          ) : (
            recipes.map(recipe => {
              if (!recipe || typeof recipe !== 'object') {
                return (
                  <div key={Math.random()} className="recipe-card error-card">
                    Invalid recipe data
                  </div>
                );
              }

              const safeRecipe = {
                id: recipe.id,
                title: recipe.title || 'Untitled',
                image: recipe.image || '/images/placeholder.png',
                ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
                rating: typeof recipe.rating === 'number' ? recipe.rating : 0,
                difficulty: recipe.difficulty || 'N/A',
              };

              return <RecipeCard key={safeRecipe.id || Math.random()} recipe={safeRecipe} />;
            })
          )}
        </div>
      </main>
    </div>
  );
}

export default HomePage;