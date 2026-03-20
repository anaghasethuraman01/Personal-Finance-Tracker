import React, { useState, useEffect } from 'react';
import { X, Plus, Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { motion, AnimatePresence } from 'framer-motion';
import { insforge } from '../lib/insforge';

const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'];
const EXPENSE_CATEGORIES = ['Food', 'Shopping', 'Rent', 'Transport', 'Entertainment', 'Utilities', 'Health', 'Other'];

const AddTransactionModal = ({ isOpen, onClose, editData }) => {
  const { addTransaction, updateTransaction, currency, rates } = useFinance();
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    type: 'expense',
    category: 'Food',
    originalCurrency: currency,
    bill: '',
    image_key: ''
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editData) {
      setFormData({
        title: editData.title,
        amount: editData.amount,
        type: editData.type,
        category: editData.category,
        originalCurrency: editData.originalCurrency,
        bill: editData.bill || '',
        image_key: editData.image_key || ''
      });
    } else {
      setFormData({
        title: '',
        amount: '',
        type: 'expense',
        category: 'Food',
        originalCurrency: currency,
        bill: '',
        image_key: ''
      });
    }
  }, [editData, isOpen, currency]);

  // Update category when type changes if current category is invalid
  useEffect(() => {
    const categories = formData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    if (!categories.includes(formData.category)) {
      setFormData(prev => ({ ...prev, category: categories[0] }));
    }
  }, [formData.type]);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let billUrl = formData.bill;
      let billKey = formData.image_key;

      if (file) {
        setUploading(true);
        const { data: uploadData, error: uploadError } = await insforge.storage.from('receipts').uploadAuto(file);
        if (uploadError) throw uploadError;
        billUrl = insforge.storage.from('receipts').getPublicUrl(uploadData.path);
        billKey = uploadData.path;
        setUploading(false);
      }

      const submissionData = {
        ...formData,
        title: formData.category, // Use category as title
        bill: billUrl,
        image_key: billKey
      };

      if (editData) {
        await updateTransaction(editData.id, submissionData);
      } else {
        await addTransaction(submissionData);
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Failed to save transaction. Please try again.');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="flex-center" style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          background: 'rgba(0,0,0,0.8)', 
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          padding: '20px'
        }}>
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="glass-panel"
            style={{ 
              width: '100%', 
              maxWidth: '500px', 
              padding: '40px',
              position: 'relative'
            }}
          >
            <button 
              onClick={onClose}
              style={{ position: 'absolute', top: '24px', right: '24px', color: 'var(--text-secondary)' }}
            >
              <X size={24} />
            </button>

            <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '32px' }}>
              {editData ? 'Edit Transaction' : 'New Transaction'}
            </h2>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '4px' }}>
                {['income', 'expense'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({ ...formData, type })}
                    style={{ 
                      flex: 1,
                      padding: '12px', 
                      borderRadius: '8px', 
                      fontSize: '14px',
                      fontWeight: '600',
                      textTransform: 'capitalize',
                      background: formData.type === type ? 'var(--accent-primary)' : 'transparent',
                      color: formData.type === type ? '#fff' : 'var(--text-secondary)'
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '12px' }}>
                  <select 
                      value={formData.originalCurrency}
                      onChange={(e) => setFormData({ ...formData, originalCurrency: e.target.value })}
                      style={{ background: 'rgba(255, 255, 255, 0.05)', fontSize: '18px', fontWeight: '600' }}
                  >
                      {Object.keys(rates).map(cur => <option key={cur} value={cur}>{cur}</option>)}
                  </select>
                  <input 
                      type="number" 
                      placeholder="0.00" 
                      step="0.01"
                      required 
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      style={{ fontSize: '24px', fontWeight: '700' }}
                  />
              </div>

              <select 
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {(formData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <div style={{ position: 'relative' }}>
                <input 
                  type="file" 
                  id="receipt-upload"
                  onChange={handleFileChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                <label 
                  htmlFor="receipt-upload"
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '32px',
                    border: '2px dashed var(--border-glass)',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    transition: 'var(--transition-smooth)',
                    background: file ? 'rgba(99, 102, 241, 0.1)' : 'transparent'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-glass)'}
                >
                  {file ? (
                    <>
                      <ImageIcon size={32} color="var(--accent-primary)" />
                      <span style={{ fontSize: '14px', fontWeight: '600' }}>{file.name}</span>
                    </>
                  ) : (
                    <>
                      <Upload size={32} color="var(--text-secondary)" />
                      <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Upload Receipt (Optional)</span>
                    </>
                  )}
                </label>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                style={{ 
                  background: 'var(--accent-primary)', 
                  color: '#fff', 
                  padding: '18px', 
                  borderRadius: '16px', 
                  fontWeight: '700', 
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  boxShadow: '0 4px 20px var(--accent-primary-glow)',
                  marginTop: '12px'
                }}
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <Plus size={20} />
                    {editData ? 'Save Changes' : 'Add Transaction'}
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddTransactionModal;
