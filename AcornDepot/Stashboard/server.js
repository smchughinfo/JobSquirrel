const express = require('express');
const path = require('path');
const fs = require('fs');
const { ClipboardMonitor } = require('./services/clipboard');
const { JobQueue } = require('./services/jobQueue');
const { eventBroadcaster } = require('./services/eventBroadcaster');
const { getHoard } = require('./services/hoard');
const { getHoardPath } = require('./services/jobSquirrelPaths');

//////////////////////////////////////////////////////////////////////////////////////////////////
////////// SETUP SERVER  /////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Basic route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

//////////////////////////////////////////////////////////////////////////////////////////////////
////////// ENDPOINTS /////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////

// Server-Sent Events endpoint for real-time updates
app.get('/api/events', (req, res) => {
    // Set up SSE headers
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Send initial connection event
    res.write(`data: ${JSON.stringify({
        type: 'connected',
        timestamp: new Date().toISOString(),
        message: 'Connected to Stashboard events'
    })}\n\n`);

    // Add client to broadcaster
    eventBroadcaster.addClient(res);

    // Send current system status
    eventBroadcaster.systemStatus('connected', 'Client connected to event stream');
});

// Job Queue Status endpoint
app.get('/api/queue-status', (req, res) => {
    const status = jobQueue.getStatus();
    res.json(status);
});

// Event broadcaster stats endpoint
app.get('/api/events-status', (req, res) => {
    const stats = eventBroadcaster.getStats();
    res.json(stats);
});

// Hoard endpoint to serve current job listings
app.get('/api/hoard', (req, res) => {
    try {
        const hoard = getHoard();
        res.json({ success: true, jobs: hoard.jobListings, count: hoard.jobListings.length });
    } catch (error) {
        console.error(`🥜 Error fetching hoard: ${error.message}`);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Test endpoint for debugging WSL commands (kept from original)
app.get('/api/test-wsl', (req, res) => {
    const command = req.query.cmd || 'ls';
    console.log(`🧪 Testing WSL with command: ${command}`);
    
    // You could add the testWSLCommand function back here if needed
    res.json({ command, result: "WSL testing disabled in this version" });
});

//////////////////////////////////////////////////////////////////////////////////////////////////
////////// JOB QUEUE /////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////

const jobQueue = new JobQueue();

// Set up job queue event listeners with broadcasting
jobQueue.on('jobQueued', (data) => {
    console.log(`🥜 Job queued: ${data.filename}`);
    eventBroadcaster.jobQueued(data.jobId, data.filename);
});

jobQueue.on('jobProcessingStarted', (data) => {
    console.log(`🥜 Processing job: ${data.filename}`);
    eventBroadcaster.jobStarted(data.jobId || 'unknown', data.filename);
});

jobQueue.on('jobCompleted', (data) => {
    console.log(`🥜 Job completed: ${data.filename}`);
    eventBroadcaster.jobCompleted(data.jobId || 'unknown', data.filename);
});

jobQueue.on('jobFailed', (data) => {
    console.log(`🥜 Job failed: ${data.filename} - ${data.error.message}`);
    eventBroadcaster.jobFailed(data.jobId || 'unknown', data.filename, data.error);
});

jobQueue.on('error', (error) => {
    console.log(`🥜 Queue error: ${error.message}`);
    eventBroadcaster.systemStatus('error', `Queue error: ${error.message}`);
});

// Start job queue processor
jobQueue.startProcessing();

//////////////////////////////////////////////////////////////////////////////////////////////////
////////// CLIPBOARD /////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////

const clipboardMonitor = new ClipboardMonitor(jobQueue);

clipboardMonitor.clearJobSquirrelMessageFromClipboard(); // clipboard gets weird. if app stops during processing it doesn't clear the clipboard and may not notice when we copy the same text (click the browser extension). so clear the clipboard on server start so the clipboard logic will run when we paste the same text into the clipboard that was already there.

clipboardMonitor.on('clipboardChange', (text) => {
    const preview = text.substring(0, 100) + (text.length > 100 ? '...' : '');
    console.log(`📋 Clipboard changed: ${preview}`);
    eventBroadcaster.clipboardChanged(preview);
});
clipboardMonitor.startMonitoring();

//////////////////////////////////////////////////////////////////////////////////////////////////
////////// HOARD FILE WATCHING ///////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////

const hoardPath = getHoardPath();

// Set up file watching for hoard.json
try {
    // Ensure hoard.json exists by calling getHoard()
    getHoard();
    
    console.log(`🥜 Watching hoard file: ${hoardPath}`);
    
    let watchTimeout;
    fs.watch(hoardPath, (eventType, filename) => {
        if (eventType === 'change') {
            // Debounce rapid file changes
            clearTimeout(watchTimeout);
            watchTimeout = setTimeout(() => {
                console.log(`🥜 Hoard file changed, broadcasting update...`);
                eventBroadcaster.broadcast('hoard-updated', {
                    message: 'Job hoard updated - new listings available'
                });
            }, 100);
        }
    });
} catch (error) {
    console.error(`🥜 Error setting up hoard file watching: ${error.message}`);
}

//////////////////////////////////////////////////////////////////////////////////////////////////
////////// START WEB SERVER //////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////

app.listen(PORT, () => {
    console.log(`🐿️ Stashboard running at http://localhost:${PORT}`);
    console.log(`📋 Clipboard monitoring started`);
    console.log(`🥜 Job queue processor started`);
    console.log(`📡 Event broadcasting ready at /api/events`);
    console.log(`💰 Token pricer thread started`);
    
    // Send system startup event
    eventBroadcaster.systemStatus('startup', `Stashboard started on port ${PORT}`);
});