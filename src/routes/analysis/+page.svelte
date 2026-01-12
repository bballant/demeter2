<script lang="ts">
  import { onMount } from "svelte";
  import { getTransactions } from "../../lib/db";
  import { analyzeTransactions } from "../../lib/analysis";
  import type { TransactionAnalysis, Filter } from "../../lib/types";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";

  // Derive filter from URL params (source of truth)
  let filter = $state<Filter>({
    filename: undefined,
    startDate: null,
    endDate: null,
  });

  // Initialize filter from URL on mount and when page changes
  const updateFilterFromUrl = () => {
    filter = {
      filename: $page.url.searchParams.get("filename") || undefined,
      startDate: $page.url.searchParams.get("startDate")
        ? new Date($page.url.searchParams.get("startDate")!)
        : null,
      endDate: $page.url.searchParams.get("endDate")
        ? new Date($page.url.searchParams.get("endDate")!)
        : null,
    };
  };

  // Update filter when page URL changes
  $effect(() => {
    // Access $page to track it
    const url = $page.url;
    updateFilterFromUrl();
  });
  let analysis = $state<TransactionAnalysis>({
    totalCount: 0,
    mostExpensive: null,
    topDescription: "",
    topDescriptorCount: 0,
    totalSpending: 0,
    avgSpending: 0,
    medianSpending: 0,
    weeklyAvgSpending: 0,
    topPayees: [],
  });

  const updateAnalysis = async () => {
    let txs = await getTransactions();
    if (filter.filename && filter.filename !== "All") {
      txs = txs.filter((t) => t.filename === filter.filename);
    }

    txs = txs.filter((t) =>
      filter.startDate ? t.date >= filter.startDate : true
    );
    txs = txs.filter((t) => (filter.endDate ? t.date <= filter.endDate : true));

    analysis = analyzeTransactions(txs);
  };

  // React to filter changes (derived from URL)
  $effect(() => {
    updateAnalysis();
  });

  onMount(() => {
    // Initialize filter from URL on mount
    updateFilterFromUrl();
  });

  const formatAmount = (cents: number): string => {
    const sign = cents < 0 ? "-" : "";
    const abs = Math.abs(cents);
    return `${sign}$${(abs / 100).toFixed(2)}`;
  };
</script>

<main class="container">
  <h1>Transaction Analysis</h1>
  <p class="subtitle" style="margin-top:0.5rem; margin-bottom:1rem;">
    {#if !filter.filename && !filter.startDate && !filter.endDate}
      No Filter
    {:else}
      Filtered on
      {#if filter.filename && filter.filename !== "All"}
        filename: {filter.filename}
      {/if}
      {#if filter.startDate}
        from {filter.startDate.toISOString().split("T")[0]}
      {/if}
      {#if filter.endDate}
        to {filter.endDate.toISOString().split("T")[0]}
      {/if}
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
              {analysis.mostExpensive.description} ({formatAmount(
                analysis.mostExpensive.amount
              )}
              on {analysis.mostExpensive.date.toISOString().split("T")[0]})
            {/if}
          </td>
        </tr>
        <tr>
          <td class="key-cell">Most frequent payee</td>
          <td class="value-cell"
            >{analysis.topDescription} ({analysis.topDescriptorCount} times)</td
          >
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
    onclick={() => goto("/")}
    style="width: auto; align-self: center; margin-top: 1rem;"
  >
    Close
  </button>
</main>
