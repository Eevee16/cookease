import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { supabase } from "./supabaseClient";
import { RoleProvider } from "./contexts/RoleContext";
import Layout from "./components/Layout";
import Popular from "./pages/Popular.jsx";
import LandingPage from "./pages/LandingPage";
import HomePage from "./pages/HomePage.jsx";
import RecipeDetail from "./pages/RecipeDetail.jsx";
import Signup from "./components/Auth/Signup.jsx";
import AddRecipe from "./components/Recipe/AddRecipes.jsx";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./components/Auth/Login.jsx";
import SearchByIngredients from "./pages/SearchByIngredients.jsx";
import ModeratorDashboard from "./pages/ModeratorDashboard.jsx";
import SearchByCourseCuisine from "./pages/SearchByCourseCuisine.jsx";
import ResetPassword from "./components/Auth/ResetPassword.jsx";
import Profile from "./pages/Profile.jsx";
import MyRecipes from "./pages/MyRecipes.jsx";
import SearchResults from "./pages/SearchResults";
import AdminDashboard from "./pages/AdminDashboard";
import AboutUs from "./pages/AboutUs";
import ContactUs from "./pages/ContactUs";
import AdminApproval from "./pages/AdminApproval";
import AdminStats from "./pages/AdminStats";
import UserPunishment from "./pages/UserPunishment";

function App() {
  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      console.log("Supabase session:", data);
      if (error) console.error("Supabase error:", error);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Auth state changed:", session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <RoleProvider>
      <Layout>
        <Routes>
          {/* ✅ Landing page is now the root */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/home" element={<HomePage />} />

          <Route path="/recipe/:id" element={<RecipeDetail />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/search-ingredients" element={<SearchByIngredients />} />
          <Route path="/search-course-cuisine" element={<SearchByCourseCuisine />} />
          <Route path="/moderator" element={<ModeratorDashboard />} />
          <Route path="/popular" element={<Popular />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/admin-approval" element={<AdminApproval />} />
          <Route path="/admin-stats" element={<AdminStats />} />
          <Route path="/admin-punishment" element={<UserPunishment />} />

          {/* Protected Routes */}
          <Route path="/add-recipe" element={<ProtectedRoute><AddRecipe /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/my-recipes" element={<ProtectedRoute><MyRecipes /></ProtectedRoute>} />
        </Routes>
      </Layout>
    </RoleProvider>
  );
}

export default App;