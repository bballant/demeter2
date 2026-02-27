# Build the project
build:
    npm run build

# Run the built version (from dist/)
run *args:
    node dist/index.js {{ args }}

# Run in development mode (no build required)
dev *args:
    node --loader ts-node/esm --no-warnings=ExperimentalWarning src/index.ts {{ args }}
