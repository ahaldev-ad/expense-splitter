import React, { useState } from 'react';
import { Card } from './Card';
import { IndianRupee, ArrowRight, Banknote } from 'lucide-react';

export const SettleUp = ({ members, onSettleUp }) => {
  const [payerId, setPayerId] = useState('');
  const [receiverId, setReceiverId] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!payerId || !receiverId || !amount) return;
    
    onSettleUp(payerId, receiverId, parseFloat(amount));
    
    // Reset form
    setPayerId('');
    setReceiverId('');
    setAmount('');
  };

  const isValid = payerId && receiverId && amount && payerId !== receiverId;

  if (members.length < 2) {
    return (
        <Card title="Settle Up">
            <p className="text-sm text-olive-700 italic">Add at least two people in the 'People' tab to settle up.</p>
        </Card>
    )
  }

  return (
    <Card title="Record Payment">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-olive-50 p-4 rounded-lg border border-olive-200 flex flex-col items-center justify-center text-center mb-2">
            <div className="p-3 bg-white rounded-full shadow-sm text-olive-600 mb-2">
                <Banknote size={24} />
            </div>
            <p className="text-sm text-olive-800 font-medium">Record a payment between people</p>
            <p className="text-xs text-olive-600 mt-1">This will adjust the balances but won't increase total group spending.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            {/* Payer */}
            <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-olive-700">Who Paid?</label>
                <select
                    value={payerId}
                    onChange={(e) => {
                        setPayerId(e.target.value);
                        if (e.target.value === receiverId) setReceiverId('');
                    }}
                    className="w-full px-3 py-3 bg-white border border-olive-300 rounded-lg focus:ring-2 focus:ring-olive-600 focus:outline-none appearance-none cursor-pointer text-olive-900 shadow-sm"
                >
                    <option value="" disabled className="text-olive-400">Select Payer...</option>
                    {members.map(m => (
                    <option key={m.id} value={m.id} disabled={m.id === receiverId}>{m.name}</option>
                    ))}
                </select>
            </div>

            {/* Direction Arrow (Visual) */}
            <div className="hidden md:flex justify-center pt-5 text-olive-400">
                <ArrowRight size={24} />
            </div>

            {/* Receiver */}
            <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-olive-700">Who Received?</label>
                <select
                    value={receiverId}
                    onChange={(e) => setReceiverId(e.target.value)}
                    className="w-full px-3 py-3 bg-white border border-olive-300 rounded-lg focus:ring-2 focus:ring-olive-600 focus:outline-none appearance-none cursor-pointer text-olive-900 shadow-sm"
                >
                    <option value="" disabled className="text-olive-400">Select Receiver...</option>
                    {members.map(m => (
                    <option key={m.id} value={m.id} disabled={m.id === payerId}>{m.name}</option>
                    ))}
                </select>
            </div>
        </div>

        {/* Amount */}
        <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-olive-700">Amount</label>
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-olive-500">
                <IndianRupee size={18} />
                </span>
                <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-3 bg-white border border-olive-300 rounded-lg focus:ring-2 focus:ring-olive-600 focus:outline-none placeholder-olive-400 text-olive-900 font-bold text-lg shadow-sm"
                />
            </div>
        </div>

        <button
          type="submit"
          disabled={!isValid}
          className="w-full py-3 bg-olive-700 text-white rounded-lg font-bold shadow-md hover:bg-olive-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] mt-4"
        >
          Settle Up
        </button>
      </form>
    </Card>
  );
};