import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  const accessToken = searchParams.get("access_token");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newPassword || newPassword !== confirmPassword) {
      setMessage("Passwords do not match!");
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      }, accessToken);

      if (error) throw error;

      setMessage("Password successfully updated!");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setMessage(err.message);
    }
  };

  if (!accessToken) {
    return <p>Invalid or expired reset link.</p>;
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
        <button type="submit">Reset Password</button>
      </form>
    </div>
  );
}

export default ResetPassword;
