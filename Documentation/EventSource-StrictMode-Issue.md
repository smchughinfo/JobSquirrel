# EventSource + React.StrictMode Issue - Critical Bug Documentation

## Issue Summary
**Date Discovered:** January 18, 2025  
**Severity:** Critical - Caused complete webpage hanging and server unresponsiveness  
**Root Cause:** React.StrictMode double-invoking useEffect causing dual EventSource connections  
**Resolution:** Removed React.StrictMode from main.jsx  

## Problem Description

### Symptoms
- Webpage would load initially but become completely unresponsive after first page load
- Server would continue running but unable to serve subsequent requests
- Browser network tab showed one successful EventSource connection and one hanging "pending" connection
- Node.js single-threaded event loop appeared to be blocked/overwhelmed

### Technical Root Cause

React.StrictMode intentionally double-invokes effects in development mode to help detect side effects. However, EventSource connections have real network side effects that React.StrictMode doesn't account for.

**The Problematic Code:**
```javascript
// src/main.jsx - BEFORE (causing the issue)
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

**What was happening:**
1. React.StrictMode renders `<App />` twice in development
2. Each render triggers `useEventStream` hook in Header component
3. Each `useEventStream` creates an EventSource connection to `/api/events`
4. Result: **Two concurrent EventSource connections** to the same endpoint
5. Node.js single-threaded event loop gets overwhelmed by concurrent persistent connections
6. Server becomes unresponsive to new requests

## File-by-File Analysis

### Files Involved in the Issue

**`src/main.jsx`** - The root cause
```javascript
// PROBLEMATIC VERSION:
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>     // ← This was causing double rendering
    <App />
  </React.StrictMode>,
)

// FIXED VERSION:
ReactDOM.createRoot(document.getElementById('root')).render(
  <App />                // ← Direct rendering, single EventSource connection
)
```

**`src/hooks/useEventStream.js`** - The affected hook
```javascript
useEffect(() => {
    console.log('🔌 EventSource #1 enabled for testing');
    const eventSource = new EventSource(url);  // ← This was being called twice
    // ... rest of the EventSource setup
}, [url]);
```

**`src/components/Header.jsx`** - Where useEventStream is called
```javascript
function Header({ onOpenATSSkillsDialog }) {
  // This effect was running twice due to StrictMode
  useEffect(() => {
    const eventSource = new EventSource('/api/events');  // ← Second EventSource connection
    // ... resume upload event handling
  }, []);
  
  // ... component logic
}
```

**`routes/events.js`** - Server-side EventSource endpoint
```javascript
router.get('/events', (req, res) => {
    console.log("/EVENTS");  // ← This was being called twice simultaneously
    
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',  // ← Two persistent connections
        // ...
    });
    
    eventBroadcaster.addClient(res);  // ← Two clients added simultaneously
    // ...
});
```

## Debugging Process That Led to Discovery

### Initial Symptoms
1. Fresh page loads worked fine
2. After any browser refresh, page would hang indefinitely
3. Server console showed "/EVENTS" being called
4. Browser network tab showed one working and one pending EventSource connection

### Debugging Steps Taken
1. **Systematic EventSource Disabling**: Commented out individual EventSource connections to isolate the issue
2. **Connection Counting**: Discovered there were multiple concurrent connections to `/api/events`
3. **React Effect Investigation**: Suspected React.StrictMode due to double-invocation behavior
4. **StrictMode Removal**: Removed `<React.StrictMode>` wrapper from main.jsx
5. **Issue Resolution**: Problem immediately resolved

### Why the Issue Was Confusing
- React.StrictMode only affects development mode
- The double-invocation is intentional React behavior for detecting side effects
- EventSource connections have real network side effects that React doesn't clean up automatically
- Timing-sensitive issue that appeared/disappeared based on connection timing

## Technical Deep Dive

### React.StrictMode Behavior
React.StrictMode intentionally:
- Double-invokes component constructors, render methods, and state updaters
- Double-invokes effects (useEffect, useMemo, useState initializers)
- **Purpose**: Help detect side effects and prepare for React's future Concurrent Mode

### EventSource Connection Lifecycle
```javascript
// What React.StrictMode caused:
// Render 1: useEffect runs → new EventSource('/api/events') → Connection A
// Render 2: useEffect runs → new EventSource('/api/events') → Connection B
// Result: Two persistent connections to same endpoint

