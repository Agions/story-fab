#!/usr/bin/env python3
"""Zip a macOS .app bundle for distribution."""
import os, sys, zipfile, pathlib

if len(sys.argv) > 1:
    app_bundle = pathlib.Path(sys.argv[1])
    zip_path = pathlib.Path(sys.argv[2])
else:
    workspace = pathlib.Path(os.getcwd())
    app_bundle = workspace / "src-tauri/target/release/bundle/macos/CutDeck.app"
    zip_path = workspace / "src-tauri/target/release/bundle/CutDeck-macos.zip"

print(f"Workspace: {os.getcwd()}")
print(f"App bundle: {app_bundle}")
print(f"Zip output: {zip_path}")

bundle_dir = app_bundle.parent
print(f"Bundle dir exists: {bundle_dir.exists()}")
if bundle_dir.exists():
    print(f"Contents: {[p.name for p in bundle_dir.iterdir()]}")

if not app_bundle.exists():
    print(f"ERROR: .app not found at {app_bundle}")
    sys.exit(1)

print(f"Zipping {app_bundle} ...")
zf = zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED)
total = sum(1 for _ in app_bundle.rglob('*'))
count = 0
for root, dirs, files in os.walk(app_bundle):
    for file in files:
        filepath = pathlib.Path(root) / file
        arcname = filepath.relative_to(app_bundle.parent)
        zf.write(filepath, arcname)
        count += 1
        if count % 200 == 0:
            print(f"  {count}/{total} files...")
zf.close()

size_mb = zip_path.stat().st_size / 1024 / 1024
print(f"Done: {zip_path} ({size_mb:.1f} MB)")
