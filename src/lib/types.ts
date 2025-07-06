export type Transaction = {
  id: number;
  date: Date;
  description: string;
  amount: number;
  filename: string | undefined;
};

export type SortOrder = "asc" | "desc";

export type SortBy = "date" | "description" | "amount";

export type Sort = {
  order: SortOrder;
  by: SortBy;
};

export type Filter = {
  filename: string | undefined;
  startDate: Date | null; // null for DatePicker compatibility
  endDate: Date | null; // null for DatePicker compatibility
};

export type TransactionAnalysis = {
  totalCount: number;
  mostExpensive: Transaction | null;
  topDescription: string;
  topDescriptorCount: number;
  totalSpending: number;
  avgSpending: number;
  medianSpending: number;
  weeklyAvgSpending: number;
  topPayees: { description: string; total: number }[];
};
