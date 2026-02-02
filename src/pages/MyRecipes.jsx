import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import "../styles/MyRecipes.css";

function MyRecipes() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyRecipes = async () => {
      const user = supabase.auth.user();
      if (!user) return;

      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (error) console.error(error);
      else setRecipes(data || []);

      setLoading(false);
    };

    fetchMyRecipes();
  }, []);

  if (loading) return <p>Loading your recipes...</p>;

  return (
    <div className="my-recipes-page">
      <h1>My Recipes</h1>
      {recipes.length === 0 ? (
        <p>You haven’t added any recipes yet.</p>
      ) : (
        <ul className="recipe-list">
          {recipes.map((r) => (
            <li key={r.id}>
              <strong>{r.title}</strong> - {r.status}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default MyRecipes;
