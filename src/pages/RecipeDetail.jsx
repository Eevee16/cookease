import { useParams, Link } from 'react-router-dom';
import { recipes } from '../components/data/recipes.js';
import '../styles/RecipeCard.css';

function RecipeDetail() {
  const { id } = useParams(); // Gets the :id from the URL
  const recipe = recipes.find((r) => r.id === Number(id));

  if (!recipe) {
    return (
      <div className="recipe-not-found">
        <h2>Recipe Not Found</h2>
        <p>Sorry, we couldn't find that recipe.</p>
        <Link to="/" className="back-btn">
          ← Back to Home
        </Link>
      </div>
    );
  }

  // Generate stars
  const rating = Math.round(recipe.rating || 0);
  const filledStars = '★'.repeat(rating);
  const emptyStars = '☆'.repeat(5 - rating);

  return (
    <div className="recipe-detail">
      <div className="recipe-header">
        <img
          src={recipe.image}
          alt={recipe.title}
          className="recipe-detail-image"
        />
        <div className="recipe-info">
          <h1 className="recipe-title">{recipe.title}</h1>

          <div className="recipe-meta">
            <span className="prep-time">⏱ {recipe.prepTime}</span>
            <span className="difficulty">🔥 {recipe.difficulty}</span>
            <div className="rating">
              <span className="stars-filled">{filledStars}</span>
              <span className="stars-empty">{emptyStars}</span>
              <span className="rating-text">({rating}/5)</span>
            </div>
          </div>

          {recipe.tags && (
            <div className="tags">
              {recipe.tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="recipe-body">
        <div className="ingredients-section">
          <h2>Ingredients</h2>
          <ul className="ingredients-list">
            {recipe.ingredients.map((ingredient, index) => (
              <li key={index}>{ingredient}</li>
            ))}
          </ul>
        </div>

        <div className="instructions-section">
          <h2>Instructions</h2>
          <ol className="instructions-list">
            {recipe.instructions.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </div>
      </div>

      <Link to="/" className="back-btn">
        ← Back to All Recipes
      </Link>
    </div>
  );
}

export default RecipeDetail;