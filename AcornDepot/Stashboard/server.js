const express = require('express');
const path = require('path');
const { execSync } = require('child_process');
const { getCacheDirectory } = require('./services/jobSquirrelPaths');
const { ClipboardMonitor } = require('./services/clipboard');

// Test function for debugging WSL commands
function testWSLCommand(command = 'ls') {
    const cacheDir = getCacheDirectory(true)
    const workingDir = cacheDir.replace(/\\/g, '/').replace(/^([A-Z]):/, (match, drive) => `/mnt/${drive.toLowerCase()}`);
    
    console.log(`🧪 Testing WSL command: ${command}`);
    console.log(`🧪 Working directory: ${workingDir}`);
    
    try {
        const wslCommand = `wsl -e bash -c "cd '${workingDir}' && pwd && ${command}"`;
        console.log(`🧪 Full command: ${wslCommand}`);
        const result = execSync(wslCommand, { encoding: 'utf8', timeout: 30000 });
        console.log(`🧪 Success: ${result}`);
        return result;
    } catch (error) {
        console.error(`🧪 Error: ${error.message}`);
        return `Error: ${error.message}`;
    }
}

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize clipboard monitor
const clipboardMonitor = new ClipboardMonitor();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Basic route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoints

// Test endpoint for debugging WSL commands
app.get('/api/test-wsl', (req, res) => {
    const command = req.query.cmd || 'ls';
    console.log(`🧪 Testing WSL with command: ${command}`);
    
    const result = testWSLCommand(command);
    res.json({ command, result });
});

// Set up clipboard monitoring
clipboardMonitor.on('clipboardChange', (text) => {
    console.log(`📋 Clipboard changed: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
});

// Start clipboard monitoring when server starts
clipboardMonitor.startMonitoring();

app.listen(PORT, () => {
    console.log(`🐿️ Stashboard running at http://localhost:${PORT}`);
    console.log(`📋 Clipboard monitoring started`);
});