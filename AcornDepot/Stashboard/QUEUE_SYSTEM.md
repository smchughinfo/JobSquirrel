# Job Queue System 🥜

The JobSquirrel job queue system provides resilient, file-based job processing that decouples clipboard detection from job processing.

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Clipboard       │───▶│   Job Queue     │───▶│ Job Processor   │
│ Detection       │    │  (File-based)   │    │ (Background)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       ▼
         ▼                       ▼               ┌─────────────────┐
┌─────────────────┐    ┌─────────────────┐      │   jobListing    │
│ JobSquirrel     │    │  queue/         │      │   Processor     │
│ Message         │    │  raw-job-*.txt  │      │                 │
└─────────────────┘    └─────────────────┘      └─────────────────┘
```

## How It Works

### 1. Job Detection (Clipboard)
- Browser extension copies JobSquirrel message to clipboard
- ClipboardMonitor detects message with "JobSquirrelBrowserExtensionMessage:" 
- Instead of immediate processing, job is added to queue

### 2. Job Queuing (File-based)
- Raw job data saved to `queue/raw-job-{uuid}.txt`
- File includes metadata header with timestamp and job ID
- Multiple jobs can be queued simultaneously

### 3. Job Processing (Background)
- JobQueue processor polls `queue/` directory every 2 seconds
- Processes oldest job first (FIFO)
- Calls existing `jobListingProcessor.processJobListing()`
- Deletes job file after successful processing

### 4. Error Handling
- Failed jobs moved to `queue/errors/` with error details
- Processing continues with next job
- Resilient to server restarts (jobs persist in files)

## File Structure

```
AcornDepot/Stashboard/
├── queue/
│   ├── raw-job-12345-abcd.txt        # Pending job
│   ├── raw-job-67890-efgh.txt        # Another pending job
│   └── errors/
│       └── 1234567890-raw-job-failed.txt  # Failed job with error info
├── services/
│   ├── jobQueue.js                   # Job queue implementation
│   ├── clipboard.js                  # Modified to use queue
│   └── jobListingProcessor.js        # Existing job processor
└── server.js                         # Integration point
```

## Job File Format

Each job file contains:

```
// JobSquirrel Queue Job
// Created: 2024-01-15T10:30:00.000Z
// JobId: 12345678-1234-4567-8901-123456789012
// ---
<h1 data-job-squirrel-url="https://example.com/job"></h1>
<div class="job-content">
  ... actual job HTML content ...
</div>
```

## Integration Points

### Server.js
```javascript
// Create job queue
const jobQueue = new JobQueue();

// Create clipboard monitor with queue
const clipboardMonitor = new ClipboardMonitor(jobQueue);

// Start both services
jobQueue.startProcessing();
clipboardMonitor.startMonitoring();
```

### Event Logging
```javascript
jobQueue.on('jobQueued', (data) => {
    console.log(`🥜 Job queued: ${data.filename}`);
});

jobQueue.on('jobCompleted', (data) => {
    console.log(`🥜 Job completed: ${data.filename}`);
});

jobQueue.on('jobFailed', (data) => {
    console.log(`🥜 Job failed: ${data.filename} - ${data.error.message}`);
});
```

## API Endpoints

### GET /api/queue-status
Returns current queue status:

```json
{
  "running": true,
  "queuedJobs": 2,
  "jobs": [
    {
      "filename": "raw-job-12345-abcd.txt",
      "created": "2024-01-15T10:30:00.000Z",
      "size": 15420
    }
  ]
}
```

## Benefits

### ✅ Resilience
- Jobs survive server restarts
- Failed jobs preserved for debugging
- No job loss during processing errors

### ✅ Decoupling
- Clipboard detection independent of job processing
- Can queue multiple jobs rapidly
- Processing happens at its own pace

### ✅ Debugging
- Raw job files available for inspection
- Error files contain full context
- Queue status visible via API

### ✅ Scalability
- Easy to add parallel processing later
- Can prioritize jobs if needed
- File-based approach is simple and reliable

## Configuration

### JobQueue Options
```javascript
const jobQueue = new JobQueue();
jobQueue.pollInterval = 2000;  // Check every 2 seconds
```

### Queue Directory
- Default: `AcornDepot/Stashboard/queue/`
- Automatically created if missing
- Errors subdirectory for failed jobs

## Testing

Run the test script to verify functionality:

```bash
cd AcornDepot/Stashboard
node test-queue.js
```

This will:
1. Create a test job file
2. Start processing
3. Show queue status
4. Process the job
5. Clean up

## Migration from Direct Processing

### Before (Direct)
```javascript
// clipboard.js
routeMessage(message) {
    const payload = message.split("JobSquirrelBrowserExtensionMessage:")[1];
    processRawJobListing(payload);  // Direct processing
}
```

### After (Queued)
```javascript
// clipboard.js  
routeMessage(message) {
    const payload = message.split("JobSquirrelBrowserExtensionMessage:")[1];
    this.jobQueue.addJob(payload);  // Queue for processing
}
```

The existing `jobListingProcessor.js` remains unchanged - it just gets called by the queue processor instead of directly from clipboard detection.

## Future Enhancements

- **Parallel Processing**: Process multiple jobs simultaneously
- **Job Priorities**: High/low priority job types
- **Batch Processing**: Group similar jobs together
- **Job Retries**: Automatic retry for transient failures
- **Queue Metrics**: Processing time, success rates, etc.
- **Web UI**: Visual queue management interface