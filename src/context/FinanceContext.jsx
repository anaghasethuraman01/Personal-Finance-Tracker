import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { insforge } from '../lib/insforge';

const FinanceContext = createContext();

export const FinanceProvider = ({ children }) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [currency, setCurrency] = useState('$');
  const [loading, setLoading] = useState(true);

  // Simulated Exchange Rates (Base: USD $)
  const rates = {
    '$': 1.0,
    '€': 0.92,
    '£': 0.79,
    '¥': 150.25,
    '₹': 83.12
  };

  const convert = (amount, fromCur, toCur) => {
    // Normalize currencies (handle USD as $)
    const from = fromCur === 'USD' ? '$' : fromCur;
    const to = toCur === 'USD' ? '$' : toCur;
    
    if (from === to) return amount;
    
    const fromRate = rates[from] || 1.0;
    const toRate = rates[to] || 1.0;
    
    const inUSD = amount / fromRate;
    return inUSD * toRate;
  };

  // Fetch transactions from InsForge
  const fetchTransactions = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await insforge.database
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });

    if (!error && data) {
      const mapped = data.map(t => ({
        ...t,
        originalCurrency: t.original_currency,
        date: t.date 
      }));
      setTransactions(mapped);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchTransactions();
      const savedCurrency = localStorage.getItem(`finflow_currency_${user.id}`);
      if (savedCurrency) setCurrency(savedCurrency);
    } else {
      setTransactions([]);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(`finflow_currency_${user.id}`, currency);
    }
  }, [currency, user]);

  const addTransaction = async (data) => {
    if (!user) return;

    const dbData = {
      user_id: user.id,
      title: data.title,
      amount: parseFloat(data.amount),
      type: data.type,
      category: data.category,
      original_currency: data.originalCurrency || currency,
      bill: data.bill,
      date: new Date().toISOString()
    };

    const { data: inserted, error } = await insforge.database
      .from('transactions')
      .insert(dbData)
      .select()
      .single();

    if (!error && inserted) {
       setTransactions(prev => [{ ...inserted, originalCurrency: inserted.original_currency }, ...prev]);
    } else if (error) {
        throw error;
    }
  };

  const updateTransaction = async (id, updatedData) => {
    if (!user) return;

    const dbData = {
      title: updatedData.title,
      amount: parseFloat(updatedData.amount),
      type: updatedData.type,
      category: updatedData.category,
      original_currency: updatedData.originalCurrency,
      bill: updatedData.bill
    };

    const { data: updated, error } = await insforge.database
      .from('transactions')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (!error && updated) {
      setTransactions(prev => prev.map(t => 
        t.id === id ? { ...updated, originalCurrency: updated.original_currency } : t
      ));
    }
  };

  const deleteTransaction = async (id) => {
    const { error } = await insforge.database
      .from('transactions')
      .delete()
      .eq('id', id);

    if (!error) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const stats = React.useMemo(() => {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => {
        const val = Number(t.amount) || 0;
        return sum + convert(val, t.originalCurrency, currency);
      }, 0);

    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => {
        const val = Number(t.amount) || 0;
        return sum + convert(val, t.originalCurrency, currency);
      }, 0);

    const monthlySavingsNum = totalIncome - totalExpense;
    const monthlySavings = (monthlySavingsNum || 0).toFixed(2);

    const expenseByCategory = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        const val = Number(t.amount) || 0;
        const convertedAmount = convert(val, t.originalCurrency, currency);
        acc[t.category] = (acc[t.category] || 0) + convertedAmount;
        return acc;
      }, {});

    const pieChartData = Object.keys(expenseByCategory).map(name => ({
      name,
      value: parseFloat((expenseByCategory[name] || 0).toFixed(2))
    }));

    return { 
      totalIncome: (totalIncome || 0).toFixed(2), 
      totalExpense: (totalExpense || 0).toFixed(2), 
      monthlySavings, 
      pieChartData 
    };
  }, [transactions, currency]);

  return (
    <FinanceContext.Provider value={{ 
      transactions, 
      currency,
      setCurrency,
      addTransaction, 
      updateTransaction, 
      deleteTransaction,
      convert,
      rates,
      stats,
      loading
    }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => useContext(FinanceContext);
