const { EventEmitter } = require('events');
const { spawn } = require('child_process');

class ClipboardMonitor extends EventEmitter {
    constructor() {
        super();
        this.isRunning = false;
        this.process = null;
        this.chatter = (message) => console.log(`📋 Clipboard: ${message}`);
    }

    startMonitoring() {
        if (this.isRunning) {
            this.chatter('Already monitoring clipboard');
            return;
        }

        this.chatter('Starting clipboard monitoring...');
        this.isRunning = true;

        // Use PowerShell to monitor clipboard on Windows
        const script = `
            Add-Type -AssemblyName System.Windows.Forms
            $lastClipboard = ""
            
            while ($true) {
                try {
                    $currentClipboard = [System.Windows.Forms.Clipboard]::GetText()
                    if ($currentClipboard -ne $lastClipboard -and $currentClipboard -ne "") {
                        Write-Output "CLIPBOARD_CHANGE:$currentClipboard"
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
            const output = data.toString().trim();
            if (output.startsWith('CLIPBOARD_CHANGE:')) {
                const clipboardText = output.substring('CLIPBOARD_CHANGE:'.length);
                this.chatter(`Clipboard changed: ${clipboardText.substring(0, 100)}${clipboardText.length > 100 ? '...' : ''}`);
                this.emit('clipboardChange', clipboardText);
            }
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
}

module.exports = { ClipboardMonitor };