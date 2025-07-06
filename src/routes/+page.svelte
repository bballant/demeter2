<script lang="ts">
  import { parseCsv } from '../lib/csv';
  import type { Transaction, Filter, Sort, SortBy } from '../lib/types';
  import { onMount } from 'svelte';
  import { getTransactions, addTransaction, getFilenames, deleteByIds } from '../lib/db';
  import { DatePicker } from '@svelte-plugins/datepicker';

  let datePickerIsOpen = $state(false);
  const toggleDatePicker = () => (datePickerIsOpen = !datePickerIsOpen);

  const formatAmount = (cents: number): string => {
    const sign = cents < 0 ? '-' : '';
    const abs = Math.abs(cents);
    const dollars = (abs / 100).toFixed(2);
    return `${sign}$${dollars}`;
  };

  let transactions = $state<Transaction[]>([]);
  let filenames = $state<string[]>([]);
  let filter = $state<Filter>({ filename: undefined, startDate: null, endDate: null });
  // Initialize file input element
  let fileInput: HTMLInputElement;
  let sort = $state<Sort>({ by: 'date', order: 'asc' });
  let showAbout = $state(false);

  // Computed values for DatePicker (needs strings)
  let datePickerStartDate = $derived(filter.startDate ? filter.startDate.toISOString().split('T')[0] : null);
  let datePickerEndDate = $derived(filter.endDate ? filter.endDate.toISOString().split('T')[0] : null);

  const clearFilter = () => {
    filter = { filename: undefined, startDate: null, endDate: null };
    datePickerIsOpen = false;
  };

  const getTransactionsLocal = async () => {
    try {
      const result = await getTransactions();
      transactions = result;
    } catch (error) {
      console.log(error);
    }
  };

  const addTransactionLocal = async (tx: Omit<Transaction, "id">) => {
    try {
      await addTransaction(tx);
      await getTransactionsLocal();
      await loadFilenames();
    } catch (error) {
      console.log(error);
    }
  };


  onMount(() => {
    const url = new URL(window.location.href);
    filter.filename = url.searchParams.get('filename') || undefined;
    const startDateStr = url.searchParams.get('startDate');
    const endDateStr = url.searchParams.get('endDate');
    filter.startDate = startDateStr ? new Date(startDateStr) : null;
    filter.endDate = endDateStr ? new Date(endDateStr) : null;
    getTransactionsLocal();
    loadFilenames();
    filterTransactions();
  });

const loadFilenames = async () => {
  try {
    const names = await getFilenames();
    filenames = ["All", ...names];
  } catch (error) {
    console.log(error);
  }
};

const deleteByFilter = async () => {
  try {
    const all = await getTransactions();
    const toDelete = all.filter(tx =>
      (filter.filename && filter.filename !== "All" ? tx.filename === filter.filename : true) &&
      (filter.startDate ? tx.date >= filter.startDate : true) &&
      (filter.endDate ? tx.date <= filter.endDate : true)
    );
    const ids = toDelete.map(tx => tx.id);
    await deleteByIds(ids);
    // reset filters after deletion
    filter = { filename: undefined, startDate: null, endDate: null };
    await getTransactionsLocal();
    await loadFilenames();
  } catch (error) {
    console.log(error);
  }
};

const handleCSVUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const text = await file.text();
  const txs = parseCsv(text, file.name);
  for (const tx of txs) {
    await addTransaction(tx);
  }
  await getTransactionsLocal();
  await loadFilenames();
};

const filterTransactions = async () => {
  try {
    let result = await getTransactions();
    if (filter.filename !== "All") {
      result = result.filter(tx => tx.filename === filter.filename);
    }
    const startDate = filter.startDate;
    console.log("Filter startDate:", startDate);
    if (startDate) {
      console.log("Filtering from start date:", filter.startDate);
      console.log(result[0]?.date);
      console.log(result[0]?.date >= startDate);
      result = result.filter(tx => tx.date >= startDate);
    }
    const endDate = filter.endDate;
    if (endDate) {
      result = result.filter(tx => tx.date <= endDate);
    }
    // apply sorting
    result.sort((a, b) => {
      let cmp = 0;
      if (sort.by === 'date') {
        cmp = a.date.getTime() - b.date.getTime();
      } else if (sort.by === 'description') {
        cmp = a.description.localeCompare(b.description);
      } else if (sort.by === 'amount') {
        cmp = a.amount - b.amount;
      }
      return sort.order === 'asc' ? cmp : -cmp;
    });
    transactions = result;
  } catch (error) {
    console.log(error);
  }
};

