import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AdminProvider } from "./contexts/AdminContext";
import { ModeratorProvider } from "./contexts/ModeratorContext";
import Layout from "./components/Layout";
import Popular from "./pages/Popular.jsx";
import HomePage from "./pages/HomePage.jsx";
import RecipeDetail from "./pages/RecipeDetail.jsx";
import Signup from "./components/Auth/Signup.jsx";
import AddRecipe from "./components/Recipe/AddRecipes.jsx";
import ProtectedRoute from "./components/ProtectedRoute"; // ← FIXED PATH
import Login from "./components/Auth/Login.jsx";
import SearchByIngredients from "./pages/SearchByIngredients.jsx";
import ModeratorDashboard from "./pages/ModeratorDashboard.jsx";
import SearchByCourseCuisine from "./pages/SearchByCourseCuisine.jsx";


function App() {
  return (
    <AuthProvider>
      <AdminProvider>
        <ModeratorProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/recipe/:id" element={<RecipeDetail />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/login" element={<Login />} />
              <Route path="/search-ingredients" element={<SearchByIngredients />} />
              <Route path="/search-course-cuisine" element={<SearchByCourseCuisine />} />
              <Route path="/moderator" element={<ModeratorDashboard />} />
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
          </Layout>
        </ModeratorProvider>
      </AdminProvider>
    </AuthProvider>
  );
}

export default App;