const fs = require('fs');
const path = require('path');
const { AskAssistant, CreateVectorStore } = require('./llm/openai');
const { AskClaude } = require('./llm/anthropic');
const { eventBroadcaster } = require('./eventBroadcaster');
const { getResumeDataDirectory, getResumePersonalInformation } = require('./jobSquirrelPaths');
const { addOrUpdateNutNote } = require('./hoard');

const RESUME_CLAMP_CLAUSE = `Do not include any preamble, commentary, or code block formatting. Output only the final html content, nothing else.`;
const COVER_LATTER_CLAMP_CLAUDE = `Do not include any preamble, commentary, or code block formatting. Output only the cover letter itself, nothing else.`;

async function generateResume(nutNote) {
    await generateResumeAnthropic(nutNote);
}

async function generateResumeOpenAI(nutNote) {
    const prompt = `Use the provided files to generate a tailored resume for this job description. Output your result as html. ${RESUME_CLAMP_CLAUSE}\n\n"${nutNote.markdown}".`;
    let response = await AskAssistant(prompt, true);
    nutNote.html = response;
    addOrUpdateNutNote(nutNote);
    console.log("resume generated!");
}

async function generateResumeAnthropic(nutNote) {
    let jobListingPath = "/AcornDepot/Stashboard/job-listing.md";
    fs.writeFileSync("c:/users/seanm/desktop/jobsquirrel" + jobListingPath, nutNote.markdown);

    let resumeCustomInstructionsPath = getResumeDataDirectory(true);
    let resumePersonalInformationPath = getResumePersonalInformation(true);

    let prompt = `Use the provided files in /ResumeData to generate a tailored resume for the job listing in ${jobListingPath}.`;
    prompt += ` Make sure to follow all instructions in '${resumeCustomInstructionsPath}'.`;
    prompt += ` Use '${resumePersonalInformationPath}' as your canonical source for contact information.`;
    prompt += ` ${RESUME_CLAMP_CLAUSE}`;

    let response = await AskClaude(prompt);
    response = response.substring(response.indexOf("<"));
    response = response.substring(0, response.lastIndexOf(">") + 1);

    // Initialize html as array if it doesn't exist or append to existing array
    if (!nutNote.html) {
        nutNote.html = [];
    } else if (!Array.isArray(nutNote.html)) {
        // Convert string to array (shouldn't happen per user's note, but safety check)
        nutNote.html = [nutNote.html];
    }
    
    nutNote.coverLetter = await generateCoverLetterAnthropic(jobListingPath, resumePersonalInformationPath);

    // Append new resume to array
    nutNote.html.push(response);
    
    addOrUpdateNutNote(nutNote);
    console.log("resume generated!");
}

async function generateCoverLetterAnthropic(jobListingPath) {
    let resumeCustomInstructionsPath = getResumeDataDirectory(true);
    let resumePersonalInformationPath = getResumePersonalInformation(true);

    let prompt = `Use the provided files in /ResumeData to generate a tailored cover letter for the job listing in ${jobListingPath}.`;
    prompt += ` Make sure to follow all instructions in '${resumeCustomInstructionsPath}' that are relevent for writing a cover letter.`;
    prompt += ` Use '${resumePersonalInformationPath}' as your canonical source for contact information.`;
    prompt += ` Output your response in plain text.`;
    prompt += ` ${COVER_LATTER_CLAMP_CLAUDE}`;

    let response = await AskClaude(prompt);
    return response;
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