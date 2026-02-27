# Build the project
build:
    npm run build

test:
    npm run test

# Run the built version (from dist/)
run *args:
    node dist/index.js {{ args }}

# Refresh DB from CSV (migration down/up, ingest, seed-tags) then run report
refresh-and-report csv:
    node dist/index.js record refresh {{ csv }}
    node dist/index.js report -o pdf

# Run in development mode (no build required)
dev *args:
    node --loader ts-node/esm --no-warnings=ExperimentalWarning src/index.ts {{ args }}
