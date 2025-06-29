const fs = require('fs');
const path = require('path');
const { AskAssistant, CreateVectorStore } = require('./llm/openai');
const { eventBroadcaster } = require('./eventBroadcaster');
const { getResumeDataDirectory } = require('./jobSquirrelPaths');

async function generateResume(nutNote) {
    let response = await AskAssistant("tell me about the files you see", true);
    console.log(response);
}

async function UploadResumeData() {
    let resumeDataFiles = getResumeDataFiles();
    let vectorStoreId = await CreateVectorStore(resumeDataFiles);
    return vectorStoreId;
}

function getResumeDataFiles() {
    let resumeDataDirectory = getResumeDataDirectory();
    let resumeDataFiles = fs.readdirSync(resumeDataDirectory);
    resumeDataFiles = resumeDataFiles.map(f => path.join(resumeDataDirectory, f));
    return resumeDataFiles;
}

module.exports = {
    generateResume,
    UploadResumeData
};