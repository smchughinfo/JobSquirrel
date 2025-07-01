const { EventEmitter } = require('events');
const fs = require('fs');
const path = require('path');
const { processJobListing } = require('./jobListingProcessor');
const { generateUUID } = require('./utilities');

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

    addJob(rawJobData) {
        const jobId = this.generateJobId();
        const filename = `raw-job-${jobId}.txt`;
        const filepath = path.join(this.queueDir, filename);
        
        // Add metadata header to the job file
        const jobContent = `// JobSquirrel Queue Job\]n// Created: ${new Date().toISOString()}\n// JobId: ${jobId}\n// ---\n${rawJobData}`;

        fs.writeFileSync(filepath, jobContent, 'utf8');
        this.chatter(`Job queued: ${filename}`);
        
        this.emit('jobQueued', { jobId, filename });
        return jobId;
    }

    // Start processing jobs from the queue
    startProcessing() {
        this.chatter('Starting job queue processor...');
        this.isRunning = true;
        this.emit('processorStarted');
        
        // Start the polling loop
        this.processLoop();
    }

    // Main processing loop
    async processLoop() {
        while (this.isRunning) {
            await this.processNextJob();
            await this.delay(this.pollInterval);
        }
    }

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

    async processJob(jobData, filename) {
        this.chatter(`Starting job processing for: ${filename}`);
        
        // Call the existing job processor
        await processJobListing(jobData);
        
        this.chatter(`Job processing completed for: ${filename}`);
    }

    getQueuedJobs() {
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
    }

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
        return generateUUID();
    }

    // Utility delay function
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = { JobQueue };