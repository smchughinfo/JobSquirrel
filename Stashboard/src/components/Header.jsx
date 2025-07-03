import React, { useState, useEffect } from 'react'

function Header() {
  const [isUploading, setIsUploading] = useState(false);
  const [lastUpload, setLastUpload] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [configDialog, setConfigDialog] = useState({
    isOpen: false,
    fileName: '',
    content: '',
    originalContent: ''
  });

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

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && !event.target.closest('.hamburger-menu')) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMenuOpen]);

  const handleUploadClick = async () => {
    setIsUploading(true);
    setIsMenuOpen(false); // Close menu when action is taken
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

  const handleCustomInstructionsClick = async () => {
    setIsMenuOpen(false);
    try {
      const response = await fetch('/api/config-files');
      const data = await response.json();
      if (data.success) {
        setConfigDialog({
          isOpen: true,
          fileName: 'custom-resume-instructions.txt',
          content: data.customResumeInstructions || '',
          originalContent: data.customResumeInstructions || ''
        });
      }
    } catch (error) {
      console.error('Error fetching custom instructions:', error);
    }
  };

  const handleContactInfoClick = async () => {
    setIsMenuOpen(false);
    try {
      const response = await fetch('/api/config-files');
      const data = await response.json();
      if (data.success) {
        setConfigDialog({
          isOpen: true,
          fileName: 'personal-information.txt',
          content: data.personalInformation || '',
          originalContent: data.personalInformation || ''
        });
      }
    } catch (error) {
      console.error('Error fetching personal information:', error);
    }
  };

  const handleConfigDialogClose = () => {
    setConfigDialog({
      isOpen: false,
      fileName: '',
      content: '',
      originalContent: ''
    });
  };

  const handleConfigContentChange = (e) => {
    setConfigDialog(prev => ({
      ...prev,
      content: e.target.value
    }));
  };

  const handleConfigUpdate = async () => {
    try {
      const response = await fetch('/api/update-config-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: configDialog.fileName,
          content: configDialog.content
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ Successfully updated ${configDialog.fileName}`);
        console.log(`📁 File path: ${result.filePath}`);
        
        // Update the original content to reflect the saved state
        setConfigDialog(prev => ({
          ...prev,
          originalContent: prev.content
        }));
        
        // Close the dialog
        handleConfigDialogClose();
      } else {
        console.error('❌ Failed to update config file:', result.error);
        alert(`Failed to update ${configDialog.fileName}: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error updating config file:', error);
      alert(`Error updating ${configDialog.fileName}: ${error.message}`);
    }
  };

  const handleConfigCancel = () => {
    setConfigDialog(prev => ({
      ...prev,
      content: prev.originalContent
    }));
    handleConfigDialogClose();
  };


  return (
    <>
      <header>
        <div className="header-content">
          <div className="header-text">
            <h1>🐿️ Stashboard</h1>
            <p>For the hoard</p>
          </div>
          <div className="header-controls">
            <div className="hamburger-menu">
              <button 
                className="hamburger-button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                ☰
              </button>
              {isMenuOpen && (
                <div className="hamburger-dropdown">
                  <button 
                    className="dropdown-item"
                    onClick={handleCustomInstructionsClick}
                  >
                    🔧 Custom Instructions
                  </button>
                  <button 
                    className="dropdown-item"
                    onClick={handleContactInfoClick}
                  >
                    📞 Contact Information
                  </button>
                </div>
              )}
              {lastUpload && (
                <div className="upload-status">
                  Last upload: {new Date(lastUpload).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Configuration File Dialog */}
      {configDialog.isOpen && (
        <div className="config-dialog-overlay" onClick={handleConfigDialogClose}>
          <div className="config-dialog" onClick={e => e.stopPropagation()}>
            <div className="config-dialog-header">
              <h3>{configDialog.fileName}</h3>
              <button 
                className="config-dialog-close"
                onClick={handleConfigDialogClose}
              >
                ✕
              </button>
            </div>
            <div className="config-dialog-content">
              <textarea
                className="config-textarea"
                value={configDialog.content}
                onChange={handleConfigContentChange}
                placeholder={`Enter content for ${configDialog.fileName}...`}
              />
            </div>
            <div className="config-dialog-actions">
              <button 
                className="config-button config-cancel-button"
                onClick={handleConfigCancel}
              >
                Cancel
              </button>
              <button 
                className="config-button config-update-button"
                onClick={handleConfigUpdate}
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Header