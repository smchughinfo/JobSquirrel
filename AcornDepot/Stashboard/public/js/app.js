// Stashboard App - Squirrel Job Cache Viewer

document.addEventListener('DOMContentLoaded', function() {
    console.log('🐿️ Stashboard loaded - time to check the winter cache!');
    
    const jobList = document.getElementById('job-list');
    const runScamperBtn = document.getElementById('run-scamper');
    const processAcornsBtn = document.getElementById('process-acorns');
    
    // Placeholder for now
    setTimeout(() => {
        jobList.innerHTML = `
            <div style="text-align: center; color: #666;">
                <h3>🥜 No cached acorns yet!</h3>
                <p>Run Scamper to start collecting job listings</p>
            </div>
        `;
    }, 1000);
    
    // Button handlers
    runScamperBtn.addEventListener('click', function() {
        console.log('🐿️ Running Scamper...');
        this.innerHTML = '⏳ Scampering...';
        this.disabled = true;
        
        // Create EventSource for real-time updates
        const eventSource = new EventSource('/api/run-scamper');
        
        eventSource.onmessage = function(event) {
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
                eventSource.close();
                runScamperBtn.innerHTML = '🐿️ Run Scamper';
                runScamperBtn.disabled = false;
                
                const output = document.getElementById('scamper-output');
                if (output) {
                    output.textContent += `\n🐿️ Scamper completed with exit code: ${data.code}`;
                }
            }
        };
        
        eventSource.onerror = function(error) {
            console.error('❌ Scamper EventSource error:', error);
            eventSource.close();
            runScamperBtn.innerHTML = '🐿️ Run Scamper';
            runScamperBtn.disabled = false;
        };
    });
    
    processAcornsBtn.addEventListener('click', function() {
        console.log('🌰 Processing acorns...');
        this.innerHTML = '⚙️ Processing...';
        this.disabled = true;
        
        // Create EventSource for real-time updates
        const eventSource = new EventSource('/api/process-acorns');
        
        eventSource.onmessage = function(event) {
            const data = JSON.parse(event.data);
            console.log(`🌰 ${data.type}: ${data.message}`);
            
            // Update job list with live output
            const jobList = document.getElementById('job-list');
            if (data.type === 'start') {
                jobList.innerHTML = '<div style="color: #666;"><h3>🌰 Acorn Processing Output:</h3><pre id="scamper-output"></pre></div>';
            }
            
            if (data.type === 'stdout' || data.type === 'stderr') {
                const output = document.getElementById('scamper-output');
                if (output) {
                    output.textContent += data.message + '\n';
                    output.scrollTop = output.scrollHeight;
                }
            }
            
            if (data.type === 'end') {
                eventSource.close();
                processAcornsBtn.innerHTML = '🌰 Process Acorns';
                processAcornsBtn.disabled = false;
                
                const output = document.getElementById('scamper-output');
                if (output) {
                    output.textContent += `\n🌰 Acorn processing completed with exit code: ${data.code}`;
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