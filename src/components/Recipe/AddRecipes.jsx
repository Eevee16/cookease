import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import '../../styles/AddRecipes.css';

function AddRecipe() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (user === null) {
      // not logged in → redirect to login (remember where we came from)
      navigate('/login', { state: { from: location } });
    }
  }, [user, navigate, location]);

  const [formData, setFormData] = useState({
    title: '',
    category: 'lunch',
    cuisine: 'filipino',
    difficulty: 'Easy',
    ingredients: [''],
    instructions: ['']
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [lastSavedId, setLastSavedId] = useState(null);

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

  const handleSubmit = async (e) =>{
    e.preventDefault();
    console.log('handleSubmit triggered');
    setError('');
    setSubmitting(true);



    //Filter out empty ingredients and instructions
    const cleanedData = {
      ...formData,
      ingredients: formData.ingredients.filter(ing => ing.trim() !== ''),
      instructions: formData.instructions.filter(inst => inst.trim() !== '')
    };

    try {
      // Image upload removed — no images will be stored
      const imagesUrls = [];

      // Build recipe object
      const recipeObj = {
        title: cleanedData.title,
        category: cleanedData.category,
        cuisine: cleanedData.cuisine,
        difficulty: cleanedData.difficulty,
        image: '',
        images: [],
        ingredients: cleanedData.ingredients,
        instructions: cleanedData.instructions,
        ownerId: user?.uid || null,
        ownerName: user?.displayName || '',
        createdAt: serverTimestamp(),
        rating: 0
      };

      console.log('Saving recipe to Firestore:', recipeObj);

      // Save to Firestore
      const recipesCol = collection(db, 'recipes');
      const docRef = await addDoc(recipesCol, recipeObj);

      console.log('Recipe saved, id:', docRef.id);
      setLastSavedId(docRef.id);

      alert('Recipe added!');
      navigate('/');

    } catch (err) {
      console.error('Error adding recipe:', err);
      setError(err?.message || String(err));
      alert('Failed to add recipe. Check console for details.');
    } finally {
      setSubmitting(false);
    }
  }

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

          <form className="recipe-form" onSubmit={handleSubmit} noValidate>
            {error && <div className="form-error">{error}</div>}
            {lastSavedId && <div className="form-success">Last saved id: {lastSavedId}</div> }
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
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="submit-btn"
                onClick={() => console.log('Publish clicked')}
                disabled={submitting}
              >
                {submitting ? 'Publishing...' : 'Publish Recipe'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default AddRecipe;