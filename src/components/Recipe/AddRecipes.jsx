import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { db, storage } from "../../firebase/config";
import {
  collection,
  addDoc,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL
} from "firebase/storage";
import imageCompression from "browser-image-compression";
import "../../styles/AddRecipes.css";

/* 🔤 Helper */
const slugify = (text = "") =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

function AddRecipe() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (user === null) {
      navigate("/login", { state: { from: location } });
    }
  }, [user, navigate, location]);

  /* OPTIONS */
  const categoryOptions = [
    "Breakfast","Lunch","Dinner","Dessert","Snacks",
    "Appetizer","Soup","Salad","Beverage","Side Dish"
  ];

  const cuisineOptions = [
    "Filipino","Chinese","Japanese","Korean","Thai","Vietnamese",
    "Indian","Italian","French","American","Mexican","Spanish",
    "Greek","Middle Eastern","African","Fusion"
  ];

  const difficultyOptions = ["Easy", "Medium", "Hard"];

  /* STATE */
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    cuisine: "",
    difficulty: "",
    prepTime: "",
    cookTime: "",
    servings: "4",
    ingredients: [""],
    instructions: [""]
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  /* INPUT CHANGE */
  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  /* IMAGE */
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const compressed = await imageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1200,
      useWebWorker: true
    });

    setImageFile(compressed);
    setImagePreview(URL.createObjectURL(compressed));
  };

  /* INGREDIENTS */
  const handleIngredientChange = (i, v) => {
    const items = [...formData.ingredients];
    items[i] = v;
    setFormData({ ...formData, ingredients: items });
  };

  const addIngredient = () =>
    setFormData({ ...formData, ingredients: [...formData.ingredients, ""] });

  const removeIngredient = (i) => {
    if (formData.ingredients.length === 1) return;
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter((_, idx) => idx !== i)
    });
  };

  /* INSTRUCTIONS */
  const handleInstructionChange = (i, v) => {
    const steps = [...formData.instructions];
    steps[i] = v;
    setFormData({ ...formData, instructions: steps });
  };

  const addInstruction = () =>
    setFormData({
      ...formData,
      instructions: [...formData.instructions, ""]
    });

  const removeInstruction = (i) => {
    if (formData.instructions.length === 1) return;
    setFormData({
      ...formData,
      instructions: formData.instructions.filter((_, idx) => idx !== i)
    });
  };

  /* SUBMIT */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFieldErrors({});
    setUploadProgress(0);

    const cleaned = {
      ...formData,
      ingredients: formData.ingredients.filter(i => i.trim()),
      instructions: formData.instructions.filter(i => i.trim())
    };

    const errors = {};
    if (!cleaned.title) errors.title = "Recipe title is required";
    if (!cleaned.category) errors.category = "Please select a category";
    if (!cleaned.cuisine) errors.cuisine = "Please select a cuisine";
    if (!cleaned.difficulty) errors.difficulty = "Please select difficulty";
    if (!cleaned.ingredients.length) errors.ingredients = "Add at least one ingredient";
    if (!cleaned.instructions.length) errors.instructions = "Add at least one step";

    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      setSubmitting(false);
      return;
    }

    try {
      // 1️⃣ Create recipe
      const recipeRef = await addDoc(collection(db, "recipes"), {
        ...cleaned,
        slug: slugify(cleaned.title),
        imageUrl: "",
        ownerId: user.uid,
        ownerName: user.displayName || user.email,
        rating: 0,
        status: "pending",
        createdAt: serverTimestamp()
      });

      // 2️⃣ Upload image if provided
      if (imageFile) {
        const imgRef = storageRef(storage, `recipes/${recipeRef.id}/main.jpg`);
        const uploadTask = uploadBytesResumable(imgRef, imageFile);

        await new Promise((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(Math.round(progress));
            },
            (error) => reject(error),
            async () => {
              const imageUrl = await getDownloadURL(uploadTask.snapshot.ref);
              await updateDoc(recipeRef, { imageUrl });
              resolve();
            }
          );
        });
      }

      // 3️⃣ Show success feedback and navigate
      alert("Recipe submitted for approval!");
      navigate("/");

    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  };

  return (
    <div className="add-recipe-page">
      <div className="add-recipe-main">
        <div className="add-recipe-container">

          <h1 className="page-title">Add New Recipe</h1>
          <p className="page-subtitle">Share your favorite dish with others</p>

          <form className="recipe-form" onSubmit={handleSubmit}>

            {/* BASIC INFO */}
            <div className="form-section">
              <h3>Basic Information</h3>

              <div className="form-group">
                <label>Recipe Title *</label>
                <input
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                />
                {fieldErrors.title && (
                  <small className="field-error">{fieldErrors.title}</small>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <select name="category" value={formData.category} onChange={handleChange}>
                    <option value="">Select...</option>
                    {categoryOptions.map(c => <option key={c}>{c}</option>)}
                  </select>
                  {fieldErrors.category && (
                    <small className="field-error">{fieldErrors.category}</small>
                  )}
                </div>

                <div className="form-group">
                  <label>Cuisine *</label>
                  <select name="cuisine" value={formData.cuisine} onChange={handleChange}>
                    <option value="">Select...</option>
                    {cuisineOptions.map(c => <option key={c}>{c}</option>)}
                  </select>
                  {fieldErrors.cuisine && (
                    <small className="field-error">{fieldErrors.cuisine}</small>
                  )}
                </div>

                <div className="form-group">
                  <label>Difficulty *</label>
                  <select name="difficulty" value={formData.difficulty} onChange={handleChange}>
                    <option value="">Select...</option>
                    {difficultyOptions.map(d => <option key={d}>{d}</option>)}
                  </select>
                  {fieldErrors.difficulty && (
                    <small className="field-error">{fieldErrors.difficulty}</small>
                  )}
                </div>
              </div>
            </div>

            {/* IMAGE */}
            <div className="form-section">
              <h3>Recipe Image</h3>

              {imagePreview && (
                <div className="image-preview">
                  <img src={imagePreview} alt="Preview" />
                </div>
              )}

              <input type="file" accept="image/*" onChange={handleImageChange} />

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="upload-progress">
                  <div
                    className="progress-bar"
                    style={{ width: `${uploadProgress}%` }}
                  />
                  <span>{uploadProgress}%</span>
                </div>
              )}
            </div>

            {/* INGREDIENTS */}
            <div className="form-section">
              <h3>Ingredients *</h3>

              {formData.ingredients.map((item, idx) => (
                <div key={idx} className="dynamic-field">
                  <input
                    value={item}
                    onChange={e => handleIngredientChange(idx, e.target.value)}
                    placeholder={`Ingredient ${idx + 1}`}
                  />
                  {formData.ingredients.length > 1 && (
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => removeIngredient(idx)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}

              <button type="button" className="add-btn" onClick={addIngredient}>
                + Add Ingredient
              </button>
            </div>

            {/* INSTRUCTIONS */}
            <div className="form-section">
              <h3>Instructions *</h3>

              {formData.instructions.map((step, idx) => (
                <div key={idx} className="dynamic-field">
                  <input
                    className="instruction-input"
                    value={step}
                    onChange={e => handleInstructionChange(idx, e.target.value)}
                    placeholder={`Step ${idx + 1}`}
                  />
                  {formData.instructions.length > 1 && (
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => removeInstruction(idx)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}

              <button type="button" className="add-btn" onClick={addInstruction}>
                + Add Step
              </button>
            </div>

            {/* ACTIONS */}
            <div className="form-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => navigate("/")}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="submit-btn"
                disabled={submitting}
              >
                {submitting ? "Publishing..." : "Publish Recipe"}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}

export default AddRecipe;
