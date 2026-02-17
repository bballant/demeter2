# Build the project
build:
    npm run build

# Run the built version
run *args:
    ./bin/run.js {{ args }}

# Run in development mode (no build required)
dev *args:
    ./bin/dev.js {{ args }}
