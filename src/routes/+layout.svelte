<script lang="ts">
  import { page } from "$app/stores";
  import { get } from "svelte/store";
  import { goto } from "$app/navigation";

  // local state for the help-modal
  let showAbout = false;

  $: currentPath = $page.url.pathname;

  // Helper to navigate while preserving search params
  function navigateWithParams(path: string) {
    const currentPage = get(page);
    const search = currentPage.url.search.toString();
    const url = search ? `${path}?${search}` : path;
    goto(url);
  }
</script>

<nav class="button-row">
  <button
    class:active={currentPath === "/"}
    on:click={() => navigateWithParams("/")}
    disabled={currentPath === "/"}>Transactions</button
  >
  <button
    class:active={currentPath.startsWith("/analysis")}
    on:click={() => navigateWithParams("/analysis")}
    disabled={currentPath.startsWith("/analysis")}>Analysis</button
  >
  <button
    class:active={currentPath.startsWith("/tagging")}
    on:click={() => navigateWithParams("/tagging")}
    disabled={currentPath.startsWith("/tagging")}>Tagging</button
  >
  <button
    type="button"
    on:click={() => (showAbout = true)}
    style="margin-left: auto;">?</button
  >
</nav>

<slot />

{#if showAbout}
  <div
    class="modal-overlay"
    role="button"
    tabindex="0"
    on:click={() => (showAbout = false)}
    on:keydown={(e) =>
      e.key === "Enter" || e.key === " " ? (showAbout = false) : null}
    style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;"
  >
    <div
      class="modal-content"
      role="dialog"
      aria-modal="true"
      tabindex="0"
      on:click={(e) => e.stopPropagation()}
      on:keydown={(e) => e.stopPropagation()}
      style="background: white; padding: 1rem; border-radius: 4px; max-width: 90%; max-height: 90%; overflow: auto;"
    >
      <img
        src="/demeter2.png"
        alt="Demeter 2 logo"
        style="max-width:100%; max-height:80vh;"
      />
      <button
        on:click={() => (showAbout = false)}
        style="display: block; margin: 1rem auto 0;">Close</button
      >
    </div>
  </div>
{/if}
