import { writable } from "svelte/store";
import { goto } from "$app/navigation";
import type { Filter } from "./types";

// Create a writable store for filter state
function createFilterStore() {
  const { subscribe, set, update } = writable<Filter>({
    filename: undefined,
    startDate: null,
    endDate: null,
  });

  // Initialize from URL params
  const initializeFromUrl = () => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const filter: Filter = {
      filename: url.searchParams.get("filename") || undefined,
      startDate: url.searchParams.get("startDate")
        ? new Date(url.searchParams.get("startDate")!)
        : null,
      endDate: url.searchParams.get("endDate")
        ? new Date(url.searchParams.get("endDate")!)
        : null,
    };
    set(filter);
  };

  // Sync filter state to URL params
  const syncToUrl = (filter: Filter, path?: string) => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams();
    if (filter.filename && filter.filename !== "All") {
      params.set("filename", filter.filename);
    }
    if (filter.startDate) {
      params.set("startDate", filter.startDate.toISOString().split("T")[0]);
    }
    if (filter.endDate) {
      params.set("endDate", filter.endDate.toISOString().split("T")[0]);
    }

    const targetPath = path || window.location.pathname;
    const queryString = params.toString();
    const newUrl = queryString ? `${targetPath}?${queryString}` : targetPath;

    // Only update URL if it's different from current URL
    const currentUrl = window.location.pathname + window.location.search;
    if (newUrl !== currentUrl) {
      goto(newUrl, { replaceState: true, keepFocus: true });
    }
  };

  return {
    subscribe,
    set,
    update,
    initializeFromUrl,
    syncToUrl,
    // Helper to update filter and sync to URL
    updateFilter: (newFilter: Filter, path?: string) => {
      set(newFilter);
      syncToUrl(newFilter, path);
    },
  };
}

export const filterStore = createFilterStore();
