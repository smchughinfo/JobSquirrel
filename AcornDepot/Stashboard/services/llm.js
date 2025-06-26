const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { runCommandWithStreaming } = require('./commandRunner');
const { getJobSquirrelRootDirectory, convertPathToWSL } = require('./jobSquirrelPaths');

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

/**
 * Runs Ollama synchronously and returns the result as a string
 * @param {string} message - Message to send to Ollama
 * @param {string} model - Ollama model to use (default: llama3:latest)
 * @param {string} workingDir - Directory to run Ollama from (optional)
 * @returns {string} - Ollama's response
 */
function askOllamaSync(message, model = 'llama3:latest', workingDir = null) {
    // Default to JobSquirrel root directory if no working directory specified
    if (!workingDir) {
        workingDir = getJobSquirrelRootDirectory();
    }
    
    console.log(`🦙 [${new Date().toISOString()}] Starting Ollama (${model}): "${message.substring(0, 100)}..."`);
    console.log(`🦙 Working directory: ${workingDir}`);
    
    try {
        // Detect if we're running in WSL or Windows
        const isInWSL = process.platform === 'linux' && process.env.WSL_DISTRO_NAME;
        
        // For job processing, always use temp files to preserve formatting
        // For other messages, use temp files if over 8000 chars
        const isJobProcessing = message.includes('complete description of this job listing');
        const useFileForLongMessage = isJobProcessing || message.length > 8000;
        let command;
        
        if (useFileForLongMessage) {
            // Write message to temporary file and read from stdin
            const tempFile = path.join(workingDir, 'temp_ollama_input.txt');
            const cleanMessage = message
                .replace(/\r\n/g, '\n')  // Normalize line endings
                .replace(/\r/g, '\n');   // Handle old Mac line endings
            
            fs.writeFileSync(tempFile, cleanMessage, 'utf8');
            
            if (isInWSL) {
                command = `cd '${workingDir}' && cat temp_ollama_input.txt | /mnt/c/Users/seanm/AppData/Local/Programs/Ollama/ollama.exe run ${model}`;
            } else {
                const wslWorkingDir = convertPathToWSL(workingDir);
                command = `wsl -e bash -c "cd '${wslWorkingDir}' && cat temp_ollama_input.txt | /mnt/c/Users/seanm/AppData/Local/Programs/Ollama/ollama.exe run ${model}"`;
            }
            
            console.log(`🦙 Using temporary file for long message (${message.length} chars)`);
        } else {
            // Use command line for shorter messages
            const cleanMessage = message
                .replace(/['"]/g, '')  // Remove both single and double quotes entirely
                .replace(/`/g, '')     // Remove backticks
                .replace(/\$/g, '')    // Remove dollar signs (shell variables)
                .replace(/\\/g, ' ')   // Replace backslashes with spaces
                .replace(/\n/g, ' ')   // Replace newlines with spaces
                .replace(/\s+/g, ' ')  // Normalize multiple spaces
                .trim();
            
            if (isInWSL) {
                command = `cd '${workingDir}' && /mnt/c/Users/seanm/AppData/Local/Programs/Ollama/ollama.exe run ${model} '${cleanMessage}'`;
            } else {
                const wslWorkingDir = convertPathToWSL(workingDir);
                command = `wsl -e bash -c "cd '${wslWorkingDir}' && /mnt/c/Users/seanm/AppData/Local/Programs/Ollama/ollama.exe run ${model} '${cleanMessage}'"`;
            }
        }
        
        console.log(`🦙 Command: ${command}`);
        const result = execSync(command, { encoding: 'utf8', timeout: 300000 }); // 5 minutes timeout

        // Clean up temporary file if it was used
        if (useFileForLongMessage) {
            try {
                const tempFile = path.join(workingDir, 'temp_ollama_input.txt');
                fs.unlinkSync(tempFile);
                console.log(`🦙 Cleaned up temporary file`);
            } catch (cleanupError) {
                console.warn(`🦙 Warning: Could not clean up temporary file: ${cleanupError.message}`);
            }
        }

        // Clean up ANSI escape sequences and extra whitespace (similar to Claude cleaning)
        const cleanResult = result
            .replace(/\x1b\[[0-9;]*[mGKHF]?/g, '') // Remove ANSI sequences
            .replace(/\[\?[0-9]+[hl]/g, '') // Remove all cursor/mode sequences
            .replace(/\[[0-9]*[GKJH]/g, '') // Remove cursor position/clear sequences
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars
            .replace(/[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]/g, '') // Remove spinner characters
            .replace(/[ \t]+/g, ' ') // Normalize spaces and tabs (but preserve newlines)
            .replace(/\n\s*\n\s*\n+/g, '\n\n') // Collapse multiple newlines to double newlines
            .trim();
            
        console.log(`🦙 [${new Date().toISOString()}] Ollama completed: ${cleanResult.substring(0, 100)}...`);
        return cleanResult;
    } catch (error) {
        console.error(`🦙 [${new Date().toISOString()}] Ollama error: ${error.message}`);
        return `Error: ${error.message}`;
    }
}

module.exports = {
    askClaudeSync,
    askClaudeStream,
    askOllamaSync,
};