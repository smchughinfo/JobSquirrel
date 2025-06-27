# Real-time Event System 📡

The Stashboard real-time event system enables **server-to-client messaging** without requiring client requests. Perfect for showing live job processing status, clipboard changes, and system events.

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Server Events   │───▶│ EventBroadcaster│───▶│ Client Browser  │
│ (JobQueue,      │    │ (Server-Sent    │    │ (React Hook)    │
│  Clipboard)     │    │  Events)        │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Event Triggers  │    │ /api/events     │    │ Console Logs +  │
│ • job-queued    │    │ SSE Stream      │    │ Visual Updates  │
│ • job-completed │    │                 │    │                 │
│ • clipboard     │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## How It Works

### 1. Server-Side Event Broadcasting

**EventBroadcaster Service** (`services/eventBroadcaster.js`):
- Maintains list of connected clients
- Broadcasts events to all connected clients simultaneously
- Handles client disconnections gracefully
- Provides convenience methods for common event types

### 2. Server-Sent Events Endpoint

**GET /api/events**:
- Sets up SSE headers for persistent connection
- Sends initial connection confirmation
- Adds client to broadcaster for future events
- Handles client disconnection cleanup

### 3. Client-Side Event Reception

**React Hook** (`hooks/useEventStream.js`):
- Connects to `/api/events` using EventSource API
- Automatically logs events to browser console
- Provides connection status and last event data
- Handles reconnection and cleanup

**React Component** (`components/EventMonitor.jsx`):
- Visual event monitor with real-time updates
- Shows connection status with colored indicator
- Displays last 10 events with timestamps and icons
- Color-coded event types for easy scanning

## Event Types

### Job Processing Events
```javascript
// Job queued for processing
eventBroadcaster.jobQueued(jobId, filename);
// Browser console: "🥜 Job queued: raw-job-123.txt"

// Job processing started
eventBroadcaster.jobStarted(jobId, filename);
// Browser console: "⚙️ Processing job: raw-job-123.txt"

// Job completed successfully
eventBroadcaster.jobCompleted(jobId, filename, result);
// Browser console: "✅ Job completed: raw-job-123.txt"

// Job failed with error
eventBroadcaster.jobFailed(jobId, filename, error);
// Browser console: "❌ Job failed: raw-job-123.txt - Error message"
```

### System Events
```javascript
// Clipboard changed
eventBroadcaster.clipboardChanged(preview);
// Browser console: "📋 Clipboard changed: Some content..."

// System status updates
eventBroadcaster.systemStatus(status, message);
// Browser console: "🐿️ System: Server started on port 3000"

// Client connected
// Browser console: "🔌 Connected to Stashboard events"
```

## Event Data Format

All events follow this structure:
```json
{
  "type": "job-completed",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "message": "Job completed: raw-job-123.txt",
  "jobId": "12345678-1234-4567-8901-123456789012",
  "filename": "raw-job-123.txt",
  "result": { "company": "Acme Corp", "jobTitle": "Engineer" }
}
```

## Integration Points

### Server.js Integration
```javascript
// Import event broadcaster
const { eventBroadcaster } = require('./services/eventBroadcaster');

// Set up SSE endpoint
app.get('/api/events', (req, res) => {
    // SSE headers and client registration
    eventBroadcaster.addClient(res);
});

// Broadcast job queue events
jobQueue.on('jobQueued', (data) => {
    eventBroadcaster.jobQueued(data.jobId, data.filename);
});

// Broadcast clipboard events
clipboardMonitor.on('clipboardChange', (text) => {
    eventBroadcaster.clipboardChanged(preview);
});
```

### React Frontend Integration
```javascript
// App.jsx
import { useEventStream } from './hooks/useEventStream';

function App() {
  const { isConnected, lastEvent } = useEventStream();
  
  return (
    <div>
      <EventMonitor isConnected={isConnected} lastEvent={lastEvent} />
      {/* other components */}
    </div>
  );
}
```

## API Endpoints

### GET /api/events
**Server-Sent Events stream for real-time updates**

**Response**: Continuous SSE stream
```
data: {"type":"connected","timestamp":"2024-01-15T10:30:00.000Z","message":"Connected to Stashboard events"}

data: {"type":"job-queued","timestamp":"2024-01-15T10:30:15.000Z","message":"Job queued: raw-job-123.txt","jobId":"123","filename":"raw-job-123.txt"}

data: {"type":"job-completed","timestamp":"2024-01-15T10:30:45.000Z","message":"Job completed: raw-job-123.txt","jobId":"123","filename":"raw-job-123.txt"}
```

### GET /api/events-status
**Get current event broadcaster statistics**

**Response**:
```json
{
  "connectedClients": 2,
  "isActive": true
}
```


## Browser Console Output

When events are received, you'll see logs like:
```
🔌 Connected to event stream
📡 Event received: {type: "connected", message: "Connected to Stashboard events", ...}
🔌 Connected to Stashboard events

📡 Event received: {type: "job-queued", message: "Job queued: raw-job-123.txt", ...}
🥜 Job queued: raw-job-123.txt

📡 Event received: {type: "job-completed", message: "Job completed: raw-job-123.txt", ...}
✅ Job completed: raw-job-123.txt

📡 Event received: {type: "clipboard-changed", message: "Clipboard changed: Some content...", ...}
📋 Clipboard changed: Some content...
```

## Visual Interface

The **EventMonitor component** shows:
- 🟢 Green dot when connected, 🔴 red when disconnected
- Real-time event list with icons and timestamps
- Color-coded event types for easy scanning
- Last 10 events displayed
- Auto-scroll to newest events

## Benefits

### ✅ Real-time Feedback
- Instant notification when jobs are queued/processed
- Live clipboard monitoring feedback
- System status updates

### ✅ Multiple Clients
- Support multiple browser tabs/windows
- Each client gets all events
- Automatic cleanup on disconnect

### ✅ No Polling Required
- Push-based updates (not pull-based polling)
- Efficient network usage
- Immediate response to server events

### ✅ Resilient Connection
- Handles client disconnections gracefully
- Automatic browser reconnection on network issues
- No memory leaks from dead connections

### ✅ Development Friendly
- Rich console logging for debugging
- Visual connection status
- Easy to test with curl commands

## Future Enhancements

- **Event Filtering**: Allow clients to subscribe to specific event types
- **Event History**: Store and replay recent events for new connections
- **Event Persistence**: Save important events to database
- **Push Notifications**: Browser notifications for critical events
- **Event Metrics**: Track event frequency and client connections
- **Room-based Broadcasting**: Different event channels for different purposes