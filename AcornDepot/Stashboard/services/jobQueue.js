const { EventEmitter } = require('events');
const fs = require('fs');
const path = require('path');
// Simple UUID v4 generator
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
const { processJobListing } = require('./jobListingProcessor');

class JobQueue extends EventEmitter {
    constructor() {
        super();
        this.isRunning = false;
        this.queueDir = path.join(__dirname, '..', 'queue');
        this.pollInterval = 2000; // Check every 2 seconds
        this.chatter = (message) => console.log(`🥜 JobQueue: ${message}`);
        
        // Ensure queue directory exists
        if (!fs.existsSync(this.queueDir)) {
            fs.mkdirSync(this.queueDir, { recursive: true });
        }
    }

    // Add a job to the queue
    addJob(rawJobData) {
        try {
            const jobId = this.generateJobId();
            const filename = `raw-job-${jobId}.txt`;
            const filepath = path.join(this.queueDir, filename);
            
            // Add metadata header to the job file
            const jobContent = `// JobSquirrel Queue Job
// Created: ${new Date().toISOString()}
// JobId: ${jobId}
// ---
${rawJobData}`;

            fs.writeFileSync(filepath, jobContent, 'utf8');
            this.chatter(`Job queued: ${filename}`);
            
            this.emit('jobQueued', { jobId, filename });
            return jobId;
        } catch (error) {
            this.chatter(`Failed to queue job: ${error.message}`);
            this.emit('error', error);
            throw error;
        }
    }

    // Start processing jobs from the queue
    startProcessing() {
        if (this.isRunning) {
            this.chatter('Job processor already running');
            return;
        }

        this.chatter('Starting job queue processor...');
        this.isRunning = true;
        this.emit('processorStarted');
        
        // Start the polling loop
        this.processLoop();
    }

    // Stop processing jobs
    stopProcessing() {
        if (!this.isRunning) {
            this.chatter('Job processor not running');
            return;
        }

        this.chatter('Stopping job queue processor...');
        this.isRunning = false;
        this.emit('processorStopped');
    }

    // Main processing loop
    async processLoop() {
        while (this.isRunning) {
            try {
                await this.processNextJob();
                await this.delay(this.pollInterval);
            } catch (error) {
                this.chatter(`Error in process loop: ${error.message}`);
                this.emit('error', error);
                await this.delay(this.pollInterval);
            }
        }
    }

    // Process the next job in the queue
    async processNextJob() {
        const jobFiles = this.getQueuedJobs();
        
        if (jobFiles.length === 0) {
            return; // No jobs to process
        }

        // Get the oldest job file
        const oldestJob = jobFiles.sort((a, b) => a.mtime - b.mtime)[0];
        const jobPath = path.join(this.queueDir, oldestJob.filename);

        this.chatter(`Processing job: ${oldestJob.filename}`);
        this.emit('jobProcessingStarted', { filename: oldestJob.filename });

        try {
            // Read the job data
            const jobContent = fs.readFileSync(jobPath, 'utf8');
            
            // Extract the actual job data (skip metadata header)
            const jobData = this.extractJobData(jobContent);
            
            // Process the job
            await this.processJob(jobData, oldestJob.filename);
            
            // Delete the job file after successful processing
            fs.unlinkSync(jobPath);
            this.chatter(`Job completed and removed: ${oldestJob.filename}`);
            this.emit('jobCompleted', { filename: oldestJob.filename });
            
        } catch (error) {
            this.chatter(`Failed to process job ${oldestJob.filename}: ${error.message}`);
            this.emit('jobFailed', { filename: oldestJob.filename, error });
            
            // Move failed job to error directory for debugging
            await this.moveToErrorDirectory(jobPath, oldestJob.filename, error);
        }
    }

    // Extract job data from file content (skip metadata)
    extractJobData(content) {
        const lines = content.split('\n');
        const dataStartIndex = lines.findIndex(line => line.trim() === '// ---');
        
        if (dataStartIndex === -1) {
            // No metadata header found, return entire content
            return content;
        }
        
        return lines.slice(dataStartIndex + 1).join('\n');
    }

    // Process a single job
    async processJob(jobData, filename) {
        this.chatter(`Starting job processing for: ${filename}`);
        
        // Call the existing job processor
        await processJobListing(jobData);
        
        this.chatter(`Job processing completed for: ${filename}`);
    }

    // Move failed job to error directory
    async moveToErrorDirectory(jobPath, filename, error) {
        try {
            const errorDir = path.join(this.queueDir, 'errors');
            if (!fs.existsSync(errorDir)) {
                fs.mkdirSync(errorDir, { recursive: true });
            }
            
            const errorFilename = `${Date.now()}-${filename}`;
            const errorPath = path.join(errorDir, errorFilename);
            
            // Add error info to the file
            const originalContent = fs.readFileSync(jobPath, 'utf8');
            const errorContent = `// ERROR: ${error.message}
// Error Time: ${new Date().toISOString()}
// ---
${originalContent}`;
            
            fs.writeFileSync(errorPath, errorContent, 'utf8');
            fs.unlinkSync(jobPath);
            
            this.chatter(`Failed job moved to errors: ${errorFilename}`);
        } catch (moveError) {
            this.chatter(`Failed to move error file: ${moveError.message}`);
            // If we can't move it, just leave it in the queue
        }
    }

    // Get list of queued job files
    getQueuedJobs() {
        try {
            const files = fs.readdirSync(this.queueDir);
            return files
                .filter(file => file.startsWith('raw-job-') && file.endsWith('.txt'))
                .map(filename => {
                    const filepath = path.join(this.queueDir, filename);
                    const stats = fs.statSync(filepath);
                    return {
                        filename,
                        filepath,
                        mtime: stats.mtime,
                        size: stats.size
                    };
                });
        } catch (error) {
            this.chatter(`Error reading queue directory: ${error.message}`);
            return [];
        }
    }

    // Get queue status
    getStatus() {
        const queuedJobs = this.getQueuedJobs();
        return {
            running: this.isRunning,
            queuedJobs: queuedJobs.length,
            jobs: queuedJobs.map(job => ({
                filename: job.filename,
                created: job.mtime,
                size: job.size
            }))
        };
    }

    // Generate unique job ID
    generateJobId() {
        try {
            return generateUUID();
        } catch (error) {
            // Fallback to timestamp + random
            return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }
    }

    // Utility delay function
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = { JobQueue };