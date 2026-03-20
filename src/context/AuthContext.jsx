import React, { createContext, useContext, useState, useEffect } from 'react';
import { insforge } from '../lib/insforge';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const initAuth = async () => {
      // Add a fail-safe timeout (5 seconds)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth Timeout')), 5000)
      );

      try {
        const authPromise = insforge.auth.getCurrentUser();
        const { data } = await Promise.race([authPromise, timeoutPromise]);
        
        if (active && data?.user) {
          setUser({
            id: data.user.id,
            name: data.user.profile?.name || data.user.email,
            email: data.user.email
          });
        }
      } catch (err) {
        console.warn('Auth initialization stalled or failed:', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    initAuth();
    return () => { active = false; };
  }, []);

  const signup = async (email, password, name) => {
    const { data, error } = await insforge.auth.signUp({ email, password, name });
    if (error) throw error;
    if (data?.requireEmailVerification) return { requireVerification: true, email };
    if (data?.user) setUser({ id: data.user.id, name: data.user.profile?.name || data.user.email, email: data.user.email });
  };

  const verifyEmail = async (email, otp) => {
    const { data, error } = await insforge.auth.verifyEmail({ email, otp });
    if (error) throw error;
    if (data?.user) setUser({ id: data.user.id, name: data.user.profile?.name || data.user.email, email: data.user.email });
  };

  const login = async (email, password) => {
    const { data, error } = await insforge.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data?.user) setUser({ id: data.user.id, name: data.user.profile?.name || data.user.email, email: data.user.email });
  };

  const logout = async () => {
    const { error } = await insforge.auth.signOut();
    if (!error) setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, signup, verifyEmail, login, logout, loading }}>
        {loading ? (
          <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0b10', color: '#6366f1' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px' }}>My Finance Planner</div>
              <div style={{ fontSize: '14px', opacity: 0.7 }}>Preparing your command center...</div>
            </div>
          </div>
        ) : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
