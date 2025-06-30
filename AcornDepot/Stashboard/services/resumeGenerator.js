const fs = require('fs');
const path = require('path');
const { AskAssistant, CreateVectorStore } = require('./llm/openai');
const { AskClaude } = require('./llm/anthropic');
const { eventBroadcaster } = require('./eventBroadcaster');
const { getResumeDataDirectory, getResumePersonalInformation, getJobListingMDPath, getRemixResumePath, getRemixResumeInstructionsPath } = require('./jobSquirrelPaths');
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
    let jobListingPath = getJobListingMDPath();
    let jobListingPathWSL = getJobListingMDPath(true);
    fs.writeFileSync(jobListingPath, nutNote.markdown);

    let resumeCustomInstructionsPath = getResumeDataDirectory(true);
    let resumePersonalInformationPath = getResumePersonalInformation(true);

    let prompt = `Use the provided files in /ResumeData to generate a tailored resume for the job listing in ${jobListingPathWSL}.`;
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
    
    // save the resume now so it's avaialale in the ui while we are waiting on the cover letter
    nutNote.html.push(response);
    addOrUpdateNutNote(nutNote);
    console.log("resume generated!");

    // now do the cover letter
    nutNote.coverLetter = await generateCoverLetterAnthropic(jobListingPath, resumePersonalInformationPath);
    addOrUpdateNutNote(nutNote);
    console.log("cover letter generated!");
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

async function remixResumeAnthropic(nutNote, remixInstructions, remixIndex) {
    let jobListingPath = getJobListingMDPath();
    let jobListingPathWSL = getJobListingMDPath(true);
    fs.writeFileSync(jobListingPath, nutNote.markdown);

    let remixResumePath = getRemixResumePath();
    let remixResumePathWSL = getRemixResumePath(true);
    fs.writeFileSync(remixResumePath, nutNote.html[remixIndex]);

    let remixInstructionPath = getRemixResumeInstructionsPath();
    let remixInstructionPathWSL = getRemixResumeInstructionsPath(true);
    fs.writeFileSync(remixInstructionPath, remixInstructions);

    let resumeCustomInstructionsPath = getResumeDataDirectory(true);
    let resumePersonalInformationPath = getResumePersonalInformation(true);

    let prompt = `Remix this resume '${remixResumePathWSL}' according to these instructions: '${remixInstructionPathWSL}' for this job listing '${jobListingPathWSL}'`;
    prompt += ` Use the files in /ResumeData as your source of information about the job candidate.`;
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
    
    // save the remixed resume
    nutNote.html.push(response);
    addOrUpdateNutNote(nutNote);
    console.log("resume remixed!");
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
    remixResumeAnthropic,
    UploadResumeData 
};