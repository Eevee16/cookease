import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useModerator } from '../contexts/ModeratorContext';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase/config';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import '../styles/ModeratorDashboard.css';

function ModeratorDashboard() {
  const { isModerator, loading: moderatorLoading } = useModerator();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pendingRecipes, setPendingRecipes] = useState([]);
  const [approvedRecipes, setApprovedRecipes] = useState([]);
  const [rejectedRecipes, setRejectedRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (!moderatorLoading && !isModerator) {
      alert('Access denied. Moderators only.');
      navigate('/');
    }
  }, [isModerator, moderatorLoading, navigate]);

  useEffect(() => {
    if (isModerator) {
      fetchRecipes();
    }
  }, [isModerator]);

  const fetchRecipes = async () => {
  setLoading(true);

  try {
    const snapshot = await getDocs(
      query(
        collection(db, 'recipes'),
        orderBy('createdAt', 'desc')
      )
    );

    const allRecipes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Treat missing status as "pending"
    const pending = allRecipes.filter(
      r => !r.status || r.status === 'pending'
    );
    const approved = allRecipes.filter(
      r => r.status === 'approved'
    );
    const rejected = allRecipes.filter(
      r => r.status === 'rejected'
    );

    setPendingRecipes(pending);
    setApprovedRecipes(approved);
    setRejectedRecipes(rejected);

  } catch (error) {
    console.error('Error fetching recipes:', error);
    alert('Failed to load recipes');
  } finally {
    setLoading(false);
  }
};


  const handleReject = async (recipeId) => {
    setSelectedRecipe(recipeId);
  };

  const confirmReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      await updateDoc(doc(db, 'recipes', selectedRecipe), {
        status: 'rejected',
        reviewedBy: user.uid,
        reviewedAt: serverTimestamp(),
        rejectionReason: rejectionReason
      });
      alert('Recipe rejected');
      setSelectedRecipe(null);
      setRejectionReason('');
      fetchRecipes();
    } catch (error) {
      console.error('Error rejecting recipe:', error);
      alert('Failed to reject recipe');
    }
  };

  const handleDelete = async (recipeId) => {
    if (!window.confirm('Permanently delete this recipe?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'recipes', recipeId));
      alert('Recipe deleted');
      fetchRecipes();
    } catch (error) {
      console.error('Error deleting recipe:', error);
      alert('Failed to delete recipe');
    }
  };

  if (moderatorLoading || loading) {
    return (
      <div className="moderator-dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isModerator) {
    return null;
  }

  const currentRecipes = 
    activeTab === 'pending' ? pendingRecipes :
    activeTab === 'approved' ? approvedRecipes :
    rejectedRecipes;

  return (
    <div className="moderator-dashboard">
      <header className="moderator-header">
        <div className="moderator-header-content">
          <h1>Moderator Dashboard</h1>
          <Link to="/" className="back-btn">← Back to Home</Link>
        </div>
      </header>

      <div className="moderator-main">
        {/* Stats Cards */}
        <div className="stats-cards">
          <div className="stat-card pending">
            <h3>Pending Review</h3>
            <p className="stat-number">{pendingRecipes.length}</p>
          </div>
          <div className="stat-card approved">
            <h3>Approved</h3>
            <p className="stat-number">{approvedRecipes.length}</p>
          </div>
          <div className="stat-card rejected">
            <h3>Rejected</h3>
            <p className="stat-number">{rejectedRecipes.length}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="moderator-tabs">
          <button
            className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending ({pendingRecipes.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'approved' ? 'active' : ''}`}
            onClick={() => setActiveTab('approved')}
          >
            Approved ({approvedRecipes.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'rejected' ? 'active' : ''}`}
            onClick={() => setActiveTab('rejected')}
          >
            Rejected ({rejectedRecipes.length})
          </button>
        </div>

        {/* Recipe List */}
        <div className="moderator-section">
          {currentRecipes.length === 0 ? (
            <div className="empty-state">
              <p>No {activeTab} recipes</p>
            </div>
          ) : (
            <div className="recipes-table">
              <table>
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Title</th>
                    <th>Owner</th>
                    <th>Submitted</th>
                    {activeTab === 'rejected' && <th>Reason</th>}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRecipes.map(recipe => (
                    <tr key={recipe.id}>
                      <td>
                        <img 
                          src={recipe.image || 'https://via.placeholder.com/100'} 
                          alt={recipe.title}
                          className="recipe-thumbnail"
                        />
                      </td>
                      <td className="recipe-title-cell">{recipe.title}</td>
                      <td>{recipe.ownerName || 'Unknown'}</td>
                      <td>
                        {recipe.createdAt?.toDate 
                          ? recipe.createdAt.toDate().toLocaleDateString() 
                          : 'N/A'}
                      </td>
                      {activeTab === 'rejected' && (
                        <td className="rejection-reason">
                          {recipe.rejectionReason || 'No reason provided'}
                        </td>
                      )}
                      <td className="action-buttons">
                        <Link 
                          to={`/recipe/${recipe.id}`} 
                          className="btn-view"
                          target="_blank"
                        >
                          View
                        </Link>
                        
                        {activeTab === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(recipe.id)}
                              className="btn-approve"
                            >
                              ✓ Approve
                            </button>
                            <button
                              onClick={() => handleReject(recipe.id)}
                              className="btn-reject"
                            >
                              ✕ Reject
                            </button>
                          </>
                        )}
                        
                        {activeTab === 'approved' && (
                          <button
                            onClick={() => handleReject(recipe.id)}
                            className="btn-reject"
                          >
                            Unpublish
                          </button>
                        )}

                        {activeTab === 'rejected' && (
                          <button
                            onClick={() => handleApprove(recipe.id)}
                            className="btn-approve"
                          >
                            Re-approve
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDelete(recipe.id)}
                          className="btn-delete"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Rejection Modal */}
      {selectedRecipe && (
        <div className="modal-overlay" onClick={() => setSelectedRecipe(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Reject Recipe</h3>
            <p>Please provide a reason for rejection:</p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Inappropriate content, unclear instructions, missing information..."
              rows="4"
            />
            <div className="modal-actions">
              <button onClick={() => setSelectedRecipe(null)} className="btn-cancel">
                Cancel
              </button>
              <button onClick={confirmReject} className="btn-confirm-reject">
                Reject Recipe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ModeratorDashboard;