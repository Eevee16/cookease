import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import "../../styles/ResetPassword.css";

function ResetPassword() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    // Supabase automatically handles the hash fragment and creates a session
    // We just need to wait for it to process
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setIsRecovery(true);
      } else {
        setMessage("Invalid or expired reset link. Please request a new one.");
      }
    };

    // Give Supabase a moment to process the hash fragment
    setTimeout(checkSession, 100);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newPassword || newPassword !== confirmPassword) {
      setMessage("Passwords do not match!");
      return;
    }

    if (newPassword.length < 6) {
      setMessage("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setMessage("Password successfully updated! Redirecting to login...");
      
      // Sign out the user after password reset
      await supabase.auth.signOut();
      
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      console.error("Reset password error:", err);
      setMessage(err.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isRecovery && !message) {
    return (
      <div className="reset-password-page">
        <h2>Reset Password</h2>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isRecovery) {
    return (
      <div className="reset-password-page">
        <h2>Reset Password</h2>
        <p className="error">{message}</p>
        <button onClick={() => navigate("/forgot-password")}>Request New Reset Link</button>
      </div>
    );
  }

  return (
    <div className="reset-password-page">
      <h2>Reset Your Password</h2>
      {message && <p className={message.includes("success") ? "success" : "error"}>{message}</p>}
      <form onSubmit={handleSubmit}>
        <div className="password-input-wrapper">
          <input
            type={showNewPassword ? "text" : "password"}
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
          />
          <button
            type="button"
            className="toggle-password"
            onClick={() => setShowNewPassword(!showNewPassword)}
            aria-label="Toggle password visibility"
          >
            {showNewPassword ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            )}
          </button>
        </div>
        
        <div className="password-input-wrapper">
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
          />
          <button
            type="button"
            className="toggle-password"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            aria-label="Toggle password visibility"
          >
            {showConfirmPassword ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            )}
          </button>
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? "Updating..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
}

export default ResetPassword;