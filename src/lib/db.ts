import Database from "@tauri-apps/plugin-sql";
import type { Transaction } from './types';

const DB_URL = "sqlite:demeter2.db";
let dbInstance: Database | null = null;

const getDb = async (): Promise<Database> => {
  if (!dbInstance) {
    dbInstance = await Database.load(DB_URL);
  }
  return dbInstance;
};

export const getTransactions = async (): Promise<Transaction[]> => {
  const db = await getDb();
  return await db.select("SELECT * FROM txn");
};

export const addTransaction = async (tx: Omit<Transaction, "id">): Promise<void> => {
  const db = await getDb();
  await db.execute("INSERT INTO txn (date, description, amount, filename) VALUES ($1, $2, $3, $4)", [
    tx.date,
    tx.description,
    tx.amount,
    tx.filename,
  ]);
};

export const deleteAllTransactions = async (): Promise<void> => {
  const db = await getDb();
  await db.execute("DELETE FROM txn");
};

export const getFilenames = async (): Promise<string[]> => {
  try {
    const db = await getDb();
    const rows: { filename: string }[] = await db.select("SELECT DISTINCT filename FROM txn WHERE filename IS NOT NULL");
    return rows.map(r => r.filename);
  } catch {
    return [];
  }
};

export const deleteTransactionsByFilename = async (filename: string): Promise<void> => {
  const db = await getDb();
  if (filename === "All") {
    await deleteAllTransactions();
  } else {
    await db.execute("DELETE FROM txn WHERE filename = $1", [filename]);
  }
};

export const deleteByIds = async (ids: number[]): Promise<void> => {
  if (!ids || ids.length === 0) return;
  const db = await getDb();
  const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
  const sql = `DELETE FROM txn WHERE id IN (${placeholders})`;
  await db.execute(sql, ids);
};
