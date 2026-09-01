# Build & Deploy

## Prerequisites

- Node.js and npm installed
- Bash available (Git Bash or WSL on Windows)
- `zip` / `unzip` — used by the scripts; if not installed, the scripts fall back to PowerShell `Compress-Archive` / `Expand-Archive` automatically

## Building the app

```bash
bash build.sh
```

What it does:
1. Cleans `dist/` and any previous `.zip` artifacts in `artifacts/`
2. Runs `npm install`
3. Compiles TypeScript (`npm run build`) — outputs to `dist/`
4. Verifies `dist/server.js` was produced (exits with an error if not)
5. Stages `dist/`, `public/`, `package.json`, and `package-lock.json` for packaging
6. Creates a versioned zip at `artifacts/library-management-app-build-<timestamp>.zip`

The `artifacts/` folder is gitignored (build outputs, not source).

## Deploying locally

```bash
bash deploy-local.sh
```

What it does:
1. Picks the most-recent zip from `artifacts/`
2. Cleans and recreates `deploy/`
3. Extracts the zip into `deploy/`
4. Runs `npm install --production` inside `deploy/` (installs only runtime dependencies)
5. Starts the server: `node dist/server.js` from within `deploy/`

Once started, the app is available at **http://localhost:5050**.

Stop the server with `Ctrl+C`.

The `deploy/` folder is gitignored (deployment target, not source).

## Artifact contents

```
library-management-app-build-<timestamp>.zip
├── dist/           # compiled JavaScript (server + client bundles)
├── public/         # static frontend files served at runtime
├── package.json    # npm manifest (needed for production install)
└── package-lock.json
```

> `public/` is included because the server resolves it relative to `dist/` at runtime:
> `path.join(__dirname, '..', 'public')` → one level above `dist/server.js`.
