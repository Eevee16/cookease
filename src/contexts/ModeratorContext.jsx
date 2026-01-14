import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

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
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          const role = data.role;
          
          setIsAdmin(role === 'admin');
          setIsModerator(role === 'moderator' || role === 'admin');
        } else {
          setIsModerator(false);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error checking moderator status:', error);
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
    loading
  };

  return (
    <ModeratorContext.Provider value={value}>
      {children}
    </ModeratorContext.Provider>
  );
}