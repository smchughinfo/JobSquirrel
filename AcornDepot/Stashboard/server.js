const express = require('express');
const path = require('path');
const { ClipboardMonitor } = require('./services/clipboard');
const { JobQueue } = require('./services/jobQueue');

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

// Job Queue Status endpoint
app.get('/api/queue-status', (req, res) => {
    const status = jobQueue.getStatus();
    res.json(status);
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

// Set up job queue event listeners
jobQueue.on('jobQueued', (data) => {
    console.log(`🥜 Job queued: ${data.filename}`);
});

jobQueue.on('jobProcessingStarted', (data) => {
    console.log(`🥜 Processing job: ${data.filename}`);
});

jobQueue.on('jobCompleted', (data) => {
    console.log(`🥜 Job completed: ${data.filename}`);
});

jobQueue.on('jobFailed', (data) => {
    console.log(`🥜 Job failed: ${data.filename} - ${data.error.message}`);
});

jobQueue.on('error', (error) => {
    console.log(`🥜 Queue error: ${error.message}`);
});

// Start job queue processor
jobQueue.startProcessing();

//////////////////////////////////////////////////////////////////////////////////////////////////
////////// CLIPBOARD /////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////

const clipboardMonitor = new ClipboardMonitor(jobQueue);

clipboardMonitor.clearJobSquirrelMessageFromClipboard(); // clipboard gets weird. if app stops during processing it doesn't clear the clipboard and may not notice when we copy the same text (click the browser extension). so clear the clipboard on server start so the clipboard logic will run when we paste the same text into the clipboard that was already there.

clipboardMonitor.on('clipboardChange', (text) => {
    console.log(`📋 Clipboard changed: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
});
clipboardMonitor.startMonitoring();

app.listen(PORT, () => {
    console.log(`🐿️ Stashboard running at http://localhost:${PORT}`);
    console.log(`📋 Clipboard monitoring started`);
    console.log(`🥜 Job queue processor started`);
});