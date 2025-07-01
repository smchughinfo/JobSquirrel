const path = require('path');
const { generateUUID } = require('./utilities');

function getJobSquirrelRootDirectory(wsl = false) {
    let rootDir = path.join(__dirname, "..", "..", "..");
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

function getSessionIdData(wsl) {
    let rootDir = getJobSquirrelRootDirectory();
    let uid = generateUUID();
    let sessionIdsDir =  path.join(rootDir, `SessionIdS`);
    let sessionIdPath = path.join(sessionIdsDir, `session-id-${uid}.txt`);
    let sessionIdInstructionsPath = path.join(sessionIdsDir, `save-session-id-${uid}-instructions.txt`);
    let workingResumePath = path.join(sessionIdsDir, `working-resume-${uid}.html`);
    let doubleCheckedResumePath = path.join(sessionIdsDir, `double-checked-resume-${uid}.html`);
    let coverLetterPath = path.join(sessionIdsDir, `cover-letter-${uid}.txt`);
    let jobListingPath = path.join(rootDir, "Stashboard", `job-listing-${uid}.md`);
    let remixResumePath = path.join(rootDir, "Stashboard", `remix-resume-${uid}.html`);
    let remixResumeInstructionsPath = path.join(rootDir, "Stashboard", `remix-resume-instructions-${uid}'.txt`);

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
        jobListingPath: jobListingPath,
        jobListingPathWSL: convertPathToWSL(jobListingPath),
        coverLetterPathWSL: convertPathToWSL(coverLetterPath),
        remixResumePath: remixResumePath,
        remixResumePathWSL: convertPathToWSL(remixResumePath),
        remixResumeInstructionsPath: remixResumeInstructionsPath,
        remixResumeInstructionsPathWSL: convertPathToWSL(remixResumeInstructionsPath)
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
    getSessionIdData,
    convertPathToWSL
};