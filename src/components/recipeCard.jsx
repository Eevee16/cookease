import "../styles/RecipeCard.css";
import { Link } from "react-router-dom";

function RecipeCard({ recipe }) {
  if (!recipe) return null;

  const rating = Math.min(
    5,
    Math.max(0, Math.round(recipe.rating || 0))
  );

  const filledStars = "★".repeat(rating);
  const emptyStars = "☆".repeat(5 - rating);

  const imageSrc =
    recipe.image_url || "/images/recipe-placeholder.jpg";

  const ingredientsText = Array.isArray(recipe.ingredients)
    ? recipe.ingredients.join(", ")
    : recipe.ingredients || "";

  return (
    <Link
      to={`/recipe/${recipe.id}`}
      className="recipe-card-link"
      aria-label={`View ${recipe.title} details`}
    >
      <div className="recipe-card" role="button">
        <div className="recipe-image">
          <img
            loading="lazy"
            src={imageSrc}
            alt={recipe.title || "Recipe image"}
          />
        </div>

        <div className="recipe-content">
          <h3 className="recipe-title">
            {recipe.title || "Untitled Recipe"}
          </h3>

          <p className="recipe-ingredients">
            {ingredientsText}
          </p>
        </div>

        <div className="recipe-card-footer">
          <div
            className="recipe-rating"
            aria-label={`Rating: ${rating} out of 5 stars`}
          >
            <span className="stars-filled">{filledStars}</span>
            <span className="stars-empty">{emptyStars}</span>
          </div>

          <span className="recipe-difficulty">
            {recipe.difficulty || "—"}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default RecipeCard;
