const express = require('express');
const path = require('path');
const { runCommandWithStreaming } = require('./services/commandRunner');
const { getUnProcessedAcorns, askClaudeSync, askClaudeStream, testWSLCommand } = require('./services/utilities');

// Helper function to properly escape JSON strings
function escapeJsonString(str) {
    return str
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
}

// Helper function to add delay for streaming
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

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

app.get('/api/process-acorns', async (req, res) => {
    // Set up Server-Sent Events manually
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no' // Disable nginx buffering if present
    });

    // Disable Express buffering
    res.socket.setNoDelay(true);

    const unprocessedAcorns = getUnProcessedAcorns();

    res.write(`data: {"type":"start","message":"Processing ${unprocessedAcorns.length} acorns..."}\n\n`);
    res.flushHeaders(); // Force flush

    // Process files sequentially, one at a time
    for (let index = 0; index < unprocessedAcorns.length; index++) {
        const file = unprocessedAcorns[index];
        
        try {
            console.log(`🐿️ [${new Date().toISOString()}] Starting file ${index + 1}: ${file}`);
            res.write(`data: {"type":"progress","message":"${escapeJsonString(`Processing file ${index + 1}: ${file}/${unprocessedAcorns.length}`)}"}\n\n`);
            
            // Add small delay to ensure message is sent
            await delay(100);

            const messageToClaude = `Hi Claude, can you copy what you see in ${file}. to a file called ${file.replace(/html$/, "")}md.`;
            
            // Process this file and immediately send the result
            const result = askClaudeSync(messageToClaude);
            
            console.log(`🐿️ [${new Date().toISOString()}] Completed file ${index + 1}: ${file}`);
            
            // Send the result immediately after this file is processed
            res.write(`data: {"type":"result","file":"${escapeJsonString(file)}","result":"${escapeJsonString(result)}"}\n\n`);
            
            // Add small delay to ensure message is sent before next iteration
            await delay(100);
            
        } catch (error) {
            console.log(`🐿️ [${new Date().toISOString()}] Error with file ${index + 1}: ${file} - ${error.message}`);
            res.write(`data: {"type":"error","file":"${escapeJsonString(file)}","error":"${escapeJsonString(error.message)}"}\n\n`);
            await delay(100);
        }
    }

    res.write(`data: {"type":"end","message":"All acorns processed!"}\n\n`);
    res.end();
});

app.listen(PORT, () => {
    console.log(`🐿️ Stashboard running at http://localhost:${PORT}`);
});