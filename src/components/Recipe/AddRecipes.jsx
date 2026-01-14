import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { db, storage } from "../../firebase/config";
import {
  collection,
  addDoc,
  updateDoc,
  serverTimestamp
} from "firebase/firestore";
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL
} from "firebase/storage";
import imageCompression from "browser-image-compression";
import "../../styles/AddRecipes.css";

/* 🔤 Helper: make safe filenames */
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

  /* 🔒 Redirect if not logged in */
  useEffect(() => {
    if (user === null) {
      navigate("/login", { state: { from: location } });
    }
  }, [user, navigate, location]);

  /* 📄 Form State */
  const [formData, setFormData] = useState({
    title: "",
    category: "lunch",
    cuisine: "filipino",
    difficulty: "Easy",
    prepTime: "",
    cookTime: "",
    servings: "",
    description: "",
    ingredients: [""],
    instructions: []
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  /* ✏️ Input Change */
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  /* 🖼 Image Compression */
  const compressImage = async (file) => {
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
        fileType: "image/webp"
      });

      return new File(
        [compressed],
        file.name.replace(/\..+$/, ".webp"),
        { type: "image/webp" }
      );
    } catch {
      return file;
    }
  };

  /* 📷 File Select */
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const compressed = await compressImage(file);
    setImageFile(compressed);

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(compressed);
  };

  /* 🧂 Ingredients */
  const handleIngredientChange = (i, v) => {
    const items = [...formData.ingredients];
    items[i] = v;
    setFormData({ ...formData, ingredients: items });
  };

  const addIngredient = () =>
    setFormData({ ...formData, ingredients: [...formData.ingredients, ""] });

  const removeIngredient = (i) =>
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter((_, idx) => idx !== i)
    });

  /* 📋 Instructions */
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

  const removeInstruction = (i) =>
    setFormData({
      ...formData,
      instructions: formData.instructions.filter((_, idx) => idx !== i)
    });

  /* 🚀 Submit */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const cleaned = {
        ...formData,
        ingredients: formData.ingredients.filter(i => i.trim()),
        instructions: formData.instructions.filter(i => i.trim())
      };

      /* 📌 Create recipe FIRST */
      const docRef = await addDoc(collection(db, "recipes"), {
        ...cleaned,
        image: "",
        ownerId: user.uid,
        ownerName: user.displayName || user.email,
        rating: 0,
        status: "pending",
        createdAt: serverTimestamp()
      });

      alert("Recipe submitted for review!");
      navigate("/");

      /* 🧵 Upload image in background */
      if (imageFile) {
        const safeTitle = slugify(cleaned.title);

        const fileRef = storageRef(
          storage,
          `recipes/${user.uid}/${safeTitle}-${docRef.id}.webp`
        );

        const uploadTask = uploadBytesResumable(fileRef, imageFile);

        uploadTask.on(
          "state_changed",
          (snap) => {
            setUploadPercent(
              Math.round((snap.bytesTransferred / snap.totalBytes) * 100)
            );
          },
          async () => {
            await updateDoc(docRef, { status: "failed" });
          },
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            await updateDoc(docRef, { image: url });
            setUploadPercent(0);
          }
        );
      }
    } catch (err) {
      console.error(err);
      setError("Failed to submit recipe.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="add-recipe-page">
      <div className="add-recipe-main">
        <div className="add-recipe-container">
          <h1 className="page-title">Share Your Recipe</h1>
          <p className="page-subtitle">
            Fill in the details below to add your recipe
          </p>

          <form className="recipe-form" onSubmit={handleSubmit}>
            {error && <div className="form-error">{error}</div>}

            {/* BASIC INFO */}
            <div className="form-section">
              <h3>Basic Information</h3>
              <div className="form-group">
                <label>Recipe Title</label>
                <input
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Spicy Chicken Adobo"
                  required
                />
              </div>
            </div>

            {/* IMAGE */}
            <div className="form-section">
              <h3>Recipe Image</h3>
              <input type="file" accept="image/*" onChange={handleFileChange} />
              {imagePreview && <img src={imagePreview} alt="preview" width={200} />}
              {uploadPercent > 0 && <p>Uploading: {uploadPercent}%</p>}
            </div>

            {/* INGREDIENTS */}
            <div className="form-section">
              <h3>Ingredients</h3>
              {formData.ingredients.map((item, idx) => (
                <div key={idx} className="dynamic-field">
                  <input
                    value={item}
                    onChange={(e) => handleIngredientChange(idx, e.target.value)}
                    placeholder={`Ingredient ${idx + 1}`}
                  />
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => removeIngredient(idx)}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button type="button" className="add-btn" onClick={addIngredient}>
                + Add Ingredient
              </button>
            </div>

            {/* INSTRUCTIONS */}
            <div className="form-section">
              <h3>Instructions</h3>
              {formData.instructions.map((step, idx) => (
                <div key={idx} className="dynamic-field">
                  <div className="step-number">
                    <span className="step-label">Step</span>
                    <span className="step-count">{idx + 1}</span>
                  </div>
                  <textarea
                    value={step}
                    onChange={(e) =>
                      handleInstructionChange(idx, e.target.value)
                    }
                    placeholder="Describe this step..."
                  />
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => removeInstruction(idx)}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button type="button" className="add-btn" onClick={addInstruction}>
                + Add Step
              </button>
            </div>

            {/* ACTIONS */}
            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={() => navigate("/")}>
                Cancel
              </button>
              <button type="submit" className="submit-btn" disabled={submitting}>
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