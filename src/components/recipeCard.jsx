import "../styles/RecipeCard.css";

function RecipeCard({ recipe }) {

    const filledStars = '★'.repeat(recipe.rating);
    const emptyStars = '☆'.repeat(5 - recipe.rating);
    return (
        <div className ="recipe-card">

            
            <div className = "recipe-image">
                <img src={recipe.image} alt={recipe.title}></img>
            </div>

            
            <div className="recipe-content">
                <h3 className ="recipe-title">
                    {recipe.title}
                </h3>

                <p className="recipes-ingredients">
                    {recipe.ingredients.join(', ')}
                </p>
            </div>

            <div className="recipe-footer">

              <div className="recipe-rating" aria-label={`Rating: ${recipe.rating} out of 5 stars`}>
                <span className="stars-filled">{filledStars}</span>
                <span className="stars-empty">{emptyStars}</span>
              </div>
              <span className="recipe-difficulty">{recipe.difficulty}</span>
            </div>

        </div>
    )
}

export default RecipeCard;