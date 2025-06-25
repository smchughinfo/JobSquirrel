const { spawn } = require('child_process');

/**
 * Runs a command and streams output via Server-Sent Events
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object  
 * @param {string} command - Command to execute
 * @param {Array} args - Command arguments
 * @param {Object} options - Spawn options (optional)
 */
function runCommandWithStreaming(req, res, command, args = [], options = {}) {
    console.log(`🐿️ Running command: ${command} ${args.join(' ')}`);
    
    // Set headers for Server-Sent Events
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
    });

    // Send initial message
    res.write(`data: {"type":"start","message":"Starting ${escape(command)}..."}\n\n`);

    // Spawn the process
    const childProcess = spawn(command, args, options);
    
    childProcess.stdout.on('data', (data) => {
        const output = data.toString().trim();
        console.log(`${command} stdout: ${output}`);
        res.write(`data: {"type":"stdout","message":"${escape(output)}"}\n\n`);
    });

    childProcess.stderr.on('data', (data) => {
        const output = data.toString().trim();
        console.log(`${command} stderr: ${output}`);
        res.write(`data: {"type":"stderr","message":"${escape(output)}"}\n\n`);
    });

    childProcess.on('close', (code) => {
        console.log(`🐿️ ${command} process exited with code ${code}`);
        res.write(`data: {"type":"end","message":"${escape(command)} finished with code ${code}","code":${code}}\n\n`);
        res.end();
    });

    // Handle client disconnect
    req.on('close', () => {
        console.log(`Client disconnected, killing ${command} process`);
        childProcess.kill();
    });

    return childProcess;
}

/**
 * Escapes special characters for JSON and strips ANSI escape sequences
 */
function escape(str) {
    return str
        // Strip ANSI escape sequences (colors, cursor movement, etc.)
        .replace(/\x1b\[[0-9;]*[mGKHF]?/g, '')
        // Strip other control characters except newlines/carriage returns we want to keep
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        // JSON escape the remaining characters
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r');
}

module.exports = {
    runCommandWithStreaming
};