const { execSync, spawn } = require('child_process');
const { runCommandWithStreaming } = require('../commandRunner');
const { getJobSquirrelRootDirectory } = require('../jobSquirrelPaths');

function AskClaude(message, workingDir = null) {
    if (!workingDir || typeof workingDir !== 'string') {
        workingDir = getJobSquirrelRootDirectory();
    }
    
    console.log('askClaudeAsync workingDir:', workingDir, 'type:', typeof workingDir);
    
    return new Promise((resolve, reject) => {
        const wslCommand = `cd ${workingDir} && script -qec "claude --print --dangerously-skip-permissions '${message}'" /dev/null`;
        
        const process = spawn('wsl', ['-e', 'bash', '-c', wslCommand], {
            stdio: ['pipe', 'pipe', 'pipe']
        });
        
        let output = '';
        let error = '';
        
        process.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        process.stderr.on('data', (data) => {
            error += data.toString();
        });
        
        process.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Claude process failed with code ${code}: ${error}`));
                return;
            }
            
            const cleanResult = output
                .replace(/\x1b\[[0-9;]*[mGKHF]?/g, '')
                .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
                .replace(/\?25h/g, '')
                .trim();
                
            resolve(cleanResult);
        });
        
        process.on('error', (err) => {
            reject(new Error(`Failed to start Claude process: ${err.message}`));
        });
    });
}

module.exports = {
    AskClaude,
};