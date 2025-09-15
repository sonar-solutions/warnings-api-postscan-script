# warnings-api-postscan-script

This repository contains a Node.js script for post-scan processing of warnings from an API.

## Features
- Processes API warnings after scans
- Configurable via `config.json`

## Getting Started

### Prerequisites
- Node.js (v14 or higher recommended)
- npm

### Installation
1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd warnings-api-postscan-script
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Usage
Run the script:
```bash
npm run build
node index.js
```

### Running the Packaged Binary

After building, you will find platform-specific binaries in the `dist/` folder:

- **macOS (Apple Silicon):** `./dist/index-macos-arm64`
- **macOS (Intel):** `./dist/index-macos-x64`
- **Linux (x64):** `./dist/index-linux-x64`
- **Linux (ARM64):** `./dist/index-linux-arm64`
- **Windows (x64):** `./dist/index-win-x64.exe`
- **Windows (ARM64):** `./dist/index-win-arm64.exe`

To run the binary, use the appropriate file for your platform. For example, on macOS (Apple Silicon):

```bash
./dist/index-macos-arm64
```

On Windows:

```powershell
.\dist\index-win-x64.exe
```

Make sure your `config.json` is present in the same directory as the binary or provide the correct path.

## Configuration
Edit `config.json` to set up your API keys and other settings.

## License
MIT
