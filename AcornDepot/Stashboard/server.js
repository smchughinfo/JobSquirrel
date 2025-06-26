const express = require('express');
const path = require('path');
const { execSync } = require('child_process');
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

// Track running processes for kill functionality
let runningProcesses = {
    scamper: null,
    acorns: null
};

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Basic route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoints
app.get('/api/run-scamper', (req, res) => {
    if (runningProcesses.scamper) {
        // Already running, send error
        res.status(409).json({ error: 'Scamper is already running. Use /api/kill-scamper to stop it.' });
        return;
    }

    const scamperPath = path.join(__dirname, '..', 'Scamper', 'bin', 'Debug', 'net8.0', 'Scamper.exe');
    const childProcess = runCommandWithStreaming(req, res, scamperPath);
    
    // Store the process reference
    runningProcesses.scamper = childProcess;
    
    // Clean up when process ends
    childProcess.on('close', () => {
        runningProcesses.scamper = null;
    });
});

// Kill Scamper endpoint
app.post('/api/kill-scamper', (req, res) => {
    if (runningProcesses.scamper) {
        console.log('🔪 Killing Scamper process...');
        
        // Kill the main Scamper process
        runningProcesses.scamper.kill('SIGKILL'); // Use SIGKILL for more forceful termination
        runningProcesses.scamper = null;
        
        // Also kill any lingering Chrome and ChromeDriver processes
        console.log('🔪 Killing Chrome and ChromeDriver processes...');
        
        try {
            // Kill Chrome processes
            execSync('taskkill /f /im chrome.exe', { stdio: 'ignore' });
            console.log('🔪 Chrome processes killed');
        } catch (error) {
            console.log('ℹ️ No Chrome processes to kill or kill failed');
        }
        
        try {
            // Kill ChromeDriver processes  
            execSync('taskkill /f /im chromedriver.exe', { stdio: 'ignore' });
            console.log('🔪 ChromeDriver processes killed');
        } catch (error) {
            console.log('ℹ️ No ChromeDriver processes to kill or kill failed');
        }
        
        res.json({ success: true, message: 'Scamper, Chrome, and ChromeDriver processes killed' });
    } else {
        res.status(404).json({ error: 'No Scamper process running' });
    }
});

// Check if Scamper is running
app.get('/api/scamper-status', (req, res) => {
    res.json({ 
        running: runningProcesses.scamper !== null,
        pid: runningProcesses.scamper ? runningProcesses.scamper.pid : null
    });
});

// Test endpoint for debugging WSL commands
app.get('/api/test-wsl', (req, res) => {
    const command = req.query.cmd || 'ls';
    console.log(`🧪 Testing WSL with command: ${command}`);
    
    const result = testWSLCommand(command);
    res.json({ command, result });
});

app.get('/api/process-acorns', async (req, res) => {
    if (runningProcesses.acorns) {
        // Already running, send error
        res.status(409).json({ error: 'Acorns processing is already running. Use /api/kill-acorns to stop it.' });
        return;
    }

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

    // Mark as running and store cancellation flag
    runningProcesses.acorns = { 
        cancelled: false,
        response: res,
        startTime: new Date()
    };

    res.write(`data: {"type":"start","message":"Processing ${unprocessedAcorns.length} acorns..."}\n\n`);
    res.flushHeaders(); // Force flush

    // Process files sequentially, one at a time
    for (let index = 0; index < unprocessedAcorns.length; index++) {
        // Check if cancelled
        if (runningProcesses.acorns && runningProcesses.acorns.cancelled) {
            console.log('🔪 Acorns processing cancelled by user');
            res.write(`data: {"type":"end","message":"Acorns processing cancelled by user"}\n\n`);
            res.end();
            runningProcesses.acorns = null;
            return;
        }

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

    // Clean completion
    if (runningProcesses.acorns && !runningProcesses.acorns.cancelled) {
        res.write(`data: {"type":"end","message":"All acorns processed!"}\n\n`);
        res.end();
        runningProcesses.acorns = null;
    }
});

// Kill Acorns processing endpoint
app.post('/api/kill-acorns', (req, res) => {
    if (runningProcesses.acorns) {
        console.log('🔪 Killing acorns processing...');
        
        // Set cancellation flag
        runningProcesses.acorns.cancelled = true;
        
        // Close the SSE connection if it exists
        if (runningProcesses.acorns.response) {
            try {
                runningProcesses.acorns.response.end();
            } catch (error) {
                console.log('Response already closed');
            }
        }
        
        runningProcesses.acorns = null;
        res.json({ success: true, message: 'Acorns processing cancelled' });
    } else {
        res.status(404).json({ error: 'No acorns processing running' });
    }
});

// Check if Acorns processing is running
app.get('/api/acorns-status', (req, res) => {
    res.json({ 
        running: runningProcesses.acorns !== null,
        startTime: runningProcesses.acorns ? runningProcesses.acorns.startTime : null
    });
});

app.listen(PORT, () => {
    console.log(`🐿️ Stashboard running at http://localhost:${PORT}`);
});