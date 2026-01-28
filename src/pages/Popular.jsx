import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import "../styles/Popular.css";

const Popular = () => {
  const navigate = useNavigate();
  const isNavigatingRef = useRef(false);

  const [activeTab, setActiveTab] = useState("All Time");
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch popular recipes
  useEffect(() => {
    const fetchPopularRecipes = async () => {
      try {
        const { data, error } = await supabase
          .from("recipes")
          .select("*")
          .order("views", { ascending: false })
          .limit(12);

        if (error) throw error;

        const recipesData = data.map((recipe, index) => ({
          ...recipe,
          rank: index + 1,
        }));

        setRecipes(recipesData);
      } catch (err) {
        console.error("Error fetching popular recipes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPopularRecipes();
  }, []);

  // Increment views safely
  const handleRecipeClick = async (id) => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;

    const sessionKey = `viewed_recipe_${id}`;

    try {
      if (!sessionStorage.getItem(sessionKey)) {
        sessionStorage.setItem(sessionKey, "true");

        // Increment views in Supabase
        const { error } = await supabase.rpc("increment_recipe_views", { recipe_id: id });
        if (error) throw error;
      }
    } catch (err) {
      console.error("Error updating views:", err);
      sessionStorage.removeItem(sessionKey);
    } finally {
      navigate(`/recipe/${id}`);
    }
  };

  const formatViews = (num) => {
    if (!num) return "0";
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  if (loading) return <div className="loading">Loading popular recipes...</div>;

  return (
    <div className="popular-page-wrapper">
      <div className="popular-container">
        <div className="popular-header">
          <h2 className="popular-title">Most Viewed Recipes</h2>
          <p className="popular-subtitle">
            Trending dishes our community is watching right now
          </p>
        </div>

        <div className="popular-tabs">
          {["All Time", "This Week", "New & Rising"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`tab-button ${activeTab === tab ? "active" : ""}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="popular-grid">
          {recipes.length === 0 ? (
            <div className="empty-state">
              <p>No recipes available yet.</p>
            </div>
          ) : (
            recipes.map((recipe) => {
              const safeRecipe = {
                id: recipe.id,
                title: recipe.title || "Untitled",
                image: recipe.image || "/images/placeholder.png",
                ingredients: Array.isArray(recipe.ingredients)
                  ? recipe.ingredients
                  : [],
                difficulty: recipe.difficulty || "Medium",
                views: recipe.views || 0,
                rank: recipe.rank,
              };

              return (
                <div
                  key={safeRecipe.id}
                  className="recipe-card"
                  onClick={() => handleRecipeClick(safeRecipe.id)}
                >
                  <div className={`rank-badge rank-${safeRecipe.rank}`}>
                    #{safeRecipe.rank}
                  </div>

                  <div className="recipe-image">
                    <img src={safeRecipe.image} alt={safeRecipe.title} />
                  </div>

                  <div className="recipe-content">
                    <h3 className="recipe-title">{safeRecipe.title}</h3>

                    <p className="recipe-ingredients">
                      {safeRecipe.ingredients.slice(0, 3).join(", ")}
                      {safeRecipe.ingredients.length > 3 && "..."}
                    </p>

                    <div className="recipe-card-footer">
                      <span>{formatViews(safeRecipe.views)} views</span>
                      <span
                        className={`recipe-difficulty difficulty-${safeRecipe.difficulty.toLowerCase()}`}
                      >
                        {safeRecipe.difficulty}
                      </span>
                    </div>
                  </div>
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
