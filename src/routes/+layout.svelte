<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  $: currentPath = $page.url.pathname;
</script>

<nav class="button-row">
  <button on:click={() => goto('/')} disabled={currentPath === '/'}>Transactions</button>
  <button on:click={() => goto('/analysis')} disabled={currentPath.startsWith('/analysis')}>Analysis</button>
  <button on:click={() => goto('/tagging')} disabled={currentPath.startsWith('/tagging')}>Tagging</button>
</nav>

<slot />
