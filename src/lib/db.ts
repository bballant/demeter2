import type { Transaction } from './types';

export async function getTransactions(db: any): Promise<Transaction[]> {
  return await db.select("SELECT * FROM txn");
}

export async function addTransaction(db: any, tx: Omit<Transaction, "id">): Promise<void> {
  await db.execute("INSERT INTO txn (date, description, amount, filename) VALUES ($1, $2, $3, $4)", [
    tx.date,
    tx.description,
    tx.amount,
    tx.filename,
  ]);
}

export async function deleteAllTransactions(db: any): Promise<void> {
  await db.execute("DELETE FROM txn");
}
