import React from 'react'

function Header() {
  return (
    <header>
      <div className="header-content">
        <div className="header-text">
          <h1>🐿️ Stashboard</h1>
          <p>For the hoard</p>
        </div>
        <div className="header-controls">
          {/* Clipboard monitoring is now active */}
        </div>
      </div>
    </header>
  )
}

export default Header