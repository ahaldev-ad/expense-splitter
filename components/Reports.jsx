import React, { useState, useMemo } from 'react';
import { Card } from './Card';
import { formatCurrency } from '../utils';
import { FileText, Download, Calendar, PieChart, TrendingUp, FileDown } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const Reports = ({ expenses, members, groups }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-11
  const [reportType, setReportType] = useState('monthly'); // 'monthly' | 'annual'

  const years = useMemo(() => {
    const yearsSet = new Set([new Date().getFullYear()]);
    expenses.forEach(e => yearsSet.add(new Date(e.date).getFullYear()));
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [expenses]);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const date = new Date(e.date);
      const yearMatch = date.getFullYear() === selectedYear;
      const monthMatch = reportType === 'annual' || date.getMonth() === selectedMonth;
      return yearMatch && monthMatch && e.type !== 'settlement';
    }).sort((a, b) => b.date - a.date);
  }, [expenses, selectedYear, selectedMonth, reportType]);

  const stats = useMemo(() => {
    const total = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    const groupBreakdown = {};
    const memberContribution = {};

    filteredExpenses.forEach(e => {
      const gName = groups.find(g => g.id === e.groupId)?.name || 'General';
      groupBreakdown[gName] = (groupBreakdown[gName] || 0) + e.amount;
      
      const mName = members.find(m => m.id === e.payerId)?.name || 'Unknown';
      memberContribution[mName] = (memberContribution[mName] || 0) + e.amount;
    });

    const topGroup = Object.entries(groupBreakdown).sort((a, b) => b[1] - a[1])[0];
    const topPayer = Object.entries(memberContribution).sort((a, b) => b[1] - a[1])[0];

    return { total, groupBreakdown, memberContribution, topGroup, topPayer };
  }, [filteredExpenses, groups, members]);

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const period = reportType === 'monthly' ? `${monthNames[selectedMonth]} ${selectedYear}` : `Year ${selectedYear}`;
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(40, 60, 30); // Deep forest color
    doc.text('Expense Report', 14, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Period: ${period}`, 14, 28);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 34);

    // Summary Section
    doc.setDrawColor(200);
    doc.line(14, 40, 196, 40);
    
    doc.setFontSize(14);
    doc.setTextColor(40, 60, 30);
    doc.text('Summary Metrics', 14, 50);

    doc.setFontSize(11);
    doc.setTextColor(50);
    doc.text(`Total Spending:`, 14, 60);
    doc.setFont(undefined, 'bold');
    doc.text(`${formatCurrency(stats.total)}`, 60, 60);
    doc.setFont(undefined, 'normal');

    doc.text(`Top Category:`, 14, 68);
    doc.setFont(undefined, 'bold');
    doc.text(`${stats.topGroup ? stats.topGroup[0] : 'N/A'} (${stats.topGroup ? formatCurrency(stats.topGroup[1]) : '$0'})`, 60, 68);
    doc.setFont(undefined, 'normal');

    doc.text(`Major Payer:`, 14, 76);
    doc.setFont(undefined, 'bold');
    doc.text(`${stats.topPayer ? stats.topPayer[0] : 'N/A'} (${stats.topPayer ? formatCurrency(stats.topPayer[1]) : '$0'})`, 60, 76);
    doc.setFont(undefined, 'normal');

    // Transactions Table
    const tableData = filteredExpenses.map(e => [
      new Date(e.date).toLocaleDateString(),
      e.title,
      members.find(m => m.id === e.payerId)?.name || 'Unknown',
      groups.find(g => g.id === e.groupId)?.name || 'General',
      { content: formatCurrency(e.amount), styles: { halign: 'right' } }
    ]);

    autoTable(doc, {
      startY: 85,
      head: [['Date', 'Description', 'Payer', 'Group', 'Amount']],
      body: tableData,
      headStyles: { fillColor: [40, 60, 30], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [245, 247, 242] },
      margin: { top: 85 },
      theme: 'striped'
    });

    const filename = `Report_${reportType}_${selectedYear}${reportType === 'monthly' ? '_' + monthNames[selectedMonth] : ''}.pdf`;
    doc.save(filename);
  };

  return (
    <div className="space-y-6">
      <Card title="Report Settings">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-olive-600 tracking-wider">Scope</label>
            <div className="flex bg-olive-100 p-1 rounded-lg">
                <button 
                    onClick={() => setReportType('monthly')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${reportType === 'monthly' ? 'bg-white text-olive-900 shadow-sm' : 'text-olive-500 hover:text-olive-700'}`}
                >
                    Monthly
                </button>
                <button 
                    onClick={() => setReportType('annual')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${reportType === 'annual' ? 'bg-white text-olive-900 shadow-sm' : 'text-olive-500 hover:text-olive-700'}`}
                >
                    Annual
                </button>
            </div>
          </div>

          <div className="space-y-1 flex-1 min-w-[120px]">
            <label className="text-[10px] font-bold uppercase text-olive-600 tracking-wider">Year</label>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full bg-olive-50 border border-olive-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-olive-500 focus:outline-none"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {reportType === 'monthly' && (
            <div className="space-y-1 flex-1 min-w-[140px]">
              <label className="text-[10px] font-bold uppercase text-olive-600 tracking-wider">Month</label>
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full bg-olive-50 border border-olive-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-olive-500 focus:outline-none"
              >
                {monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
            </div>
          )}

          <button 
            onClick={handleDownloadPDF}
            disabled={filteredExpenses.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-olive-800 text-white rounded-lg text-sm font-bold shadow-md hover:bg-olive-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            <FileDown size={16} />
            <span>Download PDF</span>
          </button>
        </div>
      </Card>

      {filteredExpenses.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-olive-200">
            <Calendar size={48} className="mx-auto text-olive-200 mb-4" />
            <p className="text-olive-600 font-medium">No expenses found for this period.</p>
            <p className="text-xs text-olive-400 mt-1">Try selecting a different month or year.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-olive-900 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden">
                <h4 className="text-olive-300 text-[10px] font-bold uppercase tracking-widest mb-1">Total Spending</h4>
                <div className="text-3xl font-extrabold">{formatCurrency(stats.total)}</div>
                <TrendingUp size={60} className="absolute -right-4 -bottom-4 text-white opacity-5" />
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-olive-100 flex items-center gap-4">
                <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                    <PieChart size={24} />
                </div>
                <div>
                    <h4 className="text-olive-500 text-[10px] font-bold uppercase tracking-widest">Top Category</h4>
                    <div className="text-lg font-bold text-olive-900">{stats.topGroup ? stats.topGroup[0] : 'None'}</div>
                    <div className="text-xs text-olive-400">{stats.topGroup ? formatCurrency(stats.topGroup[1]) : '$0'}</div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-olive-100 flex items-center gap-4">
                <div className="p-3 bg-olive-50 rounded-xl text-olive-600">
                    <TrendingUp size={24} />
                </div>
                <div>
                    <h4 className="text-olive-500 text-[10px] font-bold uppercase tracking-widest">Major Payer</h4>
                    <div className="text-lg font-bold text-olive-900">{stats.topPayer ? stats.topPayer[0] : 'None'}</div>
                    <div className="text-xs text-olive-400">{stats.topPayer ? formatCurrency(stats.topPayer[1]) : '$0'}</div>
                </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Spending by Group">
              <div className="space-y-4">
                {Object.entries(stats.groupBreakdown).sort((a,b) => b[1]-a[1]).map(([name, amount]) => {
                  const percentage = (amount / stats.total) * 100;
                  return (
                    <div key={name} className="space-y-1.5">
                      <div className="flex justify-between items-end">
                        <span className="text-sm font-bold text-olive-800">{name}</span>
                        <span className="text-sm font-medium text-olive-600">{formatCurrency(amount)}</span>
                      </div>
                      <div className="w-full h-2 bg-olive-50 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-olive-500 rounded-full transition-all duration-1000" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card title="Latest Transactions (PDF Preview)">
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                {filteredExpenses.slice(0, 10).map(e => (
                  <div key={e.id} className="flex items-center justify-between p-3 rounded-xl bg-olive-50/50 border border-olive-100/50">
                    <div className="min-w-0 flex-1 mr-4">
                      <div className="text-sm font-bold text-olive-900 truncate">{e.title}</div>
                      <div className="text-[10px] text-olive-500 flex items-center gap-1.5">
                        <span className="bg-white px-1.5 py-0.5 rounded border border-olive-200">{members.find(m => m.id === e.payerId)?.name || '?'}</span>
                        <span>{new Date(e.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="text-sm font-bold text-olive-800">{formatCurrency(e.amount)}</div>
                  </div>
                ))}
                {filteredExpenses.length > 10 && (
                  <p className="text-center text-[10px] text-olive-400 italic pt-2">Download PDF to see full history ({filteredExpenses.length} total)</p>
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};