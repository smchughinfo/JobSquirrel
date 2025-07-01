const fs = require('fs');
const path = require('path');
const { AskAssistant, CreateVectorStore } = require('./llm/openai');
const { AskClaude } = require('./llm/anthropic');
const { eventBroadcaster } = require('./eventBroadcaster');
const { getResumeDataDirectory, getCustomResumeInstructions, getResumePersonalInformation, getSaveSessionIdInstructionsTemplatePath, getSessionIdData } = require('./jobSquirrelPaths');
const { addOrUpdateNutNote } = require('./hoard');

const RESUME_CLAMP_CLAUSE = `Do not include any preamble, commentary, or code block formatting. Output only the final html content, nothing else.`;

async function generateResume(nutNote) {
    await generateResumeAnthropic(nutNote);
}

async function generateCoverLetter(nutNote) {
    await generateCoverLetterAnthropic(nutNote);
}

async function generateResumeOpenAI(nutNote) {
    const prompt = `Use the provided files to generate a tailored resume for this job description. Output your result as html. ${RESUME_CLAMP_CLAUSE}\n\n"${nutNote.markdown}".`;
    let response = await AskAssistant(prompt, true);
    nutNote.html = response;
    addOrUpdateNutNote(nutNote);
    console.log("resume generated!");
}

function generateSessionData() {
    let sessionIdData = getSessionIdData();

    let sessionIdsDir = path.dirname(sessionIdData.sessionIdPath);
    if (!fs.existsSync(sessionIdsDir)) {
        fs.mkdirSync(sessionIdsDir, { recursive: true });
    }

    let templatePath = getSaveSessionIdInstructionsTemplatePath();
    let instructions = fs.readFileSync(templatePath).toString();
    instructions = instructions.replace("[SESSION ID PATH]", sessionIdData.sessionIdPath);
    fs.writeFileSync(sessionIdData.sessionIdInstructionsPath, instructions);
    return sessionIdData;
}

async function generateResumeAnthropic(nutNote) {
    let sessionData = generateSessionData();

    fs.writeFileSync(sessionData.jobListingPath, nutNote.markdown);

    let resumeCustomInstructionsPath = getCustomResumeInstructions(true);
    let resumePersonalInformationPath = getResumePersonalInformation(true);
    let resumeDataDirectory = getResumeDataDirectory(true);

    let prompt = `Use the files provided in '${resumeDataDirectory}' to generate a tailored resume for the job listing in '${sessionData.jobListingPathWSL}'.`;
    prompt += ` Output the resume as html to '${sessionData.workingResumePathWSL}'.`;
    prompt += ` Make sure to follow all instructions in '${resumeCustomInstructionsPath}' when generating the resume.`;
    prompt += ` Use '${resumePersonalInformationPath}' as your canonical source of contact information.`;
    prompt += ` Upon completion save your current session id to a file by following these instructions: '${sessionData.sessionIdInstructionsPathWSL}'`;

    await AskClaude(prompt);
    let response = fs.readFileSync(sessionData.workingResumePath).toString();

    sessionData.sessionId = fs.readFileSync(sessionData.sessionIdPath).toString();
    nutNote.sessionData.push(sessionData);

    // Initialize html as array if it doesn't exist or append to existing array
    if (!nutNote.html) {
        nutNote.html = [];
    } else if (!Array.isArray(nutNote.html)) {
        // Convert string to array (shouldn't happen per user's note, but safety check)
        nutNote.html = [nutNote.html];
    }

    // save the resume now so it's available in the ui while we are waiting on the cover letter
    nutNote.html.push(response);
    addOrUpdateNutNote(nutNote);
    console.log("resume generated!");
}

