<script lang="ts">
  import { onMount } from 'svelte';
  import Database from '@tauri-apps/plugin-sql';
  import { getTransactions } from '../../lib/db';
  import type { Transaction } from '../../lib/types';

  let filename: string | undefined;
  let startDate: string | undefined;
  let endDate: string | undefined;

  const DB_URL = "sqlite:demeter2.db";

  let totalCount = 0;
  let mostExpensive: Transaction | null = null;
  let topDescription = "";
  let topDescriptorCount = 0;

  onMount(async () => {
    const url = new URL(window.location.href);
    filename  = url.searchParams.get('filename') || undefined;
    startDate = url.searchParams.get('startDate') || undefined;
    endDate   = url.searchParams.get('endDate')   || undefined;

    const db = await Database.load(DB_URL);
    let txs = await getTransactions(db);
    if (filename && filename !== 'All') {
      txs = txs.filter(t => t.filename === filename);
    }

    txs = txs.filter(t => startDate ? t.date >= startDate : true);
    txs = txs.filter(t => endDate ? t.date <= endDate : true);

    totalCount = txs.length;
    if (totalCount === 0) return;

    mostExpensive = txs.reduce(
      (prev, curr) => (curr.amount < prev.amount ? curr : prev),
      txs[0]
    );

    const freq: Record<string, number> = {};
    txs.forEach(t => {
      freq[t.description] = (freq[t.description] || 0) + 1;
    });
    const [desc, count] = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])[0];
    topDescription = desc;
    topDescriptorCount = count;
  });

  function formatAmount(cents: number): string {
    const sign = cents < 0 ? '-' : '';
    const abs = Math.abs(cents);
    return `${sign}$${(abs / 100).toFixed(2)}`;
  }
</script>

<main class="container">
  <h1>Transaction Analysis</h1>
  <p class="subtitle" style="margin-top:0.5rem; margin-bottom:1rem;">
    {#if !filename && !startDate && !endDate}
      No Filter
    {:else}
      Filtered on
      {#if filename} filename: {filename}{/if}
      {#if startDate} from {startDate}{/if}
      {#if endDate} to {endDate}{/if}
    {/if}
  </p>
  {#if totalCount === 0}
    <p>No transactions match your filter.</p>
  {:else}
    <table class="analysis-table" style="margin: auto;">
      <tbody>
      <tr>
        <td class="key-cell">Total transactions</td>
        <td class="value-cell">{totalCount}</td>
      </tr>
      <tr>
        <td class="key-cell">Most expensive</td>
        <td class="value-cell">
          {#if !mostExpensive}
            No transactions available
          {:else}
            {mostExpensive.description} ({formatAmount(mostExpensive.amount * 100)}
            on {mostExpensive.date})
          {/if}
        </td>
      </tr>
      <tr>
        <td class="key-cell">Most frequent description</td>
        <td class="value-cell">{topDescription} ({topDescriptorCount} times)</td>
      </tr>
      </tbody>
    </table>
  {/if}
  <button
    onclick={() => {
      const params = new URLSearchParams({
        filename: filename ?? "",
        startDate: startDate ?? "",
        endDate: endDate ?? ""
      });
      window.location.href = `/?${params.toString()}`;
    }}
    style="width: auto; align-self: center; margin-top: 1rem;"
  >
    Close
  </button>
</main>
