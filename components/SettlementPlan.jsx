import React from 'react';
import { formatCurrency } from '../utils';
import { Card } from './Card';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export const SettlementPlan = ({ settlements, members }) => {
  const getName = (id) => members.find(m => m.id === id)?.name || 'Unknown';

  return (
    <Card title="Settlement Plan" className="bg-olive-50/50 border-olive-200">
      {settlements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-olive-600">
          <CheckCircle2 size={48} className="mb-3 text-olive-400" />
          <p className="font-medium text-lg">All settled up!</p>
          <p className="text-sm opacity-80">No debts remaining.</p>
        </div>
      ) : (
        <div className="space-y-3">
            <p className="text-xs text-olive-700 font-medium mb-4 uppercase tracking-wide">Suggested Payments</p>
          {settlements.map((s, idx) => (
            <div key={idx} className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-olive-200">
              <div className="flex items-center gap-3">
                <div className="font-semibold text-olive-900">{getName(s.from)}</div>
                <div className="text-olive-400">
                    <ArrowRight size={16} />
                </div>
                <div className="font-semibold text-olive-900">{getName(s.to)}</div>
              </div>
              <div className="font-bold text-olive-800 text-lg">
                {formatCurrency(s.amount)}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};