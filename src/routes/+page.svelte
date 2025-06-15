<script lang="ts">
  import Database from "@tauri-apps/plugin-sql";
  import type { Transaction } from '../lib/types';
  import { getTransactions,  addTransaction} from '../lib/db';

  const DB_URL = "sqlite:demeter2.db";

  async function getTransactions_() {
    try {
      const db = await Database.load(DB_URL);
      await getTransactions(db).then((transactions) => {
        console.log(transactions);
      });
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
          filename: undefined
        });
      }
    } catch (error) {
      console.log(error);
    }
  }

</script>
<main class="container">

<button onclick={() => addTransaction_({date: "2025-06-14", description: "cool", amount: 1000, filename: undefined})}>Add Transactions</button>
<button onclick={getTransactions_}>Print Transactions</button>
<button onclick={addSampleTransactions_}>Add Sample Transactions</button>

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
