const fs = require('node:fs');
const path = require('node:path');
const https = require('node:https');
const http = require('node:http');

const configPath = path.resolve(process.cwd(), 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const SONARQUBE_URL = config.SONARQUBE_URL;
const SONARQUBE_TOKEN = config.SONARQUBE_TOKEN;
const CSV_FILE = config.CSV_FILE;

function buildAuthHeaders() {
    return {
        'Authorization': `Basic ${Buffer.from(SONARQUBE_TOKEN + ':').toString('base64')}`
    };
}

function httpGet(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        client.get(url, { headers: buildAuthHeaders() }, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
        }).on('error', reject);
    });
}

async function checkSonarQubeConnection() {
    try {
        const { statusCode, body } = await httpGet(`${SONARQUBE_URL}/api/system/status`);
        if (statusCode === 200) return true;
        console.error(`SonarQube responded with status ${statusCode}: ${body}`);
        return false;
    } catch (err) {
        console.error('Error connecting to SonarQube:', err.message);
        return false;
    }
}

async function fetchAnalysisStatus(projectKey, branch) {
    const branchParam = branch ? `&branch=${encodeURIComponent(branch)}` : '';
    const url = `${SONARQUBE_URL}/api/ce/analysis_status?component=${projectKey}${branchParam}`;
    try {
        const { body } = await httpGet(url);
        return JSON.parse(body);
    } catch (err) {
        console.error('Error fetching analysis status:', err.message);
        return null;
    }
}

async function fetchAllBranches(projectKey) {
    const url = `${SONARQUBE_URL}/api/project_branches/list?project=${projectKey}`;
    try {
        const { body } = await httpGet(url);
        const parsed = JSON.parse(body);
        return parsed.branches ? parsed.branches.map(b => b.name) : [];
    } catch (err) {
        console.error('Error fetching branches:', err.message);
        return [];
    }
}

async function fetchAllProjectKeys() {
    const url = `${SONARQUBE_URL}/api/projects/search`;
    try {
        const { body } = await httpGet(url);
        const parsed = JSON.parse(body);
        const keys = parsed.components ? parsed.components.map(p => p.key) : [];
        console.log('Fetched project keys:', keys);
        return keys;
    } catch (err) {
        console.error('Error fetching projects:', err.message);
        return [];
    }
}

function extractWarnings(data) {
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
        return '"' + str.replaceAll('"', '""') + '"';
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

async function collectWarningsForProject(projectKey) {
    const warnings = [];
    const branches = await fetchAllBranches(projectKey);
    if (branches.length === 0) {
        const data = await fetchAnalysisStatus(projectKey, '');
        const extracted = extractWarnings(data);
        console.log(`Project ${projectKey} (no branches) warnings:`, extracted);
        return extracted;
    }
    for (const branch of branches) {
        const data = await fetchAnalysisStatus(projectKey, branch);
        const extracted = extractWarnings(data);
        console.log(`Project ${projectKey} branch ${branch} warnings:`, extracted);
        warnings.push(...extracted.map(w => ({ ...w, branch })));
    }
    return warnings;
}

(async () => {
    const reachable = await checkSonarQubeConnection();
    if (!reachable) {
        console.error('ERROR: Unable to connect to SonarQube at', SONARQUBE_URL);
        console.error('Please check that SonarQube is running and the URL/token in config.json are correct.');
        process.exit(1);
    }

    const projectKey = config.PROJECT_NAME || '';
    let allWarnings;

    if (projectKey.trim() === '') {
        allWarnings = [];
        const projectKeys = await fetchAllProjectKeys();
        for (const key of projectKeys) {
            allWarnings.push(...await collectWarningsForProject(key));
        }
    } else {
        allWarnings = await collectWarningsForProject(projectKey);
    }

    writeWarningsToCsv(allWarnings);
})();
