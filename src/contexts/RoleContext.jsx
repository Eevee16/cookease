import { createClient } from "@supabase/supabase-js";
import { createContext, useContext, useState, useEffect } from "react";

const supabaseUrl = "https://nrorypixaucxuoculxta.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yb3J5cGl4YXVjeHVvY3VseHRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0ODgxOTcsImV4cCI6MjA4NTA2NDE5N30.BW-Nh1AX2vqdg8OdsVEenl3f4eJ1s3iQC4C64pIC7z8";
const supabase = createClient(supabaseUrl, supabaseKey);

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

  // Handle authentication state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch user role data
  useEffect(() => {
    if (!user) {
      setUserData(null);
      setRole(null);
      setIsAdmin(false);
      setIsModerator(false);
      setLoading(false);
      return;
    }

    const fetchUserData = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("profiles")
          .select("id, email, role")
          .eq("id", user.id)
          .single();
        if (error) throw error;
        setUserData(data);
        setRole(data.role);
        setIsAdmin(data.role === "admin");
        setIsModerator(data.role === "moderator" || data.role === "admin");
      } catch (err) {
        console.error(err);
        setUserData(null);
        setRole(null);
        setIsAdmin(false);
        setIsModerator(false);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const logout = async () => {
    await supabase.auth.signOut();
    setUserData(null);
    setRole(null);
    setIsAdmin(false);
    setIsModerator(false);
  };

  const session = user ? { user } : null;

  return (
    <RoleContext.Provider
      value={{ user, session, userData, role, isAdmin, isModerator, loading, logout }}
    >
      {children}
    </RoleContext.Provider>
  );
}