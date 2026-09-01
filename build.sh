#!/usr/bin/env bash
set -euo pipefail

APP_NAME="library-management-app"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
ARTIFACT_NAME="${APP_NAME}-build-${TIMESTAMP}.zip"
ARTIFACTS_DIR="artifacts"
STAGING_DIR="${ARTIFACTS_DIR}/.staging"

echo "================================================"
echo "  Building ${APP_NAME}"
echo "================================================"

# 1. Clean previous build output
echo ""
echo "[1/6] Cleaning previous build output..."
rm -rf dist/
if [ -d "${ARTIFACTS_DIR}" ]; then
  rm -f "${ARTIFACTS_DIR}"/*.zip
fi
rm -rf "${STAGING_DIR}"
echo "      Cleaned dist/ and old .zip artifacts."

# 2. Install dependencies
echo ""
echo "[2/6] Installing dependencies..."
npm install
echo "      Dependencies installed."

# 3. TypeScript build
echo ""
echo "[3/6] Running TypeScript build..."
npm run build
echo "      TypeScript build complete."

# 4. Verify dist/server.js exists
echo ""
echo "[4/6] Verifying build output..."
if [ ! -f "dist/server.js" ]; then
  echo "ERROR: dist/server.js not found after build. Compilation may have failed." >&2
  exit 1
fi
echo "      dist/server.js verified."

# 5. Stage artifact contents into a local staging directory
echo ""
echo "[5/6] Staging artifact contents..."
mkdir -p "${STAGING_DIR}"

cp -r dist/     "${STAGING_DIR}/dist"
cp -r public/   "${STAGING_DIR}/public"
cp package.json "${STAGING_DIR}/package.json"

STAGED_FILES="dist/, public/, package.json"
if [ -f package-lock.json ]; then
  cp package-lock.json "${STAGING_DIR}/package-lock.json"
  STAGED_FILES="${STAGED_FILES}, package-lock.json"
fi
echo "      Staged: ${STAGED_FILES}"

# 6. Create versioned zip artifact
echo ""
echo "[6/6] Creating zip artifact..."
ARTIFACT_PATH="${ARTIFACTS_DIR}/${ARTIFACT_NAME}"

# Build the file list from the staging dir
ZIP_FILES="dist public package.json"
if [ -f "${STAGING_DIR}/package-lock.json" ]; then
  ZIP_FILES="${ZIP_FILES} package-lock.json"
fi

if command -v zip &>/dev/null; then
  (cd "${STAGING_DIR}" && zip -r "../${ARTIFACT_NAME}" ${ZIP_FILES})
else
  # Fallback: PowerShell Compress-Archive (Git Bash on Windows without zip)
  WIN_STAGING=$(cygpath -w "${STAGING_DIR}" 2>/dev/null || echo "${STAGING_DIR}")
  WIN_ARTIFACT=$(cygpath -w "$(pwd)/${ARTIFACT_PATH}" 2>/dev/null || echo "$(pwd)/${ARTIFACT_PATH}")
  powershell.exe -NoProfile -Command "Compress-Archive -Path '${WIN_STAGING}\\*' -DestinationPath '${WIN_ARTIFACT}'"
fi

# Clean up staging directory
rm -rf "${STAGING_DIR}"

ARTIFACT_SIZE=$(du -sh "${ARTIFACT_PATH}" | cut -f1)

echo ""
echo "================================================"
echo "  BUILD SUCCESSFUL"
echo "  Artifact : ${ARTIFACT_PATH}"
echo "  Size     : ${ARTIFACT_SIZE}"
echo "================================================"
