<script lang="ts">
  import Database from "@tauri-apps/plugin-sql";
  import type { Transaction } from '../lib/types';
  import { onMount } from 'svelte';
  import { getTransactions, addTransaction, deleteAllTransactions, getFilenames, deleteTransactionsByFilename } from '../lib/db';

  const DB_URL = "sqlite:demeter2.db";

  let transactions: Transaction[] = [];
  let filenames: string[] = [];
  let selectedFilename: string = "All";
  let fileInput: HTMLInputElement;
  let startDate: string = "";
  let endDate: string = "";

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
      await getTransactions_();
      await loadFilenames_();
    } catch (error) {
      console.log(error);
    }
  }


  onMount(() => {
    getTransactions_();
    loadFilenames_();
  });

async function loadFilenames_() {
  try {
    const db = await Database.load(DB_URL);
    const names = await getFilenames(db);
    filenames = ["All", ...names];
  } catch (error) {
    console.log(error);
  }
}

async function deleteByFilename_() {
  try {
    const db = await Database.load(DB_URL);
    await deleteTransactionsByFilename(db, selectedFilename);
    await getTransactions_();
    await loadFilenames_();
  } catch (error) {
    console.log(error);
  }
}

async function handleCSVUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const text = await file.text();
  const lines = text.split("\n").filter(line => line.trim());
  // drop header
  lines.shift();
  const filenameStr = file.name;
  const db = await Database.load(DB_URL);
  for (const line of lines) {
    const cols = line.split(",");
    const date = cols[0].replace(/"/g, "");
    const description = cols[2]?.replace(/"/g, "") || "";
    const amount = Number(cols[4]?.replace(/"/g, "")) || 0;
    await addTransaction(db, { date, description, amount, filename: filenameStr });
  }
  await getTransactions_();
  await loadFilenames_();
}

async function filterTransactions_() {
  try {
    const db = await Database.load(DB_URL);
    let result = await getTransactions(db);
    if (selectedFilename !== "All") {
      result = result.filter(tx => tx.filename === selectedFilename);
    }
    if (startDate) {
      result = result.filter(tx => tx.date >= startDate);
    }
    if (endDate) {
      result = result.filter(tx => tx.date <= endDate);
    }
    transactions = result;
  } catch (error) {
    console.log(error);
  }
}

</script>
<main class="container">
  <div class="button-row">
    <select bind:value={selectedFilename} onchange={filterTransactions_}>
      <option value="All">Show All</option>
      {#each filenames.slice(1) as fname}
        <option value={fname}>{fname}</option>
      {/each}
    </select>
    <input
      type="date"
      bind:value={startDate}
      placeholder="YYYY-MM-DD"
      pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}"
      onblur={filterTransactions_}
    />
    <input
      type="date"
      bind:value={endDate}
      placeholder="YYYY-MM-DD"
      pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}"
      onblur={filterTransactions_}
    />
    <button onclick={() => fileInput.click()}>Upload CSV</button>
    <input type="file" accept=".csv" bind:this={fileInput} onchange={handleCSVUpload} style="display:none" />
    <button onclick={deleteByFilename_}>Delete shown</button>
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
