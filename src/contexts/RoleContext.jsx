import { createClient } from "@supabase/supabase-js";
import { createContext, useContext, useState, useEffect } from "react";

const supabaseUrl = "https://nrorypixaucxuoculxta.supabase.co"; // 🔒 Use your Supabase URL
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yb3J5cGl4YXVjeHVvY3VseHRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0ODgxOTcsImV4cCI6MjA4NTA2NDE5N30.BW-Nh1AX2vqdg8OdsVEenl3f4eJ1s3iQC4C64pIC7z8"; // 🔒 Use anon key in frontend
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const RoleContext = createContext();

export function useRoles() {
  const context = useContext(RoleContext);
  if (!context) throw new Error("useRoles must be used within a RoleProvider");
  return context;
}

export function RoleProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [role, setRole] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [fullName, setFullName] = useState(""); // ✅ added

  useEffect(() => {
    const getSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) console.error(error);
      setUser(session?.user ?? null);
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setUserData(null);
      setRole(null);
      setIsAdmin(false);
      setIsModerator(false);
      setFullName(""); // ✅
      setLoading(false);
      return;
    }

    const fetchUserData = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, email, role, first_name, last_name") // ✅ added
          .eq("id", user.id)
          .maybeSingle();

        if (error) throw error;

        setUserData(data || null);
        setRole(data?.role || null);
        setIsAdmin(data?.role === "admin");
        setIsModerator(data?.role === "moderator" || data?.role === "admin");

        // ✅ Build full name
        const fn = data?.first_name || "";
        const ln = data?.last_name || "";
        setFullName([fn, ln].filter(Boolean).join(" ") || user.email || "");

      } catch (err) {
        console.error("Error fetching profile:", err.message || err);
        setUserData(null);
        setRole(null);
        setIsAdmin(false);
        setIsModerator(false);
        setFullName(user.email || "");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserData(null);
    setRole(null);
    setIsAdmin(false);
    setIsModerator(false);
    setFullName(""); // ✅
  };

  return (
    <RoleContext.Provider
      value={{ user, userData, role, isAdmin, isModerator, loading, logout, fullName }} // ✅ exposed
    >
      {children}
    </RoleContext.Provider>
  );
}