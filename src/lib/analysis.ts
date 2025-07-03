import type { Transaction, TransactionAnalysis } from './types';

export function analyzeTransactions(transactions: Transaction[]): TransactionAnalysis {
  const totalCount = transactions.length;
  
  if (totalCount === 0) {
    return {
      totalCount: 0,
      mostExpensive: null,
      topDescription: "",
      topDescriptorCount: 0,
      totalSpending: 0,
      avgSpending: 0,
      medianSpending: 0,
      weeklyAvgSpending: 0,
      topPayees: []
    };
  }

  // Find most expensive transaction (most negative amount)
  const mostExpensive = transactions.reduce(
    (prev, curr) => (curr.amount < prev.amount ? curr : prev),
    transactions[0]
  );

  // Calculate most frequent description
  const freq: Record<string, number> = {};
  transactions.forEach(t => {
    freq[t.description] = (freq[t.description] || 0) + 1;
  });
  const [topDescription, topDescriptorCount] = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])[0] || ["", 0];

  // Calculate spending metrics (negative amounts only)
  const spendTxs = transactions.filter(t => t.amount < 0);
  let totalSpending = 0;
  let avgSpending = 0;
  let medianSpending = 0;
  let weeklyAvgSpending = 0;
  let topPayees: { description: string; total: number }[] = [];

  if (spendTxs.length > 0) {
    totalSpending = spendTxs.reduce((sum, t) => sum + t.amount, 0);
    avgSpending = totalSpending / spendTxs.length;

    // Calculate median spending
    const sorted = spendTxs.map(t => t.amount).sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    medianSpending = sorted.length % 2 !== 0
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;

    // Calculate weekly average spending over date range
    const dates = spendTxs.map(t => new Date(t.date));
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    const days = (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24) + 1;
    const weeks = days / 7 || 1;
    weeklyAvgSpending = totalSpending / weeks;

    // Calculate top 20 payees by total spending
    const sumByDesc: Record<string, number> = {};
    spendTxs.forEach(t => {
      sumByDesc[t.description] = (sumByDesc[t.description] || 0) + t.amount;
    });
    topPayees = Object.entries(sumByDesc)
      .map(([description, total]) => ({ description, total }))
      .sort((a, b) => a.total - b.total)
      .slice(0, 20);
  }

  return {
    totalCount,
    mostExpensive,
    topDescription,
    topDescriptorCount,
    totalSpending,
    avgSpending,
    medianSpending,
    weeklyAvgSpending,
    topPayees
  };
}
