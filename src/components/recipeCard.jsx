import "../styles/RecipeCard.css";
import { Link } from 'react-router-dom';

function RecipeCard({ recipe }) {

    const filledStars = '★'.repeat(recipe.rating);
    const emptyStars = '☆'.repeat(5 - recipe.rating);
    return (
        <Link to={`/recipe/${recipe.id}`} className="recipe-card-link">
          <div className ="recipe-card" role="button" aria-label={`View ${recipe.title} details`}>

              <div className = "recipe-image">
                <img loading="lazy" src={recipe.image} alt={recipe.title}></img>
              </div>

              <div className="recipe-content">
                  <h3 className ="recipe-title">
                      {recipe.title}
                  </h3>

                  <p className="recipe-ingredients">
                      {Array.isArray(recipe.ingredients) ? recipe.ingredients.join(', ') : recipe.ingredients}
                  </p>
              </div>

              <div className="recipe-card-footer">

                <div className="recipe-rating" aria-label={`Rating: ${recipe.rating} out of 5 stars`}>
                  <span className="stars-filled">{filledStars}</span>
                  <span className="stars-empty">{emptyStars}</span>
                </div>
                <span className="recipe-difficulty">{recipe.difficulty}</span>
              </div>

          </div>
        </Link>
    )
}

export default RecipeCard; 