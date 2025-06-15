import type { Transaction } from './types';

export async function getTransactions(db: any): Promise<Transaction[]> {
  return await db.select<Transaction[]>("SELECT * FROM transaction");
}

export async function addTransaction(db: any, tx: Omit<Transaction, "id">): Promise<void> {
  await db.execute("INSERT INTO transaction (date, description, amount, filename) VALUES ($1, $2, $3, $4)", [
    tx.date,
    tx.description,
    tx.amount,
    tx.filename,
  ]);
}
