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

export async function getFilenames(db: any): Promise<string[]> {
  try {
    const rows: { filename: string }[] = await db.select("SELECT DISTINCT filename FROM txn WHERE filename IS NOT NULL");
    return rows.map(r => r.filename);
  } catch {
    return [];
  }
}

export async function deleteTransactionsByFilename(db: any, filename: string): Promise<void> {
  if (filename === "All") {
    await deleteAllTransactions(db);
  } else {
    await db.execute("DELETE FROM txn WHERE filename = $1", [filename]);
  }
}
