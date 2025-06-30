import React, { useState, useEffect } from 'react'

function Header() {
  const [isUploading, setIsUploading] = useState(false);
  const [lastUpload, setLastUpload] = useState(null);
  const [isStreamingTest, setIsStreamingTest] = useState(false);

  useEffect(() => {
    // Listen for resume data upload events
    const eventSource = new EventSource('/api/events');
    
    eventSource.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'resume-data-upload-status') {
        setLastUpload(data.lastModified);
      }
    });

    return () => eventSource.close();
  }, []);

  const handleUploadClick = async () => {
    setIsUploading(true);
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
    } finally {
      setIsUploading(false);
    }
  };

  const handleClaudeStreamTest = async () => {
    setIsStreamingTest(true);
    try {
      const response = await fetch('/api/test-claude-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Write a short haiku about file watching and streaming. Make it exactly 3 lines.'
        })
      });
      
      const result = await response.json();
      if (result.success) {
        console.log('🎉 Claude streaming test successful:', result.result);
      } else {
        console.error('❌ Claude streaming test failed:', result.error);
      }
    } catch (error) {
      console.error('❌ Error testing Claude streaming:', error);
    } finally {
      setIsStreamingTest(false);
    }
  };

  return (
    <header>
      <div className="header-content">
        <div className="header-text">
          <h1>🐿️ Stashboard</h1>
          <p>For the hoard</p>
        </div>
        <div className="header-controls">
          <div>
            <button 
              className="upload-resume-button"
              onClick={handleUploadClick}
              disabled={isUploading}
            >
              {isUploading ? '🔄 Uploading...' : '📁 Upload Resume Data'}
            </button>
            <button 
              className="claude-stream-button"
              onClick={handleClaudeStreamTest}
              disabled={isStreamingTest}
              style={{ marginLeft: '10px' }}
            >
              {isStreamingTest ? '🔄 Streaming...' : '🤖 Test Claude Stream'}
            </button>
            {lastUpload && (
              <div className="upload-status">
                Last upload: {new Date(lastUpload).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header