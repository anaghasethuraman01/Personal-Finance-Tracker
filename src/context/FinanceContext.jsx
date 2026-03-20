import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { insforge } from '../lib/insforge';

const FinanceContext = createContext();

export const FinanceProvider = ({ children }) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Initialize currency from localStorage immediately to prevent flicker/reset
  const [currency, setCurrency] = useState(() => {
    try {
        // Try to get a generic global currency first if user not yet loaded, 
        // or wait for specific user currency in useEffect.
        return localStorage.getItem('finflow_global_currency') || '$';
    } catch (e) {
        return '$';
    }
  });

  const CURRENCY_SYMBOLS = ['$', '€', '£', '¥', '₹'];

  // Internal mapping for conversion (Base: USD $)
  const rates = {
    '$': 1.0, '€': 0.92, '£': 0.79, '¥': 150.25, '₹': 83.12,
    'USD': 1.0, 'EUR': 0.92, 'GBP': 0.79, 'JPY': 150.25, 'INR': 83.12
  };

  const convert = useCallback((amount, fromCur, toCur) => {
    const from = fromCur === 'USD' ? '$' : fromCur === 'EUR' ? '€' : fromCur === 'GBP' ? '£' : fromCur;
    const to = toCur === 'USD' ? '$' : toCur === 'EUR' ? '€' : toCur === 'GBP' ? '£' : toCur;
    
    if (from === to) return amount;
    const fromRate = rates[from] || 1.0;
    const toRate = rates[to] || 1.0;
    const inUSD = amount / fromRate;
    return inUSD * toRate;
  }, []);

  const fetchTransactions = async () => {
    if (!user) return;
    setLoading(true);
    try {
        const { data, error } = await insforge.database
          .from('transactions')
          .select('*')
          .order('date', { ascending: false });

        if (!error && data) {
          setTransactions(data.map(t => ({ ...t, originalCurrency: t.original_currency })));
        }
    } finally {
        setLoading(false);
    }
  };

  // Sync with localStorage
  useEffect(() => {
    if (user) {
        fetchTransactions();
        // Load user-specific currency preference
        const saved = localStorage.getItem(`finflow_currency_${user.id}`);
        if (saved) setCurrency(saved);
        else {
            // If no user-specific, try global one
            const global = localStorage.getItem('finflow_global_currency');
            if (global) setCurrency(global);
        }
    }
  }, [user]);

  // Persist currency whenever it changes
  useEffect(() => {
    localStorage.setItem('finflow_global_currency', currency);
    if (user) {
      localStorage.setItem(`finflow_currency_${user.id}`, currency);
    }
  }, [currency, user]);

  const addTransaction = async (data) => {
    if (!user) return;
    const dbData = {
      user_id: user.id,
      title: data.category,
      amount: parseFloat(data.amount),
      type: data.type,
      category: data.category,
      original_currency: data.originalCurrency || currency,
      bill: data.bill,
      date: new Date().toISOString()
    };

    const { data: inserted, error } = await insforge.database.from('transactions').insert(dbData).select().single();
    if (!error && inserted) {
       setTransactions(prev => [{ ...inserted, originalCurrency: inserted.original_currency }, ...prev]);
    } else if (error) throw error;
  };

  const updateTransaction = async (id, updatedData) => {
    const dbData = {
      title: updatedData.category,
      amount: parseFloat(updatedData.amount),
      type: updatedData.type,
      category: updatedData.category,
      original_currency: updatedData.originalCurrency,
      bill: updatedData.bill
    };
    const { data: updated, error } = await insforge.database.from('transactions').update(dbData).eq('id', id).select().single();
    if (!error && updated) {
      setTransactions(prev => prev.map(t => t.id === id ? { ...updated, originalCurrency: updated.original_currency } : t));
    }
  };

  const deleteTransaction = async (id) => {
    const { error } = await insforge.database.from('transactions').delete().eq('id', id);
    if (!error) setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const stats = useMemo(() => {
    const totals = transactions.reduce((acc, t) => {
        const amt = Number(t.amount) || 0;
        const conv = convert(amt, t.originalCurrency, currency);
        if (t.type === 'income') acc.income += conv;
        else {
            acc.expense += conv;
            acc.byCat[t.category] = (acc.byCat[t.category] || 0) + conv;
        }
        return acc;
    }, { income: 0, expense: 0, byCat: {} });

    return {
        totalIncome: totals.income.toFixed(2),
        totalExpense: totals.expense.toFixed(2),
        monthlySavings: (totals.income - totals.expense).toFixed(2),
        pieChartData: Object.entries(totals.byCat).map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
    };
  }, [transactions, currency, convert]);

  return (
    <FinanceContext.Provider value={{ 
      transactions, currency, setCurrency, addTransaction, updateTransaction, deleteTransaction, 
      convert, rates, stats, loading, CURRENCY_SYMBOLS
    }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => useContext(FinanceContext);
