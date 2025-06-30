const fs = require('fs');
const path = require('path');
const { AskAssistant, CreateVectorStore } = require('./llm/openai');
const { AskClaude } = require('./llm/anthropic');
const { eventBroadcaster } = require('./eventBroadcaster');
const { getResumeDataDirectory } = require('./jobSquirrelPaths');
const { addOrUpdateNutNote } = require('./hoard');

const CLAMP_CLAUSE = `Do not include any preamble, commentary, or code block formatting. Output only the final html content, nothing else.`;

async function generateResume(nutNote) {
    generateResumeAnthropic(nutNote);
}

async function generateResumeOpenAI(nutNote) {
    const prompt = `Use the provided files to generate a tailored resume for this job description. ${CLAMP_CLAUSE}\n\n"${nutNote.markdown}".`;
    let response = await AskAssistant(prompt, true);
    nutNote.html = response;
    addOrUpdateNutNote(nutNote);
    console.log("resume generated!");
}

async function generateResumeAnthropic(nutNote) {
    let jobListingPath = "/AcornDepot/Stashboard/job-listing.md";
    fs.writeFileSync("c:/users/seanm/desktop/jobsquirrel" + jobListingPath, nutNote.markdown);
    const prompt = `Use the provided files in /ResumeData to generate a tailored resume for the job listing in ${jobListingPath}. ${CLAMP_CLAUSE}`;
    let response = await AskClaude(prompt, true);
    nutNote.html = response;
    addOrUpdateNutNote(nutNote);
    console.log("resume generated!");
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