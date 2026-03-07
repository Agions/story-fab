#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BUNDLE_DIR="$ROOT_DIR/src-tauri/target/release/bundle"
DMG_DIR="$BUNDLE_DIR/dmg"
MACOS_DIR="$BUNDLE_DIR/macos"

echo "[build-dmg] running tauri build..."
set +e
(cd "$ROOT_DIR" && npm run tauri build)
BUILD_EXIT_CODE=$?
set -e

mkdir -p "$DMG_DIR"

find_final_dmg() {
  find "$DMG_DIR" -maxdepth 1 -type f -name "*.dmg" ! -name "rw.*.dmg" | head -n 1
}

FINAL_DMG="$(find_final_dmg || true)"

if [[ -z "${FINAL_DMG:-}" ]]; then
  echo "[build-dmg] tauri dmg not found, trying fallback conversion from rw.*.dmg"
  RW_DMG="$(find "$MACOS_DIR" -maxdepth 1 -type f -name "rw.*.dmg" | head -n 1 || true)"
  if [[ -z "${RW_DMG:-}" ]]; then
    echo "[build-dmg] no rw.*.dmg found in $MACOS_DIR"
    exit "${BUILD_EXIT_CODE:-1}"
  fi

  TARGET_NAME="$(basename "$RW_DMG" | sed -E 's/^rw\.[0-9]+\.//')"
  TARGET_PATH="$DMG_DIR/$TARGET_NAME"
  rm -f "$TARGET_PATH"

  ATTACHED_DEV="$(hdiutil info | awk -v p="$RW_DMG" '
    $0 ~ "image-path" && index($0, p) > 0 { flag=1; next }
    flag && $1 ~ /^\/dev\/disk/ { print $1; exit }
  ' || true)"

  if [[ -n "${ATTACHED_DEV:-}" ]]; then
    echo "[build-dmg] detaching mounted rw dmg device: $ATTACHED_DEV"
    hdiutil detach "$ATTACHED_DEV" || true
  fi

  echo "[build-dmg] converting rw dmg -> final dmg"
  hdiutil convert "$RW_DMG" -format UDZO -o "$TARGET_PATH"
  FINAL_DMG="$TARGET_PATH"
fi

if [[ ! -f "$FINAL_DMG" ]]; then
  echo "[build-dmg] failed: final dmg not found"
  exit "${BUILD_EXIT_CODE:-1}"
fi

echo "[build-dmg] success"
echo "[build-dmg] dmg: $FINAL_DMG"
