import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import RecipeDetail from "./pages/RecipeDetail.jsx";
import Signup from "./components/Auth/Signup.jsx";
import Login from './components/Auth/Login.jsx'; // if needed
import AddRecipe from "./components/Recipe/AddRecipes.jsx";
import ProtectedRoute from './components/ProtectedRoute.jsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route  path="/recipe/:id" element={<RecipeDetail />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route 
        path="/add-recipe" 
        element={
          <ProtectedRoute>
            <AddRecipe />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

export default App;
