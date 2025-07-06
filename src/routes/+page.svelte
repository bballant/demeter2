<script lang="ts">
  import { parseCsv } from '../lib/csv';
  import type { Transaction, Filter, Sort, SortBy } from '../lib/types';
  import { onMount } from 'svelte';
  import { getTransactions, addTransaction, deleteAllTransactions, getFilenames, deleteTransactionsByFilename, deleteByIds } from '../lib/db';
  import { DatePicker } from '@svelte-plugins/datepicker';

  let datePickerIsOpen = false;
  const toggleDatePicker = () => (datePickerIsOpen = !datePickerIsOpen);

  function formatAmount(cents: number): string {
    const sign = cents < 0 ? '-' : '';
    const abs = Math.abs(cents);
    const dollars = (abs / 100).toFixed(2);
    return `${sign}$${dollars}`;
  }

  let transactions: Transaction[] = [];
  let filenames: string[] = [];
  let filter: Filter = { filename: undefined, startDate: null, endDate: null };
  // Initialize file input element
  let fileInput: HTMLInputElement;
  let sort: Sort = { by: 'date', order: 'asc' };
  let showAbout = false;

  // Computed values for DatePicker (needs strings)
  $: datePickerStartDate = filter.startDate ? filter.startDate.toISOString().split('T')[0] : null;
  $: datePickerEndDate = filter.endDate ? filter.endDate.toISOString().split('T')[0] : null;

  function clearFilter_() {
    filter = { filename: undefined, startDate: null, endDate: null };
    datePickerIsOpen = false;
  }

  async function getTransactions_() {
    try {
      const result = await getTransactions();
      transactions = result;
    } catch (error) {
      console.log(error);
    }
  }

  async function addTransaction_(tx: Omit<Transaction, "id">) {
    try {
      await addTransaction(tx);
      await getTransactions_();
      await loadFilenames_();
    } catch (error) {
      console.log(error);
    }
  }


  onMount(() => {
    const url = new URL(window.location.href);
    filter.filename = url.searchParams.get('filename') || undefined;
    const startDateStr = url.searchParams.get('startDate');
    const endDateStr = url.searchParams.get('endDate');
    filter.startDate = startDateStr ? new Date(startDateStr) : null;
    filter.endDate = endDateStr ? new Date(endDateStr) : null;
    getTransactions_();
    loadFilenames_();
    filterTransactions_();
  });

async function loadFilenames_() {
  try {
    const names = await getFilenames();
    filenames = ["All", ...names];
  } catch (error) {
    console.log(error);
  }
}

async function deleteByFilter_() {
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
  const txs = parseCsv(text, file.name);
  for (const tx of txs) {
    await addTransaction(tx);
  }
  await getTransactions_();
  await loadFilenames_();
}

async function filterTransactions_() {
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
}

function handleDatePickerChange() {
  // Sync DatePicker string values back to filter Date objects
  filter.startDate = datePickerStartDate ? new Date(datePickerStartDate) : null;
  filter.endDate = datePickerEndDate ? new Date(datePickerEndDate) : null;
  filterTransactions_();
}

function toggleSort(by: SortBy) {
  if (sort.by === by) {
    sort.order = sort.order === 'asc' ? 'desc' : 'asc';
  } else {
    sort.by = by;
    sort.order = 'asc';
  }
  filterTransactions_();
}

</script>
<main class="container">
  <div class="button-row">
    <button onclick={() => fileInput.click()}>Upload CSV</button>
    <input type="file" accept=".csv" bind:this={fileInput} onchange={handleCSVUpload} style="display:none" />
    <select bind:value={filter.filename} onchange={filterTransactions_}>
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
    <button type="button" onclick={() => { clearFilter_(); filterTransactions_(); }}>
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
    <button onclick={deleteByFilter_}>Delete Shown</button>
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
