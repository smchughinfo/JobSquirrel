const express = require('express');
const path = require('path');
const { execSync } = require('child_process');
const { runCommandWithStreaming } = require('./services/commandRunner');
const { AcornProcessor } = require('./services/acornProcessor');
const { getCacheDirectory, getAcornDepotDirectory } = require('./services/jobSquirrelPaths');
const { ClipboardMonitor } = require('./services/clipboard');

// Helper function to properly escape JSON strings
function escapeJsonString(str) {
    // Handle null, undefined, or non-string values
    if (str === null || str === undefined) {
        return '';
    }
    
    // Convert to string if it's not already
    const stringValue = String(str);
    
    return stringValue
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

    const acornDepotPath = getAcornDepotDirectory();
    const scamperPath = path.join(acornDepotPath, 'Scamper', 'bin', 'Debug', 'net8.0', 'Scamper.exe');
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

app.get('/api/process-acorns', (req, res) => {
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

    // Create new processor instance
    const processor = new AcornProcessor();
    
    // Store processor reference for kill functionality
    runningProcesses.acorns = {
        processor: processor,
        response: res,
        startTime: new Date()
    };

    // Set up event listeners for streaming
    processor.on('start', (data) => {
        res.write(`data: {"type":"start","message":"${escapeJsonString(data.message)}"}\n\n`);
    });

    processor.on('progress', (data) => {
        res.write(`data: {"type":"progress","message":"${escapeJsonString(data.message)}"}\n\n`);
    });

    processor.on('result', (data) => {
        res.write(`data: {"type":"result","file":"${escapeJsonString(data.file)}","result":"${escapeJsonString(data.result)}"}\n\n`);
    });

    processor.on('error', (data) => {
        // Handle both file-specific errors and general errors
        if (data.file) {
            res.write(`data: {"type":"error","file":"${escapeJsonString(data.file)}","error":"${escapeJsonString(data.error)}"}\n\n`);
        } else {
            res.write(`data: {"type":"error","error":"${escapeJsonString(data.error)}"}\n\n`);
        }
    });

    processor.on('cancelled', (data) => {
        res.write(`data: {"type":"end","message":"${escapeJsonString(data.message)}"}\n\n`);
        res.end();
        runningProcesses.acorns = null;
    });

    processor.on('complete', (data) => {
        res.write(`data: {"type":"end","message":"${escapeJsonString(data.message)}"}\n\n`);
        res.end();
        runningProcesses.acorns = null;
    });

    // Handle client disconnect
    req.on('close', () => {
        console.log('Client disconnected, cancelling acorn processing');
        if (processor) {
            processor.cancel();
        }
        runningProcesses.acorns = null;
    });

    // Start processing
    processor.processAllUnprocessedAcorns().catch(error => {
        console.error('Processor error:', error);
        res.write(`data: {"type":"error","error":"${escapeJsonString(error.message)}"}\n\n`);
        res.end();
        runningProcesses.acorns = null;
    });
});

// Kill Acorns processing endpoint
app.post('/api/kill-acorns', (req, res) => {
    if (runningProcesses.acorns) {
        console.log('🔪 Killing acorns processing...');
        
        // Cancel the processor
        if (runningProcesses.acorns.processor) {
            runningProcesses.acorns.processor.cancel();
        }
        
        // The processor will emit 'cancelled' event which will clean up runningProcesses.acorns
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