async function doubleCheckResume(nutNote, resumeIndex) {
    let sessionData = generateSessionData();

    let resumeCustomInstructionsPath = getCustomResumeInstructions(true);
    let resumePersonalInformationPath = getResumePersonalInformation(true);
    let resumeDataDirectory = getResumeDataDirectory(true);

    fs.writeFileSync(sessionData.workingResumePath, nutNote.html[resumeIndex]);

    let fixPrompt = `The resume at '${sessionData.workingResumePathWSL}' was supposed to be generated according to this guidelines file: '${resumeCustomInstructionsPath}'.\n\n`;
    fixPrompt += ` However the user has requested a review. Can you please double check that the resume is in compliance with the guidelines file.`;
    fixPrompt += ` Save the new, compliant, resume to '${sessionData.doubleCheckedResumePathWSL}'.`;
    fixPrompt += ` Use '${resumeDataDirectory}' to backfill or correct any information on the resume and '${resumePersonalInformationPath}' as your canonical source of contact information.`;
    fixPrompt += ` Upon completion save your current session id to a file by following these instructions: '${sessionData.sessionIdInstructionsPathWSL}'`;

    await AskClaude(fixPrompt);
    let response = fs.readFileSync(sessionData.doubleCheckedResumePath).toString();
    sessionData.sessionId = fs.readFileSync(sessionData.sessionIdPath).toString();

    nutNote.html.push(response);
    nutNote.sessionData.push(sessionData);
    addOrUpdateNutNote(nutNote);
    console.log("resume double checked!");
}

async function generateCoverLetterAnthropic(nutNote) {
    let sessionData = generateSessionData();

    fs.writeFileSync(sessionData.jobListingPath, nutNote.markdown);

    let resumeCustomInstructionsPath = getCustomResumeInstructions(true);
    let resumePersonalInformationPath = getResumePersonalInformation(true);
    let resumeDataDirectory = getResumeDataDirectory(true);

    let prompt = `Use the provided files in '${resumeDataDirectory}' to generate a tailored cover letter for the job listing in '${sessionData.jobListingPathWSL}'.`;
    prompt += ` Make sure to follow all instructions in '${resumeCustomInstructionsPath}' that are relevant for writing a cover letter.`;
    prompt += ` Use '${resumePersonalInformationPath}' as your canonical source for contact information.`;
    prompt += ` Save the cover letter to '${sessionData.coverLetterPathWSL}'`;
    prompt += ` Upon completion save your current session id to a file by following these instructions: '${sessionData.sessionIdInstructionsPathWSL}'`;

    await AskClaude(prompt);
    let response = fs.readFileSync(sessionData.coverLetterPath).toString();
    
    sessionData.sessionId = fs.readFileSync(sessionData.sessionIdPath).toString();

    nutNote.coverLetter.push(response);
    nutNote.sessionData.push(sessionData);
    addOrUpdateNutNote(nutNote);
    console.log("cover letter generated!");
}

async function remixCoverLetterAnthropic(nutNote, remixInstructions, remixIndex) {
    let sessionData = generateSessionData();

    fs.writeFileSync(sessionData.jobListingPath, nutNote.markdown);
    fs.writeFileSync(sessionData.remixCoverLetterPath, nutNote.coverLetter[remixIndex]);
    fs.writeFileSync(sessionData.remixCoverLetterInstructionsPath, remixInstructions);

    let resumeCustomInstructionsPath = getCustomResumeInstructions(true);
    let resumePersonalInformationPath = getResumePersonalInformation(true);
    let resumeDataDirectory = getResumeDataDirectory(true);

    let prompt = `Remix this cover letter '${sessionData.remixCoverLetterPathWSL}' according to these instructions: '${sessionData.remixCoverLetterInstructionsPathWSL}' for this job listing '${sessionData.jobListingPathWSL}'`;
    prompt += ` Use the files in '${resumeDataDirectory}' as your source of information about the job candidate.`;
    prompt += ` Make sure to follow all instructions in '${resumeCustomInstructionsPath}' that are relevant for writing a cover letter.`;
    prompt += ` Use '${resumePersonalInformationPath}' as your canonical source for contact information.`;
    prompt += ` Save the new, remixed, cover letter to '${sessionData.remixCoverLetterPathWSL}'.`;
    prompt += ` Upon completion save your current session id to a file by following these instructions: '${sessionData.sessionIdInstructionsPathWSL}'`;

    await AskClaude(prompt);
    let response = fs.readFileSync(sessionData.remixCoverLetterPath).toString();
    sessionData.sessionId = fs.readFileSync(sessionData.sessionIdPath).toString();

    nutNote.coverLetter.push(response);
    nutNote.sessionData.push(sessionData);
    addOrUpdateNutNote(nutNote);
    console.log("cover letter remixed!");
}

