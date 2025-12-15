export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
};

export const calculateBalances = (members, expenses) => {
  const summary = {};

  // Initialize
  members.forEach(m => {
    summary[m.id] = {
      memberId: m.id,
      totalPaid: 0,
      fairShare: 0,
      balance: 0,
    };
  });

  expenses.forEach(expense => {
    // Explicitly cast to number to ensure no string math occurs
    const amount = Number(expense.amount);

    if (expense.type === 'settlement') {
        // Settlement Logic: Direct transfer from Payer to Receiver
        const payer = summary[expense.payerId];
        const receiverId = expense.sharedByIds[0];
        const receiver = summary[receiverId];

        if (payer) {
            payer.balance += amount;
        }
        if (receiver) {
            receiver.balance -= amount;
        }

    } else {
        // Regular Expense Logic
        const payer = summary[expense.payerId];
        if (payer) {
            payer.totalPaid += amount;
            payer.balance += amount;
        }

        const splitCount = expense.sharedByIds.length;
        if (splitCount > 0) {
            const splitAmount = amount / splitCount;
            expense.sharedByIds.forEach(sharedId => {
                if (summary[sharedId]) {
                    summary[sharedId].fairShare += splitAmount;
                    summary[sharedId].balance -= splitAmount;
                }
            });
        }
    }
  });

  return Object.values(summary);
};

export const calculateSettlements = (balances) => {
  // CRITICAL FIX: Clone the array and the objects inside it to prevent mutating the Dashboard's view
  const workingBalances = balances.map(b => ({ ...b }));

  let debtors = workingBalances
    .filter(b => b.balance < -0.01)
    .sort((a, b) => a.balance - b.balance); // Ascending (most negative first)
  
  let creditors = workingBalances
    .filter(b => b.balance > 0.01)
    .sort((a, b) => b.balance - a.balance); // Descending (most positive first)

  const settlements = [];

  let i = 0; // debtor index
  let j = 0; // creditor index

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const amountOwed = Math.abs(debtor.balance);
    const amountToReceive = creditor.balance;

    // The settlement is the smaller of what is owed vs what is needed
    const settlementAmount = Math.min(amountOwed, amountToReceive);

    if (settlementAmount > 0.01) {
        settlements.push({
            from: debtor.memberId,
            to: creditor.memberId,
            amount: settlementAmount
          });
    }

    // Adjust remaining balances in our working copy
    debtor.balance += settlementAmount;
    creditor.balance -= settlementAmount;

    // Move indices if settled (using a small epsilon for float precision)
    if (Math.abs(debtor.balance) < 0.01) i++;
    if (creditor.balance < 0.01) j++;
  }

  return settlements;
};