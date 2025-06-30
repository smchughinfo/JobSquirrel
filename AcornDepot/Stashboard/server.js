const express = require('express');
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');
const { ClipboardMonitor } = require('./services/clipboard');
const { JobQueue } = require('./services/jobQueue');
const { eventBroadcaster } = require('./services/eventBroadcaster');
const { getHoard, addOrUpdateNutNote, getIdentifier, deleteNutNote } = require('./services/hoard');
const { getHoardPath, getResumeDataVectorStoreIdPath } = require('./services/jobSquirrelPaths');
const { generateResume, UploadResumeData } = require('./services/resumeGenerator');

//////////////////////////////////////////////////////////////////////////////////////////////////
////////// SETUP SERVER  /////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve GeneratedResumes directory for PDF access
const { getJobSquirrelRootDirectory } = require('./services/jobSquirrelPaths');
const generatedResumesPath = path.join(getJobSquirrelRootDirectory(), 'GeneratedResumes');
app.use('/GeneratedResumes', express.static(generatedResumesPath));

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
    
    // Send initial resume data status to new client
    setTimeout(() => broadcastResumeDataStatus(), 100);
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
    const hoard = getHoard();
    res.json({ success: true, jobs: hoard.jobListings, count: hoard.jobListings.length });
});

// Update nut note endpoint (accepts full nut note object)
app.patch('/api/nut-note', (req, res) => {
    const nutNote = req.body;
    addOrUpdateNutNote(nutNote);
    res.sendStatus(200);
});

// Delete nut note endpoint
app.delete('/api/nut-note', (req, res) => {
    const { company, jobTitle } = req.body;
    deleteNutNote(company, jobTitle);
    res.sendStatus(200);
});

// Generate resume endpoint
app.post('/api/generate-resume', async (req, res) => {
    const nutNote = req.body;
    await generateResume(nutNote);
    res.sendStatus(200);
});

