import { useEffect } from "react";
import { supabase } from "../supabaseClient"; // adjust path if needed

/* 🔹 Ingredient seed data */
const ingredientsData = [
  { name: "chicken", category: "meat", image: "/images/ingredients/chicken.jpg" },
  { name: "tomato", category: "vegetable", image: "/images/ingredients/tomato.jpg" },
  { name: "onion", category: "vegetable", image: "/images/ingredients/onion.jpg" },
  { name: "egg", category: "dairy", image: "/images/ingredients/egg.jpg" },
  { name: "salt", category: "spice", image: "/images/ingredients/salt.jpg" },
];

/* 🔹 Populate ingredients (Supabase) */
const populateIngredients = async () => {
  const { error } = await supabase
    .from("ingredients")
    .upsert(ingredientsData, {
      onConflict: "name", // prevents duplicates
    });

  if (error) {
    console.error("Error populating ingredients:", error);
  } else {
    console.log("Ingredients populated successfully");
  }
};

const PopulateIngredients = () => {
  useEffect(() => {
    populateIngredients();
  }, []);

  return <div>Populating ingredients… Check the console.</div>;
};

export default PopulateIngredients;
