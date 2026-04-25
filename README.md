
**⚠️ Disclaimer: This is a purely experimental project, not affiliated with SonarSource or SonarQube in any way. Use at your own risk. Please fork and modify for your own needs, but do not use this in production or share it without clearly stating that it's not an official SonarQube product. I am not responsible for any issues that arise from using this tool.**

# Warnings API Post-Scan Script

[![Quality gate](https://sonarcloud.io/api/project_badges/quality_gate?project=sonar-solutions_warnings-api-postscan-script&token=ad08a680953dded78955142800533d2340f15e36)](https://sonarcloud.io/summary/new_code?id=sonar-solutions_warnings-api-postscan-script) [![SonarQube Cloud](https://sonarcloud.io/images/project_badges/sonarcloud-light.svg)](https://sonarcloud.io/summary/new_code?id=sonar-solutions_warnings-api-postscan-script)

This repository provides a **zero-dependency** Node.js script and standalone binary for post-scan processing of warnings from SonarQube APIs. It collects warnings for every project and every branch, outputting them to a CSV file for analysis or reporting.

Built with only Node.js native modules — no third-party dependencies, no supply chain risk.

---

## Features
- Fetches warnings for **all projects** and **all branches** in SonarQube
- Supports fetching for a single project (set `PROJECT_NAME` in `config.json`)
- Outputs warnings to a CSV file with columns: Project Key, Branch, Key, Message, Dismissable
- Checks SonarQube connectivity before running and provides clear error messages if unreachable
- Supports both HTTP and HTTPS SonarQube endpoints
- Can be run as a Node.js script or as a standalone binary via [Node.js Single Executable Applications (SEA)](https://nodejs.org/api/single-executable-applications.html)
- **Zero third-party dependencies** — uses only Node.js built-in modules
- Easy configuration via `config.json`

---

## Getting Started

### Prerequisites
- Node.js v20 or higher (v25.5+ recommended for zero-dependency builds)
- No `npm install` required — this project has no dependencies

### Installation
1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd warnings-api-postscan-script
   ```

That's it — no `npm install` needed.

---


## Configuration

Edit `config.json` to set up your SonarQube connection and output file:

```json
{
   "SONARQUBE_URL": "http://localhost:9091",
   "SONARQUBE_TOKEN": "your-sonarqube-token",
   "CSV_FILE": "sonarqube_warnings.csv",
   "PROJECT_NAME": ""
}
```

- `SONARQUBE_URL`: The base URL of your SonarQube server (http or https)
- `SONARQUBE_TOKEN`: Your SonarQube API token
- `CSV_FILE`: Output CSV file name
- `PROJECT_NAME`: The key of the project to fetch warnings for. Leave blank to fetch warnings for all projects.

---


## Usage

### Run as Node.js Script

```bash
node index.js
```

Or:
```bash
npm start
```

### Build a Standalone Binary (Node SEA)

This project uses [Node.js Single Executable Applications](https://nodejs.org/api/single-executable-applications.html) to create standalone binaries — no `pkg` or third-party build tools required.

```bash
npm run build
# or
./build.sh
```

The build script auto-detects your platform and Node.js version:

- **Node v25.5+**: Uses `--build-sea` (fully native, zero dependencies)
- **Node v20–v25.4**: Uses `--experimental-sea-config` + `postject` (postject is fetched once at build time via npx)

The binary is output to `dist/`:
- **macOS (Apple Silicon):** `dist/warnings-api-postscan-script-macos-arm64`
- **macOS (Intel):** `dist/warnings-api-postscan-script-macos-x64`
- **Linux (x64):** `dist/warnings-api-postscan-script-linux-x64`
- **Linux (ARM64):** `dist/warnings-api-postscan-script-linux-arm64`
- **Windows (x64):** `dist/warnings-api-postscan-script-win-x64.exe`
- **Windows (ARM64):** `dist/warnings-api-postscan-script-win-arm64.exe`

Run the binary for your platform:
```bash
./dist/warnings-api-postscan-script-macos-arm64
```

> **Note:** Unlike `pkg`, Node SEA builds for the current platform only. To build for other platforms, run `build.sh` on that platform (or use CI with platform-specific runners).

> **Note:** Ensure `config.json` is present in the working directory when running the binary.

---


## Output

The script/binary generates a CSV file (default: `sonarqube_warnings.csv`) with the following columns:

- `Project Key`: SonarQube project key
- `Branch`: Branch name (if available)
- `Key`: Unique warning key
- `Message`: Warning message
- `Dismissable`: Whether the warning is dismissable (true/false)

Example output:
```csv
Project Key,Branch,Key,Message,Dismissable
darren-sample-project-scan,main,ef2f937d-7e84-4ba1-8d29-786c4c7435aa,"SCM provider autodetection failed...",false
project-b-express-api-backend,feature-xyz,fc856c26-4f44-48fa-9ecb-16b0a7070803,"Missing blame information for 2 files...",false
...etc
```

---


## Troubleshooting

- **SonarQube not reachable:**
   - The script checks connectivity before running. If unreachable, you'll see:
      ```
      ERROR: Unable to connect to SonarQube at [SONARQUBE_URL]
      Please check that SonarQube is running and the URL/token in config.json are correct.
      ```
- **Empty CSV output:**
   - Ensure your SonarQube server is running and accessible at the URL in `config.json`
   - Ensure your API token is valid and has sufficient permissions
   - Check console output for errors or warnings
- **Protocol errors:**
   - Verify that your `SONARQUBE_URL` starts with `http://` or `https://`
- **Build errors:**
   - Ensure you're running Node.js v20 or higher (`node --version`)
   - On macOS, the build script runs `codesign` automatically. If signing fails, the binary may still work locally.
   - For Node v20–v25.4, `postject` is fetched via `npx` at build time — ensure you have internet access during the build.
- **Debugging:**
   - Add `console.log` statements in `index.js` to inspect API responses

---


## Advanced Usage

- **Fetch warnings for a specific project:** Set `PROJECT_NAME` in `config.json` to the desired project key
- **Fetch warnings for all projects:** Leave `PROJECT_NAME` blank
- **Fetch warnings for all branches:** The script automatically fetches all branches for each project
- **Customize output CSV file name:** Change `CSV_FILE` in `config.json`
- **Extending the script:** You can modify `index.js` to filter, process, or export warnings in other formats as needed

---


## License

MIT License. See [LICENSE](LICENSE) for details.
