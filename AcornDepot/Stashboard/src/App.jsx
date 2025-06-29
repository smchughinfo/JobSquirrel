import React from 'react'
import Header from './components/Header'
import ClipboardMonitor from './components/ClipboardMonitor'
import EventMonitor from './components/EventMonitor'
import JobListings from './components/JobListings'
import { useEventStream } from './hooks/useEventStream'
import './App.css'

function App() {
  const { isConnected, lastEvent } = useEventStream();

  return (
    <div className="app">
      <Header />
      <main className="main-layout">
        <aside className="sidebar-left">
          <EventMonitor isConnected={isConnected} lastEvent={lastEvent} />
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