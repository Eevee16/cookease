import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import "../styles/RecipeCard.css";
import "../styles/votes.css";

function RecipeCard({ recipe }) {
  const {
    id, title, image_url, category, cuisine,
    difficulty, prep_time, cook_time, servings,
    rating, view_count, owner_name
  } = recipe;

  const totalTime = (prep_time || 0) + (cook_time || 0);

  const formatTime = (minutes) => {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getDifficultyColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'easy': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'hard': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <Link to={`/recipe/${id}`} className="recipe-card">
      <div className="recipe-card-image">
        {image_url ? (
          <img src={image_url} alt={title} loading="lazy" />
        ) : (
          <div className="recipe-card-no-image">
            <span>🍽️</span>
            <p>No Image</p>
          </div>
        )}

        <div className="recipe-card-badges">
          {category && <span className="badge badge-category">{category}</span>}
          {difficulty && (
            <span className="badge badge-difficulty" style={{ backgroundColor: getDifficultyColor(difficulty) }}>
              {difficulty}
            </span>
          )}
        </div>

        {view_count > 0 && (
          <div className="recipe-card-views">
            <span>👁️ {view_count}</span>
          </div>
        )}
      </div>

      <div className="recipe-card-content">
        <h3 className="recipe-card-title">{title || "Untitled Recipe"}</h3>

        {cuisine && (
          <p className="recipe-card-cuisine"><span>🌍</span> {cuisine}</p>
        )}

        <div className="recipe-card-info">
          {totalTime > 0 && formatTime(totalTime) && (
            <div className="info-item">
              <span className="info-icon">⏱️</span>
              <span>{formatTime(totalTime)}</span>
            </div>
          )}
          {rating > 0 && (
            <div className="info-item">
              <span className="info-icon">⭐</span>
              <span>{rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {owner_name && (
          <div className="recipe-card-author">
            <div className="author-avatar">{owner_name[0]?.toUpperCase()}</div>
            <span className="author-name">by {owner_name}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

RecipeCard.propTypes = {
  recipe: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string,
    image_url: PropTypes.string,
    category: PropTypes.string,
    cuisine: PropTypes.string,
    difficulty: PropTypes.string,
    prep_time: PropTypes.number,
    cook_time: PropTypes.number,
    servings: PropTypes.number,
    rating: PropTypes.number,
    view_count: PropTypes.number,
    owner_name: PropTypes.string
  }).isRequired
};

export default RecipeCard;