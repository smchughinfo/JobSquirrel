const express = require('express');
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');
const { ClipboardMonitor } = require('./services/clipboard');
const { JobQueue } = require('./services/jobQueue');
const { eventBroadcaster } = require('./services/eventBroadcaster');
const { getHoard, addOrUpdateNutNote, getIdentifier, deleteNutNote, deleteNuteNoteByIndex, deleteCoverLetterByIndex } = require('./services/hoard');
const { getHoardPath, getResumeDataVectorStoreIdPath } = require('./services/jobSquirrelPaths');
const { generateResume, generateCoverLetter, remixResumeAnthropic, remixCoverLetterAnthropic, UploadResumeData, doubleCheckResume, doubleCheckCoverLetterAnthropic } = require('./services/resumeGenerator');
const { htmlToPdf } = require('./services/pdf');


//////////////////////////////////////////////////////////////////////////////////////////////////
////////// SETUP SERVER  /////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware with maximum payload size
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
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

// Delete specific resume version endpoint
app.delete('/api/resume-version', (req, res) => {
    try {
        const { nutNote, resumeIndex } = req.body;
        
        if (!nutNote || resumeIndex === undefined) {
            return res.status(400).json({ 
                error: 'Missing required parameters: nutNote, resumeIndex' 
            });
        }
        
        console.log(`🗑️ Deleting resume version ${resumeIndex + 1} for ${nutNote.company} - ${nutNote.jobTitle}`);
        
        deleteNuteNoteByIndex(nutNote, resumeIndex);
        
        res.json({ 
            success: true, 
            message: `Resume version ${resumeIndex + 1} deleted successfully`
        });
        
    } catch (error) {
        console.error('❌ Resume version deletion failed:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Delete specific cover letter version endpoint
app.delete('/api/cover-letter-version', (req, res) => {
    try {
        const { nutNote, coverLetterIndex } = req.body;
        
        if (!nutNote || coverLetterIndex === undefined) {
            return res.status(400).json({ 
                error: 'Missing required parameters: nutNote, coverLetterIndex' 
            });
        }
        
        console.log(`🗑️ Deleting cover letter version ${coverLetterIndex + 1} for ${nutNote.company} - ${nutNote.jobTitle}`);
        
        deleteCoverLetterByIndex(nutNote, coverLetterIndex);
        
        res.json({ 
            success: true, 
            message: `Cover letter version ${coverLetterIndex + 1} deleted successfully`
        });
        
    } catch (error) {
        console.error('❌ Cover letter version deletion failed:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Generate resume endpoint
app.post('/api/generate-resume', async (req, res) => {
    const nutNote = req.body;
    await generateResume(nutNote);
    res.sendStatus(200);
});

// Generate cover letter endpoint
app.post('/api/generate-cover-letter', async (req, res) => {
    const nutNote = req.body;
    await generateCoverLetter(nutNote);
    res.sendStatus(200);
});

// Double-check resume endpoint
app.post('/api/double-check-resume', async (req, res) => {
    try {
        const { nutNote, resumeIndex } = req.body;
        
        if (!nutNote || resumeIndex === undefined) {
            return res.status(400).json({ 
                error: 'Missing required parameters: nutNote, resumeIndex' 
            });
        }
        
        console.log(`✅ Starting double-check for resume version ${resumeIndex + 1} for ${nutNote.company} - ${nutNote.jobTitle}`);
        
        await doubleCheckResume(nutNote, resumeIndex);
        
        res.json({ 
            success: true, 
            message: `Resume double-check completed for version ${resumeIndex + 1}`
        });
        
    } catch (error) {
        console.error('❌ Resume double-check failed:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Remix resume endpoint
app.post('/api/remix-resume', async (req, res) => {
    try {
        const { nutNote, activeResumeIndex, currentResumeHtml, requestedChanges } = req.body;
        
        if (!nutNote || currentResumeHtml === undefined || !requestedChanges || activeResumeIndex === undefined) {
            return res.status(400).json({ 
                error: 'Missing required parameters: nutNote, activeResumeIndex, currentResumeHtml, requestedChanges' 
            });
        }
        
        console.log(`🎨 Starting resume remix for ${nutNote.company} - ${nutNote.jobTitle}`);
        console.log(`📝 Changes requested: ${requestedChanges}`);
        console.log(`📊 Remixing resume version ${activeResumeIndex + 1}`);
        
        // Call the actual remix function
        await remixResumeAnthropic(nutNote, requestedChanges, activeResumeIndex);
        
        res.json({ 
            success: true, 
            message: 'Resume remix completed successfully'
        });
        
    } catch (error) {
        console.error('❌ Resume remix failed:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Remix cover letter endpoint
app.post('/api/remix-cover-letter', async (req, res) => {
    try {
        const { nutNote, activeCoverLetterIndex, currentCoverLetterHtml, requestedChanges } = req.body;
        
        if (!nutNote || currentCoverLetterHtml === undefined || !requestedChanges || activeCoverLetterIndex === undefined) {
            return res.status(400).json({ 
                error: 'Missing required parameters: nutNote, activeCoverLetterIndex, currentCoverLetterHtml, requestedChanges' 
            });
        }
        
        console.log(`🎨 Starting cover letter remix for ${nutNote.company} - ${nutNote.jobTitle}`);
        console.log(`📝 Changes requested: ${requestedChanges}`);
        console.log(`📊 Remixing cover letter version ${activeCoverLetterIndex + 1}`);
        
        // Call the actual remix function
        await remixCoverLetterAnthropic(nutNote, requestedChanges, activeCoverLetterIndex);
        
        res.json({ 
            success: true, 
            message: 'Cover letter remix completed successfully'
        });
        
    } catch (error) {
        console.error('❌ Cover letter remix failed:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Double-check cover letter endpoint
app.post('/api/double-check-cover-letter', async (req, res) => {
    try {
        const { nutNote, coverLetterIndex } = req.body;
        
        if (!nutNote || coverLetterIndex === undefined) {
            return res.status(400).json({ 
                error: 'Missing required parameters: nutNote, coverLetterIndex' 
            });
        }
        
        console.log(`✅ Starting double-check for cover letter version ${coverLetterIndex + 1} for ${nutNote.company} - ${nutNote.jobTitle}`);
        
        await doubleCheckCoverLetterAnthropic(nutNote, coverLetterIndex);
        
        res.json({ 
            success: true, 
            message: `Cover letter double-check completed for version ${coverLetterIndex + 1}`
        });
        
    } catch (error) {
        console.error('❌ Cover letter double-check failed:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Generate PDF endpoint
app.post('/api/generate-pdf', async (req, res) => {
    try {
        const { nutNote, resumeHtml, marginInches } = req.body;
        
        if (!nutNote || !resumeHtml) {
            return res.status(400).json({ error: 'Missing required parameters: nutNote, resumeHtml' });
        }
        
        const { getJobSquirrelRootDirectory } = require('./services/jobSquirrelPaths');
        const fs = require('fs');
        const path = require('path');
        
        // Generate PDF filename and path
        const filename = `Sean McHugh - Resume For ${nutNote.jobTitle} - ${nutNote.company}.pdf`;
        const rootDir = getJobSquirrelRootDirectory();
        const pdfPath = path.join(rootDir, 'GeneratedResumes', filename);
        
        // Ensure GeneratedResumes directory exists
        const generatedResumesDir = path.join(rootDir, 'GeneratedResumes');
        if (!fs.existsSync(generatedResumesDir)) {
            fs.mkdirSync(generatedResumesDir, { recursive: true });
        }
        
        // Generate PDF using the pdf service
        await htmlToPdf(resumeHtml, pdfPath, parseFloat(marginInches) || 0);
        
        // Return the PDF path (relative for client access)
        const relativePdfPath = `/GeneratedResumes/${filename}`;
        
        // Update the job record with the PDF path
        try {
            const hoard = getHoard();
            const job = hoard.jobListings.find(job => getIdentifier(job) === getIdentifier(nutNote));
            if (job) {
                job.pdfPath = relativePdfPath;
                // Save the updated hoard
                const hoardPath = getHoardPath();
                fs.writeFileSync(hoardPath, JSON.stringify(hoard, null, 2));
                console.log(`🥜 Updated job ${getIdentifier(nutNote)} with PDF path: ${relativePdfPath}`);
                
                // Broadcast hoard update event
                eventBroadcaster.broadcast('hoard-updated', {
                    type: 'pdf-generated',
                    content: `PDF generated for ${nutNote.company} - ${nutNote.jobTitle}`,
                    pdfPath: relativePdfPath
                });
            } else {
                console.warn(`⚠️ Could not find job with identifier: ${getIdentifier(nutNote)}`);
            }
        } catch (updateError) {
            console.warn('⚠️ Failed to update job with PDF path:', updateError.message);
            // Don't fail the request if job update fails
        }
        
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

// Get configuration files endpoint
app.get('/api/config-files', (req, res) => {
    try {
        const customResumeInstructionsPath = path.join(getJobSquirrelRootDirectory(), 'Config', 'custom-resume-instructions.txt');
        const personalInformationPath = path.join(getJobSquirrelRootDirectory(), 'Config', 'personal-information.txt');
        
        let customResumeInstructions = '';
        let personalInformation = '';
        
        if (fs.existsSync(customResumeInstructionsPath)) {
            customResumeInstructions = fs.readFileSync(customResumeInstructionsPath, 'utf8');
        }
        
        if (fs.existsSync(personalInformationPath)) {
            personalInformation = fs.readFileSync(personalInformationPath, 'utf8');
        }
        
        res.json({
            success: true,
            customResumeInstructions,
            personalInformation
        });
        
    } catch (error) {
        console.error('❌ Error reading config files:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Update configuration files endpoint
app.post('/api/update-config-file', (req, res) => {
    try {
        const { fileName, content } = req.body;
        
        if (!fileName || content === undefined) {
            return res.status(400).json({
                error: 'Missing required parameters: fileName, content'
            });
        }
        
        // Determine file path based on fileName
        let filePath;
        if (fileName === 'custom-resume-instructions.txt') {
            filePath = path.join(getJobSquirrelRootDirectory(), 'Config', 'custom-resume-instructions.txt');
        } else if (fileName === 'personal-information.txt') {
            filePath = path.join(getJobSquirrelRootDirectory(), 'Config', 'personal-information.txt');
        } else {
            return res.status(400).json({
                error: 'Invalid fileName. Must be custom-resume-instructions.txt or personal-information.txt'
            });
        }
        
        // Ensure Config directory exists
        const configDir = path.join(getJobSquirrelRootDirectory(), 'Config');
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
            console.log(`📁 Created Config directory: ${configDir}`);
        }
        
        // Write the file
        fs.writeFileSync(filePath, content, 'utf8');
        
        console.log(`🔧 Updated configuration file: ${fileName}`);
        console.log(`📁 File path: ${filePath}`);
        console.log(`📝 Content length: ${content.length} characters`);
        
        res.json({
            success: true,
            message: `Configuration file ${fileName} updated successfully`,
            filePath
        });
        
    } catch (error) {
        console.error('❌ Error updating config file:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
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

// Configuration file paths
const customResumeInstructionsPath = path.join(getJobSquirrelRootDirectory(), 'Config', 'custom-resume-instructions.txt');
const personalInformationPath = path.join(getJobSquirrelRootDirectory(), 'Config', 'personal-information.txt');

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
                    
                    if (currentCount > previousHoardCount) {
                        console.log(`🥜 Hoard count changed from ${previousHoardCount} to ${currentCount}, broadcasting update...`);
                        eventBroadcaster.broadcast('hoard-updated', {
                            message: 'Job hoard updated - new listings available'
                        });
                    } 
                    else if (currentCount < previousHoardCount) {
                        console.log(`🥜 Hoard count changed from ${previousHoardCount} to ${currentCount}, broadcasting update...`);
                        eventBroadcaster.broadcast('hoard-updated', {
                            message: 'Job hoard updated - listing removed'
                        });
                    } 
                    else {
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

// Function to log configuration file contents
function logConfigFileContents(filePath, fileLabel) {
    try {
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            console.log(`\n🔧 ${fileLabel} contents:`);
            console.log('─'.repeat(50));
            console.log(content);
            console.log('─'.repeat(50));
        } else {
            console.log(`⚠️ ${fileLabel} not found at: ${filePath}`);
        }
    } catch (error) {
        console.error(`❌ Error reading ${fileLabel}: ${error.message}`);
    }
}

// Log initial contents of configuration files
logConfigFileContents(customResumeInstructionsPath, 'Custom Resume Instructions');
logConfigFileContents(personalInformationPath, 'Personal Information');

// Set up file watching for custom-resume-instructions.txt
try {
    console.log(`🔧 Watching custom resume instructions file: ${customResumeInstructionsPath}`);
    
    let customInstructionsTimeout;
    fs.watch(customResumeInstructionsPath, (eventType, filename) => {
        if (eventType === 'change') {
            clearTimeout(customInstructionsTimeout);
            customInstructionsTimeout = setTimeout(() => {
                console.log(`🔧 Custom resume instructions file changed, logging contents...`);
                logConfigFileContents(customResumeInstructionsPath, 'Custom Resume Instructions');
                
                // Broadcast the change to connected clients
                try {
                    const content = fs.readFileSync(customResumeInstructionsPath, 'utf8');
                    eventBroadcaster.broadcast('config-file-changed', {
                        type: 'config-change',
                        fileName: 'custom-resume-instructions.txt',
                        fileLabel: 'Custom Resume Instructions',
                        content: content
                    });
                } catch (broadcastError) {
                    console.error(`🔧 Error broadcasting custom resume instructions change: ${broadcastError.message}`);
                }
            }, 100);
        }
    });
} catch (error) {
    console.error(`🔧 Error setting up custom resume instructions file watching: ${error.message}`);
}

// Set up file watching for personal-information.txt
try {
    console.log(`🔧 Watching personal information file: ${personalInformationPath}`);
    
    let personalInfoTimeout;
    fs.watch(personalInformationPath, (eventType, filename) => {
        if (eventType === 'change') {
            clearTimeout(personalInfoTimeout);
            personalInfoTimeout = setTimeout(() => {
                console.log(`🔧 Personal information file changed, logging contents...`);
                logConfigFileContents(personalInformationPath, 'Personal Information');
                
                // Broadcast the change to connected clients
                try {
                    const content = fs.readFileSync(personalInformationPath, 'utf8');
                    eventBroadcaster.broadcast('config-file-changed', {
                        type: 'config-change',
                        fileName: 'personal-information.txt',
                        fileLabel: 'Personal Information',
                        content: content
                    });
                } catch (broadcastError) {
                    console.error(`🔧 Error broadcasting personal information change: ${broadcastError.message}`);
                }
            }, 100);
        }
    });
} catch (error) {
    console.error(`🔧 Error setting up personal information file watching: ${error.message}`);
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