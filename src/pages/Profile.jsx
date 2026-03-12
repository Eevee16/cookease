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
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState("recipes");
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    name: "",
    photo_url: ""
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkAuthAndLoadData = async () => {
      try {
        console.log("🔍 Checking authentication...");
        
        // First, try to get the session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        console.log("📦 Session data:", session ? "Session found" : "No session");
        console.log("❌ Session error:", sessionError);

        if (!isMounted) return;

        // If there's a session, we're good to go
        if (session && session.user) {
          console.log("✅ User authenticated:", session.user.email);
          setUserData(session.user);
          await fetchUserData();
          setAuthChecked(true);
        } else {
          // No session - but let's double check with getUser
          console.log("🔄 No session, trying getUser...");
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          console.log("👤 User data:", user ? user.email : "No user");
          console.log("❌ User error:", userError);

          if (!isMounted) return;

          if (user) {
            console.log("✅ User found via getUser:", user.email);
            setUserData(user);
            await fetchUserData();
            setAuthChecked(true);
          } else {
            console.log("🚪 No user found, redirecting to login...");
            setAuthChecked(true);
            setLoading(false);
            navigate("/login");
          }
        }
      } catch (error) {
        console.error("💥 Auth check error:", error);
        if (isMounted) {
          setAuthChecked(true);
          setLoading(false);
          navigate("/login");
        }
      }
    };

    checkAuthAndLoadData();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔔 Auth state changed:", event);
      
      if (!isMounted) return;
      
      if (event === 'SIGNED_OUT') {
        console.log("👋 User signed out");
        navigate("/login");
      } else if (event === 'SIGNED_IN' && session) {
        console.log("👋 User signed in:", session.user.email);
        setUserData(session.user);
        await fetchUserData();
      }
    });

    return () => {
      console.log("🧹 Cleaning up auth subscription");
      isMounted = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error("Not logged in:", userError);
        setLoading(false);
        return;
      }

      setUserData(user);

      // Get profile data. use maybeSingle so that absence of a row
      // doesn't throw an error – we simply end up with `null`.
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
      } else {
        // `profile` will be `null` if the user hasn't created one yet.
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

  const openEditModal = () => {
    // Pre-fill form with existing profile data or empty strings
    setEditForm({
      first_name: profileData?.first_name || "",
      last_name: profileData?.last_name || "",
      name: profileData?.name || "",
      photo_url: profileData?.photo_url || ""
    });
    setShowEditModal(true);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (!userData?.id) {
        alert("User not found. Please log in again.");
        return;
      }

      const profilePayload = {
        id: userData.id,
        first_name: editForm.first_name.trim(),
        last_name: editForm.last_name.trim(),
        name: editForm.name.trim(),
        photo_url: editForm.photo_url.trim(),
        updated_at: new Date().toISOString()
      };

      // Check if profile exists
      if (profileData) {
        // Update existing profile
        const { error } = await supabase
          .from("profiles")
          .update(profilePayload)
          .eq("id", userData.id);

        if (error) throw error;
      } else {
        // Create new profile
        const { error } = await supabase
          .from("profiles")
          .insert([profilePayload]);

        if (error) throw error;
      }

      // Refresh profile data
      await fetchUserData();
      setShowEditModal(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      if (!userData?.id) {
        alert("User not found. Please log in again.");
        return;
      }

      // Create unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${userData.id}-${Date.now()}.${fileExt}`;
      const filePath = `profile-pictures/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      // Update profile with new photo URL
      const profilePayload = {
        id: userData.id,
        photo_url: publicUrl,
        updated_at: new Date().toISOString()
      };

      if (profileData) {
        // Update existing profile
        const { error } = await supabase
          .from("profiles")
          .update(profilePayload)
          .eq("id", userData.id);

        if (error) throw error;
      } else {
        // Create new profile with photo
        const { error } = await supabase
          .from("profiles")
          .insert([profilePayload]);

        if (error) throw error;
      }

      // Refresh profile data
      await fetchUserData();
      alert("Profile picture updated successfully!");
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const filteredRecipes = activeTab === "recipes" 
    ? userRecipes 
    : userRecipes.filter(r => r.status === activeTab);

  if (!authChecked || loading) {
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

  const displayName = profileData
    ? profileData.name ||
      `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim()
    : userData.email?.split('@')[0] ||
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
          <input
            type="file"
            id="avatar-upload"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />
          <button 
            className="edit-avatar-btn" 
            onClick={() => document.getElementById('avatar-upload').click()}
            title="Change profile picture"
            disabled={uploading}
          >
            {uploading ? '⏳' : '📷'}
          </button>
        </div>

        <div className="profile-info">
          <h1 className="profile-name">{displayName}</h1>
          <p className="profile-email">{userData.email}</p>
          
          <div className="profile-badges">
            {profileData ? (
              profileData.role && (
                <span className={`role-badge ${profileData.role}`}>
                  {profileData.role === 'moderator' ? '⭐ Moderator' : '👤 User'}
                </span>
              )
            ) : (
              <span className="no-profile-badge">
                You haven't set up a profile yet.
              </span>
            )}
          </div>
          
          <div className="profile-actions">
            <button onClick={openEditModal} className="edit-profile-btn">
              ✏️ Edit Profile
            </button>
          </div>
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

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Profile</h2>
              <button 
                className="modal-close" 
                onClick={() => setShowEditModal(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="edit-profile-form">
              <div className="form-group">
                <label htmlFor="first_name">First Name</label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={editForm.first_name}
                  onChange={handleEditFormChange}
                  placeholder="Enter your first name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="last_name">Last Name</label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={editForm.last_name}
                  onChange={handleEditFormChange}
                  placeholder="Enter your last name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="name">Display Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={editForm.name}
                  onChange={handleEditFormChange}
                  placeholder="How you want to be called"
                />
                <small className="form-help">
                  This will be shown instead of your first and last name
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="photo_url">Profile Photo URL (Optional)</label>
                <input
                  type="url"
                  id="photo_url"
                  name="photo_url"
                  value={editForm.photo_url}
                  onChange={handleEditFormChange}
                  placeholder="https://example.com/photo.jpg"
                />
                <small className="form-help">
                  Enter a URL or use the camera button on your avatar to upload
                </small>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn-cancel"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-save"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;