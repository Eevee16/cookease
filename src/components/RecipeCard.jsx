import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import "../styles/RecipeCard.css";
import "../styles/votes.css";

function RecipeCard({ recipe }) {
  const {
    id, title, image_url, category, cuisine,
    difficulty, prep_time, cook_time, servings,
    rating, view_count, owner_name, owner_photo
  } = recipe;

  const totalTime = (prep_time || 0) + (cook_time || 0);

  const formatTime = (minutes) => {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatCount = (num) => {
    if (!num) return "0";
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
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
      {/* Image Container */}
      <div className="recipe-card-image">
        {image_url ? (
          <img src={image_url} alt={title} loading="lazy" />
        ) : (
          <div className="recipe-card-no-image">
            <span>🍽️</span>
            <p>No Image</p>
          </div>
        )}

        {/* Badges on Image */}
        <div className="recipe-card-badges">
          {category && <span className="badge badge-category">{category}</span>}
          {difficulty && (
            <span 
              className="badge badge-difficulty" 
              style={{ backgroundColor: getDifficultyColor(difficulty) }}
            >
              {difficulty}
            </span>
          )}
        </div>

        {/* View Count Badge */}
        {view_count > 0 && (
          <div className="recipe-card-views">
            👁️ {formatCount(view_count)}
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="recipe-card-content">
        {/* Title */}
        <h3 className="recipe-card-title">{title || "Untitled Recipe"}</h3>

        {/* Cuisine + Difficulty + Category Badges */}
        <div className="recipe-card-tags">
          {category && (
            <span className="recipe-tag tag-category">{category}</span>
          )}
          {cuisine && (
            <span className="recipe-tag tag-cuisine">{cuisine}</span>
          )}
          {difficulty && (
            <span className={`recipe-tag tag-difficulty difficulty-${difficulty.toLowerCase()}`}>
              {difficulty}
            </span>
          )}
        </div>

        {/* Author Section */}
        {owner_name && (
          <div className="recipe-card-author">
            {owner_photo ? (
              <img
                src={owner_photo}
                alt={owner_name}
                className="recipe-card-author-avatar-img"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className="recipe-card-author-avatar"
              style={{ display: owner_photo ? 'none' : 'flex' }}
            >
              {owner_name[0]?.toUpperCase()}
            </div>
            <div className="recipe-card-author-info">
              <p className="recipe-card-author-label">Recipe by</p>
              <p className="recipe-card-author-name">{owner_name}</p>
            </div>
          </div>
        )}

        {/* Stats Section */}
        <div className="recipe-card-stats">
          {totalTime > 0 && formatTime(totalTime) && (
            <span>⏱️ {formatTime(totalTime)}</span>
          )}
          {servings && (
            <span>🍽️ {servings} servings</span>
          )}
          {rating > 0 && (
            <span>⭐ {rating.toFixed(1)}</span>
          )}
        </div>
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
    owner_name: PropTypes.string,
    owner_photo: PropTypes.string
  }).isRequired
};

export default RecipeCard;