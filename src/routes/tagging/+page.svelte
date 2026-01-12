<script lang="ts">
  import { onMount } from 'svelte';
  import { getTransactions } from '../../lib/db';
  import { filterStore } from '../../lib/filterStore';
  import type { Transaction, Filter } from '../../lib/types';

  let filter = $state<Filter>({ filename: undefined, startDate: null, endDate: null });
  let transactions = $state<Transaction[]>([]);

  const formatAmount = (cents: number): string => {
    const sign = cents < 0 ? '-' : '';
    const abs = Math.abs(cents);
    const dollars = (abs / 100).toFixed(2);
    return `${sign}$${dollars}`;
  };

  const updateTransactions = async () => {
    let txs = await getTransactions();
    if (filter.filename && filter.filename !== 'All') {
      txs = txs.filter(t => t.filename === filter.filename);
    }
    txs = txs.filter(t => filter.startDate ? t.date >= filter.startDate : true);
    txs = txs.filter(t => filter.endDate ? t.date <= filter.endDate : true);
    transactions = txs;
  };

  // Subscribe to filter store and update transactions when filter changes
  filterStore.subscribe(value => {
    filter = value;
    updateTransactions();
  });

  onMount(async () => {
    // Initialize filter from URL
    filterStore.initializeFromUrl();
    await updateTransactions();
  });
</script>

<section class="container">
  <h1>Tagging</h1>
  <p class="subtitle" style="margin-top:0.5rem; margin-bottom:1rem;">
    {#if !filter.filename && !filter.startDate && !filter.endDate}
      No Filter - Showing all transactions
    {:else}
      Filtered on
      {#if filter.filename} filename: {filter.filename}{/if}
      {#if filter.startDate} from {filter.startDate.toISOString().split('T')[0]}{/if}
      {#if filter.endDate} to {filter.endDate.toISOString().split('T')[0]}{/if}
      ({transactions.length} transactions)
    {/if}
  </p>
  <p>Tagging functionality coming soon. Currently showing {transactions.length} filtered transactions.</p>
</section>
