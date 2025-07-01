const fs = require('fs');
const path = require('path');
const { AskAssistant, CreateVectorStore } = require('./llm/openai');
const { AskClaude } = require('./llm/anthropic');
const { eventBroadcaster } = require('./eventBroadcaster');
const { getResumeDataDirectory, getCustomResumeInstructions, getResumePersonalInformation, getJobListingMDPath, getRemixResumePath, getRemixResumeInstructionsPath, getSaveSessionIdInstructionsTemplatePath, getSessionIdData } = require('./jobSquirrelPaths');
const { addOrUpdateNutNote } = require('./hoard');

const RESUME_CLAMP_CLAUSE = `Do not include any preamble, commentary, or code block formatting. Output only the final html content, nothing else.`;

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

async function generateResumeAnthropic(nutNote, doubleCheck = false) {
    let jobListingPath = getJobListingMDPath();
    let jobListingPathWSL = getJobListingMDPath(true);
    fs.writeFileSync(jobListingPath, nutNote.markdown);

    let resumeCustomInstructionsPath = getCustomResumeInstructions(true);
    let resumePersonalInformationPath = getResumePersonalInformation(true);

    let sessionData = generateSessionData();

    let prompt = `Use the files provided in /ResumeData to generate a tailored resume for the job listing in '${jobListingPathWSL}'.`;
    prompt += ` Output the resume as html to '${sessionData.workingResumePathWSL}'.`;
    prompt += ` Make sure to follow all instructions in '${resumeCustomInstructionsPath}' when generating the resume.`;
    prompt += ` Use '${resumePersonalInformationPath}' as your canonical source for contact information.`;
    prompt += ` Upon completion save your current session id to a file by following these instructions: '${sessionData.sessionIdInstructionsPathWSL}'`;

    await AskClaude(prompt);
    let response = fs.readFileSync(sessionData.workingResumePath).toString();

    //sessionData.sessionId = fs.readFileSync(sessionData.sessionIdPath).toString();
    nutNote.sessionData = sessionData;

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

    // now do the cover letter (only if it wasn't already created)
    if(!nutNote.coverLetter) {
        nutNote.coverLetter = await generateCoverLetterAnthropic(jobListingPath, resumePersonalInformationPath);
        addOrUpdateNutNote(nutNote);
        console.log("cover letter generated!");
    }
}

async function doubleCheckResume(nutNote) {
    let resumeCustomInstructionsPath = getCustomResumeInstructions(true);
    let resumePersonalInformationPath = getResumePersonalInformation(true);
    
    let fixPrompt = `I notice all the instructions in '${resumeCustomInstructionsPath}' were not followed.`;
    fixPrompt += ` Can you adjust '${nutNote.sessionData.workingResumePathWSL}' accordingly. When complete summarize your changes in '${nutNote.sessionData.resumeChangesPathWSL}'.`;
    fixPrompt += ` Again, use '/ResumeData' to backfill or correct any data and '${resumePersonalInformationPath}' as your canonical source for contact information.`;
    await AskClaude(fixPrompt, nutNote.sessionData.sessionId);

    let response = fs.readFileSync(nutNote.sessionData.workingResumePath).toString();
    nutNote.html.push(response);
    addOrUpdateNutNote(nutNote);
    console.log("resume double checked!");
}

async function generateCoverLetterAnthropic(nutNote, jobListingPath) {
    let resumeCustomInstructionsPath = getCustomResumeInstructions(true);
    let resumePersonalInformationPath = getResumePersonalInformation(true);

    let prompt = `Use the provided files in /ResumeData to generate a tailored cover letter for the job listing in ${jobListingPath}.`;
    prompt += ` Make sure to follow all instructions in '${resumeCustomInstructionsPath}' that are relevant for writing a cover letter.`;
    prompt += ` Use '${resumePersonalInformationPath}' as your canonical source for contact information.`;
    prompt += ` Save the cover letter to '${nutNote.sessionData.coverLetterPathWSL}'`;

    await AskClaude(prompt);
    let response = fs.readFileSync(nutNote.sessionData.coverLetterPath).toString();
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

    let resumeCustomInstructionsPath = getCustomResumeInstructions(true);
    let resumePersonalInformationPath = getResumePersonalInformation(true);

    let prompt = `Remix this resume '${remixResumePathWSL}' according to these instructions: '${remixInstructionPathWSL}' for this job listing '${jobListingPathWSL}'`;
    prompt += ` Use the files in /ResumeData as your source of information about the job candidate.`;
    prompt += ` Make sure to follow all instructions in '${resumeCustomInstructionsPath}'.`;
    prompt += ` Use '${resumePersonalInformationPath}' as your canonical source for contact information.`;

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
    UploadResumeData,
    doubleCheckResume
};