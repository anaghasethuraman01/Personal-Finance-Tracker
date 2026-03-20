import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const { login, signup, verifyEmail } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isVerifying) {
        await verifyEmail(email, otp);
        navigate('/');
        return;
      }

      if (isLogin) {
        // Manual Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Please enter a valid email address.');
            return;
        }
        await login(email, password);
        navigate('/');
      } else {
        const res = await signup(email, password, name);
        if (res?.requireVerification) {
            setIsVerifying(true);
        } else {
            navigate('/');
        }
      }
    } catch (err) {
      setError(err.message);
    }
  };

  if (isVerifying) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh', padding: '20px' }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel" style={{ width: '100%', maxWidth: '450px', padding: '40px' }}>
          <h2 style={{ marginBottom: '8px', fontSize: '24px' }}>Verify Email</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Enter the 6-digit code sent to <strong>{email}</strong></p>
          
          {error && <div style={{ background: 'rgba(244, 63, 94, 0.1)', color: 'var(--accent-expense)', padding: '12px', borderRadius: '12px', marginBottom: '20px', fontSize: '14px' }}>{error}</div>}

          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <input 
              type="text" 
              placeholder="000000" 
              maxLength={6}
              required 
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              style={{ width: '100%', textAlign: 'center', fontSize: '24px', letterSpacing: '8px', fontWeight: '700' }}
            />
            <button type="submit" className="flex-center" style={{ background: 'var(--accent-primary)', color: '#fff', padding: '14px', borderRadius: '12px', fontWeight: '600', boxShadow: '0 4px 20px var(--accent-primary-glow)' }}>
              Verify & Sign In
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-center" style={{ minHeight: '100vh', padding: '20px' }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel" 
        style={{ width: '100%', maxWidth: '450px', padding: '40px' }}
      >
        <div className="flex-center" style={{ marginBottom: '30px', gap: '12px' }}>
          <div style={{ padding: '12px', background: 'var(--accent-primary)', borderRadius: '12px' }}>
            <Wallet size={32} color="#fff" />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', letterSpacing: '-1px' }}>My Finance Planner</h1>
        </div>

        <h2 style={{ marginBottom: '8px', fontSize: '24px' }}>{isLogin ? 'Welcome back' : 'Create account'}</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
          {isLogin ? 'Enter your credentials to access your dashboard' : 'Start managing your finances beautifully'}
        </p>

        {error && (
          <div style={{ background: 'rgba(244, 63, 94, 0.1)', color: 'var(--accent-expense)', padding: '12px', borderRadius: '12px', marginBottom: '20px', fontSize: '14px', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {!isLogin && (
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '16px', top: '16px', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                placeholder="Full Name" 
                required 
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ width: '100%', paddingLeft: '48px' }}
              />
            </div>
          )}
          
          <div style={{ position: 'relative' }}>
            <Mail size={18} style={{ position: 'absolute', left: '16px', top: '16px', color: 'var(--text-secondary)' }} />
            <input 
              type="email" 
              placeholder="Email address" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', paddingLeft: '48px' }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '16px', top: '16px', color: 'var(--text-secondary)' }} />
            <input 
              type="password" 
              placeholder="Password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', paddingLeft: '48px' }}
            />
          </div>

          <button 
            type="submit" 
            style={{ 
              background: 'var(--accent-primary)', 
              color: '#fff', 
              padding: '14px', 
              borderRadius: '12px', 
              fontWeight: '600', 
              marginTop: '10px',
              boxShadow: '0 4px 20px var(--accent-primary-glow)'
            }}
          >
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p style={{ marginTop: '30px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            style={{ color: 'var(--accent-primary)', fontWeight: '600' }}
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;
