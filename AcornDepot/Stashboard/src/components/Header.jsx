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
          <button 
            onClick={async () => {
              try {
                const response = await fetch('/api/upload-resume-data', { method: 'POST' });
                const result = await response.json();
                if (result.success) {
                  console.log('Vector store created:', result.vectorStoreId);
                } else {
                  console.error('Failed to create vector store:', result.error);
                }
              } catch (error) {
                console.error('Error uploading resume data:', error);
              }
            }}
          >
            Upload Resume Data
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header