import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Search, Filter, Trash2, Edit2, Eye, Download, MoreVertical, TrendingUp, TrendingDown, ArrowRightLeft, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AddTransactionModal from '../components/AddTransactionModal';

const Transactions = () => {
  const { transactions, deleteTransaction, currency, convert } = useFinance();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedBill, setSelectedBill] = useState(null);
  const [editTransaction, setEditTransaction] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);

  const handleEdit = (transaction) => {
    setEditTransaction(transaction);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditTransaction(null);
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || t.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="flex-between">
        <h1 style={{ fontWeight: '700', fontSize: '28px' }}>Transaction History</h1>
      </div>

      {/* Filters & Search */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '14px', color: 'var(--text-secondary)' }} />
            <input 
                type="text" 
                placeholder="Search transactions..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', paddingLeft: '48px', height: '48px' }}
            />
        </div>

        <div style={{ display: 'flex', gap: '8px', background: 'rgba(255, 255, 255, 0.05)', padding: '4px', borderRadius: '12px' }}>
            {['all', 'income', 'expense'].map((type) => (
                <button 
                   key={type}
                   onClick={() => setFilterType(type)}
                   style={{ 
                       padding: '8px 16px', 
                       borderRadius: '8px', 
                       fontSize: '14px',
                       fontWeight: '600',
                       textTransform: 'capitalize',
                       background: filterType === type ? 'var(--accent-primary)' : 'transparent',
                       color: filterType === type ? '#fff' : 'var(--text-secondary)'
                   }}
                >
                    {type}
                </button>
            ))}
        </div>
      </div>

      {/* Transaction List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <AnimatePresence>
            {filteredTransactions.map((t, index) => (
                <motion.div 
                    key={t.id}
                    initial={{ opacity: 0, scale: 0.98, x: -10 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95, x: 10 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass-card flex-between" 
                    style={{ padding: '20px 32px' }}
                >
                    <div className="flex-center" style={{ gap: '24px' }}>
                        <div style={{ 
                            width: '48px', 
                            height: '48px', 
                            borderRadius: '16px', 
                            background: t.type === 'income' ? 'var(--accent-income-glow)' : 'var(--accent-expense-glow)',
                            color: t.type === 'income' ? 'var(--accent-income)' : 'var(--accent-expense)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {t.type === 'income' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                        </div>
                        <div>
                            <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>{t.title}</h4>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
                                <span>{t.category}</span>
                                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text-secondary)' }}></span>
                                <span>{new Date(t.date).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-center" style={{ gap: '40px' }}>
                        <div style={{ textAlign: 'right' }}>
                            <h3 style={{ 
                                fontSize: '20px', 
                                fontWeight: '700', 
                                color: t.type === 'income' ? 'var(--accent-income)' : 'var(--accent-expense)'
                            }}>
                                {t.type === 'income' ? '+' : '-'}{currency}{convert(t.amount, t.originalCurrency, currency).toFixed(2)}
                            </h3>
                            {t.originalCurrency !== currency && (
                                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                    Orig: {t.originalCurrency}{t.amount}
                                </p>
                            )}
                        </div>

                        <div className="flex-center" style={{ gap: '12px' }}>
                            {t.bill && (
                                <button 
                                    onClick={() => setSelectedBill(t.bill)}
                                    style={{ padding: '8px', color: 'var(--accent-primary)', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.1)' }}
                                    title="View Receipt"
                                >
                                    <Eye size={18} />
                                </button>
                            )}
                            <button 
                                onClick={() => handleEdit(t)}
                                style={{ padding: '8px', color: 'var(--accent-primary)', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.1)' }}
                                title="Edit"
                            >
                                <Edit2 size={18} />
                            </button>
                            <button 
                                onClick={() => deleteTransaction(t.id)}
                                style={{ padding: '8px', color: 'var(--accent-expense)', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.1)' }}
                                title="Delete"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            ))}
        </AnimatePresence>

        {filteredTransactions.length === 0 && (
            <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-secondary)' }}>
                <div style={{ marginBottom: '20px', opacity: 0.5 }}>
                    <ArrowRightLeft size={64} style={{ margin: '0 auto' }} />
                </div>
                <h3>No transactions found</h3>
                <p>Try adjusting your search or filters.</p>
            </div>
        )}
      </div>

      {/* Bill Viewer Modal */}
      {selectedBill && (
          <div 
            style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}
            onClick={() => setSelectedBill(null)}
          >
              <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
                  <button onClick={() => setSelectedBill(null)} style={{ position: 'absolute', top: '-40px', right: '0', color: '#fff' }}>
                      <X size={32} />
                  </button>
                  <img src={selectedBill} alt="Receipt" style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '12px', border: '1px solid var(--border-glass)' }} />
              </div>
          </div>
      )}

      <AddTransactionModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        editData={editTransaction} 
      />
    </div>
  );
};

export default Transactions;