const handleDatePickerChange = () => {
  // Sync DatePicker string values back to filter Date objects
  filter.startDate = datePickerStartDate ? new Date(datePickerStartDate) : null;
  filter.endDate = datePickerEndDate ? new Date(datePickerEndDate) : null;
  filterTransactions();
};

const toggleSort = (by: SortBy) => {
  if (sort.by === by) {
    sort.order = sort.order === 'asc' ? 'desc' : 'asc';
  } else {
    sort.by = by;
    sort.order = 'asc';
  }
  filterTransactions();
};

</script>
<main class="container">
  <div class="button-row">
    <button onclick={() => fileInput.click()}>Upload CSV</button>
    <input type="file" accept=".csv" bind:this={fileInput} onchange={(e) => handleCSVUpload(e)} style="display:none" />
    <select bind:value={filter.filename} onchange={() => filterTransactions()}>
      <option value="All">Show All</option>
      {#each filenames.slice(1) as fname}
        <option value={fname}>{fname}</option>
      {/each}
    </select>

    <DatePicker
      isRange={true}
      bind:startDate={datePickerStartDate}
      bind:endDate={datePickerEndDate}
      bind:isOpen={datePickerIsOpen}
      onDateChange={handleDatePickerChange}
    />
    <button type="button" onclick={toggleDatePicker}>
      {#if filter.startDate && filter.endDate}
        {filter.startDate.toISOString().split('T')[0]} - {filter.endDate.toISOString().split('T')[0]}
      {:else if filter.startDate}
        {filter.startDate.toISOString().split('T')[0]} - ?
      {:else}
        Select Date Range
      {/if}
    </button>
    <button type="button" onclick={() => { clearFilter(); filterTransactions(); }}>
      Clear
    </button>
    <button
      onclick={() => {
        const params = new URLSearchParams({
          filename: filter.filename ?? "",
          startDate: filter.startDate ? filter.startDate.toISOString().split('T')[0] : "",
          endDate: filter.endDate ? filter.endDate.toISOString().split('T')[0] : "",
        });
        window.location.href = `/analysis?${params.toString()}`;
      }}
    >
      Analysis
    </button>
    <button onclick={() => deleteByFilter()}>Delete Shown</button>
    <button type="button" onclick={() => (showAbout = true)} style="margin-left: auto;">?</button>
  </div>
  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th onclick={() => toggleSort('date')} style="cursor: pointer;">
          Date {sort.by === 'date' ? (sort.order==='asc' ? '▲' : '▼') : ''}
        </th>
        <th onclick={() => toggleSort('description')} style="cursor: pointer;">
          Description {sort.by === 'description' ? (sort.order==='asc' ? '▲' : '▼') : ''}
        </th>
        <th onclick={() => toggleSort('amount')} style="cursor: pointer;">
          Amount {sort.by === 'amount' ? (sort.order==='asc' ? '▲' : '▼') : ''}
        </th>
        <th>Filename</th>
      </tr>
    </thead>
    <tbody>
      {#each transactions as tx}
        <tr>
          <td>{tx.id}</td>
          <td>{tx.date.toISOString().split('T')[0]}</td>
          <td>{tx.description}</td>
          <td>{formatAmount(tx.amount)}</td>
          <td>{tx.filename}</td>
        </tr>
      {/each}
    </tbody>
  </table>

  {#if showAbout}
    <div class="modal-overlay" role="button" tabindex="0" onclick={() => (showAbout = false)} onkeydown={(e) => (e.key === 'Enter' || e.key === ' ' ? showAbout = false : null)} style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;">
      <div class="modal-content" role="dialog" aria-modal="true" tabindex="0" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()} style="background: white; padding: 1rem; border-radius: 4px; max-width: 90%; max-height: 90%; overflow: auto;">
        <img src="/demeter2.png" alt="Demeter 2 logo" style="max-width:100%; max-height:80vh;" />
        <button onclick={() => (showAbout = false)} style="display: block; margin: 1rem auto 0;">Close</button>
      </div>
    </div>
  {/if}
</main>
