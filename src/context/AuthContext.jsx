import React, { createContext, useContext, useState, useEffect } from 'react';
import { insforge } from '../lib/insforge';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data, error } = await insforge.auth.getCurrentUser();
        if (data?.user) {
          setUser({
            id: data.user.id,
            name: data.user.profile?.name || data.user.email,
            email: data.user.email
          });
        }
      } catch (err) {
        console.error('Auth init error:', err);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const signup = async (email, password, name) => {
    const { data, error } = await insforge.auth.signUp({
      email,
      password,
      name
    });

    if (error) throw error;

    if (data?.requireEmailVerification) {
        return { requireVerification: true, email };
    }

    if (data?.user) {
        const sessionUser = { 
            id: data.user.id, 
            name: data.user.profile?.name || data.user.email, 
            email: data.user.email 
        };
        setUser(sessionUser);
    }
  };

  const verifyEmail = async (email, otp) => {
    const { data, error } = await insforge.auth.verifyEmail({ email, otp });
    if (error) throw error;
    
    if (data?.user) {
        const sessionUser = { 
            id: data.user.id, 
            name: data.user.profile?.name || data.user.email, 
            email: data.user.email 
        };
        setUser(sessionUser);
    }
  };

  const login = async (email, password) => {
    const { data, error } = await insforge.auth.signInWithPassword({ email, password });
    
    if (error) throw error;

    if (data?.user) {
        const sessionUser = { 
            id: data.user.id, 
            name: data.user.profile?.name || data.user.email, 
            email: data.user.email 
        };
        setUser(sessionUser);
    }
  };

  const logout = async () => {
    const { error } = await insforge.auth.signOut();
    if (!error) setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, signup, verifyEmail, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
