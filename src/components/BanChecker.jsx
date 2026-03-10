import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useRoles } from "../contexts/RoleContext";
import "../styles/BanPopup.css";

/**
 * BanChecker Component
 * 
 * Monitors user ban status and enforces restrictions:
 * - Permanent bans → immediate logout
 * - Temp bans → countdown timer + restricted access
 * - Auto-unban when temp ban expires
 */
function BanChecker() {
  const { user, userData } = useRoles();
  const navigate = useNavigate();
  const [banInfo, setBanInfo] = useState(null);
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!user) return;

    const checkBanStatus = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("status, ban_until, ban_reason")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Ban check error:", error);
          return;
        }

        // ✅ PERMANENT BAN - Logout immediately
        if (data.status === "banned") {
          setBanInfo({
            type: "permanent",
            reason: data.ban_reason || "Policy violation",
          });
          
          // Log out after showing message
          setTimeout(async () => {
            await supabase.auth.signOut();
            navigate("/");
            window.location.reload();
          }, 3000);
          return;
        }

        // ✅ TEMP BAN - Show countdown
        if (data.status === "tempbanned" && data.ban_until) {
          const banUntil = new Date(data.ban_until);
          const now = new Date();

          // Check if ban has expired
          if (now >= banUntil) {
            // Auto-unban
            await supabase
              .from("profiles")
              .update({ status: "active", ban_until: null, ban_reason: null })
              .eq("id", user.id);
            
            setBanInfo(null);
            return;
          }

          setBanInfo({
            type: "temporary",
            until: banUntil,
            reason: data.ban_reason || "Temporary suspension",
          });
        }
      } catch (err) {
        console.error("Ban status check failed:", err);
      }
    };

    // Check immediately
    checkBanStatus();

    // Check every 30 seconds
    const interval = setInterval(checkBanStatus, 30000);

    return () => clearInterval(interval);
  }, [user, navigate]);

  // ✅ Countdown timer for temp bans
  useEffect(() => {
    if (!banInfo || banInfo.type !== "temporary") return;

    const updateCountdown = () => {
      const now = new Date();
      const diff = banInfo.until - now;

      if (diff <= 0) {
        setTimeLeft("Ban expired - refreshing...");
        window.location.reload();
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [banInfo]);

  if (!banInfo) return null;

  return (
    <div className="ban-overlay">
      <div className="ban-popup">
        {banInfo.type === "permanent" ? (
          <>
            <div className="ban-icon permanent">🚫</div>
            <h2>Account Permanently Banned</h2>
            <p className="ban-reason">
              <strong>Reason:</strong> {banInfo.reason}
            </p>
            <p className="ban-message">
              Your account has been permanently suspended. You will be logged out in a moment.
            </p>
            <p className="ban-contact">
              If you believe this is a mistake, please contact support.
            </p>
          </>
        ) : (
          <>
            <div className="ban-icon temporary">⏱️</div>
            <h2>Account Temporarily Suspended</h2>
            <p className="ban-reason">
              <strong>Reason:</strong> {banInfo.reason}
            </p>
            <div className="ban-countdown">
              <span className="countdown-label">Time Remaining:</span>
              <span className="countdown-time">{timeLeft}</span>
            </div>
            <p className="ban-message">
              You can view recipes but cannot add or edit content during this period.
            </p>
            <p className="ban-until">
              Your access will be restored on{" "}
              <strong>
                {banInfo.until.toLocaleString("en-PH", {
                  dateStyle: "long",
                  timeStyle: "short",
                })}
              </strong>
            </p>
            <button
              className="ban-close-btn"
              onClick={() => setBanInfo(null)}
            >
              I Understand
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default BanChecker;