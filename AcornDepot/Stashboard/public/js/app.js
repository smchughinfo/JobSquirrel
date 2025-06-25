// Stashboard App - Squirrel Job Cache Viewer

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🐿️ Stashboard loaded - time to check the winter cache!');
    
    const jobList = document.getElementById('job-list');
    const runScamperBtn = document.getElementById('run-scamper');
    const processAcornsBtn = document.getElementById('process-acorns');
    
    // Scamper state management
    let scamperEventSource = null;
    let scamperRunning = false;

    // Function to update button state
    function updateScamperButton() {
        if (scamperRunning) {
            runScamperBtn.innerHTML = '🔪 Kill Scamper';
            runScamperBtn.disabled = false;
            runScamperBtn.style.backgroundColor = '#dc3545'; // Red color
        } else {
            runScamperBtn.innerHTML = '🐿️ Run Scamper';
            runScamperBtn.disabled = false;
            runScamperBtn.style.backgroundColor = ''; // Reset to default
        }
    }

    // Function to kill Scamper
    async function killScamper() {
        try {
            const response = await fetch('/api/kill-scamper', { method: 'POST' });
            const data = await response.json();
            
            if (response.ok) {
                console.log('🔪 Scamper killed:', data.message);
                if (scamperEventSource) {
                    scamperEventSource.close();
                    scamperEventSource = null;
                }
                scamperRunning = false;
                updateScamperButton();
                
                // Update output
                const output = document.getElementById('scamper-output');
                if (output) {
                    output.textContent += '\n🔪 Scamper process killed by user\n';
                }
            } else {
                console.error('❌ Failed to kill Scamper:', data.error);
            }
        } catch (error) {
            console.error('❌ Error killing Scamper:', error);
        }
    }

    // Function to start Scamper
    function startScamper() {
        console.log('🐿️ Starting Scamper...');
        scamperRunning = true;
        updateScamperButton();
        
        // Create EventSource for real-time updates
        scamperEventSource = new EventSource('/api/run-scamper');
        
        scamperEventSource.onmessage = function(event) {
            const data = JSON.parse(event.data);
            console.log(`🐿️ ${data.type}: ${data.message}`);
            
            // Update job list with live output
            const jobList = document.getElementById('job-list');
            if (data.type === 'start') {
                jobList.innerHTML = '<div style="color: #666;"><h3>🐿️ Scamper Output:</h3><pre id="scamper-output"></pre></div>';
            }
            
            if (data.type === 'stdout' || data.type === 'stderr') {
                const output = document.getElementById('scamper-output');
                if (output) {
                    output.textContent += data.message + '\n';
                    output.scrollTop = output.scrollHeight;
                }
            }
            
            if (data.type === 'end') {
                scamperEventSource.close();
                scamperEventSource = null;
                scamperRunning = false;
                updateScamperButton();
                
                const output = document.getElementById('scamper-output');
                if (output) {
                    output.textContent += `\n🐿️ Scamper completed with exit code: ${data.code}`;
                }
            }
        };
        
        scamperEventSource.onerror = function(error) {
            console.error('❌ Scamper EventSource error:', error);
            scamperEventSource.close();
            scamperEventSource = null;
            scamperRunning = false;
            updateScamperButton();
        };
    }

    // Button handler - toggles between run and kill
    runScamperBtn.addEventListener('click', function() {
        if (scamperRunning) {
            killScamper();
        } else {
            startScamper();
        }
    });

    // Check if Scamper is already running on page load
    try {
        const statusResponse = await fetch('/api/scamper-status');
        const statusData = await statusResponse.json();
        if (statusData.running) {
            console.log('🐿️ Scamper is already running (PID:', statusData.pid, ')');
            scamperRunning = true;
            updateScamperButton();
        }
    } catch (error) {
        console.warn('⚠️ Could not check Scamper status:', error);
    }
    
    // Placeholder for now
    setTimeout(() => {
        jobList.innerHTML = `
            <div style="text-align: center; color: #666;">
                <h3>🥜 No cached acorns yet!</h3>
                <p>Run Scamper to start collecting job listings</p>
            </div>
        `;
    }, 1000);
    
    processAcornsBtn.addEventListener('click', function() {
        console.log('🌰 Processing acorns...');
        this.innerHTML = '⚙️ Processing...';
        this.disabled = true;
        
        // Create EventSource for real-time updates
        const eventSource = new EventSource('/api/process-acorns');
        
        eventSource.onmessage = function(event) {
            const data = JSON.parse(event.data);
            console.log(`🌰 ${data.type}: ${data.message || data.result || data.error}`);
            
            // Update job list with live output
            const jobList = document.getElementById('job-list');
            if (data.type === 'start') {
                jobList.innerHTML = '<div style="color: #666;"><h3>🌰 Acorn Processing Output:</h3><pre id="acorn-output"></pre></div>';
            }
            
            if (data.type === 'progress' || data.type === 'result' || data.type === 'error') {
                const output = document.getElementById('acorn-output');
                if (output) {
                    if (data.type === 'progress') {
                        output.textContent += `📁 ${data.message}\n`;
                    } else if (data.type === 'result') {
                        output.textContent += `✅ ${data.file}:\n   ${data.result}\n\n`;
                    } else if (data.type === 'error') {
                        output.textContent += `❌ ${data.file}: ${data.error}\n\n`;
                    }
                    output.scrollTop = output.scrollHeight;
                }
            }
            
            if (data.type === 'end') {
                eventSource.close();
                processAcornsBtn.innerHTML = '🌰 Process Acorns';
                processAcornsBtn.disabled = false;
                
                const output = document.getElementById('acorn-output');
                if (output) {
                    output.textContent += `\n🌰 Acorn processing completed!`;
                }
            }
        };
        
        eventSource.onerror = function(error) {
            console.error('❌ Acorn processing EventSource error:', error);
            eventSource.close();
            processAcornsBtn.innerHTML = '🌰 Process Acorns';
            processAcornsBtn.disabled = false;
        };
    });
});