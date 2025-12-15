import React, { useState } from 'react';
import { formatCurrency } from '../utils';
import { Card } from './Card';
import { Trash2, ArrowRight, ChevronDown, Layers, Calculator, Users, X, Check } from 'lucide-react';

export const ExpenseList = ({ expenses, members, groups, onDeleteExpense }) => {
  const [expandedId, setExpandedId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const getMemberName = (id) => members.find(m => m.id === id)?.name || 'Unknown';
  const getGroupName = (id) => groups.find(g => g.id === id)?.name || 'General';

  const toggleExpand = (id) => {
      setExpandedId(expandedId === id ? null : id);
      setConfirmDeleteId(null); // Reset confirmation state when toggling
  };

  if (expenses.length === 0) {
      return (
          <Card title="Recent Activity">
              <div className="text-center py-8 text-olive-600">
                  No activity recorded yet.
              </div>
          </Card>
      )
  }

  // Sort latest first
  const sortedExpenses = [...expenses].sort((a, b) => b.date - a.date);

  return (
    <Card title="Recent Activity" className="mb-20 sm:mb-0">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-xs text-olive-700 border-b border-olive-200">
              <th className="py-3 pl-2 sm:pl-4 font-semibold uppercase tracking-wider w-16 sm:w-24">Date</th>
              <th className="py-3 font-semibold uppercase tracking-wider">Description</th>
              <th className="py-3 font-semibold uppercase tracking-wider text-right">Amount</th>
              <th className="py-3 pr-2 sm:pr-4 w-8 sm:w-10"></th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {sortedExpenses.map(expense => {
              const isSettlement = expense.type === 'settlement';
              const isExpanded = expandedId === expense.id;
              const isConfirmingDelete = confirmDeleteId === expense.id;
              
              return (
                <React.Fragment key={expense.id}>
                    <tr 
                        onClick={() => toggleExpand(expense.id)}
                        className={`group hover:bg-olive-50 transition-colors border-b border-olive-100 last:border-0 cursor-pointer ${isExpanded ? 'bg-olive-50 border-transparent' : ''}`}
                    >
                    <td className="py-3 pl-2 sm:pl-4 text-olive-600 font-medium text-[10px] sm:text-xs whitespace-nowrap align-top sm:align-middle">
                        <span className="block">{new Date(expense.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        <span className="block text-olive-400 sm:hidden">{new Date(expense.date).getFullYear()}</span>
                    </td>
                    <td className="py-3 font-medium text-olive-900 align-top sm:align-middle">
                        {isSettlement ? (
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <div className="flex items-center gap-1">
                                <span className="font-bold text-olive-800">{getMemberName(expense.payerId)}</span>
                                <ArrowRight size={12} className="text-olive-400" />
                                <span className="font-bold text-olive-800">{getMemberName(expense.sharedByIds[0])}</span>
                            </div>
                            <span className="w-fit text-[9px] sm:text-[10px] uppercase tracking-wide bg-olive-100 text-olive-700 px-1.5 py-0.5 rounded border border-olive-200">Settlement</span>
                            </div>
                        ) : (
                            <div>
                            <div className="line-clamp-2">{expense.title}</div>
                            <div className="text-[10px] sm:text-[11px] text-olive-600 font-normal mt-0.5 flex flex-wrap items-center gap-1">
                                <span className="bg-olive-100 text-olive-800 px-1 rounded text-[9px] sm:text-[10px] whitespace-nowrap">{getMemberName(expense.payerId)}</span>
                                <span>paid for</span>
                                <span className="whitespace-nowrap">{expense.sharedByIds.length === members.length ? 'Everyone' : `${expense.sharedByIds.length} people`}</span>
                            </div>
                            </div>
                        )}
                    </td>
                    <td className="py-3 text-right font-bold text-olive-800 whitespace-nowrap align-top sm:align-middle">
                        {formatCurrency(expense.amount)}
                    </td>
                    <td className="py-3 pr-2 sm:pr-4 text-right align-top sm:align-middle">
                        <div className="flex items-center justify-end gap-2">
                             <div className={`text-olive-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                                <ChevronDown size={14} />
                             </div>
                        </div>
                    </td>
                    </tr>
                    
                    {/* Expanded Details Row */}
                    {isExpanded && (
                        <tr className="bg-olive-50/50">
                            <td colSpan={4} className="p-0">
                                <div className="p-3 sm:p-4 border-b border-olive-200 animate-in slide-in-from-top-1 duration-200">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        
                                        {/* Left Col: Metadata */}
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-xs text-olive-600">
                                                <Layers size={14} className="text-olive-400" />
                                                <span className="font-semibold uppercase tracking-wider">Group:</span>
                                                <span className="bg-white border border-olive-200 px-2 py-0.5 rounded text-olive-800">{getGroupName(expense.groupId)}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-olive-600">
                                                <Calculator size={14} className="text-olive-400" />
                                                <span className="font-semibold uppercase tracking-wider">Per Person:</span>
                                                <span className="font-medium text-olive-900">
                                                    {isSettlement 
                                                        ? formatCurrency(expense.amount) 
                                                        : formatCurrency(expense.amount / Math.max(1, expense.sharedByIds.length))}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-olive-600">
                                                <Users size={14} className="text-olive-400" />
                                                <span className="font-semibold uppercase tracking-wider">
                                                    {isSettlement ? 'Transfer:' : 'Split With:'}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5 pl-6">
                                                {expense.sharedByIds.map(id => (
                                                    <span key={id} className="text-xs bg-white border border-olive-200 text-olive-700 px-2 py-1 rounded-md shadow-sm">
                                                        {getMemberName(id)}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Right Col: Actions */}
                                        <div className="flex flex-col justify-end items-end pt-4 sm:pt-0">
                                             {isConfirmingDelete ? (
                                                 <div className="flex flex-col items-end gap-2 animate-in fade-in zoom-in-95 duration-200">
                                                    <p className="text-xs text-red-600 font-semibold">Permanently delete?</p>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setConfirmDeleteId(null);
                                                            }}
                                                            className="px-3 py-2 bg-white border border-olive-200 text-olive-600 rounded-lg text-xs font-medium hover:bg-olive-50 transition-colors flex items-center gap-1"
                                                        >
                                                            <X size={14} />
                                                            Cancel
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onDeleteExpense(expense.id);
                                                                setConfirmDeleteId(null);
                                                            }}
                                                            className="px-3 py-2 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 shadow-sm transition-colors flex items-center gap-1"
                                                        >
                                                            <Trash2 size={14} />
                                                            Confirm
                                                        </button>
                                                    </div>
                                                 </div>
                                             ) : (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setConfirmDeleteId(expense.id);
                                                    }}
                                                    className="relative z-10 flex items-center gap-2 text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 active:bg-red-200 px-3 py-2 rounded-lg border border-red-100 transition-colors shadow-sm"
                                                >
                                                    <Trash2 size={14} />
                                                    Delete Entry
                                                </button>
                                             )}
                                        </div>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};