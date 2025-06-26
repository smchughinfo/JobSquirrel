const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { runCommandWithStreaming } = require('./commandRunner');
const { getJobSquirrelRootDirectory } = require('./jobSquirrelPaths');

/**
 * Runs Claude synchronously and returns the result as a string
 * @param {string} message - Message to send to Claude
 * @param {string} workingDir - Directory to run Claude from (optional)
 * @returns {string} - Claude's response
 */
function askClaudeSync(message, workingDir = null) {
    // Default to JobSquirrel root directory if no working directory specified
    if (!workingDir) {
        workingDir = getJobSquirrelRootDirectory();
    }
    
    console.log(`🤖 [${new Date().toISOString()}] Starting Claude: "${message}"`);
    console.log(`🤖 Working directory: ${workingDir}`);
    
    try {
        const command = `wsl -e bash -c "cd ${workingDir} && script -qec \\"claude --print --dangerously-skip-permissions '${message}'\\" /dev/null"`;
        const result = execSync(command, { encoding: 'utf8', timeout: 180000 });

        // Clean up ANSI escape sequences and extra whitespace
        const cleanResult = result
            .replace(/\x1b\[[0-9;]*[mGKHF]?/g, '')
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
            .replace(/\?25h/g, '') // Remove cursor visibility sequences
            .trim();
            
        console.log(`🤖 [${new Date().toISOString()}] Claude completed: ${cleanResult.substring(0, 100)}...`);
        return cleanResult;
    } catch (error) {
        console.error(`🤖 [${new Date().toISOString()}] Claude error: ${error.message}`);
        return `Error: ${error.message}`;
    }
}

/**
 * Streams Claude execution to HTTP response
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {string} message - Message to send to Claude
 * @param {string} workingDir - Directory to run Claude from (optional)
 */
function askClaudeStream(req, res, message, workingDir = null) {
    // Default to JobSquirrel root directory if no working directory specified
    if (!workingDir) {
        workingDir = getJobSquirrelRootDirectory();
    }
    
    console.log(`🤖 Streaming Claude: "${message}"`);
    console.log(`🤖 Working directory: ${workingDir}`);
    
    // Use script to provide fake TTY for Claude
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