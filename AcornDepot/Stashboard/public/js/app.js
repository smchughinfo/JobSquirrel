// Stashboard App - Squirrel Job Cache Viewer

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🐿️ Stashboard loaded - time to check the winter cache!');
    
    const jobList = document.getElementById('job-list');
    const runScamperBtn = document.getElementById('run-scamper');
    const processAcornsBtn = document.getElementById('process-acorns');
    
    // Scamper state management
    let scamperEventSource = null;
    let scamperRunning = false;

    // Acorns processing state management
    let acornsEventSource = null;
    let acornsRunning = false;

    // Function to update button states
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

    function updateAcornsButton() {
        if (acornsRunning) {
            processAcornsBtn.innerHTML = '🔪 Kill Processing';
            processAcornsBtn.disabled = false;
            processAcornsBtn.style.backgroundColor = '#dc3545'; // Red color
        } else {
            processAcornsBtn.innerHTML = '🌰 Process Acorns';
            processAcornsBtn.disabled = false;
            processAcornsBtn.style.backgroundColor = ''; // Reset to default
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

    // Function to kill Acorns processing
    async function killAcorns() {
        try {
            const response = await fetch('/api/kill-acorns', { method: 'POST' });
            const data = await response.json();
            
            if (response.ok) {
                console.log('🔪 Acorns processing killed:', data.message);
                if (acornsEventSource) {
                    acornsEventSource.close();
                    acornsEventSource = null;
                }
                acornsRunning = false;
                updateAcornsButton();
                
                // Update output
                const output = document.getElementById('acorn-output');
                if (output) {
                    output.textContent += '\n🔪 Acorns processing cancelled by user\n';
                }
            } else {
                console.error('❌ Failed to kill acorns processing:', data.error);
            }
        } catch (error) {
            console.error('❌ Error killing acorns processing:', error);
        }
    }

    // Function to start Acorns processing
    function startAcorns() {
        console.log('🌰 Starting acorns processing...');
        acornsRunning = true;
        updateAcornsButton();
        
        // Create EventSource for real-time updates
        acornsEventSource = new EventSource('/api/process-acorns');
        
        acornsEventSource.onmessage = function(event) {
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
                acornsEventSource.close();
                acornsEventSource = null;
                acornsRunning = false;
                updateAcornsButton();
                
                const output = document.getElementById('acorn-output');
                if (output) {
                    output.textContent += `\n🌰 ${data.message}`;
                }
            }
        };
        
        acornsEventSource.onerror = function(error) {
            console.error('❌ Acorns processing EventSource error:', error);
            acornsEventSource.close();
            acornsEventSource = null;
            acornsRunning = false;
            updateAcornsButton();
        };
    }

    // Process Acorns button handler - toggles between run and kill
    processAcornsBtn.addEventListener('click', function() {
        if (acornsRunning) {
            killAcorns();
        } else {
            startAcorns();
        }
    });

    // Check if processes are already running on page load
    try {
        const scamperStatusResponse = await fetch('/api/scamper-status');
        const scamperStatusData = await scamperStatusResponse.json();
        if (scamperStatusData.running) {
            console.log('🐿️ Scamper is already running (PID:', scamperStatusData.pid, ')');
            scamperRunning = true;
            updateScamperButton();
        }
    } catch (error) {
        console.warn('⚠️ Could not check Scamper status:', error);
    }

    try {
        const acornsStatusResponse = await fetch('/api/acorns-status');
        const acornsStatusData = await acornsStatusResponse.json();
        if (acornsStatusData.running) {
            console.log('🌰 Acorns processing is already running (started:', acornsStatusData.startTime, ')');
            acornsRunning = true;
            updateAcornsButton();
        }
    } catch (error) {
        console.warn('⚠️ Could not check acorns processing status:', error);
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
});