// Stashboard App - Clipboard Monitor

document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 Stashboard loaded - clipboard monitoring active!');
    
    const statusDiv = document.getElementById('clipboard-status');
    
    // Update status display
    statusDiv.innerHTML = `
        <div style="text-align: center; color: #666;">
            <h3>📋 Clipboard Monitor Active</h3>
            <p>Background clipboard monitoring is running</p>
            <p>Check the server console for clipboard change logs</p>
        </div>
    `;
});