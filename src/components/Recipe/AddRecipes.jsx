import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from '../../contexts/AuthContext';
import { db, storage } from '../../firebase/config';
import { collection, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import '../../styles/AddRecipes.css';

function AddRecipe() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (user === null) {
      navigate('/login', { state: { from: location } });
    }
  }, [user, navigate, location]);

  const [formData, setFormData] = useState({
    title: '',
    category: 'lunch',
    cuisine: 'filipino',
    difficulty: 'Easy',
    prepTime: '',
    cookTime: '',
    servings: '',
    description: '',
    ingredients: [''],
    instructions: ['']
  });
  
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    
    // Create preview
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('handleSubmit triggered');
    setError('');
    setSubmitting(true);

    // Filter out empty ingredients and instructions
    const cleanedData = {
      ...formData,
      ingredients: formData.ingredients.filter(ing => ing.trim() !== ''),
      instructions: formData.instructions.filter(inst => inst.trim() !== '')
    };

    try {
      // Build partial recipe object and create document first so we can return early
      const recipePartial = {
        title: cleanedData.title,
        category: cleanedData.category,
        cuisine: cleanedData.cuisine,
        difficulty: cleanedData.difficulty,
        prepTime: cleanedData.prepTime,
        cookTime: cleanedData.cookTime,
        servings: cleanedData.servings ? Number(cleanedData.servings) : 4,
        description: cleanedData.description,
        image: '', // empty until upload finishes
        ingredients: cleanedData.ingredients,
        instructions: cleanedData.instructions,
        ownerId: user?.uid || null,
        ownerName: user?.displayName || user?.email || 'Anonymous',
        createdAt: serverTimestamp(),
        rating: 0,
        status: imageFile ? 'uploading' : 'done'
      };

      console.log('Creating recipe doc (non-blocking):', recipePartial);

      const recipesCol = collection(db, 'recipes');
      const docRef = await addDoc(recipesCol, recipePartial);

      console.log('Recipe created with ID:', docRef.id);

      // Navigate back immediately so user isn't waiting for image upload
      alert('Recipe added! Image upload will continue in the background.');
      navigate('/');

      // If there's an image, upload it in background and update the doc when done
      if (imageFile) {
        try {
          console.log('Background upload started for:', docRef.id);
          const timestamp = Date.now();
          const fileRef = storageRef(
            storage,
            `recipes/${user.uid}/${docRef.id}_${timestamp}_${imageFile.name}`
          );
          const uploadTask = uploadBytesResumable(fileRef, imageFile);

          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
              setUploadPercent(percent);
              console.log(`Background upload is ${percent}% done`);
            },
            async (error) => {
              console.error('Background upload error:', error);
              // mark doc as failed
              try { await updateDoc(docRef, { status: 'failed' }); } catch (e) { console.error('Failed to update doc status:', e); }
            },
            async () => {
              try {
                const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                console.log('Background file available at:', downloadUrl);
                // Update the Firestore doc with the image URL and mark as done
                await updateDoc(docRef, { image: downloadUrl, status: 'done' });
              } catch (error) {
                console.error('Error getting download URL in background:', error);
                try { await updateDoc(docRef, { status: 'failed' }); } catch (e) { console.error('Failed to update doc status:', e); }
              } finally {
                setUploadPercent(0);
              }
            }
          );
        } catch (bgErr) {
          console.error('Background upload setup failed:', bgErr);
          try { await updateDoc(docRef, { status: 'failed' }); } catch (e) { console.error('Failed to update doc status:', e); }
        }
      }

    } catch (err) {
      console.error('Error adding recipe:', err);
      setError(err?.message || String(err));
      alert('Failed to add recipe. Check console for details.');
    } finally {
      setSubmitting(false);
    }
  };

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

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="prepTime">Prep Time</label>
                  <input
                    type="text"
                    id="prepTime"
                    name="prepTime"
                    value={formData.prepTime}
                    onChange={handleChange}
                    placeholder="e.g., 15 minutes"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="cookTime">Cook Time</label>
                  <input
                    type="text"
                    id="cookTime"
                    name="cookTime"
                    value={formData.cookTime}
                    onChange={handleChange}
                    placeholder="e.g., 30 minutes"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="servings">Servings</label>
                  <input
                    type="number"
                    id="servings"
                    name="servings"
                    value={formData.servings}
                    onChange={handleChange}
                    placeholder="4"
                    min="1"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Tell us about this recipe..."
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label htmlFor="imageFile">Recipe Image</label>
                <input
                  type="file"
                  id="imageFile"
                  name="imageFile"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                {imagePreview && (
                  <div className="image-preview">
                    <img src={imagePreview} alt="Preview" style={{ maxWidth: '200px', marginTop: '10px', borderRadius: '8px' }} />
                  </div>
                )}
                {uploadPercent > 0 && uploadPercent < 100 && (
                  <div className="upload-progress">
                    <div className="progress-bar" style={{ width: `${uploadPercent}%` }}></div>
                    <span>Uploading: {uploadPercent}%</span>
                  </div>
                )}
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
                  <span className="step-number" aria-label={`Step ${index + 1}`}>
                    <span className="step-label">Step</span>
                    <span className="step-count">{index + 1}</span>
                  </span>
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