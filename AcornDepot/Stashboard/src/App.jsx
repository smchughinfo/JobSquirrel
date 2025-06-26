import React from 'react'
import Header from './components/Header'
import ClipboardMonitor from './components/ClipboardMonitor'
import './App.css'

function App() {
  return (
    <div className="app">
      <Header />
      <main>
        <div className="container">
          <ClipboardMonitor />
        </div>
      </main>
    </div>
  )
}

export default App