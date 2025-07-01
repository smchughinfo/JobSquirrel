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

  // Function to log configuration file contents to browser console
  const logConfigContents = (fileLabel, content) => {
    console.log(`\n🔧 ${fileLabel} contents:`);
    console.log('─'.repeat(50));
    console.log(content);
    console.log('─'.repeat(50));
  };

  // Fetch and log configuration files on page load
  useEffect(() => {
    const fetchConfigFiles = async () => {
      try {
        const response = await fetch('/api/config-files');
        const data = await response.json();
        
        if (data.success) {
          // Log to browser console
          if (data.customResumeInstructions) {
            logConfigContents('Custom Resume Instructions', data.customResumeInstructions);
          } else {
            console.log('⚠️ Custom Resume Instructions file is empty or not found');
          }
          
          if (data.personalInformation) {
            logConfigContents('Personal Information', data.personalInformation);
          } else {
            console.log('⚠️ Personal Information file is empty or not found');
          }
        } else {
          console.error('❌ Failed to fetch config files:', data.error);
        }
      } catch (error) {
        console.error('❌ Error fetching config files:', error);
      }
    };

    fetchConfigFiles();
  }, []);

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

  // Listen for configuration file changes
  useEffect(() => {
    if (lastEvent && lastEvent.type === 'config-file-changed') {
      console.log(`🔧 ${lastEvent.fileLabel} file changed, logging new contents...`);
      logConfigContents(lastEvent.fileLabel, lastEvent.content);
    }
  }, [lastEvent]);

  return (
    <div className="app">
      <Header />
      <main className="main-layout">
        <aside className="sidebar-left">
          <EventMonitor isConnected={isConnected} lastEvent={lastEvent} />
          {/*<ClaudeAssistant claudeEvents={claudeEvents} />*/}
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