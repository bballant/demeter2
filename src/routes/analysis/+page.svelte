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
  let totalSpending = 0;
  let avgSpending = 0;
  let medianSpending = 0;
  let weeklyAvgSpending = 0;
  let topPayees: { description: string; total: number }[] = [];

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
    const spendTxs = txs.filter(t => t.amount < 0);
    if (spendTxs.length > 0) {
      totalSpending = spendTxs.reduce((sum, t) => sum + t.amount, 0);
      avgSpending = totalSpending / spendTxs.length;
      const sorted = spendTxs.map(t => t.amount).sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      medianSpending = sorted.length % 2 !== 0
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2;
      // weekly average spending over date range of spend transactions
      const dates = spendTxs.map(t => new Date(t.date));
      const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
      const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
      const days = (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24) + 1;
      const weeks = days / 7 || 1;
      weeklyAvgSpending = totalSpending / weeks;
      // top 5 payees by total spending
      const sumByDesc: Record<string, number> = {};
      spendTxs.forEach(t => {
        sumByDesc[t.description] = (sumByDesc[t.description] || 0) + t.amount;
      });
      topPayees = Object.entries(sumByDesc)
        .map(([description, total]) => ({ description, total }))
        .sort((a, b) => a.total - b.total)
        .slice(0, 5);
    }
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
        <td class="key-cell">Total spending</td>
        <td class="value-cell">{formatAmount(totalSpending * 100)}</td>
      </tr>
      <tr>
        <td class="key-cell">Average spending</td>
        <td class="value-cell">{formatAmount(avgSpending * 100)}</td>
      </tr>
      <tr>
        <td class="key-cell">Median spending</td>
        <td class="value-cell">{formatAmount(medianSpending * 100)}</td>
      </tr>
      <tr>
        <td class="key-cell">Weekly average spending</td>
        <td class="value-cell">{formatAmount(weeklyAvgSpending * 100)}</td>
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
      <tr>
        <td class="key-cell">Top 5 payees (by amount)</td>
        <td class="value-cell">
          <ul>
            {#each topPayees as p}
              <li>{p.description}: {formatAmount(p.total * 100)}</li>
            {/each}
          </ul>
        </td>
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
