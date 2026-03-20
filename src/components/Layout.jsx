import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  ArrowRightLeft, 
  LogOut, 
  Wallet,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFinance } from '../context/FinanceContext';

const Layout = ({ children }) => {
  const { logout, user } = useAuth();
  const { currency, setCurrency } = useFinance();
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = React.useState(window.innerWidth >= 1024);

  const currencies = ['$', '€', '£', '¥', '₹'];

  // Close sidebar on navigation for mobile
  React.useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [window.location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/' },
    { icon: <ArrowRightLeft size={20} />, label: 'Transactions', path: '/transactions' },
  ];

  return (
    <div className="layout-container" style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile Menu Button - Floats over top-left on small screens */}
      {window.innerWidth < 1024 && (
        <button 
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          style={{ 
            position: 'fixed', 
            top: '20px', 
            left: '20px', 
            zIndex: 200, 
            background: 'var(--accent-primary)', 
            color: '#fff', 
            padding: '10px', 
            borderRadius: '10px',
            boxShadow: '0 4px 15px var(--accent-primary-glow)'
          }}
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      )}

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ 
            width: isSidebarOpen ? 'var(--sidebar-width)' : '80px',
            translateX: (!isSidebarOpen && window.innerWidth < 1024) ? '-120%' : '0%'
        }}
        className="glass-panel"
        style={{ 
          height: 'calc(100vh - 40px)', 
          margin: '20px', 
          position: 'fixed', 
          zIndex: 150,
          border: '1px solid var(--border-glass)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'var(--accent-primary)', p: '8px', borderRadius: '8px' }}>
             <Wallet size={24} color="#fff" style={{ margin: '4px' }}/>
          </div>
          {isSidebarOpen && <span style={{ fontWeight: '700', fontSize: '22px' }}>My Finance Planner</span>}
        </div>

        <nav style={{ flex: 1, padding: '12px' }}>
          {menuItems.map((item) => (
            <NavLink 
              key={item.label}
              to={item.path}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '16px',
                borderRadius: '16px',
                marginBottom: '8px',
                textDecoration: 'none',
                color: isActive ? '#fff' : 'var(--text-secondary)',
                background: isActive ? 'var(--accent-primary)' : 'transparent',
                boxShadow: isActive ? '0 4px 15px var(--accent-primary-glow)' : 'none',
                transition: 'var(--transition-smooth)'
              })}
            >
              {item.icon}
              {isSidebarOpen && <span style={{ fontWeight: '500' }}>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '24px', borderTop: '1px solid var(--border-glass)' }}>
          <button 
            onClick={handleLogout}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px', 
              color: 'var(--accent-expense)',
              padding: '16px',
              width: '100%',
              borderRadius: '16px'
            }}
          >
            <LogOut size={20} />
            {isSidebarOpen && <span style={{ fontWeight: '600' }}>Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main style={{ 
        flex: 1, 
        marginLeft: isSidebarOpen ? 'calc(var(--sidebar-width) + 40px)' : '120px',
        padding: '40px',
        transition: 'var(--transition-smooth)'
      }}>
        <div className="flex-between" style={{ marginBottom: '40px' }}>
          <div>
            <h2 style={{ fontSize: '32px', fontWeight: '700' }}>
              Hello, {(user?.name || '').split(' ')[0].charAt(0).toUpperCase() + (user?.name || '').split(' ')[0].slice(1).toLowerCase() || 'User'} 👋
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>Welcome to your financial control center.</p>
          </div>
          
          <div className="flex-center" style={{ gap: '20px' }}>
             {/* Currency Switcher */}
             <div className="glass-card" style={{ padding: '4px 12px', borderRadius: '40px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Currency:</span>
                <select 
                  value={currency} 
                  onChange={(e) => setCurrency(e.target.value)}
                  style={{ 
                    background: 'transparent', 
                    border: 'none', 
                    padding: '4px 8px', 
                    fontSize: '14px', 
                    fontWeight: '700', 
                    color: '#fff',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                   {currencies.map(c => <option key={c} value={c} style={{ background: 'var(--bg-deep)' }}>{c}</option>)}
                </select>
             </div>

             <div className="glass-card" style={{ padding: '8px 16px', borderRadius: '40px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                 <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: '#fff', fontSize: '18px', fontWeight: '600' }} className="flex-center">
                     {user?.name?.charAt(0) || 'U'}
                 </div>
                <div style={{ display: 'none', md: 'block' }}>
                   <p style={{ fontSize: '14px', fontWeight: '600' }}>{user?.name}</p>
                   <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{user?.email}</p>
                </div>
             </div>
          </div>
        </div>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={window.location.pathname}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Layout;
