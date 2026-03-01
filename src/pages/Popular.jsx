import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "../styles/Popular.css";

const TABS = ["Most Views", "Most Liked"];
const TAB_STORAGE_KEY = "popular_active_tab";

const Popular = () => {
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem(TAB_STORAGE_KEY);
    return TABS.includes(saved) ? saved : "Most Views";
  });
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    localStorage.setItem(TAB_STORAGE_KEY, tab);
  };

  useEffect(() => {
    const fetchPopularRecipes = async () => {
      setLoading(true);
      try {
        if (activeTab === "Most Views") {
          const { data, error } = await supabase
            .from("recipes")
            .select("*")
            .eq("status", "approved")
            .order("view_count", { ascending: false })
            .limit(12);

          if (error) throw error;
          setRecipes(data.map((recipe, index) => ({ ...recipe, rank: index + 1, net_votes: null })));

        } else if (activeTab === "Most Liked") {
          const { data: recipesData, error: recipesError } = await supabase
            .from("recipes")
            .select("*")
            .eq("status", "approved");

          if (recipesError) throw recipesError;

          const { data: votesData, error: votesError } = await supabase
            .from("votes")
            .select("recipe_id, vote_type");

          if (votesError) throw votesError;

          const voteMap = {};
          votesData.forEach(({ recipe_id, vote_type }) => {
            if (!voteMap[recipe_id]) voteMap[recipe_id] = 0;
            voteMap[recipe_id] += vote_type === "up" ? 1 : -1;
          });

          const sorted = recipesData
            .map(r => ({ ...r, net_votes: voteMap[r.id] || 0 }))
            .sort((a, b) => b.net_votes - a.net_votes)
            .slice(0, 12)
            .map((recipe, index) => ({ ...recipe, rank: index + 1 }));

          setRecipes(sorted);
        }
      } catch (err) {
        console.error("Error fetching popular recipes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPopularRecipes();
  }, [activeTab]);

  const formatCount = (num) => {
    if (!num) return "0";
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  if (loading) {
    return (
      <div className="popular-page">
        <div className="popular-loading">
          <div className="popular-spinner"></div>
          <p className="popular-loading-text">Loading popular recipes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="popular-page">
      <div className="popular-header">
        <div className="popular-header-content">
          <h1>Most Viewed Recipes</h1>
          <p>Trending dishes our community is watching right now</p>
        </div>
      </div>

      <div className="popular-main">
        <div className="popular-tabs">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`popular-tab ${activeTab === tab ? "active" : ""}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {recipes.length === 0 ? (
          <div className="popular-empty">
            <div className="popular-empty-icon">📊</div>
            <h3>No popular recipes yet</h3>
            <p>Check back later for trending recipes!</p>
          </div>
        ) : (
          <div className="popular-grid">
            {recipes.map((recipe) => (
              <Link
                to={`/recipe/${recipe.id}`}
                key={recipe.id}
                className="popular-card"
              >
                <div className="popular-image-container">
                  <div className={`rank-badge ${recipe.rank <= 3 ? "top-three" : ""}`}>
                    #{recipe.rank}
                  </div>

                  {recipe.image_url ? (
                    <img
                      src={recipe.image_url}
                      alt={recipe.title}
                      loading="lazy"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextElementSibling.style.display = "flex";
                      }}
                    />
                  ) : null}

                  <div
                    className="no-image"
                    style={{ display: recipe.image_url ? "none" : "flex" }}
                  >
                    No Image
                  </div>

                  <div className="view-badge">
                    {activeTab === "Most Liked" ? (
                      <>▲ {recipe.net_votes > 0 ? `+${recipe.net_votes}` : recipe.net_votes}</>
                    ) : (
                      <>👁️ {formatCount(recipe.view_count || 0)}</>
                    )}
                  </div>
                </div>

                <div className="popular-info">
                  <h3 className="popular-title">{recipe.title || "Untitled"}</h3>

                  <div className="popular-badges">
                    <span className="badge category">{recipe.category || "Uncategorized"}</span>
                    <span className="badge cuisine">{recipe.cuisine || "Global"}</span>
                    <span className={`badge difficulty ${(recipe.difficulty || "Medium").toLowerCase()}`}>
                      {recipe.difficulty || "Medium"}
                    </span>
                  </div>

                  <p className="popular-owner">By {recipe.owner_name || "Anonymous"}</p>

                  <div className="popular-stats">
                    <span>⏱️ {(recipe.prep_time || 0) + (recipe.cook_time || 0)} min</span>
                    <span>🍽️ {recipe.servings || 4} servings</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Popular;