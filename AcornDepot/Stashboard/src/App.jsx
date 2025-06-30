import React, { useState, useEffect } from 'react'
import Header from './components/Header'
import ClipboardMonitor from './components/ClipboardMonitor'
import EventMonitor from './components/EventMonitor'
import ClaudeAssistant from './components/ClaudeAssistant'
import JobListings from './components/JobListings'
import { useEventStream } from './hooks/useEventStream'
import './App.css'

function App() {
  const { isConnected, lastEvent } = useEventStream();
  const [claudeEvents, setClaudeEvents] = useState(null);

  // Filter Claude-specific events from the event stream
  useEffect(() => {
    // Check if this is a Claude event by looking for Claude-specific properties
    if (lastEvent && (
      lastEvent.type === 'claude-stream' || 
      lastEvent.type === 'system' || 
      lastEvent.type === 'response' || 
      lastEvent.type === 'response-line' || 
      lastEvent.type === 'complete' || 
      (lastEvent.type === 'error' && lastEvent.content)
    )) {
      setClaudeEvents(lastEvent);
    }
  }, [lastEvent]);

  return (
    <div className="app">
      <Header />
      <main className="main-layout">
        <aside className="sidebar-left">
          <EventMonitor isConnected={isConnected} lastEvent={lastEvent} />
          <ClaudeAssistant claudeEvents={claudeEvents} />
          <ClipboardMonitor />
        </aside>
        <div className="main-content">
          <JobListings lastEvent={lastEvent} />
        </div>
      </main>
    </div>
  )
}

export default App