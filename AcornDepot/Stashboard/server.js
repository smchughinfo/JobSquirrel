const express = require('express');
const path = require('path');
const { spawn } = require('child_process');

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
    console.log('🐿️ API Call: Running Scamper...');
    
    // Set headers for Server-Sent Events
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
    });

    // Send initial message
    res.write('data: {"type":"start","message":"🐿️ Starting Scamper..."}\n\n');

    // Dummy command for testing - replace with actual Scamper command
    const scamperProcess = spawn('ping', ['google.com', '-n', '5']);
    
    scamperProcess.stdout.on('data', (data) => {
        const output = data.toString().trim();
        console.log(`Scamper stdout: ${output}`);
        res.write(`data: {"type":"stdout","message":"${output}"}\n\n`);
    });

    scamperProcess.stderr.on('data', (data) => {
        const output = data.toString().trim();
        console.log(`Scamper stderr: ${output}`);
        res.write(`data: {"type":"stderr","message":"${output}"}\n\n`);
    });

    scamperProcess.on('close', (code) => {
        console.log(`🐿️ Scamper process exited with code ${code}`);
        res.write(`data: {"type":"end","message":"🐿️ Scamper finished with code ${code}","code":${code}}\n\n`);
        res.end();
    });

    // Handle client disconnect
    req.on('close', () => {
        console.log('🐿️ Client disconnected, killing Scamper process');
        scamperProcess.kill();
    });
});

app.post('/api/process-acorns', (req, res) => {
    console.log('🌰 API Call: Processing acorns...');
    res.json({ 
        success: true, 
        message: 'Acorns are being cracked and sorted!' 
    });
});

app.listen(PORT, () => {
    console.log(`🐿️ Stashboard running at http://localhost:${PORT}`);
});