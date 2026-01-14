import { useEffect } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase/config"; // adjust path if needed

// Step 1: Your ingredients array
const ingredientsData = [
  { name: "chicken", category: "meat", image: "/images/ingredients/chicken.jpg" },
  { name: "tomato", category: "vegetable", image: "/images/ingredients/tomato.jpg" },
  { name: "onion", category: "vegetable", image: "/images/ingredients/onion.jpg" },
  { name: "egg", category: "dairy", image: "/images/ingredients/egg.jpg" },
  { name: "salt", category: "spice", image: "/images/ingredients/salt.jpg" },
];

// Step 2: Function to add ingredients to Firestore
const populateIngredients = async () => {
  for (const ing of ingredientsData) {
    try {
      const docRef = await addDoc(collection(db, "ingredients"), ing);
      console.log(`Added: ${ing.name} with ID: ${docRef.id}`);
    } catch (error) {
      console.error("Error adding ingredient:", ing.name, error);
    }
  }
};

// Step 3: Call it on component mount
const PopulateIngredients = () => {
  useEffect(() => {
    populateIngredients();
  }, []);

  return <div>Populating ingredients... Check the console.</div>;
};

export default PopulateIngredients;
