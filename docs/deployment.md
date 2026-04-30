---
title: Deployment Guide
description: Complete deployment guide for CutDeck covering development setup, production builds, and Tauri desktop app distribution.
---

# Deployment Guide

This guide covers all aspects of deploying CutDeck — from local development to production builds and cross-platform desktop app distribution.

---

## Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | ≥ 18.0.0 | LTS recommended |
| npm | ≥ 9.0.0 | Comes with Node.js |
| Git | ≥ 2.30.0 | |
| FFmpeg | Latest | Video processing core |
| Rust | ≥ 1.70 | Only for Tauri builds |

---

## Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Agions/CutDeck.git
cd CutDeck
```

### 2. Install Dependencies

```bash
npm install
```

> If npm install hangs, try the mirror: `npm install --registry=https://registry.npmmirror.com`

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your AI API keys. See [AI Model Configuration](./ai-config.md) for details.

### 4. Start Development Server

```bash
npm run dev
```

Access at **http://localhost:1430**

### Development Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start frontend dev server |
| `npm run build` | Build frontend for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run type-check` | TypeScript type checking |
| `npm run test` | Run tests with Vitest |
| `npm run tauri dev` | Start Tauri dev mode (requires Rust) |

---

## Production Build

### Frontend Only Build

```bash
npm run build
```

Output: `dist/` directory

### Production Mode Build

```bash
npm run build:prod
```

Uses `--mode production` for full optimization.

### CI Build with Budget Check

```bash
npm run build:ci
```

Runs `build:budget` to check bundle size after build.

### Build Output Structure

```
dist/
├── assets/
│   ├── vendor-react-[hash].js
│   ├── vendor-router-[hash].js
│   └── ...
├── index.html
└── ...
```

---

## Tauri Desktop App Build

### Setup

1. **Install Rust** (if not already):
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source ~/.cargo/env
   ```

2. **Install Tauri CLI**:
   ```bash
   npm install -D @tauri-apps/cli@latest
   ```

### Build Commands

```bash
# Development build (fast, unoptimized)
npm run tauri dev

# Production build
npm run tauri build
```

### Build Output

Output binaries are located in:

```
src-tauri/target/release/bundle/
├── nsis/      # Windows NSIS installer
├── msi/       # Windows MSI installer
├── app/       # macOS app bundle
├── deb/       # Debian package
├── rpm/       # RPM package
└── appimage/  # Linux AppImage
```

### Platform-Specific Builds

#### macOS

**DMG (macOS) via script:**
```bash
npm run tauri:build:dmg
# or directly
bash scripts/build-dmg.sh
```

**Requirements:**
- macOS 10.15+
- Xcode command line tools

**First run warning:** If macOS blocks the app, right-click → **Open**, or run:
```bash
sudo xattr -rd com.apple.quarantine "/Applications/CutDeck.app"
```

#### Windows

NSIS and MSI installers are built automatically when running `npm run tauri build` on Windows.

**Requirements:**
- Windows 10/11
- Visual Studio Build Tools (for Rust)

#### Linux

**DEB package:**
```bash
npm run tauri build -- --bundles deb
```

**AppImage:**
```bash
npm run tauri build -- --bundles appimage
```

**Requirements:**
- Ubuntu/Debian: `libwebkit2gtk-4.1-0`, `libgtk-3-0`
- Fedora/RHEL: `webkit2gtk4.1`, `gtk3`

### Tauri Configuration

Key settings in `src-tauri/tauri.conf.json`:

```json
{
  "productName": "CutDeck",
  "version": "2.0.0",
  "identifier": "com.cutdeck.desktop",
  "build": {
    "devUrl": "http://localhost:1430",
    "frontendDist": "../dist"
  },
  "bundle": {
    "targets": ["nsis", "msi", "app", "deb", "rpm", "appimage"],
    "category": "Video"
  }
}
```

---

## Platform-Specific Instructions

### macOS

#### Installation from Source

```bash
git clone https://github.com/Agions/CutDeck.git
cd CutDeck
npm install
npm run build
npm run tauri build
```

#### Installation from Pre-built DMG

1. Download from [GitHub Releases](https://github.com/Agions/CutDeck/releases)
2. Mount the DMG
3. Drag CutDeck to Applications
4. Handle gatekeeper: `sudo xattr -rd com.apple.quarantine "/Applications/CutDeck.app"`

#### Codesigning (Optional)

Configure in `tauri.conf.json`:
```json
{
  "bundle": {
    "macOS": {
      "signingIdentity": "Your Developer ID",
      "minimumSystemVersion": "10.15"
    }
  }
}
```

### Windows

#### Installation from Source

```powershell
# Install Node.js 18+ via https://nodejs.org
# Install Rust via https://rustup.rs
git clone https://github.com/Agions/CutDeck.git
cd CutDeck
npm install
npm run build
npm run tauri build
```

#### Installation from Pre-built EXE

1. Download `CutDeck-{version}-windows-x64-setup.exe` from [Releases](https://github.com/Agions/CutDeck/releases)
2. Run installer
3. NSIS installer supports per-user or system-wide installation

### Linux

#### Ubuntu/Debian

```bash
# Install dependencies
sudo apt update
sudo apt install -y ffmpeg libwebkit2gtk-4.1-0 libgtk-3-0

# Clone and build
git clone https://github.com/Agions/CutDeck.git
cd CutDeck
npm install
npm run build
npm run tauri build

# Install DEB package
sudo dpkg -i src-tauri/target/release/bundle/deb/cutdeck_*.deb
```

#### Fedora/RHEL

```bash
# Install dependencies
sudo dnf install -y ffmpeg webkit2gtk4.1 gtk3

# Build and install RPM
npm run tauri build -- --bundles rpm
sudo rpm -i src-tauri/target/release/bundle/rpm/cutdeck_*.rpm
```

#### AppImage (Universal)

```bash
npm run tauri build -- --bundles appimage
# Run
./src-tauri/target/release/bundle/appimage/cutdeck_*.AppImage
```

---

## Docker Deployment

### Frontend in Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 1430
CMD ["npm", "run", "dev"]
```

### Multi-stage Production Build

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## Troubleshooting

### FFmpeg Not Found

```bash
# Verify installation
which ffmpeg    # macOS/Linux
ffmpeg -version

# Manual path in .env
CUTDECK_FFMPEG_PATH=/usr/local/bin/ffmpeg
```

### Rust Build Failures

```bash
# Update Rust
rustup update

# Clean cargo cache
cd src-tauri
cargo clean
cargo build
```

### Tauri Dev Server Port Conflicts

Check if port 1430 is in use:
```bash
lsof -i :1430  # macOS/Linux
netstat -ano | findstr :1430  # Windows
```

Change port in `.env`:
```
VITE_PORT=1431
```

### macOS Gatekeeper Blocks App

```bash
sudo xattr -rd com.apple.quarantine "/Applications/CutDeck.app"
```

### Bundle Size Too Large

Run `npm run build:budget` to check against configured limits. See `scripts/check-bundle-budget.mjs`.

---

## CI/CD

### GitHub Actions

The project includes `.github/workflows/main.yml` for automated builds.

### Manual Release Build

```bash
# 1. Update version in package.json and src-tauri/tauri.conf.json
# 2. Build all platforms
npm run build:ci
npm run tauri build

# 3. Create GitHub Release with artifacts from:
#    src-tauri/target/release/bundle/
```

---

## Related Documentation

- [Installation](./installation.md) — Detailed setup with troubleshooting
- [Architecture](./architecture.md) — System design overview
- [Features](./features.md) — Feature descriptions
- [AI Configuration](./ai-config.md) — AI model setup