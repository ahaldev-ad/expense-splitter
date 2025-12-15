
export interface Member {
  id: string;
  name: string;
}

export interface Group {
  id: string;
  name: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  payerId: string;
  sharedByIds: string[]; // For settlements, this contains the receiver's ID
  date: number; // Timestamp
  type?: 'expense' | 'settlement'; // New field, defaults to 'expense' if undefined
  groupId: string; // The group/event this expense belongs to
}

export interface Settlement {
  from: string; // Member ID
  to: string; // Member ID
  amount: number;
}

export interface BalanceSummary {
  memberId: string;
  totalPaid: number;
  fairShare: number;
  balance: number; // Positive = Owed money, Negative = Owes money
}
