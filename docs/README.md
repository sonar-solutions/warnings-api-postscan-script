# warnings-api-postscan-script — Project Documentation

## Overview
<!-- updated: 2026-04-25_00:00:00 -->

Zero-dependency Node.js tool that fetches SonarQube warnings via API and exports them to CSV. Can run as a script or be compiled into a standalone binary using Node.js Single Executable Applications (SEA).

## Architecture
<!-- updated: 2026-04-25_00:00:00 -->

Single-file Node.js application (`index.js`) using only built-in modules:
- `node:fs` — file I/O (config reading, CSV writing)
- `node:path` — path resolution
- `node:http` / `node:https` — SonarQube API requests

No third-party dependencies. CSV output is handled with native string construction and proper RFC 4180 escaping.

## Build System
<!-- updated: 2026-04-25_00:00:00 -->

Migrated from `pkg` (deprecated) to **Node.js Single Executable Applications (SEA)**.

- `build.sh` — auto-detects Node version and platform, produces a standalone binary in `dist/`
- `sea-config.json` — SEA configuration for the legacy `--experimental-sea-config` path (Node v20–v25.4)
- Node v25.5+ uses `--build-sea` which requires zero build-time dependencies
- Node v20–v25.4 uses `--experimental-sea-config` + `postject` (fetched via npx at build time)

### Why Node SEA over pkg
- `pkg` is deprecated and unmaintained
- Node SEA is the official Node.js solution for single-executable builds
- Eliminates build-time supply chain risk on Node v25.5+

## Key Decisions
<!-- updated: 2026-04-25_00:00:00 -->

- **Zero dependencies**: All functionality uses Node.js built-in modules to eliminate supply chain attack vectors
- **Node v20+ minimum**: Required for SEA support; v20 is current LTS
- **Platform-specific builds**: Unlike pkg, SEA doesn't support cross-compilation. Build on each target platform (or use CI matrix).
- **CSV escaping**: Fields containing commas, quotes, or newlines are properly escaped per RFC 4180
