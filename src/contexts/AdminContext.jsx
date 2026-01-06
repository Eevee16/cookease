import { createContext, useContext, useState, useEffect } from "react";
import {useAuth} from "./AuthContext";
import {doc , getDoc} from "firebase/firestore";
import { db } from "../firebase/config";

const AdminContext = createContext();

export function useAdmin() {
    const context = useContext(AdminContext);
    if (!context) {
        throw new Error ("useAdmin must be used within an AdminProvider");
    }
    return context;
}

export function AdminProvider({ children }) {
    const {user} = useAuth();
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        async function checkAdminStatus() {
            if (!user) {
                setIsAdmin(false);
                setUserData(null);
                setLoading(false);
                return;
            }

            try {
        console.log('Checking admin status for user:', user.uid);
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          console.log('User data:', data);
          setUserData(data);
          
          if (data.role === 'admin') {
            setIsAdmin(true);
            console.log('User is admin!');
          } else {
            setIsAdmin(false);
            console.log('User is not admin');
          }
        } else {
          console.log('No user document found');
          setIsAdmin(false);
          setUserData(null);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        setUserData(null);
      } finally {
        setLoading(false);
      }
    }

    checkAdminStatus();
  }, [user]);

  const value = {
    isAdmin,
    loading,
    userData
  };

    return (
        <AdminContext.Provider value={value}>
            {children}
        </AdminContext.Provider>
    )

}