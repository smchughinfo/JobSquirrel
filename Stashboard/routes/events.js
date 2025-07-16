const express = require('express');
const router = express.Router();
const fs = require('fs');
const { eventBroadcaster } = require('../services/eventBroadcaster');
const { getResumeDataVectorStoreIdPath } = require('../services/jobSquirrelPaths');
const { getGenerationQueueStatus } = require('../services/generators/noTemplate');

// Function to broadcast resume data status
function broadcastResumeDataStatus() {
    try {
        const resumeDataVectorStoreIdPath = getResumeDataVectorStoreIdPath();
        if (fs.existsSync(resumeDataVectorStoreIdPath)) {
            const stats = fs.statSync(resumeDataVectorStoreIdPath);
            eventBroadcaster.broadcast('resume-data-upload-status', {
                message: 'Retrieving latest vector data store id',
                lastModified: stats.mtime.toISOString()
            });
        }
    } catch (error) {
        console.error(`📁 Error getting resume data status: ${error.message}`);
    }
}

// Server-Sent Events endpoint for real-time updates  
router.get('/events', (req, res) => {
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
    
    // Send initial resume data status to new client
    setTimeout(() => broadcastResumeDataStatus(), 100);
});

// Job Queue Status endpoint
router.get('/queue-status', (req, res) => {
    // This will be populated by server.js when jobQueue is available
    res.json({ message: 'Queue status endpoint available after server initialization' });
});

// Event broadcaster stats endpoint
router.get('/events-status', (req, res) => {
    const stats = eventBroadcaster.getStats();
    res.json(stats);
});

// Generation queue status endpoint  
router.get('/generation-queue-status', (req, res) => {
    const status = getGenerationQueueStatus();
    res.json(status);
});

// Test WSL endpoint (for debugging)
router.get('/test-wsl', (req, res) => {
    const command = req.query.cmd || 'ls';
    console.log(`🧪 Testing WSL with command: ${command}`);
    
    // WSL testing functionality can be added here if needed
    res.json({ command, result: "WSL testing disabled in this version" });
});

module.exports = router;