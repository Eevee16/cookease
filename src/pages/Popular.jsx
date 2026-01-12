import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

import '../styles/Popular.css';

const Popular = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [activeTab, setActiveTab] = useState('All Time');
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const fetchPopularRecipes = async () => {
      try {
        const q = query(
          collection(db, 'recipes'),
          orderBy('views', 'desc'),
          limit(12)
        );

        const snapshot = await getDocs(q);
        const recipesData = snapshot.docs.map((doc, index) => ({
          id: doc.id,
          ...doc.data(),
          rank: index + 1
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

  // Helper: Format numbers (e.g., 1500 -> 1.5k)
  const formatViews = (num) => {
    if (!num) return '0';
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const handleLogout = async () => {
    try {
      await logout();
      alert('Logged out successfully!');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading popular recipes...</div>;
  }

  return (
    <div className="popular-page-wrapper">
      
      {/* Header Section */}
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
            <Link to="/popular">Popular</Link>

            <div className="dropdown">
              <button className="dropdown-btn">Recipes ▼</button>
              <div className="dropdown-content">
                <a href="#course">By Course</a>
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

      {/* Main Content */}
      <div className="popular-container">
        
        <div className="popular-header">
          <h2 className="popular-title">Most Viewed Recipes</h2>
          <p className="popular-subtitle">Trending dishes our community is watching right now</p>
        </div>

        {/* Filter Tabs */}
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

        {/* Recipe Grid */}
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
                ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
                difficulty: recipe.difficulty || 'Medium',
                views: recipe.views || 0,
                rank: recipe.rank
              };

              return (
                <div key={safeRecipe.id} className="recipe-card">
                  
                  {/* Rank Badge */}
                  <div className={`rank-badge rank-${safeRecipe.rank}`}>
                    #{safeRecipe.rank}
                  </div>

                  {/* Image Wrapper */}
                  <div className="recipe-image">
                    <img 
                      src={safeRecipe.image} 
                      alt={safeRecipe.title} 
                    />
                  </div>
                  
                  {/* Content Body */}
                  <div className="recipe-content">
                    <h3 className="recipe-title">{safeRecipe.title}</h3>
                    
                    <p className="recipe-ingredients">
                      {safeRecipe.ingredients.slice(0, 3).join(', ')}
                      {safeRecipe.ingredients.length > 3 && '...'}
                    </p>
                    
                    {/* Footer with View Count */}
                    <div className="recipe-card-footer">
                      
                      {/* View Counter Section */}
                      <div className="recipe-rating" style={{ color: '#6b7280' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '4px'}}>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        
                        <span style={{ fontWeight: 600, color: '#4b5563' }}>
                          {formatViews(safeRecipe.views)}
                        </span>
                        <span className="review-count" style={{marginLeft: '4px'}}>views</span>
                      </div>

                      {/* Difficulty Tag */}
                      <span className={`recipe-difficulty difficulty-${safeRecipe.difficulty.toLowerCase()}`}>
                        {safeRecipe.difficulty}
                      </span>
                    </div>
                  </div>
                  
                  <Link to={`/recipe/${safeRecipe.id}`} className="recipe-card-link" style={{position: 'absolute', inset: 0, zIndex: 0}} />
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