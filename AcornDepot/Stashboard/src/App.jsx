import React from 'react'
import Header from './components/Header'
import ClipboardMonitor from './components/ClipboardMonitor'
import EventMonitor from './components/EventMonitor'
import { useEventStream } from './hooks/useEventStream'
import './App.css'

function App() {
  const { isConnected, lastEvent } = useEventStream();

  return (
    <div className="app">
      <Header />
      <main>
        <div className="container">
          <EventMonitor isConnected={isConnected} lastEvent={lastEvent} />
          <ClipboardMonitor />
        </div>
      </main>
    </div>
  )
}

export default App