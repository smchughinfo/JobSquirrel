const express = require('express');
const path = require('path');
const { runCommandWithStreaming } = require('./utils/commandRunner');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Basic route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoints
app.get('/api/run-scamper', (req, res) => {
    const scamperPath = path.join(__dirname, '..', 'Scamper', 'bin', 'Debug', 'net8.0', 'Scamper.exe');
    runCommandWithStreaming(req, res, scamperPath);
});

app.get('/api/process-acorns', (req, res) => {
    console.log('🌰 Process acorns endpoint hit!');
    
    // Convert Windows path to WSL path
    const scamperDir = path.join(__dirname, '..', 'Scamper');
    const wslPath = scamperDir.replace(/\\/g, '/').replace(/^([A-Z]):/, (match, drive) => `/mnt/${drive.toLowerCase()}`);
    
    console.log(`🌰 Scamper dir: ${scamperDir}`);
    console.log(`🌰 WSL path: ${wslPath}`);
    
    // Run Claude to process job files with fake TTY
    const wslArgs = [
        '-e', 'bash', '-c', 
        `cd ${wslPath} && script -qec "claude --print --dangerously-skip-permissions 'Hi Claude, can God make a rock so heavy that even he cant lift it?'" /dev/null`
    ];

    // `cd ${wslPath} && echo "Testing Claude with timeout..." && timeout 10s claude --print --dangerously-skip-permissions hello && echo "Claude completed" || echo "Claude timed out or failed"`

    console.log(`🌰 Running: wsl ${wslArgs.join(' ')}`);
    runCommandWithStreaming(req, res, 'wsl', wslArgs);
});

app.listen(PORT, () => {
    console.log(`🐿️ Stashboard running at http://localhost:${PORT}`);
});