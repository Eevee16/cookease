import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { Link } from "react-router-dom";
import { useRoles } from "../contexts/RoleContext";
import RecipeCard from "../components/recipeCard";
import "../styles/App.css";

function HomePage() {
  const { userData } = useRoles(); // useRoles gives us current user info
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true);

        // Fetch approved recipes
        const { data: approved, error: approvedError } = await supabase
          .from("recipes")
          .select("*")
          .eq("status", "approved")
          .order("created_at", { ascending: false });

        if (approvedError) throw approvedError;

        // Fetch done recipes
        const { data: done, error: doneError } = await supabase
          .from("recipes")
          .select("*")
          .eq("status", "done")
          .order("created_at", { ascending: false });

        if (doneError) throw doneError;

        // Combine both
        setRecipes([...(approved || []), ...(done || [])]);
      } catch (err) {
        console.error("Failed to load recipes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, []);

  if (loading) {
    return <div className="loading">Loading recipes...</div>;
  }

  return (
    <div className="home-page">
      <div className="recipe-container">
        <h2 className="section-title">Discover Recipes</h2>

        <div className="recipe-grid">
          {recipes.length === 0 ? (
            <div className="empty-state">
              <p>No recipes available yet.</p>

              {userData && (
                <Link to="/add-recipe" className="btn-primary">
                  Add a Recipe
                </Link>
              )}
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
                rating: typeof recipe.rating === "number" ? recipe.rating : 0,
                difficulty: recipe.difficulty || "N/A",
              };

              return <RecipeCard key={safeRecipe.id} recipe={safeRecipe} />;
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default HomePage;