import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "../styles/Profile.css";

function Profile() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [userRecipes, setUserRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("recipes");
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error("Not logged in:", userError);
        navigate("/login");
        return;
      }

      setUserData(user);

      // Get profile data
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
      } else {
        setProfileData(profile);
      }

      // Get user's recipes
      const { data: recipes, error: recipesError } = await supabase
        .from("recipes")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (recipesError) {
        console.error("Error fetching recipes:", recipesError);
      } else {
        setUserRecipes(recipes || []);
        
        // Calculate stats
        const total = recipes?.length || 0;
        const approved = recipes?.filter(r => r.status === "approved").length || 0;
        const pending = recipes?.filter(r => r.status === "pending").length || 0;
        const rejected = recipes?.filter(r => r.status === "rejected").length || 0;
        
        setStats({ total, approved, pending, rejected });
      }
    } catch (err) {
      console.error("Error loading profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      await supabase.auth.signOut();
      navigate("/login");
    }
  };

  const filteredRecipes = activeTab === "recipes" 
    ? userRecipes 
    : userRecipes.filter(r => r.status === activeTab);

  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="profile-page">
        <p>Please log in to view your profile.</p>
      </div>
    );
  }

  const displayName = profileData?.name || 
                      `${profileData?.first_name || ''} ${profileData?.last_name || ''}`.trim() ||
                      userData.email?.split('@')[0] || 
                      "User";

  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="profile-page">
      {/* Header Section */}
      <div className="profile-header">
        <Link to="/" className="back-link">← Back to Home</Link>
        <button onClick={handleSignOut} className="sign-out-btn">
          Sign Out
        </button>
      </div>

      {/* Profile Card */}
      <div className="profile-card">
        <div className="profile-avatar-section">
          {profileData?.photo_url ? (
            <img 
              src={profileData.photo_url} 
              alt={displayName}
              className="profile-avatar"
            />
          ) : (
            <div className="profile-avatar-placeholder">
              {initials}
            </div>
          )}
          <button className="edit-avatar-btn" title="Change avatar">
            📷
          </button>
        </div>

        <div className="profile-info">
          <h1 className="profile-name">{displayName}</h1>
          <p className="profile-email">{userData.email}</p>
          {profileData?.role && (
            <span className={`role-badge ${profileData.role}`}>
              {profileData.role === 'moderator' ? '⭐ Moderator' : '👤 User'}
            </span>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <p className="stat-number">{stats.total}</p>
            <p className="stat-label">Total Recipes</p>
          </div>
        </div>

        <div className="stat-card approved">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <p className="stat-number">{stats.approved}</p>
            <p className="stat-label">Approved</p>
          </div>
        </div>

        <div className="stat-card pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <p className="stat-number">{stats.pending}</p>
            <p className="stat-label">Pending</p>
          </div>
        </div>

        <div className="stat-card rejected">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <p className="stat-number">{stats.rejected}</p>
            <p className="stat-label">Rejected</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <Link to="/add-recipe" className="action-btn primary">
          <span>➕</span> Add New Recipe
        </Link>
        {profileData?.role === 'moderator' && (
          <Link to="/moderator" className="action-btn secondary">
            <span>⭐</span> Moderator Dashboard
          </Link>
        )}
      </div>

      {/* Recipes Section */}
      <div className="recipes-section">
        <h2 className="section-title">My Recipes</h2>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button 
            className={`tab-btn ${activeTab === "recipes" ? "active" : ""}`}
            onClick={() => setActiveTab("recipes")}
          >
            All ({stats.total})
          </button>
          <button 
            className={`tab-btn ${activeTab === "approved" ? "active" : ""}`}
            onClick={() => setActiveTab("approved")}
          >
            Approved ({stats.approved})
          </button>
          <button 
            className={`tab-btn ${activeTab === "pending" ? "active" : ""}`}
            onClick={() => setActiveTab("pending")}
          >
            Pending ({stats.pending})
          </button>
          {stats.rejected > 0 && (
            <button 
              className={`tab-btn ${activeTab === "rejected" ? "active" : ""}`}
              onClick={() => setActiveTab("rejected")}
            >
              Rejected ({stats.rejected})
            </button>
          )}
        </div>

        {/* Recipes Grid */}
        {filteredRecipes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🍳</div>
            <p className="empty-message">No {activeTab === "recipes" ? "" : activeTab} recipes yet</p>
            {activeTab === "recipes" && (
              <Link to="/add-recipe" className="empty-action-btn">
                Create Your First Recipe
              </Link>
            )}
          </div>
        ) : (
          <div className="recipes-grid">
            {filteredRecipes.map(recipe => (
              <div key={recipe.id} className="recipe-card">
                <Link to={`/recipe/${recipe.id}`} className="recipe-link">
                  <div className="recipe-image-container">
                    <img 
                      src={recipe.image_url || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect width='300' height='200' fill='%23e0e0e0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='18' fill='%23999'%3ENo Image%3C/text%3E%3C/svg%3E"} 
                      alt={recipe.title}
                      className="recipe-image"
                      loading="lazy"
                    />
                    <div className={`status-badge ${recipe.status || 'pending'}`}>
                      {recipe.status === 'approved' ? '✓ Approved' : 
                       recipe.status === 'rejected' ? '✗ Rejected' : 
                       '⏳ Pending'}
                    </div>
                  </div>

                  <div className="recipe-info">
                    <h3 className="recipe-title">{recipe.title}</h3>
                    <div className="recipe-meta">
                      <span>{recipe.category || 'Uncategorized'}</span>
                      {recipe.cuisine && (
                        <>
                          <span className="separator">•</span>
                          <span>{recipe.cuisine}</span>
                        </>
                      )}
                    </div>
                    
                    {recipe.status === 'rejected' && recipe.rejection_reason && (
                      <div className="rejection-notice">
                        <strong>Reason:</strong> {recipe.rejection_reason}
                      </div>
                    )}

                    <div className="recipe-footer">
                      <span className="recipe-date">
                        {new Date(recipe.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                      {recipe.rating > 0 && (
                        <span className="recipe-rating">
                          ★ {recipe.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
