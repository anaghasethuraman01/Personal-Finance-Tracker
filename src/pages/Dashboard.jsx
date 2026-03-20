import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { TrendingUp, TrendingDown, DollarSign, Wallet, ChartPie as PieChartIcon, Plus } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import AddTransactionModal from '../components/AddTransactionModal';
import { motion } from 'framer-motion';

const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#ec4899'];

const Dashboard = () => {
  const { stats, transactions, currency, convert } = useFinance();
  const [isModalOpen, setModalOpen] = useState(false);

  const statCards = [
    { 
      label: 'Monthly Savings', 
      value: `${currency}${stats.monthlySavings}`, 
      icon: <Wallet size={24} />, 
      color: 'var(--accent-primary)',
      glow: 'var(--accent-primary-glow)'
    },
    { 
      label: 'Total Income', 
      value: `${currency}${stats.totalIncome}`, 
      icon: <TrendingUp size={24} />, 
      color: 'var(--accent-income)',
      glow: 'var(--accent-income-glow)'
    },
    { 
      label: 'Total Expenses', 
      value: `${currency}${stats.totalExpense}`, 
      icon: <TrendingDown size={24} />, 
      color: 'var(--accent-expense)',
      glow: 'var(--accent-expense-glow)'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="flex-between">
         <h1 style={{ fontWeight: '700', fontSize: '28px' }}>Dashboard Overview</h1>
         <button 
           onClick={() => setModalOpen(true)}
           style={{ 
             background: 'var(--accent-primary)', 
             color: '#fff', 
             padding: '12px 24px', 
             borderRadius: '12px', 
             fontWeight: '600', 
             display: 'flex', 
             alignItems: 'center', 
             gap: '8px',
             boxShadow: '0 4px 20px var(--accent-primary-glow)'
           }}
         >
           <Plus size={20} />
           Add Transaction
         </button>
      </div>

      {/* Stat Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '24px' 
      }}>
        {statCards.map((card, index) => (
          <motion.div 
            key={card.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '20px',
              borderLeft: `4px solid ${card.color}`
            }}
          >
            <div style={{ 
              padding: '16px', 
              borderRadius: '16px', 
              background: card.glow, 
              color: card.color 
            }}>
              {card.icon}
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '4px' }}>{card.label}</p>
              <h3 style={{ fontSize: '28px', fontWeight: '700' }}>{card.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
        gap: '32px' 
      }}>
        {/* Pie Chart Section */}
        <div className="glass-panel" style={{ padding: '32px', minHeight: '400px' }}>
            <div className="flex-between" style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <PieChartIcon size={20} color="var(--accent-primary)" />
                    Expense Distribution
                </h3>
            </div>
            
            {stats.pieChartData.length > 0 ? (
                <div style={{ width: '100%', height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                    <Pie
                        data={stats.pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        animationDuration={1500}
                    >
                        {stats.pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip 
                        contentStyle={{ 
                        background: 'rgba(10, 11, 16, 0.9)', 
                        border: '1px solid var(--border-glass)', 
                        borderRadius: '12px',
                        color: '#fff' 
                        }} 
                    />
                    <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                </ResponsiveContainer>
                </div>
            ) : (
                <div style={{ height: '300px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>No expense data to display yet.</p>
                </div>
            )}
        </div>

        {/* Recent Transactions */}
        <div className="glass-panel" style={{ padding: '32px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px' }}>Recent Activity</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {transactions.slice(0, 5).map((t) => (
                    <div key={t.id} className="flex-between" style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '16px', border: '1px solid var(--border-glass)' }}>
                        <div className="flex-center" style={{ gap: '16px' }}>
                            <div style={{ 
                                padding: '10px', 
                                borderRadius: '12px', 
                                background: t.type === 'income' ? 'var(--accent-income-glow)' : 'var(--accent-expense-glow)',
                                color: t.type === 'income' ? 'var(--accent-income)' : 'var(--accent-expense)'
                            }}>
                                {t.type === 'income' ? <TrendingUp size={18}/> : <TrendingDown size={18}/>}
                            </div>
                            <div>
                                <h4 style={{ fontSize: '15px', fontWeight: '600' }}>{t.title}</h4>
                                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{t.category} • {new Date(t.date).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <h4 style={{ 
                            fontWeight: '700', 
                            color: t.type === 'income' ? 'var(--accent-income)' : 'var(--accent-expense)' 
                        }}>
                            {t.type === 'income' ? '+' : '-'}{currency}{convert(t.amount, t.originalCurrency, currency).toFixed(2)}
                        </h4>
                    </div>
                ))}
            </div>
            {transactions.length === 0 && (
                 <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    Start by adding your first transaction!
                 </div>
            )}
        </div>
      </div>

      <AddTransactionModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
};

export default Dashboard;
