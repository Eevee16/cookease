import { createClient } from "@supabase/supabase-js";
import { createContext, useContext, useState, useEffect } from "react";

const supabaseUrl = "https://nrorypixaucxuoculxta.supabase.co";
const supabaseAnonKey = "YOUR_ANON_KEY_HERE"; // 🔒 Use anon key in frontend
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

  // Auth state listener
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

  // Fetch user profile only if logged in
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
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, email, role")
          .eq("id", user.id)
          .maybeSingle(); // ✅ changed from .single() to maybeSingle()

        if (error) throw error;

        setUserData(data || null);
        setRole(data?.role || null);
        setIsAdmin(data?.role === "admin");
        setIsModerator(data?.role === "moderator" || data?.role === "admin");
      } catch (err) {
        console.error("Error fetching profile:", err.message || err);
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
    setUser(null);
    setUserData(null);
    setRole(null);
    setIsAdmin(false);
    setIsModerator(false);
  };

  return (
    <RoleContext.Provider
      value={{ user, userData, role, isAdmin, isModerator, loading, logout }}
    >
      {children}
    </RoleContext.Provider>
  );
}
