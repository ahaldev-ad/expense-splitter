import React, { useState, useEffect } from 'react';
import { Card } from './Card';
import { Check, DollarSign, Sparkles, Loader2, Layers } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

export const AddExpense = ({ members, groups, activeGroupId, onAddExpense }) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [payerId, setPayerId] = useState('');
  const [sharedByIds, setSharedByIds] = useState([]);
  const [targetGroupId, setTargetGroupId] = useState(activeGroupId === 'all' ? 'general' : activeGroupId);
  
  // Smart Fill State
  const [smartInput, setSmartInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [aiError, setAiError] = useState('');

  // Update target group to match activeGroupId if it changes, but allow manual override
  useEffect(() => {
      if (activeGroupId !== 'all') {
          setTargetGroupId(activeGroupId);
      }
  }, [activeGroupId]);

  // Ensure targetGroupId is valid relative to available groups
  useEffect(() => {
      if (groups.length > 0 && !groups.some(g => g.id === targetGroupId)) {
          setTargetGroupId('general');
      }
  }, [groups, targetGroupId]);

  const handleToggleShare = (id) => {
    setSharedByIds(prev => 
      prev.includes(id) 
        ? prev.filter(mid => mid !== id) 
        : [...prev, id]
    );
  };

  const selectAll = () => {
    setSharedByIds(members.map(m => m.id));
  };

  const handleSmartFill = async () => {
    if (!smartInput.trim()) return;
    
    setIsThinking(true);
    setAiError('');

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // Create a context string for the AI to match names to IDs
        const membersContext = members.map(m => `Name: "${m.name}", ID: "${m.id}"`).join("; ");
        
        const prompt = `
            You are a helper for an expense splitting app.
            Context - Current Group Members: [${membersContext}].
            
            Task: Parse this user input into a structured expense JSON: "${smartInput}".
            
            Rules:
            1. Extract 'title' (short string).
            2. Extract 'amount' (number).
            3. Identify 'payerId' from the Context. Match names loosely (e.g., "John" matches "Jonathan"). If unclear, null.
            4. Identify 'sharedByIds' (array of IDs).
               - If input says "everyone", "all", "shared", or implies the whole group, include ALL member IDs.
               - If specific names are mentioned, map them to IDs.
               - If "split with X", usually implies Payer + X are sharing.
               - Default to ALL members if sharing isn't explicitly restricted.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        amount: { type: Type.NUMBER },
                        payerId: { type: Type.STRING },
                        sharedByIds: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                }
            }
        });

        const data = JSON.parse(response.text);

        if (data) {
            if (data.title) setTitle(data.title);
            if (data.amount) setAmount(data.amount.toString());
            
            // Validate IDs exist in current members list before setting
            if (data.payerId && members.some(m => m.id === data.payerId)) {
                setPayerId(data.payerId);
            }
            
            if (data.sharedByIds && Array.isArray(data.sharedByIds)) {
                const validIds = data.sharedByIds.filter((id) => members.some(m => m.id === id));
                if (validIds.length > 0) {
                    setSharedByIds(validIds);
                }
            }
        }

    } catch (err) {
        console.error("Smart Fill Error:", err);
        setAiError("Could not understand. Please try again or fill manually.");
    } finally {
        setIsThinking(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !amount || !payerId || sharedByIds.length === 0 || !targetGroupId) return;

    onAddExpense(title, parseFloat(amount), payerId, sharedByIds, 'expense', targetGroupId);
    
    // Reset form
    setTitle('');
    setAmount('');
    setPayerId('');
    setSharedByIds([]);
    setSmartInput('');
  };

  const isValid = title && amount && payerId && sharedByIds.length > 0 && targetGroupId;

  if (members.length < 2) {
      return (
          <Card title="Add Expense">
              <p className="text-sm text-olive-700 italic">Add at least two people in the 'People' tab to start adding expenses.</p>
          </Card>
      )
  }

  return (
    <Card title="Add New Expense">
      
      {/* Smart Fill Section */}
      <div className="mb-8 bg-olive-50 p-4 rounded-xl border border-olive-200 shadow-inner">
        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-olive-800 mb-2">
            <Sparkles size={14} className="text-amber-500 fill-amber-500" />
            Smart Fill (AI)
        </label>
        <div className="flex gap-2">
            <input 
                value={smartInput}
                onChange={(e) => setSmartInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSmartFill(); }}
                placeholder="e.g. Dinner $55 paid by Alex for everyone"
                className="flex-1 px-3 py-2 bg-white border border-olive-300 rounded-lg focus:ring-2 focus:ring-olive-600 focus:outline-none placeholder-olive-400 text-olive-900 text-sm shadow-sm"
            />
            <button 
                onClick={handleSmartFill}
                disabled={isThinking || !smartInput}
                className="px-4 py-2 bg-olive-700 text-white rounded-lg hover:bg-olive-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-semibold whitespace-nowrap shadow-sm min-w-[100px] flex items-center justify-center"
            >
                {isThinking ? <Loader2 size={16} className="animate-spin" /> : 'Auto-Fill'}
            </button>
        </div>
        {aiError ? (
            <p className="text-red-600 text-[11px] mt-2 font-medium">{aiError}</p>
        ) : (
            <p className="text-[11px] text-olive-500 mt-2 italic">Type naturally and let AI fill the details below.</p>
        )}
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-olive-200"></div>
        </div>
        <div className="relative flex justify-center">
            <span className="bg-white px-2 text-xs text-olive-400 uppercase tracking-widest">Or fill manually</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 mt-4">
        
        {/* Group Selection */}
        <div className="space-y-1">
             <label className="text-xs font-semibold uppercase tracking-wider text-olive-700 flex items-center gap-1">
                 <Layers size={12} />
                 Assign to Group
             </label>
             <select
                value={targetGroupId}
                onChange={(e) => setTargetGroupId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-olive-300 rounded-lg focus:ring-2 focus:ring-olive-600 focus:outline-none appearance-none cursor-pointer text-olive-900 shadow-sm transition-all"
            >
                {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                ))}
            </select>
            {activeGroupId !== 'all' && activeGroupId !== targetGroupId && (
                <p className="text-[10px] text-amber-600 font-medium">Note: This expense will be added to {groups.find(g => g.id === targetGroupId)?.name}, but you are currently viewing {groups.find(g => g.id === activeGroupId)?.name || 'a different group'}.</p>
            )}
        </div>

        {/* Title & Amount Row */}
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-olive-700">Expense Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Weekly Groceries"
              className="w-full px-3 py-2 bg-white border border-olive-300 rounded-lg focus:ring-2 focus:ring-olive-600 focus:outline-none placeholder-olive-400 text-olive-900 shadow-sm transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-olive-700">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-olive-500">
                <DollarSign size={16} />
              </span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-3 py-2 bg-white border border-olive-300 rounded-lg focus:ring-2 focus:ring-olive-600 focus:outline-none placeholder-olive-400 text-olive-900 font-medium shadow-sm transition-all"
              />
            </div>
          </div>
        </div>

        {/* Paid By */}
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-olive-700">Paid By</label>
          <select
            value={payerId}
            onChange={(e) => setPayerId(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-olive-300 rounded-lg focus:ring-2 focus:ring-olive-600 focus:outline-none appearance-none cursor-pointer text-olive-900 shadow-sm transition-all"
          >
            <option value="" disabled className="text-olive-400">Select a person...</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        {/* Shared By */}
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <label className="text-xs font-semibold uppercase tracking-wider text-olive-700">Split Amongst</label>
                <button type="button" onClick={selectAll} className="text-xs text-olive-700 hover:text-olive-900 underline font-medium">Select All</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
                {members.map(m => {
                    const isSelected = sharedByIds.includes(m.id);
                    return (
                        <button
                            key={m.id}
                            type="button"
                            onClick={() => handleToggleShare(m.id)}
                            className={`
                                relative flex items-center justify-center px-3 py-2.5 rounded-lg border text-sm transition-all
                                ${isSelected 
                                    ? 'bg-olive-800 border-olive-800 text-white shadow-md' 
                                    : 'bg-white border-olive-300 text-olive-800 hover:border-olive-400 hover:bg-olive-50'
                                }
                            `}
                        >
                            <span className="truncate max-w-[80%]">{m.name}</span>
                            {isSelected && <Check size={14} className="absolute right-2" />}
                        </button>
                    );
                })}
            </div>
        </div>

        <button
          type="submit"
          disabled={!isValid}
          className="w-full py-3 bg-olive-700 text-white rounded-lg font-bold shadow-md hover:bg-olive-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] mt-2"
        >
          Add Expense
        </button>
      </form>
    </Card>
  );
};