// What should happen:
// Render 1: useEffect runs → new EventSource('/api/events') → Single connection
// Cleanup: eventSource.close() on component unmount
```

### Node.js Single-Threaded Event Loop Impact
- Node.js uses a single-threaded event loop for I/O operations
- Multiple concurrent EventSource connections create multiple persistent HTTP connections
- Each connection consumes event loop resources
- Too many concurrent persistent connections can overwhelm the event loop
- Result: Server becomes unresponsive to new requests

## Resolution

### Immediate Fix
```javascript
// src/main.jsx
ReactDOM.createRoot(document.getElementById('root')).render(
  <App />  // Removed React.StrictMode wrapper
)
```

### Alternative Solutions (Not Implemented)

**Option 1: StrictMode-Safe EventSource Hook**
```javascript
useEffect(() => {
    if (eventSourceRef.current) return; // Prevent duplicate connections
    
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;
    
    return () => {
        eventSource.close();
        eventSourceRef.current = null;
    };
}, [url]);
```

**Option 2: Development vs Production Rendering**
```javascript
ReactDOM.createRoot(document.getElementById('root')).render(
  process.env.NODE_ENV === 'production' ? (
    <React.StrictMode><App /></React.StrictMode>
  ) : (
    <App />
  )
)
```

## Prevention Guidelines

### For Future Development

1. **Be Cautious with External Connections in StrictMode**
   - EventSource, WebSocket, HTTP connections
   - Timer-based effects (setInterval, setTimeout)
   - External library initializations

2. **Use Refs to Prevent Duplicate Connections**
   ```javascript
   const connectionRef = useRef(null);
   
   useEffect(() => {
       if (connectionRef.current) return; // Guard against double creation
       
       const connection = new EventSource(url);
       connectionRef.current = connection;
       
       return () => {
           connection.close();
           connectionRef.current = null;
       };
   }, [url]);
   ```

3. **Test Without StrictMode Periodically**
   - Remove StrictMode temporarily during development
   - Test for side effects that only manifest in production

4. **Monitor Network Connections During Development**
   - Use browser DevTools Network tab
   - Look for duplicate persistent connections
   - Watch for hanging "pending" requests

## Git Diff Analysis

The key changes that resolved the issue:

```diff
# src/main.jsx
 ReactDOM.createRoot(document.getElementById('root')).render(
-  <React.StrictMode>
-    <App />
-  </React.StrictMode>,
+  <App />
 )
```

Additional changes made during debugging process:
- Simplified `useEventStream.js` to remove queue mechanism (was debugging attempt)
- Added debug logging in various components
- Added ProjectNutcracker button (unrelated feature development)

## Lessons Learned

1. **React.StrictMode + External Connections = Potential Issues**
   - StrictMode is valuable for detecting React-specific issues
   - But can cause problems with non-React side effects
   - Need to be careful with persistent connections

2. **Single-Threaded Event Loop Constraints**
   - Node.js can be overwhelmed by too many concurrent persistent connections
   - EventSource connections are persistent and consume resources
   - Monitor connection counts in development

3. **Development vs Production Differences**
   - Some issues only manifest in development due to StrictMode
   - Important to test without StrictMode occasionally
   - Consider conditional StrictMode usage

4. **Debugging Persistent Connection Issues**
   - Browser Network tab is invaluable for connection debugging
   - Look for patterns in connection timing and success/failure
   - Server logs should track connection establishment and cleanup

## Status
**Resolution Date:** January 18, 2025  
**Status:** ✅ RESOLVED  
**Impact:** Critical bug completely resolved  
**Follow-up:** Monitor for any similar issues with future EventSource usage  

---

*This documentation serves as a reference for future development to prevent similar issues and understand the React.StrictMode + EventSource interaction.*