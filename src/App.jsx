import { Routes, Route } from "react-router-dom";

import HomePage from "./pages/HomePage.jsx";
import RecipeDetail from "./pages/RecipeDetail.jsx";
import Signup from "./components/Auth/Signup.jsx";
import Login from "./components/Auth/Login.jsx";
import AddRecipe from "./components/Recipe/AddRecipes.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Popular from "./pages/Popular.jsx";

import { AuthProvider } from "./contexts/AuthContext";
import { AdminProvider } from "./contexts/AdminContext";
import SearchByIngredients from "./pages/SearchByIngredients.jsx";
import PopulateIngredients from "./components/PopulateIngredients";
function App() {
  return (
      <AuthProvider>
        <AdminProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/recipe/:id" element={<RecipeDetail />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/search-ingredients" element={<SearchByIngredients />} />
            <Route path="/populate" element={<PopulateIngredients />} />
            <Route path="/popular" element={<Popular />} />
            
            <Route
              path="/add-recipe"
              element={
                <ProtectedRoute>
                  <AddRecipe />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AdminProvider>
      </AuthProvider>
  );
}

export default App;
