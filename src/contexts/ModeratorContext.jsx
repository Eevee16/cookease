import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../supabaseClient'; // adjust path if needed

const ModeratorContext = createContext();

export function useModerator() {
  const context = useContext(ModeratorContext);
  if (!context) {
    throw new Error('useModerator must be used within ModeratorProvider');
  }
  return context;
}

export function ModeratorProvider({ children }) {
  const { user } = useAuth();
  const [isModerator, setIsModerator] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkModeratorStatus() {
      if (!user) {
        setIsModerator(false);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        console.log('Checking moderator/admin status for user:', user.id);

        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (data) {
          const role = data.role;
          setIsAdmin(role === 'admin');
          setIsModerator(role === 'moderator' || role === 'admin');
          console.log('User role:', role);
        } else {
          setIsModerator(false);
          setIsAdmin(false);
        }
      } catch (err) {
        console.error('Error checking moderator status:', err);
        setIsModerator(false);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    }

    checkModeratorStatus();
  }, [user]);

  const value = {
    isModerator,
    isAdmin,
    loading,
  };

  return (
    <ModeratorContext.Provider value={value}>
      {children}
    </ModeratorContext.Provider>
  );
}
