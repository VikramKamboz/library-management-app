#!/usr/bin/env bash
set -euo pipefail

ARTIFACTS_DIR="artifacts"
DEPLOY_DIR="deploy"

echo "================================================"
echo "  Deploying Library Management App (local)"
echo "================================================"

# Find the latest zip artifact
LATEST_ARTIFACT=$(ls -t "${ARTIFACTS_DIR}"/*.zip 2>/dev/null | head -1 || true)
if [ -z "${LATEST_ARTIFACT}" ]; then
  echo "ERROR: No zip artifact found in ${ARTIFACTS_DIR}/. Run build.sh first." >&2
  exit 1
fi
echo "Artifact: ${LATEST_ARTIFACT}"

# 1. Clean and recreate deploy directory
echo ""
echo "[1/4] Preparing deploy directory..."
rm -rf "${DEPLOY_DIR}"
mkdir -p "${DEPLOY_DIR}"
echo "      ${DEPLOY_DIR}/ ready."

# 2. Extract artifact
echo ""
echo "[2/4] Extracting artifact into ${DEPLOY_DIR}/..."
if command -v unzip &>/dev/null; then
  # Exit codes: 0=success, 1=warnings (e.g. path-separator conversion) — both are fine
  unzip -q "${LATEST_ARTIFACT}" -d "${DEPLOY_DIR}" || [ $? -le 1 ]
else
  # Fallback: PowerShell Expand-Archive (Git Bash on Windows without unzip)
  WIN_ARTIFACT=$(cygpath -w "${LATEST_ARTIFACT}" 2>/dev/null || echo "${LATEST_ARTIFACT}")
  WIN_DEPLOY=$(cygpath -w "${DEPLOY_DIR}" 2>/dev/null || echo "${DEPLOY_DIR}")
  powershell.exe -NoProfile -Command "Expand-Archive -Path '${WIN_ARTIFACT}' -DestinationPath '${WIN_DEPLOY}' -Force"
fi
echo "      Extracted."

# 3. Install production dependencies
echo ""
echo "[3/4] Installing production dependencies..."
(cd "${DEPLOY_DIR}" && npm install --production --no-audit --no-fund)
echo "      Production dependencies installed."

# 4. Start server
echo ""
echo "[4/4] Starting server..."
echo "      http://localhost:5050"
echo ""
cd "${DEPLOY_DIR}"
node dist/server.js
