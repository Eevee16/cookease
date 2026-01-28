// src/components/ProtectedRoute.js
import { Navigate, useLocation } from "react-router-dom";
import { useRoles } from "../contexts/RoleContext";

function ProtectedRoute({ children, requireAdmin = false, requireModerator = false }) {
  const { user, loading, isAdmin, isModerator } = useRoles();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (requireModerator && !isModerator) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
