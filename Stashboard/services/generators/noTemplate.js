const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { AskAssistant, CreateVectorStore } = require('../llm/openai');
const { AskClaude } = require('../llm/anthropic');
const { eventBroadcaster } = require('../eventBroadcaster');
const { embedHiddenText } = require('../htmlUtilities');
const { getResumeDataDirectory, getCustomResumeInstructions, getResumePersonalInformation, getJobSquirrelRootDirectory, convertPathToWSL, getCoverLetterPath } = require('../jobSquirrelPaths');
const { addOrUpdateNutNote } = require('../hoard');
const { generateSessionData } = require('./common');

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

async function useStaticResume(nutNote) {
    let sessionData = generateSessionData();

    fs.writeFileSync(sessionData.jobListingPath, nutNote.markdown);

    let response = "USING STATIC RESUME";

    sessionData.sessionId = "STATIC";
    nutNote.sessionData.push(sessionData);

    nutNote.html.push(response);
    addOrUpdateNutNote(nutNote);
    console.log("resume generated!");
}

async function generateResumeAnthropic(nutNote) {
    let sessionData = generateSessionData();

    fs.writeFileSync(sessionData.jobListingPath, nutNote.markdown);

    let resumeCustomInstructionsPath = getCustomResumeInstructions(true);
    let resumePersonalInformationPath = getResumePersonalInformation(true);
    let resumeDataDirectory = getResumeDataDirectory(true);

    let prompt = `Use the files provided in '${resumeDataDirectory}' to generate a tailored resume for the job listing in '${sessionData.jobListingPathWSL}'. Only include skills found in '${resumeDataDirectory}' to generate the resume.`;
    prompt += ` Output the resume as html to '${sessionData.workingResumePathWSL}'.`;
    prompt += ` Make sure to follow all instructions in '${resumeCustomInstructionsPath}' when generating the resume.`;
    prompt += ` Use '${resumePersonalInformationPath}' as your canonical source of contact information. In other words, no matter what name, email, phone number, personal url, etc. that you encounter in '${resumeDataDirectory}' use the values from '${resumePersonalInformationPath}' when generating your output.`;
    prompt += ` Upon completion save your current session id to a file by following these instructions: '${sessionData.sessionIdInstructionsPathWSL}'`;

    await AskClaude(prompt);
    let response = fs.readFileSync(sessionData.workingResumePath).toString();

    sessionData.sessionId = fs.readFileSync(sessionData.sessionIdPath).toString();
    nutNote.sessionData.push(sessionData);

    response = embedHiddenText(response, "Job Listing used by JobSquirrel to tailor resume: " + nutNote.markdown);

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
    fixPrompt += ` Only include skills found in '${resumeDataDirectory}' to generate the resume.`;
    fixPrompt += ` Save the new, compliant, resume to '${sessionData.doubleCheckedResumePathWSL}'.`;
    fixPrompt += ` Use '${resumeDataDirectory}' to backfill or correct any information on the resume and '${resumePersonalInformationPath}' as your canonical source of contact information. In other words, no matter what name, email, phone number, personal url, etc. that you encounter in '${resumeDataDirectory}' use the values from '${resumePersonalInformationPath}' when generating your output.`;
    fixPrompt += ` Upon completion save your current session id to a file by following these instructions: '${sessionData.sessionIdInstructionsPathWSL}'`;

    await AskClaude(fixPrompt);
    let response = fs.readFileSync(sessionData.doubleCheckedResumePath).toString();
    sessionData.sessionId = fs.readFileSync(sessionData.sessionIdPath).toString();

    response = embedHiddenText(response, "Job Listing used by JobSquirrel to tailor resume: " + nutNote.markdown);

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

    let prompt = `Use the provided files in '${resumeDataDirectory}' to generate a tailored cover letter for the job listing in '${sessionData.jobListingPathWSL}'. Only include skills found in '${resumeDataDirectory}' to generate the cover letter.`;
    prompt += ` Make sure to follow all instructions in '${resumeCustomInstructionsPath}' that are relevant for writing a cover letter.`;
    prompt += ` Use '${resumePersonalInformationPath}' as your canonical source for contact information. In other words, no matter what name, email, phone number, personal url, etc. that you encounter in '${resumeDataDirectory}' use the values from '${resumePersonalInformationPath}' when generating your output.`;
    prompt += ` Save the cover letter to '${sessionData.coverLetterPathWSL}'`;
    prompt += ` Upon completion save your current session id to a file by following these instructions: '${sessionData.sessionIdInstructionsPathWSL}'`;

    await AskClaude(prompt);
    let response = fs.readFileSync(sessionData.coverLetterPath).toString();
    
    sessionData.sessionId = fs.readFileSync(sessionData.sessionIdPath).toString();

    fs.writeFileSync(getCoverLetterPath(nutNote.company), response);
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

    let prompt = `Remix this cover letter '${sessionData.remixCoverLetterPathWSL}' according to these instructions: '${sessionData.remixCoverLetterInstructionsPathWSL}' for this job listing '${sessionData.jobListingPathWSL}'. Only include skills found in '${resumeDataDirectory}' to generate the cover letter`;
    prompt += ` Use the files in '${resumeDataDirectory}' as your source of information about the job candidate.`;
    prompt += ` Make sure to follow all instructions in '${resumeCustomInstructionsPath}' that are relevant for writing a cover letter.`;
    prompt += ` Use '${resumePersonalInformationPath}' as your canonical source for contact information. In other words, no matter what name, email, phone number, personal url, etc. that you encounter in '${resumeDataDirectory}' use the values from '${resumePersonalInformationPath}' when generating your output.`;
    prompt += ` Save the new, remixed, cover letter to '${sessionData.remixCoverLetterPathWSL}'.`;
    prompt += ` Upon completion save your current session id to a file by following these instructions: '${sessionData.sessionIdInstructionsPathWSL}'`;

    await AskClaude(prompt);
    let response = fs.readFileSync(sessionData.remixCoverLetterPath).toString();
    sessionData.sessionId = fs.readFileSync(sessionData.sessionIdPath).toString();

    fs.writeFileSync(getCoverLetterPath(nutNote.company), response);
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
    fixPrompt += ` Only include skills found in '${resumeDataDirectory}' to generate the cover letter`;
    fixPrompt += ` Save the new, compliant, cover letter to '${sessionData.doubleCheckedCoverLetterPathWSL}'.`;
    fixPrompt += ` Use '${resumeDataDirectory}' to backfill or correct any information on the cover letter and '${resumePersonalInformationPath}' as your canonical source of contact information. In other words, no matter what name, email, phone number, personal url, etc. that you encounter in '${resumeDataDirectory}' use the values from '${resumePersonalInformationPath}' when generating your output.`;
    fixPrompt += ` Upon completion save your current session id to a file by following these instructions: '${sessionData.sessionIdInstructionsPathWSL}'`;

    await AskClaude(fixPrompt);
    let response = fs.readFileSync(sessionData.doubleCheckedCoverLetterPath).toString();
    sessionData.sessionId = fs.readFileSync(sessionData.sessionIdPath).toString();

    fs.writeFileSync(getCoverLetterPath(nutNote.company), response);
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
    prompt += ` Use the files in '${resumeDataDirectory}' as your source of information about the job candidate. Only include skills found in '${resumeDataDirectory}' to generate the resume`;
    prompt += ` Make sure to follow all instructions in '${resumeCustomInstructionsPath}'.`;
    prompt += ` Use '${resumePersonalInformationPath}' as your canonical source for contact information. In other words, no matter what name, email, phone number, personal url, etc. that you encounter in '${resumeDataDirectory}' use the values from '${resumePersonalInformationPath}' when generating your output.`;
    prompt += ` Save the new, remixed, resume to '${sessionData.remixResumePathWSL}'.`;
    prompt += ` Upon completion save your current session id to a file by following these instructions: '${sessionData.sessionIdInstructionsPathWSL}'`;

    await AskClaude(prompt);
    let response = fs.readFileSync(sessionData.remixResumePath).toString();
    sessionData.sessionId = fs.readFileSync(sessionData.sessionIdPath).toString();

    response = embedHiddenText(response, "Job Listing used by JobSquirrel to tailor resume: " + nutNote.markdown);

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

async function processPDFsInResumeData() {
    const resumeDataDirectory = getResumeDataDirectory();
    const cacheDirectory = path.join(getJobSquirrelRootDirectory(), 'Cache');
    
    console.log(`📄 Starting PDF processing in ResumeData directory: ${resumeDataDirectory}`);
    
    // Ensure cache directory exists
    if (!fs.existsSync(cacheDirectory)) {
        fs.mkdirSync(cacheDirectory, { recursive: true });
        console.log(`📁 Created cache directory: ${cacheDirectory}`);
    }
    
    // Ensure resume data directory exists
    if (!fs.existsSync(resumeDataDirectory)) {
        console.log(`⚠️ ResumeData directory does not exist: ${resumeDataDirectory}`);
        return;
    }
    
    try {
        // Read all files in the ResumeData directory
        const files = fs.readdirSync(resumeDataDirectory);
        const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));
        
        if (pdfFiles.length === 0) {
            console.log(`📄 No PDF files found in ResumeData directory`);
            return;
        }
        
        console.log(`📄 Found ${pdfFiles.length} PDF file(s) to process: ${pdfFiles.join(', ')}`);
        
        for (const pdfFile of pdfFiles) {
            const pdfPath = path.join(resumeDataDirectory, pdfFile);
            const baseName = path.basename(pdfFile, '.pdf');
            const txtFileName = `${baseName}.txt`;
            const txtPath = path.join(resumeDataDirectory, txtFileName);
            const cachePdfPath = path.join(cacheDirectory, pdfFile);
            
            try {
                console.log(`📄 Processing: ${pdfFile}`);
                
                // Convert PDF to text using pdftotext via WSL
                console.log(`🔄 Converting PDF to text: ${pdfFile} → ${txtFileName}`);
                
                // Convert Windows paths to WSL paths for the command
                const wslPdfPath = convertPathToWSL(pdfPath);
                const wslTxtPath = convertPathToWSL(txtPath);
                
                // Execute pdftotext via WSL
                const wslCommand = `wsl -e bash -c "pdftotext '${wslPdfPath}' '${wslTxtPath}'"`;
                execSync(wslCommand, { encoding: 'utf8' });
                
                // Verify text file was created and has content
                if (fs.existsSync(txtPath)) {
                    const txtContent = fs.readFileSync(txtPath, 'utf8');
                    if (txtContent.trim().length > 0) {
                        console.log(`✅ Successfully extracted text (${txtContent.length} characters): ${txtFileName}`);
                    } else {
                        console.log(`⚠️ Text file created but appears empty: ${txtFileName}`);
                    }
                } else {
                    throw new Error('Text file was not created');
                }
                
                // Copy PDF to cache directory
                console.log(`📁 Copying PDF to cache: ${pdfFile}`);
                fs.copyFileSync(pdfPath, cachePdfPath);
                console.log(`✅ PDF copied to cache: ${cachePdfPath}`);
                
                // Delete original PDF from ResumeData directory
                console.log(`🗑️ Removing original PDF from ResumeData: ${pdfFile}`);
                fs.unlinkSync(pdfPath);
                console.log(`✅ Original PDF deleted: ${pdfPath}`);
                
                // Broadcast success event
                eventBroadcaster.systemStatus('pdf-processed', `Successfully processed PDF: ${pdfFile} → ${txtFileName}`);
                
            } catch (error) {
                console.error(`❌ Error processing PDF ${pdfFile}:`, error.message);
                
                // Cleanup on error - remove any partially created text file
                if (fs.existsSync(txtPath)) {
                    try {
                        fs.unlinkSync(txtPath);
                        console.log(`🧹 Cleaned up partial text file: ${txtPath}`);
                    } catch (cleanupError) {
                        console.error(`❌ Error cleaning up text file: ${cleanupError.message}`);
                    }
                }
                
                // Broadcast error event
                eventBroadcaster.systemStatus('error', `Failed to process PDF: ${pdfFile} - ${error.message}`);
            }
        }
        
        console.log(`📄 PDF processing completed. Processed ${pdfFiles.length} file(s).`);
        eventBroadcaster.systemStatus('pdf-processing-complete', `Finished processing ${pdfFiles.length} PDF file(s)`);
        
    } catch (error) {
        console.error(`❌ Error during PDF processing:`, error.message);
        eventBroadcaster.systemStatus('error', `PDF processing failed: ${error.message}`);
    }
}

module.exports = {
    generateResume,
    generateCoverLetter,
    useStaticResume,
    remixResumeAnthropic,
    remixCoverLetterAnthropic,
    doubleCheckResume,
    doubleCheckCoverLetterAnthropic,
    UploadResumeData,
    processPDFsInResumeData,
};