const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync, exec } = require('child_process');
const { getJobSquirrelRootDirectory, convertPathToWSL } = require('../jobSquirrelPaths');
const { eventBroadcaster } = require('../eventBroadcaster');

let model = "yasserrmd/Llama-4-Scout-17B-16E-Instruct:latest"

function getOllamaExecutablePath() {
    const homeDir = os.homedir();
    const windowsOllamaPath = path.join(homeDir, 'AppData', 'Local', 'Programs', 'Ollama', 'ollama.exe');
    return convertPathToWSL(windowsOllamaPath);
}

function askOllamaSync(message) {
    const workingDir = getJobSquirrelRootDirectory();
    const isInWSL = process.platform === 'linux' && process.env.WSL_DISTRO_NAME;
    
    const isJobProcessing = message.includes('complete description of this job listing') || 
                           message.includes('job listing parser') || 
                           message.includes('GENERATE JSON') ||
                           message.includes('FIX JSON') ||
                           message.includes('SECOND PASS') ||
                           message.includes('Conver this to markdown');
    const useFileForLongMessage = isJobProcessing || message.length > 1000;
    let command;
    
    if (useFileForLongMessage) {
        const tempFile = path.join(workingDir, 'temp_ollama_input.txt');
        const cleanMessage = message
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n');
        
        fs.writeFileSync(tempFile, cleanMessage, 'utf8');
        
        const ollamaPath = getOllamaExecutablePath();
        if (isInWSL) {
            command = `cd '${workingDir}' && cat temp_ollama_input.txt | ${ollamaPath} run ${model}`;
        } else {
            const wslWorkingDir = convertPathToWSL(workingDir);
            command = `wsl -e bash -c "cd '${wslWorkingDir}' && cat temp_ollama_input.txt | ${ollamaPath} run ${model}"`;
        }
    } else {
        const cleanMessage = message
            .replace(/['"]/g, '')
            .replace(/`/g, '')
            .replace(/\$/g, '')
            .replace(/\\/g, ' ')
            .replace(/\n/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        
        const ollamaPath = getOllamaExecutablePath();
        if (isInWSL) {
            command = `${ollamaPath} run ${model} '${cleanMessage}'`;
        } else {
            command = `wsl -e bash -c "${ollamaPath} run ${model} '${cleanMessage}'"`;
        }
    }
    
    const result = execSync(command, { encoding: 'utf8', timeout: 300000 });

    if (useFileForLongMessage) {
        const tempFile = path.join(workingDir, 'temp_ollama_input.txt');
        fs.unlinkSync(tempFile);
    }

    const cleanResult = result
        .replace(/\x1b\[[0-9;]*[mGKHF]?/g, '')
        .replace(/\[\?[0-9]+[hl]/g, '')
        .replace(/\[[0-9]*[GKJH]/g, '')
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        .replace(/[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]/g, '')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n\s*\n\s*\n+/g, '\n\n')
        .trim();
        
    return cleanResult;
}

function askOllamaAsync(message, workingDir = null) {
    return new Promise((resolve, reject) => {
        if (!workingDir) {
            workingDir = getJobSquirrelRootDirectory();
        }
        
        const isInWSL = process.platform === 'linux' && process.env.WSL_DISTRO_NAME;
        
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
            tempFile = path.join(workingDir, `temp_ollama_input_${Date.now()}.txt`);
            const cleanMessage = message
                .replace(/\r\n/g, '\n')
                .replace(/\r/g, '\n');
            
            fs.writeFileSync(tempFile, cleanMessage, 'utf8');
            
            const ollamaPath = getOllamaExecutablePath();
            if (isInWSL) {
                command = `cd '${workingDir}' && cat '${path.basename(tempFile)}' | ${ollamaPath} run ${model}`;
            } else {
                const wslWorkingDir = convertPathToWSL(workingDir);
                command = `wsl -e bash -c "cd '${wslWorkingDir}' && cat '${path.basename(tempFile)}' | ${ollamaPath} run ${model}"`;
            }
        } else {
            const cleanMessage = message
                .replace(/['"]/g, '')
                .replace(/`/g, '')
                .replace(/\$/g, '')
                .replace(/\\/g, ' ')
                .replace(/\n/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            
            const ollamaPath = getOllamaExecutablePath();
            if (isInWSL) {
                command = `cd '${workingDir}' && ${ollamaPath} run ${model} '${cleanMessage}'`;
            } else {
                const wslWorkingDir = convertPathToWSL(workingDir);
                command = `wsl -e bash -c "cd '${wslWorkingDir}' && ${ollamaPath} run ${model} '${cleanMessage}'"`;
            }
        }
        
        exec(command, { encoding: 'utf8', timeout: 120000 }, (error, stdout, stderr) => {
            if (tempFile) {
                fs.unlinkSync(tempFile);
            }
            
            if (error) {
                reject(`Error: ${error.message}${stderr ? ` (stderr: ${stderr})` : ''}`);
                return;
            }
            
            const cleanResult = stdout
                .replace(/\x1b\[[0-9;]*[mGKHF]?/g, '')
                .replace(/\[\?[0-9]+[hl]/g, '')
                .replace(/\[[0-9]*[GKJH]/g, '')
                .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
                .replace(/[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]/g, '')
                .replace(/[ \t]+/g, ' ')
                .replace(/\n\s*\n\s*\n+/g, '\n\n')
                .trim();
                
            resolve(cleanResult);
        });
    });
}

function askOllamaAndLog(logName, prompt) {
    return new Promise((resolve, reject) => {
        try {
            eventBroadcaster.llmProcessingStarted(logName);
            
            setTimeout(() => {
                try {
                    const result = askOllamaSync(prompt);
                    eventBroadcaster.llmProcessingCompleted(logName, result);
                    resolve(result);
                } catch (error) {
                    console.error(`🧠 ${logName} failed: ${error.message}`);
                    eventBroadcaster.broadcast('llm-processing-failed', {
                        step: logName,
                        error: error.message,
                        message: `${logName} failed: ${error.message}`
                    });
                    reject(error);
                }
            }, 10);
            
        } catch (error) {
            console.error(`🧠 Setup error in ${logName}: ${error.message}`);
            reject(error);
        }
    });
}

async function AskOllama(prompt, log = true) {
    if(log) {
        return await askOllamaAndLog(prompt);
    }
    else {
        return await askOllamaAsync(prompt);
    }
}

module.exports = {
    AskOllama,
};