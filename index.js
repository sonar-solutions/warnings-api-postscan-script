// Required package: csv-writer
// Install with: npm install csv-writer

const fs = require('fs');
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
const SONARQUBE_URL = config.SONARQUBE_URL;
const SONARQUBE_TOKEN = config.SONARQUBE_TOKEN;
const CSV_FILE = config.CSV_FILE;

const https = require('https');
const http = require('http');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

async function fetchAnalysisStatus(projectKey) {
    return new Promise((resolve, reject) => {
        const url = `${SONARQUBE_URL}/api/ce/analysis_status?component=${projectKey}&projectName=${projectKey}`;
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

async function writeWarningsToCsv(warnings) {
    const csvWriter = createCsvWriter({
        path: CSV_FILE,
        header: [
            {id: 'projectKey', title: 'Project Key'},
            {id: 'key', title: 'Key'},
            {id: 'text', title: 'Message'},
            {id: 'dismissable', title: 'Dismissable'}
        ]
    });
    await csvWriter.writeRecords(warnings);
    console.log(`Wrote ${warnings.length} warnings to ${CSV_FILE}`);
}

(async () => {
    let allWarnings = [];
    const projectKey = config.PROJECT_NAME || '';
    if (projectKey.trim() === '') {
        const projectKeys = await fetchAllProjectKeys();
        for (const key of projectKeys) {
            const data = await fetchAnalysisStatus(key);
            const warnings = extractWarnings(data);
            console.log(`Project ${key} warnings:`, warnings);
            allWarnings = allWarnings.concat(warnings);
        }
    } else {
        const data = await fetchAnalysisStatus(projectKey);
        allWarnings = extractWarnings(data);
        console.log(`Project ${projectKey} warnings:`, allWarnings);
    }
    await writeWarningsToCsv(allWarnings);
})();
