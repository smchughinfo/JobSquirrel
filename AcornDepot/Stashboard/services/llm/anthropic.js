const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const { getJobSquirrelRootDirectory, convertPathToWSL } = require('../jobSquirrelPaths');
const { eventBroadcaster } = require('../eventBroadcaster');

async function AskClaude(message, workingDir = null) {
    if (!workingDir || typeof workingDir !== 'string') {
        workingDir = getJobSquirrelRootDirectory();
    }
    
    // Log to console and broadcast event
    console.log('🤖 Starting Claude with file-watching streaming...');
    console.log('📍 Working directory:', workingDir);
    
    eventBroadcaster.broadcast('claude-stream', {
        type: 'system',
        content: `🤖 Starting Claude with file-watching streaming...\n📍 Working directory: ${workingDir}`
    });
    
    return await new Promise((resolve, reject) => {
        // Create unique output file - use proper temp directory for platform
        const tempDir = os.tmpdir();
        const outputFile = path.join(tempDir, `claude_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jsonl`);
        console.log('📄 Output file:', outputFile);
        
        eventBroadcaster.broadcast('claude-stream', {
            type: 'system',
            content: `📄 Output file: ${outputFile}`
        });
        
        // Create empty file first
        fs.writeFileSync(outputFile, '');
        
        // Track file position for reading only new content
        let lastPosition = 0;
        let finalResult = '';
        let isComplete = false;
        let watcher = null;
        
        // Function to read only NEW content from file
        function readNewContent() {
            fs.stat(outputFile, (err, stats) => {
                if (err) return;
                
                const currentSize = stats.size;
                
                if (currentSize > lastPosition) {
                    // Read only the new bytes
                    const stream = fs.createReadStream(outputFile, {
                        start: lastPosition,
                        end: currentSize - 1
                    });
                    
                    let newContent = '';
                    stream.on('data', (chunk) => {
                        newContent += chunk.toString();
                    });
                    
                    stream.on('end', () => {
                        // Process new lines
                        const lines = newContent.split('\n');
                        lines.forEach(line => {
                            if (line.trim()) {
                                try {
                                    const jsonData = JSON.parse(line);
                                    
                                    // Handle different Claude JSON message types
                                    if (jsonData.type === 'system') {
                                        console.log('🔧 Claude system init - Session:', jsonData.session_id);
                                        
                                        // Broadcast system event
                                        eventBroadcaster.broadcast('claude-stream', {
                                            type: 'system',
                                            session: jsonData.session_id
                                        });
                                        
                                    } else if (jsonData.type === 'assistant' && jsonData.message && jsonData.message.content) {
                                        const content = jsonData.message.content[0]?.text;
                                        if (content) {
                                            console.log('🤖 Claude response received:');
                                            // Split into lines for better console display
                                            content.split('\\n').forEach(responseLine => {
                                                console.log('🤖 ', responseLine);
                                                
                                                // Broadcast each line individually
                                                eventBroadcaster.broadcast('claude-stream', {
                                                    type: 'response-line',
                                                    content: responseLine
                                                });
                                            });
                                            
                                            finalResult = content;
                                            
                                            // Broadcast response event
                                            eventBroadcaster.broadcast('claude-stream', {
                                                type: 'response',
                                                content: content
                                            });
                                        }
                                        
                                    } else if (jsonData.type === 'result') {
                                        console.log(`✅ Claude finished - ${jsonData.duration_ms}ms - $${jsonData.total_cost_usd.toFixed(6)}`);
                                        if (jsonData.result && !finalResult) {
                                            finalResult = jsonData.result;
                                        }
                                        
                                        // Broadcast completion event
                                        eventBroadcaster.broadcast('claude-stream', {
                                            type: 'complete',
                                            duration: jsonData.duration_ms,
                                            cost: jsonData.total_cost_usd,
                                            result: finalResult
                                        });
                                        
                                        isComplete = true;
                                        cleanup();
                                        resolve(finalResult);
                                    }
                                } catch (e) {
                                    // Not JSON, might be error output
                                    if (line.includes('Error:')) {
                                        console.error('❌ Claude error:', line);
                                        eventBroadcaster.broadcast('claude-stream', {
                                            type: 'error',
                                            message: line
                                        });
                                    }
                                }
                            }
                        });
                        
                        // Update position for next read
                        lastPosition = currentSize;
                    });
                }
            });
        }
        
        // Set up file watcher
        watcher = fs.watch(outputFile, (eventType) => {
            if (eventType === 'change') {
                readNewContent();
            }
        });
        
        // Start Claude process writing to file
        console.log('🚀 Starting Claude process...');
        
        eventBroadcaster.broadcast('claude-stream', {
            type: 'system',
            content: '🚀 Starting Claude process...'
        });
        
        // Check platform and setup command accordingly
        const isWindows = process.platform === 'win32';
        
        let claudeProcess;
        if (isWindows) {
            // We're on Windows, use WSL wrapper
            const wslWorkingDir = convertPathToWSL(workingDir);
            const wslOutputFile = convertPathToWSL(outputFile);
            
            console.log('🖥️  Windows detected, using WSL wrapper');
            console.log('🔄 WSL working dir:', wslWorkingDir);
            console.log('🔄 WSL output file:', wslOutputFile);
            
            eventBroadcaster.broadcast('claude-stream', {
                type: 'system',
                content: `🖥️ Windows detected, using WSL wrapper\n🔄 WSL working dir: ${wslWorkingDir}\n🔄 WSL output file: ${wslOutputFile}`
            });
            
            const wslCommand = `cd ${wslWorkingDir} && claude --print --verbose --output-format stream-json --dangerously-skip-permissions '${message}' > ${wslOutputFile}`;
            console.log('🔧 Full WSL command:', wslCommand);
            
            eventBroadcaster.broadcast('claude-stream', {
                type: 'system',
                content: `🔧 Full WSL command: ${wslCommand}`
            });
            
            claudeProcess = spawn('wsl', [
                '-e', 'bash', '-c',
                wslCommand
            ], {
                stdio: ['ignore', 'ignore', 'ignore'],  // Detach completely
                detached: false
            });
            
            console.log('📋 Claude process started, PID:', claudeProcess.pid);
            
            eventBroadcaster.broadcast('claude-stream', {
                type: 'system',
                content: `📋 Claude process started, PID: ${claudeProcess.pid}`
            });
        } else {
            // We're in WSL/Linux, run Claude directly
            console.log('🐧 Linux/WSL detected, running Claude directly');
            
            eventBroadcaster.broadcast('claude-stream', {
                type: 'system',
                content: '🐧 Linux/WSL detected, running Claude directly'
            });
            
            claudeProcess = spawn('/bin/bash', [
                '-c',
                `cd ${workingDir} && claude --print --verbose --output-format stream-json --dangerously-skip-permissions '${message}' > ${outputFile}`
            ], {
                stdio: 'inherit'
            });
        }
        
        claudeProcess.on('close', (code) => {
            console.log('🏁 Claude process finished with code:', code);
            
            eventBroadcaster.broadcast('claude-stream', {
                type: 'system',
                content: `🏁 Claude process finished with code: ${code}`
            });
            
            // Give file watcher a moment to process any final content
            setTimeout(() => {
                if (!isComplete) {
                    // Read any remaining content
                    readNewContent();
                    
                    if (code !== 0) {
                        cleanup();
                        reject(new Error(`Claude process failed with code ${code}`));
                        return;
                    }
                    
                    cleanup();
                    resolve(finalResult || 'No result received');
                }
            }, 500);
        });
        
        claudeProcess.on('error', (err) => {
            console.error('💥 Claude process error:', err.message);
            
            eventBroadcaster.broadcast('claude-stream', {
                type: 'error',
                content: `💥 Claude process error: ${err.message}`
            });
            cleanup();
            reject(err);
        });
        
        // Cleanup function
        function cleanup() {
            if (watcher) {
                watcher.close();
                watcher = null;
            }
            
            // Delete temp file
            if (fs.existsSync(outputFile)) {
                try {
                    fs.unlinkSync(outputFile);
                    console.log('🗑️  Cleaned up output file');
                    
                    eventBroadcaster.broadcast('claude-stream', {
                        type: 'system',
                        content: '🗑️ Cleaned up output file'
                    });
                } catch (e) {
                    console.warn('⚠️  Could not delete output file:', e.message);
                }
            }
        }
        
        // Safety timeout - shorter for debugging
        const timeout = setTimeout(() => {
            console.log('⏰ Claude process timeout after 10m, killing...');
            console.log('🔍 Process still running?', !claudeProcess.killed);
            
            eventBroadcaster.broadcast('claude-stream', {
                type: 'error',
                content: `⏰ Claude process timeout after 10m, killing...\n🔍 Process still running? ${!claudeProcess.killed}`
            });
            claudeProcess.kill('SIGTERM');
            cleanup();
            reject(new Error('Claude process timed out after 30 seconds'));
        }, 1000*60*10);
        
        // Clear timeout when process ends
        claudeProcess.on('close', () => {
            clearTimeout(timeout);
        });
    });
}

module.exports = {
    AskClaude,
};