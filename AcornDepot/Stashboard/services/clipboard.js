const { EventEmitter } = require('events');
const { spawn } = require('child_process');
const { processJobListing: processRawJobListing } = require('./jobListingProcessor');

class ClipboardMonitor extends EventEmitter {
    constructor() {
        super();
        this.isRunning = false;
        this.process = null;
        this.buffer = '';
        this.chatter = (message) => console.log(`📋 Clipboard: ${message}`);
        this.lastMessage = "";
    }

    startMonitoring() {
        if (this.isRunning) {
            this.chatter('Already monitoring clipboard');
            return;
        }

        this.chatter('Starting clipboard monitoring...');
        this.isRunning = true;

        // Use PowerShell to monitor clipboard on Windows with file-based approach for large content
        const script = `
            Add-Type -AssemblyName System.Windows.Forms
            $tempFile = "C:/Users/seanm/Desktop/clipboard-temp.txt"
            
            # Initialize with current clipboard to avoid startup trigger
            try {
                $lastClipboard = [System.Windows.Forms.Clipboard]::GetText()
            } catch {
                $lastClipboard = ""
            }
            
            while ($true) {
                try {
                    $currentClipboard = [System.Windows.Forms.Clipboard]::GetText()
                    if ($currentClipboard -ne $lastClipboard -and $currentClipboard -ne "") {
                        if ($currentClipboard.Length -gt 8000) {
                            # For large content, write to file and signal
                            $currentClipboard | Out-File -FilePath $tempFile -Encoding UTF8 -NoNewline
                            Write-Output "CLIPBOARD_LARGE_FILE:$tempFile"
                        } else {
                            # For small content, use stdout as before
                            Write-Output "CLIPBOARD_CHANGE:$currentClipboard"
                        }
                        $lastClipboard = $currentClipboard
                    }
                    Start-Sleep -Milliseconds 500
                } catch {
                    # Ignore clipboard access errors (common when other apps are using clipboard)
                    Start-Sleep -Milliseconds 1000
                }
            }
        `;

        this.process = spawn('powershell', ['-Command', script], {
            stdio: ['ignore', 'pipe', 'pipe'],
            windowsHide: true
        });

        this.process.stdout.on('data', (data) => {
            this.buffer += data.toString();
            
            // Process complete lines
            const lines = this.buffer.split('\n');
            this.buffer = lines.pop() || ''; // Keep incomplete line in buffer
            
            lines.forEach(line => {
                line = line.trim();
                if (line.startsWith('CLIPBOARD_CHANGE:')) {
                    const clipboardText = line.substring('CLIPBOARD_CHANGE:'.length);
                    this.processClipboardContent(clipboardText);
                    this.lastMessage = clipboardText;
                } else if (line.startsWith('CLIPBOARD_LARGE_FILE:')) {
                    const filePath = line.substring('CLIPBOARD_LARGE_FILE:'.length);
                    this.processLargeClipboardFile(filePath);
                    // lastMessage will be set inside processLargeClipboardFile when it reads the file
                }
            });
        });

        this.process.stderr.on('data', (data) => {
            this.chatter(`Error: ${data.toString().trim()}`);
        });

        this.process.on('close', (code) => {
            this.chatter(`Monitoring stopped with code ${code}`);
            this.isRunning = false;
            this.process = null;
        });

        this.process.on('error', (error) => {
            this.chatter(`Failed to start monitoring: ${error.message}`);
            this.isRunning = false;
            this.process = null;
        });
    }

    stopMonitoring() {
        if (!this.isRunning || !this.process) {
            this.chatter('Not currently monitoring');
            return;
        }

        this.chatter('Stopping clipboard monitoring...');
        this.process.kill('SIGTERM');
        this.isRunning = false;
    }

    getStatus() {
        return {
            running: this.isRunning,
            pid: this.process ? this.process.pid : null
        };
    }

    clearJobSquirrelMessageFromClipboard() {
        return new Promise((resolve, reject) => {
            this.chatter('Checking clipboard for JobSquirrel messages...');

            const script = `
                Add-Type -AssemblyName System.Windows.Forms
                try {
                    $currentClipboard = [System.Windows.Forms.Clipboard]::GetText()
                    if ($currentClipboard -like "*JobSquirrelBrowserExtensionMessage:*") {
                        [System.Windows.Forms.Clipboard]::SetText(".")
                        Write-Output "CLEARED"
                    } else {
                        Write-Output "NO_MESSAGE"
                    }
                } catch {
                    Write-Error $_.Exception.Message
                }
            `;

            const clearProcess = spawn('powershell', ['-Command', script], {
                stdio: ['ignore', 'pipe', 'pipe'],
                windowsHide: true
            });

            let output = '';
            let errorOutput = '';

            clearProcess.stdout.on('data', (data) => {
                output += data.toString();
            });

            clearProcess.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            clearProcess.on('close', (code) => {
                if (code === 0) {
                    const result = output.trim();
                    if (result === 'CLEARED') {
                        this.chatter('JobSquirrel message found and cleared from clipboard');
                        resolve(true);
                    } else if (result === 'NO_MESSAGE') {
                        this.chatter('No JobSquirrel message found in clipboard');
                        resolve(false);
                    } else {
                        this.chatter(`Unexpected result: ${result}`);
                        resolve(false);
                    }
                } else {
                    const error = errorOutput || `Process exited with code ${code}`;
                    this.chatter(`Failed to clear clipboard: ${error}`);
                    reject(new Error(error));
                }
            });

            clearProcess.on('error', (error) => {
                this.chatter(`Error clearing clipboard: ${error.message}`);
                reject(error);
            });
        });
    }


    processClipboardContent(clipboardText) {
        // Remove BOM and other invisible characters
        const cleanText = clipboardText.replace(/^\uFEFF/, '').trim();
        
        if(cleanText.startsWith("JobSquirrelBrowserExtension")) {
            this.routeMessage(cleanText);
            this.chatter(`Clipboard changed: ${cleanText.substring(0, 100)}${cleanText.length > 100 ? '...' : ''}`);
            this.emit('clipboardChange', cleanText);
        }
    }

    processLargeClipboardFile(filePath) {
        try {
            const fs = require('fs');
            const clipboardText = fs.readFileSync(filePath, 'utf8');
            this.chatter(`Large clipboard content read from file (${clipboardText.length} chars)`);
            this.lastMessage = clipboardText;
            this.processClipboardContent(clipboardText);
            
            // Clean up temp file
            fs.unlinkSync(filePath);
        } catch (error) {
            this.chatter(`Error reading large clipboard file: ${error.message}`);
        }
    }

    routeMessage(message) {
        if (message.startsWith("JobSquirrelBrowserExtensionMessage")) {
            const payload = message.split("JobSquirrelBrowserExtensionMessage:")[1];
            processRawJobListing(payload);
            clearJobSquirrelMessageFromClipboard();
        }
    }
}

module.exports = { ClipboardMonitor };