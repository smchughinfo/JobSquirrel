const fs = require('fs');
const path = require('path');
const { AskAssistant } = require('./llm/openai');
const { eventBroadcaster } = require('./eventBroadcaster');
const { getResumeDataDirectory } = require('./jobSquirrelPaths');

async function generateResume(nutNote) {
    let resumeDataFiles = getResumeDataFiles();
    let response = await AskAssistant("tell me about the files you see", resumeDataFiles);
    console.log(response);
}

function getResumeDataFiles() {
    let resumeDataDirectory = getResumeDataDirectory();
    let resumeDataFiles = fs.readdirSync(resumeDataDirectory);
    resumeDataFiles = resumeDataFiles.map(f => path.join(resumeDataDirectory, f));
    return resumeDataFiles;
}

module.exports = {
    generateResume
};