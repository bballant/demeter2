<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  $: currentPath = $page.url.pathname;
</script>

<nav class="button-row">
  <button
    class:active={currentPath === '/'}
    on:click={() => goto('/')}
    disabled={currentPath === '/'}
  >Transactions</button>
  <button
    class:active={currentPath.startsWith('/analysis')}
    on:click={() => goto('/analysis')}
    disabled={currentPath.startsWith('/analysis')}
  >Analysis</button>
  <button
    class:active={currentPath.startsWith('/tagging')}
    on:click={() => goto('/tagging')}
    disabled={currentPath.startsWith('/tagging')}
  >Tagging</button>
</nav>

<slot />
