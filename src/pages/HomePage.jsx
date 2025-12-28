import "../styles/App.css";
import RecipeCard from "../components/RecipeCard.jsx";
import { recipes } from "../components/data/recipes.js";

function App() {
  return (
    <div className = "app">
      <header className="header">
        <div className ="header-content">
          <button className="menu-btn">☰</button>
          <h1 className = "logo">CookEase</h1>
          <div className= "search-bar">
            <input type = "text" placeholder ="Search"/>
            <button>🔍</button>
          </div>
          <nav className ="nav">
            <a href = "#Home">Home</a>
            <a href = "#Popular">Popular</a>
            <div className="dropdown">
                <button className="dropdown-btn">Discover ▼</button>
                <div className="dropdown-content">
                  <a href="#recipes">All Recipes</a>
                  <a href="#ingredients">By Ingredients</a>
                  <a href="#popular">Popular</a>
                  <a href="#quick">Quick & Easy</a>
                </div>
              </div>
            <a href = "#AboutUs">About Us</a>
          </nav>
        </div>
      </header>


      <main className = "main">
        <div className = "recipe-grid">
          {recipes.map(recipe => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </main>

    </div>

  )
}
export default App;