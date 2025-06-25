const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { runCommandWithStreaming } = require('./commandRunner');

/**
 * Runs Claude synchronously and returns the result as a string
 * @param {string} message - Message to send to Claude
 * @param {string} workingDir - Directory to run Claude from (optional)
 * @returns {string} - Claude's response
 */
function askClaudeSync(message, workingDir = null) {
    // Default to Cache directory if no working directory specified
    if (!workingDir) {
        const cacheDir = path.join(__dirname, "..", "..", "Cache");
        workingDir = cacheDir.replace(/\\/g, '/').replace(/^([A-Z]):/, (match, drive) => `/mnt/${drive.toLowerCase()}`);
    }
    
    console.log(`🤖 [${new Date().toISOString()}] Starting Claude: "${message}"`);
    console.log(`🤖 Working directory: ${workingDir}`);
    
    try {
        const command = `wsl -e bash -c "cd ${workingDir} && script -qec \\"claude --print --dangerously-skip-permissions '${message}'\\" /dev/null"`;
        const result = execSync(command, { encoding: 'utf8', timeout: 600000 }); // 10 minutes

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
    // Default to Cache directory if no working directory specified
    if (!workingDir) {
        const cacheDir = path.join(__dirname, "..", "..", "Cache");
        workingDir = cacheDir.replace(/\\/g, '/').replace(/^([A-Z]):/, (match, drive) => `/mnt/${drive.toLowerCase()}`);
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

/**
 * Test function for debugging WSL commands
 */
function testWSLCommand(command = 'ls') {
    const cacheDir = path.join(__dirname, "..", "..", "Cache");
    const workingDir = cacheDir.replace(/\\/g, '/').replace(/^([A-Z]):/, (match, drive) => `/mnt/${drive.toLowerCase()}`);
    
    console.log(`🧪 __dirname: ${__dirname}`);
    console.log(`🧪 cacheDir (before WSL conversion): ${cacheDir}`);
    console.log(`🧪 workingDir (after WSL conversion): ${workingDir}`);
    console.log(`🧪 Testing WSL command: ${command}`);
    
    try {
        // Test if the directory exists first
        const testDirCommand = `wsl -e bash -c "ls -la '${workingDir}'"`;
        console.log(`🧪 Testing directory existence: ${testDirCommand}`);
        
        const wslCommand = `wsl -e bash -c "cd '${workingDir}' && pwd && ${command}"`;
        console.log(`🧪 Full command: ${wslCommand}`);
        const result = execSync(wslCommand, { encoding: 'utf8', timeout: 30000 });
        console.log(`🧪 Success: ${result}`);
        return result;
    } catch (error) {
        console.error(`🧪 Error: ${error.message}`);
        return `Error: ${error.message}`;
    }
}

function getUnProcessedAcorns() {
    const cacheDir = path.join(__dirname, "..", "..", "Cache");
    console.log(`🌰 Looking for cached files in: ${cacheDir}`);

    const htmlFiles = fs.readdirSync(cacheDir).filter(f => f.endsWith(".html"));
    const mdFiles = fs.readdirSync(cacheDir).filter(f => f.endsWith(".md"));
    let unprocessedFiles = [];
    
    htmlFiles.forEach(html => {
        const baseName = html.replace(/\.html$/, "");
        const hasProcessedVersion = mdFiles.some(md => md.replace(/\.md$/, "") === baseName);
        
        if (!hasProcessedVersion) {
            // Return just the filename, not the full path
            unprocessedFiles.push(html);
        }
    });

    console.log(`🌰 Found ${htmlFiles.length} HTML files, ${mdFiles.length} MD files`);
    console.log(`🌰 ${unprocessedFiles.length} unprocessed acorns`);
    
    return unprocessedFiles;
}

module.exports = {
    askClaudeSync,
    askClaudeStream,
    getUnProcessedAcorns,
    testWSLCommand
};