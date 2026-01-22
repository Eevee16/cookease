import { useState, useEffect } from 'react';

function CourseCuisineFilter({ recipes, onFilteredRecipes }) {
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('');

  const [allCourses, setAllCourses] = useState([]);
  const [allCuisines, setAllCuisines] = useState([]);

  useEffect(() => {
    const coursesSet = new Set();
    const cuisinesSet = new Set();

    recipes.forEach(r => {
      if (r.course) coursesSet.add(r.course);
      if (r.cuisine) cuisinesSet.add(r.cuisine);
    });

    setAllCourses(Array.from(coursesSet).sort());
    setAllCuisines(Array.from(cuisinesSet).sort());
  }, [recipes]);

  // Filter recipes whenever selection changes
  useEffect(() => {
    let filtered = [...recipes];

    if (selectedCourse) {
      filtered = filtered.filter(r => r.course === selectedCourse);
    }
    if (selectedCuisine) {
      filtered = filtered.filter(r => r.cuisine === selectedCuisine);
    }

    onFilteredRecipes(filtered);
  }, [selectedCourse, selectedCuisine, recipes, onFilteredRecipes]);

  return (
    <div className="course-cuisine-filter">
      <div className="filter-group">
        <label>Course:</label>
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
        >
          <option value="">All</option>
          {allCourses.map(course => (
            <option key={course} value={course}>{course}</option>
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
          {allCuisines.map(cuisine => (
            <option key={cuisine} value={cuisine}>{cuisine}</option>
          ))}
        </select>
      </div>

      <p>{recipes.length} recipes available</p>
    </div>
  );
}

export default CourseCuisineFilter;
