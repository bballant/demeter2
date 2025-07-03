import Database from "@tauri-apps/plugin-sql";
import type { Transaction } from './types';

const DB_URL = "sqlite:demeter2.db";
let dbInstance: any = null;

async function getDb() {
  if (!dbInstance) {
    dbInstance = await Database.load(DB_URL);
  }
  return dbInstance;
}

export async function getTransactions(): Promise<Transaction[]> {
  const db = await getDb();
  return await db.select("SELECT * FROM txn");
}

export async function addTransaction(tx: Omit<Transaction, "id">): Promise<void> {
  const db = await getDb();
  await db.execute("INSERT INTO txn (date, description, amount, filename) VALUES ($1, $2, $3, $4)", [
    tx.date,
    tx.description,
    tx.amount,
    tx.filename,
  ]);
}

export async function deleteAllTransactions(): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM txn");
}

export async function getFilenames(): Promise<string[]> {
  try {
    const db = await getDb();
    const rows: { filename: string }[] = await db.select("SELECT DISTINCT filename FROM txn WHERE filename IS NOT NULL");
    return rows.map(r => r.filename);
  } catch {
    return [];
  }
}

export async function deleteTransactionsByFilename(filename: string): Promise<void> {
  const db = await getDb();
  if (filename === "All") {
    await deleteAllTransactions();
  } else {
    await db.execute("DELETE FROM txn WHERE filename = $1", [filename]);
  }
}

export async function deleteByIds(ids: number[]): Promise<void> {
  if (!ids || ids.length === 0) return;
  const db = await getDb();
  const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
  const sql = `DELETE FROM txn WHERE id IN (${placeholders})`;
  await db.execute(sql, ids);
}
