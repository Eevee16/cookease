import './styles/App.css';
import RecipeCard from './components/recipeCard';
import { recipes } from './data/recipes';

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
            <div className = "dropdown">
              <a href = "#Recipes">Recipes</a>
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