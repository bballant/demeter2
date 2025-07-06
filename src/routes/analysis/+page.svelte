<script lang="ts">
  import { onMount } from 'svelte';
  import { getTransactions } from '../../lib/db';
  import { analyzeTransactions } from '../../lib/analysis';
  import type { TransactionAnalysis } from '../../lib/types';

  let filename: string | undefined;
  let startDate: Date | null;
  let endDate: Date | null;
  let analysis: TransactionAnalysis = {
    totalCount: 0,
    mostExpensive: null,
    topDescription: "",
    topDescriptorCount: 0,
    totalSpending: 0,
    avgSpending: 0,
    medianSpending: 0,
    weeklyAvgSpending: 0,
    topPayees: []
  };

  onMount(async () => {
    const url = new URL(window.location.href);
    filename = url.searchParams.get('filename') || undefined;
    const startDateStr = url.searchParams.get('startDate');
    const endDateStr = url.searchParams.get('endDate');
    startDate = startDateStr ? new Date(startDateStr) : null;
    endDate = endDateStr ? new Date(endDateStr) : null;

    let txs = await getTransactions();
    if (filename && filename !== 'All') {
      txs = txs.filter(t => t.filename === filename);
    }

    txs = txs.filter(t => startDate ? t.date >= startDate : true);
    txs = txs.filter(t => endDate ? t.date <= endDate : true);

    analysis = analyzeTransactions(txs);
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
      {#if startDate} from {startDate.toISOString().split('T')[0]}{/if}
      {#if endDate} to {endDate.toISOString().split('T')[0]}{/if}
    {/if}
  </p>
  {#if analysis.totalCount === 0}
    <p>No transactions match your filter.</p>
  {:else}
    <table class="analysis-table" style="margin: auto;">
      <tbody>
      <tr>
        <td class="key-cell">Total transactions</td>
        <td class="value-cell">{analysis.totalCount}</td>
      </tr>
      <tr>
        <td class="key-cell">Total spending</td>
        <td class="value-cell">{formatAmount(analysis.totalSpending)}</td>
      </tr>
      <tr>
        <td class="key-cell">Average spending</td>
        <td class="value-cell">{formatAmount(analysis.avgSpending)}</td>
      </tr>
      <tr>
        <td class="key-cell">Median spending</td>
        <td class="value-cell">{formatAmount(analysis.medianSpending)}</td>
      </tr>
      <tr>
        <td class="key-cell">Weekly average spending</td>
        <td class="value-cell">{formatAmount(analysis.weeklyAvgSpending)}</td>
      </tr>
      <tr>
        <td class="key-cell">Most expensive tx</td>
        <td class="value-cell">
          {#if !analysis.mostExpensive}
            No transactions available
          {:else}
            {analysis.mostExpensive.description} ({formatAmount(analysis.mostExpensive.amount)}
            on {analysis.mostExpensive.date.toISOString().split('T')[0]})
          {/if}
        </td>
      </tr>
      <tr>
        <td class="key-cell">Most frequent payee</td>
        <td class="value-cell">{analysis.topDescription} ({analysis.topDescriptorCount} times)</td>
      </tr>
      <tr>
        <td class="key-cell">Top 20 payees (by amount)</td>
        <td class="value-cell">
          <ul>
            {#each analysis.topPayees as p}
              <li>{p.description}: {formatAmount(p.total)}</li>
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
        startDate: startDate ? startDate.toISOString().split('T')[0] : "",
        endDate: endDate ? endDate.toISOString().split('T')[0] : ""
      });
      window.location.href = `/?${params.toString()}`;
    }}
    style="width: auto; align-self: center; margin-top: 1rem;"
  >
    Close
  </button>
</main>
