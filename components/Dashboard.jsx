import React from 'react';
import { formatCurrency } from '../utils';
import { Card } from './Card';
import { TrendingUp, ArrowDownLeft, ArrowUpRight, CheckCircle2 } from 'lucide-react';

export const Dashboard = ({ balances, members }) => {
  const totalSpent = balances.reduce((sum, b) => sum + b.totalPaid, 0);
  
  // Map member names to balances for display
  const richBalances = balances.map(b => ({
      ...b,
      name: members.find(m => m.id === b.memberId)?.name || 'Unknown'
  })).sort((a, b) => b.balance - a.balance); // Sort: Receivers first, then Payers

  return (
    <div className="space-y-4 sm:space-y-6 mb-6">
      
      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Expenses Card */}
        <div className="bg-olive-900 text-white rounded-2xl shadow-xl p-6 flex flex-col justify-between h-36 sm:h-40 relative overflow-hidden md:col-span-1">
            <div className="relative z-10">
                <h3 className="text-olive-200 text-xs font-bold uppercase tracking-widest mb-1 sm:mb-2">Total Expenses</h3>
                <p className="text-3xl sm:text-4xl font-extrabold tracking-tight">{formatCurrency(totalSpent)}</p>
                <p className="text-olive-300 text-xs sm:text-sm mt-1 sm:mt-2 font-medium">Group total across all events</p>
            </div>
            {/* Abstract Decorative Circles */}
            <div className="absolute -right-6 -bottom-10 w-32 h-32 bg-olive-700/50 rounded-full blur-2xl"></div>
            <div className="absolute right-10 -top-10 w-24 h-24 bg-olive-500/30 rounded-full blur-xl"></div>
            <div className="absolute right-4 bottom-4 text-olive-800 opacity-20 transform rotate-12">
                <TrendingUp size={100} />
            </div>
        </div>

        {/* Member Balances List */}
        <Card className="md:col-span-2 flex flex-col justify-center h-full" title="Balances">
             {richBalances.length === 0 ? (
                 <div className="text-center text-olive-500 py-4 text-sm">No data available. Add expenses to see balances.</div>
             ) : (
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-x-8 sm:gap-y-4">
                     {richBalances.map(member => {
                         const isOwed = member.balance > 0.01;
                         const isOwing = member.balance < -0.01;
                         const isSettled = !isOwed && !isOwing;

                         return (
                             <div key={member.memberId} className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-olive-50/50 border border-olive-100/50 hover:border-olive-200 transition-colors min-w-0">
                                 <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                     <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex-none flex items-center justify-center text-[10px] sm:text-xs font-bold border ${
                                         isOwed ? 'bg-green-100 text-green-700 border-green-200' :
                                         isOwing ? 'bg-red-50 text-red-700 border-red-100' :
                                         'bg-olive-100 text-olive-600 border-olive-200'
                                     }`}>
                                         {member.name.charAt(0).toUpperCase()}
                                     </div>
                                     <span className="font-semibold text-olive-900 truncate text-sm sm:text-base">{member.name}</span>
                                 </div>
                                 
                                 <div className="text-right flex-none ml-2">
                                     {isOwed && (
                                         <div className="flex items-center gap-1 text-green-700 font-bold">
                                             <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wide text-green-600 hidden xs:inline">Gets</span>
                                             <span className="text-sm sm:text-base">{formatCurrency(member.balance)}</span>
                                             <ArrowDownLeft size={14} className="sm:w-4 sm:h-4" />
                                         </div>
                                     )}
                                     {isOwing && (
                                         <div className="flex items-center gap-1 text-red-600 font-bold">
                                             <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wide text-red-500 hidden xs:inline">Owes</span>
                                             <span className="text-sm sm:text-base">{formatCurrency(Math.abs(member.balance))}</span>
                                             <ArrowUpRight size={14} className="sm:w-4 sm:h-4" />
                                         </div>
                                     )}
                                     {isSettled && (
                                         <div className="flex items-center gap-1 text-olive-400 font-medium">
                                             <CheckCircle2 size={14} className="sm:w-4 sm:h-4" />
                                             <span className="text-xs sm:text-sm">Settled</span>
                                         </div>
                                     )}
                                 </div>
                             </div>
                         );
                     })}
                 </div>
             )}
        </Card>
      </div>
    </div>
  );
};