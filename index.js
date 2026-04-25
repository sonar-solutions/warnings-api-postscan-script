const fs = require('node:fs');
const path = require('node:path');
const https = require('node:https');
const http = require('node:http');

const configPath = path.resolve(process.cwd(), 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const SONARQUBE_URL = config.SONARQUBE_URL;
const SONARQUBE_TOKEN = config.SONARQUBE_TOKEN;
const CSV_FILE = config.CSV_FILE;

async function checkSonarQubeConnection() {
    return new Promise((resolve) => {
        const url = `${SONARQUBE_URL}/api/system/status`;
        const options = {
            headers: {
                'Authorization': `Basic ${Buffer.from(SONARQUBE_TOKEN + ':').toString('base64')}`
            }
        };
        const client = url.startsWith('https') ? https : http;
        client.get(url, options, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(true);
                } else {
                    console.error(`SonarQube responded with status ${res.statusCode}: ${data}`);
                    resolve(false);
                }
            });
        }).on('error', (err) => {
            console.error('Error connecting to SonarQube:', err.message);
            resolve(false);
        });
    });
}

async function fetchAnalysisStatus(projectKey, branch) {
    return new Promise((resolve, reject) => {
        const url = `${SONARQUBE_URL}/api/ce/analysis_status?component=${projectKey}${branch ? `&branch=${encodeURIComponent(branch)}` : ''}`;
        const options = {
            headers: {
                'Authorization': `Basic ${Buffer.from(SONARQUBE_TOKEN + ':').toString('base64')}`
            }
        };
        const client = url.startsWith('https') ? https : http;
        client.get(url, options, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (err) {
                    console.error('Error parsing response:', err.message);
                    resolve(null);
                }
            });
        }).on('error', (err) => {
            console.error('Error fetching analysis status:', err.message);
            resolve(null);
        });
    });
}
// Fetch all branches for a given project
async function fetchAllBranches(projectKey) {
    return new Promise((resolve, reject) => {
        const url = `${SONARQUBE_URL}/api/project_branches/list?project=${projectKey}`;
        const options = {
            headers: {
                'Authorization': `Basic ${Buffer.from(SONARQUBE_TOKEN + ':').toString('base64')}`
            }
        };
        const client = url.startsWith('https') ? https : http;
        client.get(url, options, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    // SonarQube returns 'branches' array
                    const branches = parsed.branches ? parsed.branches.map(b => b.name) : [];
                    resolve(branches);
                } catch (err) {
                    console.error('Error parsing branches response:', err.message);
                    resolve([]);
                }
            });
        }).on('error', (err) => {
            console.error('Error fetching branches:', err.message);
            resolve([]);
        });
    });
}

async function fetchAllProjectKeys() {
    return new Promise((resolve, reject) => {
        const url = `${SONARQUBE_URL}/api/projects/search`;
        const options = {
            headers: {
                'Authorization': `Basic ${Buffer.from(SONARQUBE_TOKEN + ':').toString('base64')}`
            }
        };
        const client = url.startsWith('https') ? https : http;
        client.get(url, options, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    // SonarQube returns 'components' for /api/projects/search
                    const keys = parsed.components ? parsed.components.map(p => p.key) : [];
                    console.log('Fetched project keys:', keys);
                    resolve(keys);
                } catch (err) {
                    console.error('Error parsing projects response:', err.message);
                    resolve([]);
                }
            });
        }).on('error', (err) => {
            console.error('Error fetching projects:', err.message);
            resolve([]);
        });
    });
}

function extractWarnings(data) {
    // Adjust this function based on the actual structure of warnings in the API response
    if (!data?.component?.warnings) return [];
    const projectKey = data.component.key || '';
    return data.component.warnings.map(warning => ({
        projectKey,
        key: warning.key || '',
        text: warning.message || '',
        dismissable: typeof warning.dismissable === 'boolean' ? warning.dismissable : '',
    }));
}

function escapeCsvField(value) {
    const str = String(value ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

function writeWarningsToCsv(warnings) {
    const headers = ['Project Key', 'Branch', 'Key', 'Message', 'Dismissable'];
    const fields = ['projectKey', 'branch', 'key', 'text', 'dismissable'];
    const lines = [headers.join(',')];
    for (const row of warnings) {
        lines.push(fields.map(f => escapeCsvField(row[f])).join(','));
    }
    fs.writeFileSync(CSV_FILE, lines.join('\n') + '\n', 'utf8');
    console.log(`Wrote ${warnings.length} warnings to ${CSV_FILE}`);
}



(async () => {
    const reachable = await checkSonarQubeConnection();
    if (!reachable) {
        console.error('ERROR: Unable to connect to SonarQube at', SONARQUBE_URL);
        console.error('Please check that SonarQube is running and the URL/token in config.json are correct.');
        process.exit(1);
    }
    let allWarnings = [];
    const projectKey = config.PROJECT_NAME || '';
    if (projectKey.trim() === '') {
        const projectKeys = await fetchAllProjectKeys();
        for (const key of projectKeys) {
            const branches = await fetchAllBranches(key);
            if (branches.length === 0) {
                // If no branches, fetch without branch param
                const data = await fetchAnalysisStatus(key, '');
                const warnings = extractWarnings(data);
                console.log(`Project ${key} (no branches) warnings:`, warnings);
                allWarnings = allWarnings.concat(warnings);
            } else {
                for (const branch of branches) {
                    const data = await fetchAnalysisStatus(key, branch);
                    const warnings = extractWarnings(data);
                    console.log(`Project ${key} branch ${branch} warnings:`, warnings);
                    // Add branch info to each warning
                    allWarnings = allWarnings.concat(warnings.map(w => ({ ...w, branch })));
                }
            }
        }
    } else {
        const branches = await fetchAllBranches(projectKey);
        if (branches.length === 0) {
            const data = await fetchAnalysisStatus(projectKey, '');
            allWarnings = extractWarnings(data);
            console.log(`Project ${projectKey} (no branches) warnings:`, allWarnings);
        } else {
            for (const branch of branches) {
                const data = await fetchAnalysisStatus(projectKey, branch);
                const warnings = extractWarnings(data);
                console.log(`Project ${projectKey} branch ${branch} warnings:`, warnings);
                allWarnings = allWarnings.concat(warnings.map(w => ({ ...w, branch })));
            }
        }
    }
    writeWarningsToCsv(allWarnings);
})();
