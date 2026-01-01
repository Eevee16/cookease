import { Link } from "react-router-dom";
import RecipeCard from '../components/recipeCard.jsx';
import { recipes } from '../components/data/recipes.js';
import '../styles/App.css';

function HomePage() {
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
            <a className = "home"href="#home">Home</a>
            <a href="#popular">Popular</a>
            <div className="dropdown">
              <button className="dropdown-btn">Recipes ▼</button>
              <div className="dropdown-content">
                <a href="#course">By Course</a>
                <a href="#ingredients">By Ingredients</a>
              </div>
            </div>
            <a href="#about">About Us</a>
            <Link to="/add-recipe" className="add-recipe-link">
              + Add Recipe
            </Link>
            <Link to="/login" className="login-link">
              Login
            </Link>
          </nav>
        </div>
      </header>

      <main className="main">
        <div className="recipe-grid">
          {recipes.map(recipe => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </main>
    </div>
  );
}

export default HomePage;