async function doubleCheckCoverLetterAnthropic(nutNote, coverLetterIndex) {
    let sessionData = generateSessionData();

    let resumeCustomInstructionsPath = getCustomResumeInstructions(true);
    let resumePersonalInformationPath = getResumePersonalInformation(true);
    let resumeDataDirectory = getResumeDataDirectory(true);

    fs.writeFileSync(sessionData.coverLetterPath, nutNote.coverLetter[coverLetterIndex]);

    let fixPrompt = `The cover letter at '${sessionData.coverLetterPathWSL}' was supposed to be generated according to this guidelines file: '${resumeCustomInstructionsPath}'.\\n\\n`;
    fixPrompt += ` However the user has requested a review. Can you please double check that the cover letter is in compliance with the guidelines file.`;
    fixPrompt += ` Save the new, compliant, cover letter to '${sessionData.doubleCheckedCoverLetterPathWSL}'.`;
    fixPrompt += ` Use '${resumeDataDirectory}' to backfill or correct any information on the cover letter and '${resumePersonalInformationPath}' as your canonical source of contact information.`;
    fixPrompt += ` Upon completion save your current session id to a file by following these instructions: '${sessionData.sessionIdInstructionsPathWSL}'`;

    await AskClaude(fixPrompt);
    let response = fs.readFileSync(sessionData.doubleCheckedCoverLetterPath).toString();
    sessionData.sessionId = fs.readFileSync(sessionData.sessionIdPath).toString();

    nutNote.coverLetter.push(response);
    nutNote.sessionData.push(sessionData);
    addOrUpdateNutNote(nutNote);
    console.log("cover letter double checked!");
}

async function remixResumeAnthropic(nutNote, remixInstructions, remixIndex) {
    let sessionData = generateSessionData();

    fs.writeFileSync(sessionData.jobListingPath, nutNote.markdown);
    fs.writeFileSync(sessionData.remixResumePath, nutNote.html[remixIndex]);
    fs.writeFileSync(sessionData.remixResumeInstructionsPath, remixInstructions);

    let resumeCustomInstructionsPath = getCustomResumeInstructions(true);
    let resumePersonalInformationPath = getResumePersonalInformation(true);
    let resumeDataDirectory = getResumeDataDirectory(true);

    let prompt = `Remix this resume '${sessionData.remixResumePathWSL}' according to these instructions: '${sessionData.remixResumeInstructionsPathWSL}' for this job listing '${sessionData.jobListingPathWSL}'`;
    prompt += ` Use the files in '${resumeDataDirectory}' as your source of information about the job candidate.`;
    prompt += ` Make sure to follow all instructions in '${resumeCustomInstructionsPath}'.`;
    prompt += ` Use '${resumePersonalInformationPath}' as your canonical source for contact information.`;
    prompt += ` Save the new, remixed, resume to '${sessionData.remixResumePathWSL}'.`;
    prompt += ` Upon completion save your current session id to a file by following these instructions: '${sessionData.sessionIdInstructionsPathWSL}'`;

    await AskClaude(prompt);
    let response = fs.readFileSync(sessionData.remixResumePath).toString();
    sessionData.sessionId = fs.readFileSync(sessionData.sessionIdPath).toString();

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
    generateCoverLetter,
    remixResumeAnthropic,
    remixCoverLetterAnthropic,
    doubleCheckResume,
    doubleCheckCoverLetterAnthropic,
    UploadResumeData
};