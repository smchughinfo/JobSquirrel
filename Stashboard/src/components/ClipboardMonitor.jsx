import React from 'react'

function ClipboardMonitor() {
  return (
    <div>
      <h2>📋 Clipboard Monitor</h2>
      <div id="clipboard-status">
        <div style={{ textAlign: 'center', color: '#666' }}>
          <h3>📋 Clipboard Monitor Active</h3>
          <p>Background clipboard monitoring is running</p>
          <p>Check the server console for clipboard change logs</p>
        </div>
      </div>
    </div>
  )
}

export default ClipboardMonitor