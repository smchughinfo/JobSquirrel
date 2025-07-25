const path = require('path');
const { generateUUID } = require('./utilities');

function getJobSquirrelRootDirectory(wsl = false) {
    let rootDir = path.join(__dirname, "..", "..");
    if(wsl) {
        rootDir = convertPathToWSL(rootDir);
    }
    return rootDir;
}

let getHoardPath = (wsl) => getJobSquirrelPath(wsl, ["Stashboard", "hoard.json"]);
let getResumeDataDirectory = (wsl) => getJobSquirrelPath(wsl, ["Config", "ResumeData"]);
let getCustomResumeInstructions = (wsl) => getJobSquirrelPath(wsl, ["Config", "custom-resume-instructions.txt"]);
let getResumePersonalInformation = (wsl) => getJobSquirrelPath(wsl, ["Config", "personal-information.txt"]);
let getSaveSessionIdInstructionsTemplatePath = (wsl) => getJobSquirrelPath(wsl, ["ScriptsForClaude", "save-session-id-instructions-template.txt"]);
let getQueueDirectory = (wsl) => getJobSquirrelPath(wsl, ["Stashboard", "queue"]);
let getResumeTemplatesDirectory = (wsl) => getJobSquirrelPath(wsl, ["Stashboard", "static"]);
let getATSAddOnSkillsPath = (wsl) => getJobSquirrelPath(wsl, ["Stashboard", "ats-add-on-skills.json"]);
let getResumeJSONPath = (wsl) => getJobSquirrelPath(wsl, ["Config", "ResumeData", 'resume.json']);

function getSessionIdData(wsl) {
    let rootDir = getJobSquirrelRootDirectory();
    let uid = generateUUID();
    let sessionIdsDir =  path.join(rootDir, `Cache`);
    let sessionIdPath = path.join(sessionIdsDir, `session-id-${uid}.txt`);
    let sessionIdInstructionsPath = path.join(sessionIdsDir, `save-session-id-${uid}-instructions.txt`);
    let workingResumePath = path.join(sessionIdsDir, `working-resume-${uid}.html`);
    let doubleCheckedResumePath = path.join(sessionIdsDir, `double-checked-resume-${uid}.html`);
    let doubleCheckedCoverLetterPath = path.join(sessionIdsDir, `double-checked-cover-letter-${uid}.txt`);
    let coverLetterPath = path.join(sessionIdsDir, `cover-letter-${uid}.txt`);
    let jobListingPath = path.join(sessionIdsDir, `job-listing-${uid}.md`);
    let remixResumePath = path.join(sessionIdsDir, `remix-resume-${uid}.html`);
    let remixCoverLetterPath = path.join(sessionIdsDir, `remix-cover-letter-${uid}.txt`);
    let remixResumeInstructionsPath = path.join(sessionIdsDir, `remix-resume-instructions-${uid}.txt`);
    let remixCoverLetterInstructionsPath = path.join(sessionIdsDir, `remix-cover-letter-instructions-${uid}.txt`);
    
    if(wsl) {
        sessionIdPath = convertPathToWSL(sessionIdPath);
    }
    return {
        sessionIdPath: sessionIdPath,
        fileUID: uid,
        sessionIdInstructionsPath: sessionIdInstructionsPath,
        sessionIdInstructionsPathWSL: convertPathToWSL(sessionIdInstructionsPath),
        workingResumePath: workingResumePath,
        workingResumePathWSL: convertPathToWSL(workingResumePath),
        coverLetterPath: coverLetterPath,
        doubleCheckedResumePath: doubleCheckedResumePath,
        doubleCheckedResumePathWSL: convertPathToWSL(doubleCheckedResumePath),
        doubleCheckedCoverLetterPath: doubleCheckedCoverLetterPath,
        doubleCheckedCoverLetterPathWSL: convertPathToWSL(doubleCheckedCoverLetterPath),
        jobListingPath: jobListingPath,
        jobListingPathWSL: convertPathToWSL(jobListingPath),
        coverLetterPathWSL: convertPathToWSL(coverLetterPath),
        remixResumePath: remixResumePath,
        remixResumePathWSL: convertPathToWSL(remixResumePath),
        remixCoverLetterPath: remixCoverLetterPath,
        remixCoverLetterPathWSL: convertPathToWSL(remixCoverLetterPath),
        remixResumeInstructionsPath: remixResumeInstructionsPath,
        remixResumeInstructionsPathWSL: convertPathToWSL(remixResumeInstructionsPath),
        remixCoverLetterInstructionsPath: remixCoverLetterInstructionsPath,
        remixCoverLetterInstructionsPathWSL: convertPathToWSL(remixCoverLetterInstructionsPath),
    }
}

function convertPathToWSL(windowPath) {
    return windowPath.replace(/\\/g, '/').replace(/^([A-Z]):/, (match, drive) => `/mnt/${drive.toLowerCase()}`);
}

function getJobSquirrelPath(wsl, pathArray) {
    let rootDir = getJobSquirrelRootDirectory();
    let fullPath = path.join(rootDir, ...pathArray); 
    if(wsl) {
        fullPath = convertPathToWSL(fullPath);
    }
    return fullPath;
}

function getResumePDFPath(companyName) {
    const filename = `Sean McHugh - ${companyName}.pdf`;
    const rootDir = getJobSquirrelRootDirectory();
    const pdfPath = path.join(rootDir, 'GeneratedResumes', filename);
    return pdfPath;
}

function getCoverLetterPath(companyName) {
    const filename = `Sean McHugh - ${companyName}.txt`;
    const rootDir = getJobSquirrelRootDirectory();
    const pdfPath = path.join(rootDir, 'GeneratedResumes', filename);
    return pdfPath;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////
/////// PERHAPS DEPRECATED //////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////

// for OpenAI resume generation. reason for possible deprecation is claude code does a better job at generating resumes, at least with the way this application is written
function getResumeDataVectorStoreIdPath(wsl) {
    let rootDir = getJobSquirrelRootDirectory();
    let vectorStoreIdPath = path.join(rootDir, "Stashboard", "resume-data-vector-store-id.txt");
    if(wsl) {
        vectorStoreIdPath = convertPathToWSL(vectorStoreIdPath);
    }
    return vectorStoreIdPath;
}

module.exports = {
    getJobSquirrelRootDirectory,
    getHoardPath,
    getResumeDataDirectory,
    getResumeDataVectorStoreIdPath,
    getCustomResumeInstructions,
    getResumePersonalInformation,
    getSaveSessionIdInstructionsTemplatePath,
    getQueueDirectory,
    getSessionIdData,
    getResumePDFPath,
    getCoverLetterPath,
    getResumeTemplatesDirectory,
    getResumeJSONPath,
    getATSAddOnSkillsPath,
    convertPathToWSL
};