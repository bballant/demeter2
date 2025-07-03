# LLM Session Setup

## Files to Load for Complete Context

When starting a new LLM session for this Tauri + SvelteKit project, load these files to get full application context:

### Core Application Files
- `src/lib/db.ts` - Database operations and connection management
- `src/lib/types.ts` - TypeScript type definitions
- `src/lib/csv.ts` - CSV parsing utilities
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

## Quick Load Command

Copy and paste this to quickly load all files:

```
Load these files to the chat:
src/lib/db.ts
src/lib/types.ts
src/lib/csv.ts
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

## Project Structure Notes

- **Tauri app** - Native desktop application
- **SvelteKit frontend** - SSR disabled, uses static adapter
- **SQLite database** - Via Tauri SQL plugin
- **Simple structure** - Main transactions view + analysis page
- **Business logic** - Centralized in `src/lib/` directory
