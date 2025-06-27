const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync, exec } = require('child_process');
const { runCommandWithStreaming } = require('./commandRunner');
const { getJobSquirrelRootDirectory, convertPathToWSL } = require('./jobSquirrelPaths');

/**
 * Get the dynamic path to Ollama executable in WSL format
 * @returns {string} - WSL path to ollama.exe
 */
function getOllamaExecutablePath() {
    // Get the current user's home directory and convert to WSL format
    const homeDir = os.homedir();
    const windowsOllamaPath = path.join(homeDir, 'AppData', 'Local', 'Programs', 'Ollama', 'ollama.exe');
    return convertPathToWSL(windowsOllamaPath);
}

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
        const isJobProcessing = message.includes('complete description of this job listing') || 
                               message.includes('job listing parser') || 
                               message.includes('GENERATE JSON') ||
                               message.includes('FIX JSON') ||
                               message.includes('SECOND PASS') ||
                               message.includes('Conver this to markdown');
        const useFileForLongMessage = isJobProcessing || message.length > 1000;
        let command;
        
        if (useFileForLongMessage) {
            // Write message to temporary file and read from stdin
            const tempFile = path.join(workingDir, 'temp_ollama_input.txt');
            const cleanMessage = message
                .replace(/\r\n/g, '\n')  // Normalize line endings
                .replace(/\r/g, '\n');   // Handle old Mac line endings
            
            fs.writeFileSync(tempFile, cleanMessage, 'utf8');
            
            const ollamaPath = getOllamaExecutablePath();
            if (isInWSL) {
                command = `cd '${workingDir}' && cat temp_ollama_input.txt | ${ollamaPath} run ${model}`;
            } else {
                const wslWorkingDir = convertPathToWSL(workingDir);
                command = `wsl -e bash -c "cd '${wslWorkingDir}' && cat temp_ollama_input.txt | ${ollamaPath} run ${model}"`;
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
            
            const ollamaPath = getOllamaExecutablePath();
            if (isInWSL) {
                // Don't change directory for command line - run from root
                command = `${ollamaPath} run ${model} '${cleanMessage}'`;
            } else {
                command = `wsl -e bash -c "${ollamaPath} run ${model} '${cleanMessage}'"`;
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
            
        console.log(`🦙 [${new Date().toISOString()}] Ollama completed: ${cleanResult.substring(0, 10000)}...`);
        return cleanResult;
    } catch (error) {
        console.error(`🦙 [${new Date().toISOString()}] Ollama error: ${error.message}`);
        return `Error: ${error.message}`;
    }
}

/**
 * Runs Ollama asynchronously and returns a Promise with the result
 * @param {string} message - Message to send to Ollama
 * @param {string} model - Ollama model to use (default: llama3:latest)
 * @param {string} workingDir - Directory to run Ollama from (optional)
 * @returns {Promise<string>} - Promise resolving to Ollama's response
 */
function askOllamaAsync(message, model = 'llama3:latest', workingDir = null) {
    return new Promise((resolve, reject) => {
        // Default to JobSquirrel root directory if no working directory specified
        if (!workingDir) {
            workingDir = getJobSquirrelRootDirectory();
        }
        
        console.log(`🦙 [${new Date().toISOString()}] Starting Ollama ASYNC (${model}): "${message.substring(0, 100)}..."`);
        console.log(`🦙 Working directory: ${workingDir}`);
        
        try {
            // Detect if we're running in WSL or Windows
            const isInWSL = process.platform === 'linux' && process.env.WSL_DISTRO_NAME;
            
            // For job processing, always use temp files to preserve formatting
            // For other messages, use temp files if over 8000 chars
            const isJobProcessing = message.includes('complete description of this job listing') || 
                                   message.includes('job listing parser') || 
                                   message.includes('GENERATE JSON') ||
                                   message.includes('FIX JSON') ||
                                   message.includes('SECOND PASS') ||
                                   message.includes('Conver this to markdown');
            const useFileForLongMessage = isJobProcessing || message.length > 1000;
            let command;
            let tempFile = null;
            
            if (useFileForLongMessage) {
                // Write message to temporary file and read from stdin
                tempFile = path.join(workingDir, `temp_ollama_input_${Date.now()}.txt`);
                const cleanMessage = message
                    .replace(/\r\n/g, '\n')  // Normalize line endings
                    .replace(/\r/g, '\n');   // Handle old Mac line endings
                
                fs.writeFileSync(tempFile, cleanMessage, 'utf8');
                
                const ollamaPath = getOllamaExecutablePath();
                if (isInWSL) {
                    command = `cd '${workingDir}' && cat '${path.basename(tempFile)}' | ${ollamaPath} run ${model}`;
                } else {
                    const wslWorkingDir = convertPathToWSL(workingDir);
                    command = `wsl -e bash -c "cd '${wslWorkingDir}' && cat '${path.basename(tempFile)}' | ${ollamaPath} run ${model}"`;
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
                
                const ollamaPath = getOllamaExecutablePath();
                if (isInWSL) {
                    command = `cd '${workingDir}' && ${ollamaPath} run ${model} '${cleanMessage}'`;
                } else {
                    const wslWorkingDir = convertPathToWSL(workingDir);
                    command = `wsl -e bash -c "cd '${wslWorkingDir}' && ${ollamaPath} run ${model} '${cleanMessage}'"`;
                }
            }
            
            console.log(`🦙 Command: ${command}`);
            
            // Use async exec instead of execSync with shorter timeout and better error handling
            exec(command, { encoding: 'utf8', timeout: 120000 }, (error, stdout, stderr) => {
                // Clean up temporary file if it was used
                if (tempFile) {
                    try {
                        fs.unlinkSync(tempFile);
                        console.log(`🦙 Cleaned up temporary file`);
                    } catch (cleanupError) {
                        console.warn(`🦙 Warning: Could not clean up temporary file: ${cleanupError.message}`);
                    }
                }
                
                if (error) {
                    console.error(`🦙 [${new Date().toISOString()}] Ollama error: ${error.message}`);
                    if (stderr) {
                        console.error(`🦙 [${new Date().toISOString()}] Ollama stderr: ${stderr}`);
                    }
                    reject(`Error: ${error.message}${stderr ? ` (stderr: ${stderr})` : ''}`);
                    return;
                }
                
                if (stderr) {
                    console.warn(`🦙 [${new Date().toISOString()}] Ollama stderr (non-fatal): ${stderr}`);
                }
                
                // Clean up ANSI escape sequences and extra whitespace (similar to Claude cleaning)
                const cleanResult = stdout
                    .replace(/\x1b\[[0-9;]*[mGKHF]?/g, '') // Remove ANSI sequences
                    .replace(/\[\?[0-9]+[hl]/g, '') // Remove all cursor/mode sequences
                    .replace(/\[[0-9]*[GKJH]/g, '') // Remove cursor position/clear sequences
                    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars
                    .replace(/[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]/g, '') // Remove spinner characters
                    .replace(/[ \t]+/g, ' ') // Normalize spaces and tabs (but preserve newlines)
                    .replace(/\n\s*\n\s*\n+/g, '\n\n') // Collapse multiple newlines to double newlines
                    .trim();
                    
                console.log(`🦙 [${new Date().toISOString()}] Ollama ASYNC completed: ${cleanResult.substring(0, 100)}...`);
                resolve(cleanResult);
            });
            
        } catch (error) {
            console.error(`🦙 [${new Date().toISOString()}] Ollama ASYNC setup error: ${error.message}`);
            reject(`Error: ${error.message}`);
        }
    });
}

module.exports = {
    askClaudeSync,
    askClaudeStream,
    askOllamaSync,
    askOllamaAsync,
};