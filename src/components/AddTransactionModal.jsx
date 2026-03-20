import React, { useState, useEffect } from 'react';
import { X, Plus, Upload, Loader2, Image as ImageIcon, Sparkles, AlertCircle, Trash2 } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { motion, AnimatePresence } from 'framer-motion';
import { insforge } from '../lib/insforge';

const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'];
const EXPENSE_CATEGORIES = ['Food', 'Shopping', 'Rent', 'Transport', 'Entertainment', 'Utilities', 'Health', 'Other'];

const AddTransactionModal = ({ isOpen, onClose, editData }) => {
    const { addTransaction, updateTransaction, currency, rates, CURRENCY_SYMBOLS } = useFinance();
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    type: 'expense',
    category: '', 
    originalCurrency: currency,
    bill: '',
    image_key: ''
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scanError, setScanError] = useState(false);

  useEffect(() => {
    if (isOpen) {
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
                category: '', 
                originalCurrency: currency,
                bill: '',
                image_key: ''
            });
        }
        setScanError(false);
        setFile(null);
    }
  }, [editData, isOpen, currency]);

  useEffect(() => {
    if (formData.category === '') return;
    const categories = formData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    if (!categories.includes(formData.category)) {
      setFormData(prev => ({ ...prev, category: '' }));
    }
  }, [formData.type]);

  const scanReceipt = async (base64Data) => {
    setScanning(true);
    setScanError(false);
    
    // Priority list of vision-capable models
    const MODELS = [
        'anthropic/claude-3.5-sonnet',
        'openai/gpt-4o-mini',
        'google/gemini-3-pro-image-preview',
        'anthropic/claude-3.5-haiku'
    ];

    let success = false;
    
    for (const model of MODELS) {
        if (success) break;
        console.log(`Trying AI Scan with: ${model}...`);
        
        try {
            const response = await insforge.ai.chat.completions.create({
                model,
                messages: [
                    {
                        role: 'user',
                        content: [
                            { 
                                type: 'text', 
                                text: `Extract Total Amount, Category, and Currency Code from this receipt.
                                
                                For Currency, look for symbols like $, €, £, etc., and return the 3-letter code (USD, EUR, GBP, etc.).
                                Default to USD if context is unclear.
                                
                                Categories: ${EXPENSE_CATEGORIES.join(', ')}
                                Return ONLY JSON: {"amount": 0.00, "category": "String", "currency": "USD"}` 
                            },
                            { type: 'image_url', image_url: { url: base64Data } }
                        ]
                    }
                ]
            });

            const content = response.choices[0].message.content;
            console.log(`Success with ${model}:`, content);

            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const data = JSON.parse(jsonMatch[0]);
                if (data.amount !== undefined) {
                    // Map code back to symbol for UI consistency if needed
                    const symbolMap = { 'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 'INR': '₹' };
                    const finalCurrency = symbolMap[data.currency] || data.currency;

                    setFormData(prev => ({
                        ...prev,
                        amount: parseFloat(data.amount).toString(),
                        category: data.category || prev.category,
                        originalCurrency: (finalCurrency && rates[finalCurrency]) ? finalCurrency : prev.originalCurrency
                    }));
                    success = true;
                    setScanError(false);
                }
            }
        } catch (err) {
            console.warn(`Scan failed with ${model}:`, err.message);
            // Continue to next model
        }
    }

    if (!success) {
        console.error('All AI models failed to scan receipt.');
        setScanError(true);
    }
    setScanning(false);
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setScanError(false);
      
      const reader = new FileReader();
      reader.onloadend = async () => { await scanReceipt(reader.result); };
      reader.readAsDataURL(selectedFile);

      setUploading(true);
      try {
        const { data: uploadData, error: uploadError } = await insforge.storage.from('receipts').uploadAuto(selectedFile);
        if (uploadError) throw uploadError;
        const publicUrl = insforge.storage.from('receipts').getPublicUrl(uploadData.path);
        setFormData(prev => ({ ...prev, bill: publicUrl, image_key: uploadData.path }));
      } catch (error) {
        console.error('Upload Error:', error);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleRemoveReceipt = (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setFile(null);
    setFormData(prev => ({ ...prev, bill: '', image_key: '' }));
    setScanError(false);
  };

  const handleRetryScan = (e) => {
    e.preventDefault();
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => { await scanReceipt(reader.result); };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.category) { alert('Please select a category.'); return; }
    setLoading(true);
    try {
      if (editData) await updateTransaction(editData.id, { ...formData, title: formData.category });
      else await addTransaction({ ...formData, title: formData.category });
      onClose();
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save.');
    } finally { setLoading(false); }
  };

  const categories = formData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="flex-center" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, padding: '20px' }}>
          <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 50, scale: 0.9 }} className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '40px', position: 'relative' }}>
            <button onClick={onClose} style={{ position: 'absolute', top: '24px', right: '24px', color: 'var(--text-secondary)' }}><X size={24} /></button>
            <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '32px' }}>{editData ? 'Edit Transaction' : 'New Transaction'}</h2>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '4px' }}>
                {['income', 'expense'].map((type) => (
                  <button key={type} type="button" onClick={() => setFormData({ ...formData, type })}
                    style={{ flex: 1, padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', textTransform: 'capitalize', background: formData.type === type ? 'var(--accent-primary)' : 'transparent', color: formData.type === type ? '#fff' : 'var(--text-secondary)' }}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '12px' }}>
                  <select value={formData.originalCurrency} onChange={(e) => setFormData({ ...formData, originalCurrency: e.target.value })} style={{ background: 'rgba(255, 255, 255, 0.05)', fontSize: '18px', fontWeight: '600' }}>
                      {CURRENCY_SYMBOLS.map(cur => <option key={cur} value={cur}>{cur}</option>)}
                  </select>
                  <div style={{ position: 'relative' }}>
                    <input type="number" placeholder="0.00" step="0.01" required value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        style={{ fontSize: '24px', fontWeight: '700', width: '100%', borderColor: scanError ? 'var(--accent-expense)' : 'var(--border-glass)' }}
                    />
                    {scanning && <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)', fontSize: '12px' }}><Sparkles size={14} className="animate-pulse" /><span>Scanning...</span></div>}
                  </div>
              </div>

              {scanError && <div style={{ fontSize: '12px', color: 'var(--accent-expense)', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertCircle size={14} /><span>AI failed. Manual entry or <button type="button" onClick={handleRetryScan} style={{ textDecoration: 'underline', color: 'inherit', fontWeight: 'bold' }}>retry</button>?</span></div>}

              <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required>
                <option value="" disabled>Select Category</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>

              <div style={{ position: 'relative', overflow: 'visible' }}>
                <input type="file" id="receipt-upload" onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
                <div style={{ position: 'relative', overflow: 'visible' }}>
                    <label htmlFor="receipt-upload"
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '32px', border: '2px dashed var(--border-glass)', borderRadius: '16px', cursor: 'pointer', transition: 'var(--transition-smooth)', background: (file || formData.bill) ? 'rgba(99, 102, 241, 0.1)' : 'transparent', opacity: (uploading || scanning) ? 0.6 : 1 }}
                    onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'} onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-glass)'}
                    >
                    {uploading ? (<><Loader2 size={32} className="animate-spin" color="var(--accent-primary)" /><span style={{ fontSize: '14px', fontWeight: '600' }}>Uploading...</span></>) : 
                    scanning ? (<><Sparkles size={32} color="var(--accent-primary)" className="animate-pulse" /><span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--accent-primary)' }}>Scanning...</span></>) : 
                    (file || formData.bill) ? (
                        <div className="flex-center" style={{ gap: '12px' }}>
                            <ImageIcon size={32} color="var(--accent-primary)" />
                            <div style={{ textAlign: 'left' }}>
                                <span style={{ fontSize: '14px', fontWeight: '600', display: 'block' }}>{file?.name || 'Receipt Attached'}</span>
                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Click to replace</span>
                            </div>
                        </div>
                    ) : (<><Upload size={32} color="var(--text-secondary)" /><span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Upload Receipt (AI Scan)</span></>)}
                    </label>

                    {(file || formData.bill) && (
                        <button 
                            type="button" 
                            id="delete-receipt-btn"
                            data-testid="delete-receipt-btn"
                            onClick={handleRemoveReceipt}
                            style={{ position: 'absolute', top: '-10px', right: '-10px', background: '#f43f5e', color: '#fff', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(244, 63, 94, 0.5)', zIndex: 100, border: '3px solid #0a0b10', cursor: 'pointer' }}
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
              </div>

              <button type="submit" disabled={loading || scanning || uploading}
                style={{ background: 'var(--accent-primary)', color: '#fff', padding: '18px', borderRadius: '16px', fontWeight: '700', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', boxShadow: '0 4px 20px var(--accent-primary-glow)', marginTop: '12px', opacity: (loading || scanning || uploading) ? 0.7 : 1 }}
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <><Plus size={20} />{editData ? 'Save Changes' : 'Add Transaction'}</>}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddTransactionModal;
