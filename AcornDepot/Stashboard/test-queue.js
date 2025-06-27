// Quick test script to verify job queue functionality
const { JobQueue } = require('./services/jobQueue');

console.log('🧪 Testing JobQueue functionality...');

const queue = new JobQueue();

// Set up event listeners
queue.on('jobQueued', (data) => {
    console.log(`✅ Job queued: ${data.filename}`);
});

queue.on('jobProcessingStarted', (data) => {
    console.log(`⚙️ Processing: ${data.filename}`);
});

queue.on('jobCompleted', (data) => {
    console.log(`✅ Completed: ${data.filename}`);
});

queue.on('jobFailed', (data) => {
    console.log(`❌ Failed: ${data.filename} - ${data.error.message}`);
});

// Test data
const testJobData = `<h1 data-job-squirrel-url="https://example.com/job/123"></h1>
<div class="job-details">
    <h2>Software Engineer</h2>
    <p>Company: Test Corp</p>
    <p>Location: Remote</p>
    <p>Salary: $80,000 - $100,000</p>
    <div class="job-description">
        <p>We are looking for a skilled software engineer...</p>
        <ul>
            <li>JavaScript experience required</li>
            <li>React knowledge preferred</li>
            <li>3+ years experience</li>
        </ul>
    </div>
</div>`;

try {
    // Add a test job
    console.log('🧪 Adding test job to queue...');
    const jobId = queue.addJob(testJobData);
    console.log(`🧪 Test job added with ID: ${jobId}`);
    
    // Check queue status
    setTimeout(() => {
        const status = queue.getStatus();
        console.log('🧪 Queue status:', JSON.stringify(status, null, 2));
        
        // Start processing if not already started
        if (!status.running) {
            console.log('🧪 Starting queue processor...');
            queue.startProcessing();
        }
        
        // Stop test after 10 seconds
        setTimeout(() => {
            console.log('🧪 Test completed - stopping queue processor');
            queue.stopProcessing();
            process.exit(0);
        }, 10000);
        
    }, 1000);
    
} catch (error) {
    console.error('🧪 Test failed:', error.message);
    process.exit(1);
}