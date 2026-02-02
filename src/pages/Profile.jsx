import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import "../styles/Profile.css";

function Profile() {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const user = supabase.auth.user();
      if (!user) return;
      setUserData({
        email: user.email,
        fullName: user.user_metadata?.full_name || "N/A",
      });
    };

    fetchUser();
  }, []);

  if (!userData) return <p>Loading profile...</p>;

  return (
    <div className="profile-page">
      <h1>My Profile</h1>
      <div className="profile-info">
        <p><strong>Full Name:</strong> {userData.fullName}</p>
        <p><strong>Email:</strong> {userData.email}</p>
      </div>
    </div>
  );
}

export default Profile;