// Generate PDF endpoint
app.post('/api/generate-pdf', async (req, res) => {
    try {
        const { html, company, jobTitle } = req.body;
        
        if (!html || !company || !jobTitle) {
            return res.status(400).json({ error: 'Missing required parameters: html, company, jobTitle' });
        }
        
        const { getTempHtmlToPDFPath, getJobSquirrelRootDirectory } = require('./services/jobSquirrelPaths');
        const fs = require('fs');
        const path = require('path');
        
        // Save HTML to temp file
        const tempHtmlPath = getTempHtmlToPDFPath();
        fs.writeFileSync(tempHtmlPath, html);
        
        // Generate PDF filename and path
        const filename = `Sean McHugh - Resume For ${jobTitle} - ${company}.pdf`;
        const rootDir = getJobSquirrelRootDirectory();
        const pdfPath = path.join(rootDir, 'GeneratedResumes', filename);
        
        // Ensure GeneratedResumes directory exists
        const generatedResumesDir = path.join(rootDir, 'GeneratedResumes');
        if (!fs.existsSync(generatedResumesDir)) {
            fs.mkdirSync(generatedResumesDir, { recursive: true });
        }
        
        // Generate PDF using the pdf service
        
        async function htmlToPdf(htmlContent, outputPath, marginInches = 0) {
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
        
            await page.setContent(htmlContent);
            
            // Inject the CSS for page margins
            await page.addStyleTag({
                content: `
                    @page { 
                        margin-top: 0.5in; 
                        margin-bottom: 0.5in; 
                        ${marginInches > 0 ? `margin-left: ${marginInches}in;` : ""}
                        ${marginInches > 0 ? `margin-right: ${marginInches}in;` : ""}
                    } 
                    @page :first { 
                        margin-top: 0; 
                        margin-bottom: 0.5in; 
                        ${marginInches > 0 ? `margin-left: ${marginInches}in;` : ""}
                        ${marginInches > 0 ? `margin-right: ${marginInches}in;` : ""}
                    }
                `
            });
        
            await page.pdf({
                path: outputPath,
                format: 'A4',
                printBackground: true,
                displayHeaderFooter: false
            });
        
            await browser.close();
        }
        
        await htmlToPdf(html, pdfPath, 0);
        
        // Return the PDF path (relative for client access)
        const relativePdfPath = `/GeneratedResumes/${filename}`;
        
        res.json({ 
            success: true, 
            pdfPath: relativePdfPath,
            filename: filename
        });
        
    } catch (error) {
        console.error('❌ PDF generation failed:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Test Claude streaming endpoint
app.post('/api/test-claude-stream', async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }
        
        console.log('🧪 Testing Claude streaming with message:', message);
        
        // Import AskClaude function
        const { AskClaude } = require('./services/llm/anthropic');
        
        // Call AskClaude (events are broadcast automatically)
        const result = await AskClaude(message, null);
        
        res.json({ 
            success: true, 
            result,
            message: 'Claude streaming test completed successfully'
        });
        
    } catch (error) {
        console.error('❌ Claude streaming test failed:', error.message);
        
        // Broadcast error to clients
        eventBroadcaster.broadcast('claude-stream', {
            type: 'error',
            message: `Claude streaming failed: ${error.message}`,
            error: error.message,
            timestamp: new Date().toISOString()
        });
        
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Upload resume data endpoint
app.post('/api/upload-resume-data', async (req, res) => {
    try {
        const vectorStoreId = await UploadResumeData();
        res.json({ success: true, vectorStoreId });
    } catch (error) {
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
////////// FILE WATCHING //////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////

const hoardPath = getHoardPath();
const resumeDataVectorStoreIdPath = getResumeDataVectorStoreIdPath();

// Track hoard count for change detection
let previousHoardCount = 0;

// Set up file watching for hoard.json
try {
    // Ensure hoard.json exists by calling getHoard()
    const initialHoard = getHoard();
    previousHoardCount = initialHoard.jobListings.length;
    
    console.log(`🥜 Watching hoard file: ${hoardPath} (initial count: ${previousHoardCount})`);
    
    let watchTimeout;
    fs.watch(hoardPath, (eventType, filename) => {
        if (eventType === 'change') {
            // Debounce rapid file changes
            clearTimeout(watchTimeout);
            watchTimeout = setTimeout(() => {
                try {
                    const currentHoard = getHoard();
                    const currentCount = currentHoard.jobListings.length;
                    
                    if (currentCount !== previousHoardCount) {
                        console.log(`🥜 Hoard count changed from ${previousHoardCount} to ${currentCount}, broadcasting update...`);
                        eventBroadcaster.broadcast('hoard-updated', {
                            message: 'Job hoard updated - new listings available'
                        });
                    } else {
                        // Count unchanged, but file modified - likely an existing job was updated
                        console.log(`🥜 Hoard file changed but count unchanged (${currentCount}), broadcasting update for modified jobs...`);
                        eventBroadcaster.broadcast('hoard-updated', {
                            message: 'Job hoard updated - existing listings modified'
                        });
                    }
                    
                    previousHoardCount = currentCount;
                } catch (error) {
                    console.error(`🥜 Error reading hoard for count check: ${error.message}`);
                }
            }, 100);
        }
    });
} catch (error) {
    console.error(`🥜 Error setting up hoard file watching: ${error.message}`);
}

// Set up file watching for resume-data-vector-store-id.txt
function broadcastResumeDataStatus() {
    try {
        if (fs.existsSync(resumeDataVectorStoreIdPath)) {
            const stats = fs.statSync(resumeDataVectorStoreIdPath);
            eventBroadcaster.broadcast('resume-data-upload-status', {
                message: 'Retriving latest vector data store id',
                lastModified: stats.mtime.toISOString()
            });
        }
    } catch (error) {
        console.error(`📁 Error getting resume data status: ${error.message}`);
    }
}

try {
    console.log(`📁 Watching resume data vector store file: ${resumeDataVectorStoreIdPath}`);
    
    // Send initial status
    broadcastResumeDataStatus();
    
    let resumeWatchTimeout;
    fs.watch(path.dirname(resumeDataVectorStoreIdPath), (eventType, filename) => {
        if (filename === path.basename(resumeDataVectorStoreIdPath) && eventType === 'change') {
            clearTimeout(resumeWatchTimeout);
            resumeWatchTimeout = setTimeout(() => {
                console.log(`📁 Resume data vector store file changed, broadcasting status...`);
                broadcastResumeDataStatus();
            }, 100);
        }
    });
} catch (error) {
    console.error(`📁 Error setting up resume data vector store file watching: ${error.message}`);
}

//////////////////////////////////////////////////////////////////////////////////////////////////
////////// GLOBAL ERROR HANDLING //////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////

/*// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('🔥 UNCAUGHT EXCEPTION:', error);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('🔥 UNHANDLED REJECTION at:', promise, 'reason:', reason);
});*/

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