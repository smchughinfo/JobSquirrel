const express = require('express');
const path = require('path');
const { runCommandWithStreaming } = require('./services/commandRunner');
const { getUnProcessedAcorns, askClaudeSync, askClaudeStream, testWSLCommand } = require('./services/utilities');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Basic route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoints
app.get('/api/run-scamper', (req, res) => {
    const scamperPath = path.join(__dirname, '..', 'Scamper', 'bin', 'Debug', 'net8.0', 'Scamper.exe');
    runCommandWithStreaming(req, res, scamperPath);
});

// Test endpoint for debugging WSL commands
app.get('/api/test-wsl', (req, res) => {
    const command = req.query.cmd || 'ls';
    console.log(`🧪 Testing WSL with command: ${command}`);
    
    const result = testWSLCommand(command);
    res.json({ command, result });
});

app.get('/api/process-acorns', (req, res) => {
    // Set up Server-Sent Events manually
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });

    const unprocessedAcorns = getUnProcessedAcorns();

    res.write(`data: {"type":"start","message":"Processing ${unprocessedAcorns.length} acorns..."}\n\n`);

    unprocessedAcorns.forEach((file, index) => {
        try {
            res.write(`data: {"type":"progress","message":"Processing file ${index + 1}: ${file}"}\n\n`);

            //const messageToClaude = `Hi Claude, can you reformat this job listing, in full fidelity, as a .md file. Don't do anything to the html file, just create a new md file with the exact same file name. The file is:  ${file}`;
            const messageToClaude = `Hi Claude, can you copy what you see in ${file}. to a file called ${file.replace(/html$/, "")}md.`;
            const result = askClaudeSync(messageToClaude);

            res.write(`data: {"type":"result","file":"${file}","result":"${result.replace(/"/g, '\\"')}"}\n\n`);
        } catch (error) {
            res.write(`data: {"type":"error","file":"${file}","error":"${error.message}"}\n\n`);
        }
    });

    res.write(`data: {"type":"end","message":"All acorns processed!"}\n\n`);
    res.end();
});

app.listen(PORT, () => {
    console.log(`🐿️ Stashboard running at http://localhost:${PORT}`);
});