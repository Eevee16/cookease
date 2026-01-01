import { useState } from "react";
import { useNavigate } from "react-router-dom";
import '../../styles/AddRecipes.css';

function AddRecipe() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    category: 'lunch',
    cuisine: 'filipino',
    difficulty: 'Easy',
    image: '',
    ingredients: [''],
    instructions: ['']
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleIngredientChange = (index, value) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index] = value;
    setFormData({ ...formData, ingredients: newIngredients });
  };

  const addIngredient = () => {
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, '']
    });
  };

  const removeIngredient = (index) => {
    const newIngredients = formData.ingredients.filter((_, i) => i !== index);
    setFormData({ ...formData, ingredients: newIngredients });
  };

  const handleInstructionChange = (index, value) => {
    const newInstructions = [...formData.instructions];
    newInstructions[index] = value;
    setFormData({ ...formData, instructions: newInstructions });
  };

  const addInstruction = () => {
    setFormData({
      ...formData,
      instructions: [...formData.instructions, '']
    });
  };

  const removeInstruction = (index) => {
    const newInstructions = formData.instructions.filter((_, i) => i !== index);
    setFormData({ ...formData, instructions: newInstructions });
  };

  const handleSubmit = (e) =>{
    e.preventDefault();
  }

  //Filter out empty ingredients and instructions
  const cleanedData = {
      ...formData,
      ingredients: formData.ingredients.filter(ing => ing.trim() !== ''),
      instructions: formData.instructions.filter(inst => inst.trim() !== '')
    };

    //TODO: Add Firebase submission logic here later
    console.log('Recipe data:', cleanedData);
    alert('Recipe added! (Demo mode)');
    navigate('/');

    return (
    <div className="add-recipe-page">
      <header className="add-recipe-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← Back
        </button>
        <h1 className="logo">CookEase</h1>
      </header>

      <main className="add-recipe-main">
        <div className="add-recipe-container">
          <h2 className="page-title">Share Your Recipe</h2>
          <p className="page-subtitle">Fill in the details below to add your recipe</p>

          <form className="recipe-form" onSubmit={handleSubmit}>
            {/* Basic Info Section */}
            <div className="form-section">
              <h3>Basic Information</h3>

              <div className="form-group">
                <label htmlFor="title">Recipe Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Spicy Chicken Adobo"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="category">Category *</label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="dessert">Dessert</option>
                    <option value="snacks">Snacks</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="cuisine">Cuisine *</label>
                  <select
                    id="cuisine"
                    name="cuisine"
                    value={formData.cuisine}
                    onChange={handleChange}
                    required
                  >
                    <option value="filipino">Filipino</option>
                    <option value="asian">Asian</option>
                    <option value="western">Western</option>
                    <option value="international">International</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="difficulty">Difficulty *</label>
                  <select
                    id="difficulty"
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleChange}
                    required
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="image">Image URL</label>
                <input
                  type="url"
                  id="image"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                />
                <small>Paste a link to your recipe image</small>
              </div>
            </div>

            {/* Ingredients Section */}
            <div className="form-section">
              <h3>Ingredients</h3>
              {formData.ingredients.map((ingredient, index) => (
                <div key={index} className="dynamic-field">
                  <input
                    type="text"
                    value={ingredient}
                    onChange={(e) => handleIngredientChange(index, e.target.value)}
                    placeholder={`Ingredient ${index + 1}`}
                    required
                  />
                  {formData.ingredients.length > 1 && (
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => removeIngredient(index)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="add-btn"
                onClick={addIngredient}
              >
                + Add Ingredient
              </button>
            </div>

            {/* Instructions Section */}
            <div className="form-section">
              <h3>Instructions</h3>
              {formData.instructions.map((instruction, index) => (
                <div key={index} className="dynamic-field">
                  <span className="step-number">Step {index + 1}</span>
                  <textarea
                    value={instruction}
                    onChange={(e) => handleInstructionChange(index, e.target.value)}
                    placeholder="Describe this step..."
                    rows="3"
                    required
                  />
                  {formData.instructions.length > 1 && (
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => removeInstruction(index)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="add-btn"
                onClick={addInstruction}
              >
                + Add Step
              </button>
            </div>

            {/* Submit Button */}
            <div className="form-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => navigate('/')}
              >
                Cancel
              </button>
              <button type="submit" className="submit-btn">
                Publish Recipe
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default AddRecipe;