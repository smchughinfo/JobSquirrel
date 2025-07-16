const express = require('express');
const path = require('path');
const fs = require('fs');
const { ClipboardMonitor } = require('./services/clipboard');
const { JobQueue } = require('./services/jobQueue');
const { eventBroadcaster } = require('./services/eventBroadcaster');
const { getHoard } = require('./services/hoard');
const { getHoardPath, getResumeDataVectorStoreIdPath, getJobSquirrelRootDirectory } = require('./services/jobSquirrelPaths');
const noTemplate = require('./services/generators/noTemplate');

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
const generatedResumesPath = path.join(getJobSquirrelRootDirectory(), 'GeneratedResumes');
app.use('/GeneratedResumes', express.static(generatedResumesPath));

// Serve static templates directory for template previews
app.use('/static', express.static(path.join(__dirname, 'static')));

// Basic route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

//////////////////////////////////////////////////////////////////////////////////////////////////
////////// JOB QUEUE /////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////

const jobQueue = new JobQueue();

//////////////////////////////////////////////////////////////////////////////////////////////////
////////// MODULAR ROUTES ////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////

// Register all modular route files
const routes = require('./routes');
app.use(routes);

// Add jobQueue access to events route after initialization
app.get('/api/queue-status', (req, res) => {
    const status = jobQueue.getStatus();
    res.json(status);
});

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
////////// PROCESS PDFS //////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////

// this is because claude code cant read pdfs. if you aren't using claude code this may not be necessry
noTemplate.processPDFsInResumeData();

//////////////////////////////////////////////////////////////////////////////////////////////////
////////// FILE WATCHING /////////////////////////////////////////////////////////////////////////
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