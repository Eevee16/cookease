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
        let recipesData = [];

        if (activeTab === "Most Views") {
          const { data, error } = await supabase
            .from("recipes")
            .select("*")
            .eq("status", "approved")
            .order("view_count", { ascending: false })
            .limit(12);

          if (error) throw error;
          recipesData = data.map((recipe, index) => ({ ...recipe, rank: index + 1, net_votes: null }));

        } else if (activeTab === "Most Liked") {
          const { data: allRecipes, error: recipesError } = await supabase
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

          recipesData = allRecipes
            .map(r => ({ ...r, net_votes: voteMap[r.id] || 0 }))
            .sort((a, b) => b.net_votes - a.net_votes)
            .slice(0, 12)
            .map((recipe, index) => ({ ...recipe, rank: index + 1 }));
        }

        // Fetch owner profile photos
        const ownerIds = [...new Set(recipesData.map(r => r.owner_id).filter(Boolean))];
        let ownerMap = {};

        if (ownerIds.length) {
          const { data: profiles, error: profileError } = await supabase
            .from("profiles")
            .select("id, first_name, last_name, name, email, photo_url")
            .in("id", ownerIds);

          if (profileError) {
            console.warn("Failed to load profile data for recipes:", profileError);
          } else {
            ownerMap = (profiles || []).reduce((acc, p) => {
              const firstLast = [p.first_name, p.last_name].filter(Boolean).join(" ");
              const displayName = firstLast || p.name || p.email || "Unknown";
              acc[p.id] = {
                displayName,
                photoUrl: p.photo_url || null
              };
              return acc;
            }, {});
          }
        }

        // Normalize recipes with owner data
        const normalized = recipesData.map(r => {
          const owner = ownerMap[r.owner_id];
          return {
            ...r,
            owner_name: owner?.displayName || r.owner_name || "Unknown",
            owner_photo: owner?.photoUrl || null
          };
        });

        setRecipes(normalized);
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
            {recipes.map((recipe) => {
              const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);
              
              return (
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

                    {/* Author with Profile Photo */}
                    <div className="popular-author">
                      {recipe.owner_photo ? (
                        <img
                          src={recipe.owner_photo}
                          alt={recipe.owner_name || "User"}
                          className="popular-author-avatar-img"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextElementSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className="popular-author-avatar"
                        style={{ display: recipe.owner_photo ? 'none' : 'flex' }}
                      >
                        {recipe.owner_name ? recipe.owner_name[0].toUpperCase() : "U"}
                      </div>
                      <div className="popular-author-info">
                        <p className="popular-author-label">Recipe by</p>
                        <p className="popular-author-name">{recipe.owner_name || "Anonymous"}</p>
                      </div>
                    </div>

                    <div className="popular-stats">
                      {totalTime > 0 && (
                        <span>⏱️ {totalTime} min</span>
                      )}
                      <span>🍽️ {recipe.servings || 4} servings</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Popular;