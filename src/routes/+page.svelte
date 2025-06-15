<script lang="ts">
  import Database from "@tauri-apps/plugin-sql";
  import type { Transaction } from '../lib/types';
  import { onMount } from 'svelte';
  import { getTransactions, addTransaction, deleteAllTransactions } from '../lib/db';

  const DB_URL = "sqlite:demeter2.db";

  let transactions: Transaction[] = [];

  async function getTransactions_() {
    try {
      const db = await Database.load(DB_URL);
      const result = await getTransactions(db);
      transactions = result;
    } catch (error) {
      console.log(error);
    }
  }

  async function addTransaction_(tx: Omit<Transaction, "id">) {
    try {
      const db = await Database.load(DB_URL);
      await addTransaction(db, tx);
    } catch (error) {
      console.log(error);
    }
  }

  async function addSampleTransactions_() {
    try {
      const db = await Database.load(DB_URL);
      for (let i = 0; i < 100; i++) {
        await addTransaction(db, {
          date: new Date().toISOString().split("T")[0],
          description: `Sample transaction ${i + 1}`,
          amount: Math.floor(Math.random() * 1000),
          filename: "sample-transaction"
        });
      }
    } catch (error) {
      console.log(error);
    }
  }

  onMount(() => {
    getTransactions_();
  });

async function deleteAllTransactions_() {
  try {
    const db = await Database.load(DB_URL);
    await deleteAllTransactions(db);
    await getTransactions_();
  } catch (error) {
    console.log(error);
  }
}

</script>
<main class="container">
  <div class="button-row">
    <button onclick={() => addTransaction_({date: "2025-06-14", description: "cool", amount: 1000, filename: undefined})}>Add Transactions</button>
    <button onclick={addSampleTransactions_}>Add Sample Transactions</button>
      <button onclick={deleteAllTransactions_}>Delete All Transactions</button>
  </div>
  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Date</th>
        <th>Description</th>
        <th>Amount</th>
        <th>Filename</th>
      </tr>
    </thead>
    <tbody>
      {#each transactions as tx}
        <tr>
          <td>{tx.id}</td>
          <td>{tx.date}</td>
          <td>{tx.description}</td>
          <td>{tx.amount}</td>
          <td>{tx.filename}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</main>

<style>
:root {
  font-family: Inter, Avenir, Helvetica, Arial, sans-serif;
  font-size: 16px;
  line-height: 24px;
  font-weight: 400;
  color: #0f0f0f;
  background-color: #f6f6f6;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-text-size-adjust: 100%;
}

.container {
  margin: 0;
  padding-top: 10vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
}

.button-row {
  display: flex;
  gap: 1rem;
  justify-content: flex-start;
  margin-bottom: 1rem;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  border: 1px solid #ccc;
  padding: 0.5rem;
  text-align: left;
}

button {
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
  color: #0f0f0f;
  background-color: #ffffff;
  cursor: pointer;
  transition: border-color 0.25s;
  box-shadow: 0 2px 2px rgba(0, 0, 0, 0.2);
}

button:hover {
  border-color: #396cd8;
}

button:active {
  border-color: #396cd8;
  background-color: #e8e8e8;
}

@media (prefers-color-scheme: dark) {
  :root {
    color: #f6f6f6;
    background-color: #2f2f2f;
  }

  button {
    color: #ffffff;
    background-color: #0f0f0f98;
  }
  button:active {
    background-color: #0f0f0f69;
  }
}
</style>
