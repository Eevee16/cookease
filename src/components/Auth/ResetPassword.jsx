import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient"; // make sure this points to the correct client

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Supabase reset token from query string
  const accessToken = searchParams.get("access_token");

  useEffect(() => {
    if (!accessToken) {
      setMessage("Invalid or expired reset link.");
    }
  }, [accessToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newPassword || newPassword !== confirmPassword) {
      setMessage("Passwords do not match!");
      return;
    }

    setLoading(true);

    try {
      // Update user password using Supabase auth API
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      }, {
        // Pass the access_token from the URL
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (error) throw error;

      setMessage("Password successfully updated! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      console.error("Reset password error:", err);
      setMessage(err.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!accessToken) {
    return (
      <div className="reset-password-page">
        <h2>Reset Password</h2>
        <p>{message}</p>
      </div>
    );
  }

  return (
    <div className="reset-password-page">
      <h2>Reset Your Password</h2>
      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Updating..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
}

export default ResetPassword;
