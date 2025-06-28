const { execSync } = require('child_process');
const { runCommandWithStreaming } = require('../commandRunner');
const { getJobSquirrelRootDirectory } = require('../jobSquirrelPaths');

function askClaudeSync(message, workingDir = null) {
    if (!workingDir) {
        workingDir = getJobSquirrelRootDirectory();
    }
    
    const command = `wsl -e bash -c "cd ${workingDir} && script -qec \\"claude --print --dangerously-skip-permissions '${message}'\\" /dev/null"`;
    const result = execSync(command, { encoding: 'utf8', timeout: 180000 });

    const cleanResult = result
        .replace(/\x1b\[[0-9;]*[mGKHF]?/g, '')
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        .replace(/\?25h/g, '')
        .trim();
        
    return cleanResult;
}

function askClaudeStream(req, res, message, workingDir = null) {
    if (!workingDir) {
        workingDir = getJobSquirrelRootDirectory();
    }
    
    const wslArgs = [
        '-e', 'bash', '-c', 
        `cd ${workingDir} && script -qec "claude --print --dangerously-skip-permissions '${message}'" /dev/null`
    ];
    
    return runCommandWithStreaming(req, res, 'wsl', wslArgs);
}

module.exports = {
    askClaudeSync,
    askClaudeStream,
};