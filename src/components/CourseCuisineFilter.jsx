import { useState, useEffect } from "react";

function CourseCuisineFilter({ recipes = [], onFilteredRecipes }) {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState("");

  const [allCategories, setAllCategories] = useState([]);
  const [allCuisines, setAllCuisines] = useState([]);

  /* Build filter options safely */
  useEffect(() => {
    if (!Array.isArray(recipes)) return;

    const categorySet = new Set();
    const cuisineSet = new Set();

    for (const r of recipes) {
      if (r?.category) categorySet.add(r.category);
      if (r?.cuisine) cuisineSet.add(r.cuisine);
    }

    setAllCategories([...categorySet].sort());
    setAllCuisines([...cuisineSet].sort());
  }, [recipes]);

  /* Apply filters */
  useEffect(() => {
    if (typeof onFilteredRecipes !== "function") return;

    let filtered = [...recipes];

    if (selectedCategory) {
      filtered = filtered.filter(
        (r) => r?.category === selectedCategory
      );
    }

    if (selectedCuisine) {
      filtered = filtered.filter(
        (r) => r?.cuisine === selectedCuisine
      );
    }

    onFilteredRecipes(filtered);
  }, [
    selectedCategory,
    selectedCuisine,
    recipes,
    onFilteredRecipes
  ]);

  return (
    <div className="course-cuisine-filter">
      <div className="filter-group">
        <label>Category:</label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">All</option>
          {allCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label>Cuisine:</label>
        <select
          value={selectedCuisine}
          onChange={(e) => setSelectedCuisine(e.target.value)}
        >
          <option value="">All</option>
          {allCuisines.map((cuisine) => (
            <option key={cuisine} value={cuisine}>
              {cuisine}
            </option>
          ))}
        </select>
      </div>

      <p>{recipes.length} recipes available</p>
    </div>
  );
}

export default CourseCuisineFilter;
