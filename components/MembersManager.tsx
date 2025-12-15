import React, { useState } from 'react';
import { Member, Expense } from '../types';
import { formatCurrency } from '../utils';
import { Card } from './Card';
import { Plus, X, Users, ChevronDown, History, UserPlus } from 'lucide-react';

interface MembersManagerProps {
  members: Member[];
  expenses: Expense[];
  onAddMember: (name: string) => void;
  onRemoveMember: (id: string) => void;
}

export const MembersManager: React.FC<MembersManagerProps> = ({ members, expenses, onAddMember, onRemoveMember }) => {
  const [newName, setNewName] = useState('');
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onAddMember(newName.trim());
      setNewName('');
      // We keep the form open to allow adding multiple people quickly, 
      // but user can close it with the cancel/X button.
    }
  };

  const toggleExpand = (id: string) => {
      setExpandedMemberId(expandedMemberId === id ? null : id);
  }

  const getMemberHistory = (memberId: string) => {
      // Filter expenses where member is payer or shared (includes settlement receiver)
      return expenses.filter(e => e.payerId === memberId || e.sharedByIds.includes(memberId))
                     .sort((a, b) => b.date - a.date);
  };

  return (
    <Card 
        title="People" 
        className="h-full"
        action={
            !isAdding && (
                <button 
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-olive-800 text-white text-xs font-semibold rounded-lg hover:bg-olive-900 transition-colors shadow-sm"
                >
                    <UserPlus size={14} />
                    <span>Add Person</span>
                </button>
            )
        }
    >
      <div className="space-y-6">
        
        {/* Add New Person Form (Collapsible) */}
        {isAdding && (
            <div className="bg-olive-50/50 p-3 sm:p-4 rounded-xl border border-olive-100 animate-in slide-in-from-top-2 duration-200">
                <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-semibold text-olive-800">Add New Person</h4>
                    <button 
                        onClick={() => setIsAdding(false)} 
                        className="text-olive-400 hover:text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
                        title="Close"
                    >
                        <X size={16} />
                    </button>
                </div>
                <form onSubmit={handleAdd} className="flex gap-2">
                    <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Enter name..."
                        className="flex-1 px-3 py-2 sm:px-4 bg-white border border-olive-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-500 focus:border-transparent text-sm text-olive-900 placeholder-olive-400 shadow-sm"
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={!newName.trim()}
                        className="px-4 py-2 bg-olive-800 text-white rounded-lg hover:bg-olive-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1 font-medium shadow-sm min-w-[3rem] sm:min-w-fit"
                    >
                        <Plus size={18} />
                        <span className="hidden sm:inline">Add</span>
                    </button>
                </form>
            </div>
        )}

        {/* Members List */}
        <div>
            {members.length === 0 ? (
            <div className="text-center py-10 text-olive-600 flex flex-col items-center border-2 border-dashed border-olive-100 rounded-xl">
                <div className="p-4 bg-olive-50 rounded-full mb-3">
                    <Users size={32} className="text-olive-400" />
                </div>
                <p className="font-medium">No people yet.</p>
                <p className="text-sm text-olive-400 mt-1">
                    {!isAdding ? "Click 'Add Person' to start." : "Add someone above."}
                </p>
                {!isAdding && (
                    <button 
                        onClick={() => setIsAdding(true)}
                        className="mt-4 text-sm font-medium text-olive-700 hover:text-olive-900 underline underline-offset-2"
                    >
                        Add your first roommate
                    </button>
                )}
            </div>
            ) : (
            <div className="space-y-3">
                {members.map(member => {
                    const isExpanded = expandedMemberId === member.id;
                    const history = getMemberHistory(member.id);
                    
                    return (
                        <div key={member.id} className={`border rounded-lg overflow-hidden transition-all duration-200 ${isExpanded ? 'border-olive-400 ring-1 ring-olive-100' : 'border-olive-200 hover:border-olive-300'}`}>
                            {/* Member Header */}
                            <div 
                                onClick={() => toggleExpand(member.id)}
                                className="flex items-center justify-between p-3 bg-white cursor-pointer select-none"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-full bg-olive-100 text-olive-700 flex-none flex items-center justify-center text-xs font-bold border border-olive-200">
                                        {member.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="font-semibold text-olive-900 truncate">{member.name}</span>
                                </div>
                                <div className="flex items-center gap-1 sm:gap-2 flex-none">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRemoveMember(member.id);
                                        }}
                                        className="p-2 sm:p-1.5 text-olive-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                        title="Remove member"
                                    >
                                        <X size={16} />
                                    </button>
                                    <div className={`p-1 text-olive-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                                        <ChevronDown size={18} />
                                    </div>
                                </div>
                            </div>

                            {/* Dropdown History */}
                            {isExpanded && (
                                <div className="bg-olive-50/30 border-t border-olive-100 p-2 sm:p-3 animate-in slide-in-from-top-1 duration-200">
                                    <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-olive-500 uppercase tracking-wide">
                                        <History size={12} />
                                        <span>Recent Activity</span>
                                    </div>
                                    
                                    {history.length === 0 ? (
                                        <p className="text-sm text-olive-400 italic text-center py-2">No activity recorded yet.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {history.map(expense => {
                                                const isPayer = expense.payerId === member.id;
                                                const isSettlement = expense.type === 'settlement';
                                                
                                                return (
                                                    <div key={expense.id} className="flex justify-between items-center text-sm bg-white p-2 rounded border border-olive-100 shadow-sm">
                                                        <div className="flex-1 min-w-0 mr-2">
                                                            <div className="font-medium text-olive-900 truncate">
                                                                {isSettlement ? (
                                                                    <span className="flex items-center gap-1">
                                                                        {isPayer ? 'Paid' : 'Received from'}
                                                                        {isPayer ? (
                                                                            <span className="font-bold truncate">{members.find(m => m.id === expense.sharedByIds[0])?.name}</span>
                                                                        ) : (
                                                                             <span className="font-bold truncate">{members.find(m => m.id === expense.payerId)?.name}</span>
                                                                        )}
                                                                    </span>
                                                                ) : (
                                                                    expense.title
                                                                )}
                                                            </div>
                                                            <div className="text-[10px] sm:text-xs text-olive-500">
                                                                {new Date(expense.date).toLocaleDateString()}
                                                            </div>
                                                        </div>
                                                        <div className="text-right whitespace-nowrap flex-none">
                                                            {isSettlement ? (
                                                                isPayer ? (
                                                                    <span className="text-olive-700 font-medium text-[10px] sm:text-xs bg-olive-100 px-1.5 py-0.5 rounded border border-olive-200">
                                                                        Sent {formatCurrency(expense.amount)}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-green-700 font-medium text-[10px] sm:text-xs bg-green-50 px-1.5 py-0.5 rounded border border-green-100">
                                                                        Got {formatCurrency(expense.amount)}
                                                                    </span>
                                                                )
                                                            ) : (
                                                                isPayer ? (
                                                                    <span className="text-green-700 font-medium text-[10px] sm:text-xs bg-green-50 px-1.5 py-0.5 rounded border border-green-100">
                                                                        Paid {formatCurrency(expense.amount)}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-olive-600 text-[10px] sm:text-xs">
                                                                        Included
                                                                    </span>
                                                                )
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            )}
        </div>
      </div>
    </Card>
  );
};