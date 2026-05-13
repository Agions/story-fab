# Build & Release

## Development Build

```bash
# Install dependencies
pnpm install

# Run in development mode (hot reload)
pnpm tauri dev

# Type-check only
pnpm type-check

# Lint
pnpm lint
```

## Production Build

### Frontend Only

```bash
pnpm build
```

Output goes to `dist/`.

### Full Tauri App

```bash
# Build the Tauri app for current platform
pnpm tauri build

# For a specific platform (Linux)
pnpm tauri build --target x86_64-unknown-linux-gnu
```

Output goes to `src-tauri/target/release/bundle/`.

## Release Pipeline (CI/CD)

Releases are automated via GitHub Actions. On every tag matching `v*`:

1. **Rust Check** — `cargo check` with Rust 1.88.0
2. **TypeScript Check** — `pnpm type-check`
3. **Frontend Build** — `pnpm build`
4. **Tauri Build** — Builds for all platforms (Windows, macOS x64 + ARM, Linux)
5. **Create Release** — Attaches `.exe`, `.dmg`, `.deb` artifacts

### Triggering a Release

```bash
# Create a version tag
git tag v2.0.0
git push origin v2.0.0
```

The GitHub Actions workflow will automatically build and create a GitHub Release.

## Version Management

| File | Version Field |
|---|---|
| `package.json` | `version` |
| `src-tauri/Cargo.toml` | `version` |
| `src-tauri/tauri.conf.json` | `version` |

All three must be kept in sync. Use `scripts/bump-version.mjs` to update all at once.

## Code Signing

### macOS

Code signing and notarization are configured in `.github/workflows/release.yml`. You need:

- `CODESIGN_CERT` — Code signing certificate (GitHub Actions secret)
- `APPLE_SIGNING_IDENTITY` — Certificate name (e.g., `Developer ID Application: Your Name (TEAMID)`)

### Windows

Windows code signing is configured via:

- `CUTDECK_CERT_PATH` — Path to `.pfx` certificate
- `CUTDECK_CERT_PASSWORD` — Certificate password

## Troubleshooting

### FFmpeg Not Found

Ensure FFmpeg is in your system PATH, or set `CUTDECK_FFMPEG_PATH` environment variable.

### Rust Compilation Fails

Make sure you have Rust 1.80+ installed:

```bash
rustup update
rustc --version  # should be 1.80.0+
```
