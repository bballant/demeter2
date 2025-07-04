# LLM Session Setup

## Files to Load for Complete Context

When starting a new LLM session for this Tauri + SvelteKit project, load these files to get full application context:

### Core Application Files
- `src/lib/db.ts` - Database operations and connection management
- `src/lib/types.ts` - TypeScript type definitions (includes TransactionAnalysis type)
- `src/lib/csv.ts` - CSV parsing utilities with date format conversion
- `src/lib/analysis.ts` - Transaction analysis logic (extracted from page component)
- `src/routes/+page.svelte` - Main transactions page UI
- `src/routes/+layout.ts` - SvelteKit layout configuration (SSR disabled for Tauri)
- `src/routes/analysis/+page.svelte` - Transaction analysis page UI

### Configuration Files
- `package.json` - Dependencies and npm scripts
- `src/app.html` - HTML template
- `static/global.css` - Application styling
- `svelte.config.js` - SvelteKit configuration (static adapter)
- `tsconfig.json` - TypeScript configuration
- `vite.config.js` - Vite build configuration
- `src/lib/default-header-mappings.json` - CSV column mapping configuration for different bank formats

## Quick Load Command

Copy and paste this to quickly load all files:

```
Load these files to the chat:
src/lib/db.ts
src/lib/types.ts
src/lib/csv.ts
src/lib/analysis.ts
src/lib/default-header-mappings.json
src/routes/+page.svelte
src/routes/+layout.ts
src/routes/analysis/+page.svelte
package.json
src/app.html
static/global.css
svelte.config.js
tsconfig.json
vite.config.js
```

## Recent Changes & Current Issues

### Completed Refactoring
- **Analysis Logic**: Moved transaction analysis calculations from `analysis/+page.svelte` to `src/lib/analysis.ts`
- **Type Safety**: Added `TransactionAnalysis` type to properly type analysis results
- **CSV Parsing**: Added date format conversion (MM/DD/YYYY → YYYY-MM-DD) in `normalizeDate()` function
- **Column Mapping**: Dynamic CSV column detection supports multiple bank formats (default, fidelity, chase)

### Current Debugging Issue
- **CSV Date Parsing**: Debug alerts added to `parseCsv()` function but not appearing
- **Possible causes**: 
  - Logs going to browser dev console instead of terminal
  - Code changes not being rebuilt/reloaded
  - CSV upload not triggering parsing function
- **Debug approaches**: Check browser F12 console, use alerts instead of console.log, verify dev server restart

### Key Features
- **Multi-format CSV support**: Auto-detects column mappings for different bank statement formats
- **Date normalization**: Converts MM/DD/YYYY dates to YYYY-MM-DD format
- **Transaction analysis**: Comprehensive spending analytics with filtering
- **File management**: Upload, filter, and delete transactions by filename or date range

## Project Structure Notes

- **Tauri app** - Native desktop application
- **SvelteKit frontend** - SSR disabled, uses static adapter
- **SQLite database** - Via Tauri SQL plugin
- **Simple structure** - Main transactions view + analysis page
- **Business logic** - Centralized in `src/lib/` directory
- **TypeScript** - Fully typed with strict checking enabled

## Tauri Frontend Limitations

**IMPORTANT**: The SvelteKit frontend runs in a browser context, NOT Node.js. These Node.js APIs are NOT available:

### File System & Process APIs (DO NOT USE)
- `fs` module - Use `@tauri-apps/plugin-fs` instead
- `process.env` - Use Vite environment variables (`import.meta.env.VITE_*`) instead
- `process.cwd()`, `process.argv` - Not available in browser
- `__dirname`, `__filename` - Use `import.meta.url` with `fileURLToPath()` for build-time paths only

### Other Node.js APIs to Avoid
- `path` module - Use `@tauri-apps/plugin-path` for runtime paths
- `os` module - Use `@tauri-apps/plugin-os` instead
- `child_process` - Use `@tauri-apps/plugin-shell` instead
- `crypto` (Node.js version) - Use Web Crypto API or `@tauri-apps/plugin-crypto`
- `buffer` (Node.js Buffer) - Use Uint8Array or ArrayBuffer
- `stream` - Not available, use fetch/Response streams
- `http`/`https` - Use fetch API instead
- `url` (Node.js version) - Use Web URL API instead

### Safe Alternatives
- **File operations**: `@tauri-apps/plugin-fs`
- **Environment variables**: Vite env vars (`import.meta.env.VITE_*`)
- **Path operations**: `@tauri-apps/plugin-path`
- **Shell commands**: `@tauri-apps/plugin-shell`
- **HTTP requests**: `fetch()` API
- **Dialogs**: `@tauri-apps/plugin-dialog`

### Scripts vs Frontend
- **Scripts** (like `scripts/generate-sample.ts`): Run in Node.js, can use all Node.js APIs
- **Frontend** (`src/` files): Run in Tauri webview, must use browser/Tauri APIs only
