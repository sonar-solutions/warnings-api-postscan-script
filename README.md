

# Warnings API Post-Scan Script

This repository provides a Node.js script and cross-platform binary for post-scan processing of warnings from SonarQube APIs. It collects warnings for every project and every branch, outputting them to a CSV file for analysis or reporting.

---

## Features
- Fetches warnings for **all projects** and **all branches** in SonarQube
- Supports fetching for a single project (set `PROJECT_NAME` in `config.json`)
- Outputs warnings to a CSV file with columns: Project Key, Branch, Key, Message, Dismissable
- Checks SonarQube connectivity before running and provides clear error messages if unreachable
- Supports both HTTP and HTTPS SonarQube endpoints
- Can be run as a Node.js script or as a standalone binary for major platforms
- Easy configuration via `config.json`

---

## Getting Started

### Prerequisites
- Node.js (v14 or higher recommended)
- npm
- [pkg](https://www.npmjs.com/package/pkg) (for building binaries)

Install `pkg` globally if you plan to build binaries:
```bash
npm install -g pkg
```

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

---


## Configuration

Edit `config.json` to set up your SonarQube connection and output file:

```json
{
   "SONARQUBE_URL": "http://localhost:9091",
   "SONARQUBE_TOKEN": "your-sonarqube-token",
   "CSV_FILE": "sonarqube_warnings.csv",
   "PROJECT_NAME": "" // Leave blank to fetch warnings for ALL projects
}
```

- `SONARQUBE_URL`: The base URL of your SonarQube server (http or https)
- `SONARQUBE_TOKEN`: Your SonarQube API token
- `CSV_FILE`: Output CSV file name
- `PROJECT_NAME`: The key of the project to fetch warnings for. Leave blank to fetch warnings for all projects.

---


## Usage

### Run as Node.js Script

Build and run:
```bash
npm run build
node index.js
```

Or simply:
```bash
npm start
```

### Run as Packaged Binary

After building (`npm run build`), platform-specific binaries are available in the `dist/` folder:

- **macOS (Apple Silicon):** `./dist/index-macos-arm64`
- **macOS (Intel):** `./dist/index-macos-x64`
- **Linux (x64):** `./dist/index-linux-x64`
- **Linux (ARM64):** `./dist/index-linux-arm64`
- **Windows (x64):** `./dist/index-win-x64.exe`
- **Windows (ARM64):** `./dist/index-win-arm64.exe`

Run the binary for your platform. Example (macOS Apple Silicon):
```bash
./dist/index-macos-arm64
```
Example (Windows):
```powershell
.\dist\index-win-x64.exe
```

**Note:** Ensure `config.json` is present in the same directory as the binary or provide the correct path.

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
