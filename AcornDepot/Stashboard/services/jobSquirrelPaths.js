const path = require('path');
const { generateUUID } = require('./utilities');

function getJobSquirrelRootDirectory(wsl = false) {
    let rootDir = path.join(__dirname, "..", "..", "..");
    if(wsl) {
        rootDir = convertPathToWSL(rootDir);
    }
    return rootDir;
}

function getAcornDepotDirectory(wsl) {
    let rootDir = getJobSquirrelRootDirectory();
    let adDir = path.join(rootDir, "AcornDepot");
    if(wsl) {
        adDir = convertPathToWSL(adDir);
    }
    return adDir;
}

function getResumeDataDirectory(wsl) {
    let rootDir = getJobSquirrelRootDirectory();
    let adDir = path.join(rootDir, "ResumeData");
    if(wsl) {
        adDir = convertPathToWSL(adDir);
    }
    return adDir;
}

function getHoardPath(wsl) {
    let adDir = getAcornDepotDirectory();
    let hoardPath = path.join(adDir, "Stashboard", "hoard.json");
    if(wsl) {
        hoardPath = convertPathToWSL(hoardPath);
    }
    return hoardPath;
}

function getResumeDataVectorStoreIdPath(wsl) {
    let adDir = getAcornDepotDirectory();
    let vectorStoreIdPath = path.join(adDir, "Stashboard", "resume-data-vector-store-id.txt");
    if(wsl) {
        vectorStoreIdPath = convertPathToWSL(vectorStoreIdPath);
    }
    return vectorStoreIdPath;
}

function getCustomResumeInstructions(wsl) {
    let rootDir = getJobSquirrelRootDirectory();
    let adDir = path.join(rootDir, "custom-resume-instructions.txt");
    if(wsl) {
        adDir = convertPathToWSL(adDir);
    }
    return adDir;
}

function getResumePersonalInformation(wsl) {
    let rootDir = getJobSquirrelRootDirectory();
    let adDir = path.join(rootDir, "personal-information.txt");
    if(wsl) {
        adDir = convertPathToWSL(adDir);
    }
    return adDir;
}

function getTempHtmlToPDFPath(wsl) {
    let rootDir = getJobSquirrelRootDirectory();
    let adDir = path.join(rootDir, "tmp-html-to-pdf.html");
    if(wsl) {
        adDir = convertPathToWSL(adDir);
    }
    return adDir;
}

function getJobListingMDPath(wsl) {
    let adDir = getAcornDepotDirectory();
    let hoardPath = path.join(adDir, "Stashboard", "job-listing.md");
    if(wsl) {
        hoardPath = convertPathToWSL(hoardPath);
    }
    return hoardPath;
}

function getRemixResumePath(wsl) {
    let adDir = getAcornDepotDirectory();
    let hoardPath = path.join(adDir, "Stashboard", "remix-resume.html");
    if(wsl) {
        hoardPath = convertPathToWSL(hoardPath);
    }
    return hoardPath;
}

function getSaveSessionIdInstructionsTemplatePath(wsl) {
    let rootDir = getJobSquirrelRootDirectory();
    let saveSessionIdPath = path.join(rootDir, `save-session-id-instructions-template.txt`);
    if(wsl) {
        saveSessionIdPath = convertPathToWSL(saveSessionIdPath);
    }
    return saveSessionIdPath;
}

function getSessionIdData(wsl) {
    let rootDir = getJobSquirrelRootDirectory();
    let uid = generateUUID();
    let sessionIdsDir =  path.join(rootDir, `SessionIdS`);
    let sessionIdPath = path.join(sessionIdsDir, `session-id-${uid}.txt`);
    let sessionIdInstructionsPath = path.join(sessionIdsDir, `save-session-id-${uid}-instructions.txt`);
    let resumeChangespath = path.join(sessionIdsDir, `resume-changed-${uid}.md`);
    let workingResumePath = path.join(sessionIdsDir, `working-resume-${uid}.html`);
    let coverLetterPath = path.join(sessionIdsDir, `cover-letter-${uid}.txt`);

    if(wsl) {
        sessionIdPath = convertPathToWSL(sessionIdPath);
    }
    return {
        sessionIdPath: sessionIdPath,
        fileUID: uid,
        sessionIdInstructionsPath: sessionIdInstructionsPath,
        sessionIdInstructionsPathWSL: convertPathToWSL(sessionIdInstructionsPath),
        resumeChangesPath: resumeChangespath,
        resumeChangesPathWSL: convertPathToWSL(resumeChangespath),
        workingResumePath: workingResumePath,
        workingResumePathWSL: convertPathToWSL(workingResumePath),
        coverLetterPath: coverLetterPath,
        coverLetterPathWSL: convertPathToWSL(coverLetterPath)
    }
}

function getRemixResumeInstructionsPath(wsl) {
    let adDir = getAcornDepotDirectory();
    let hoardPath = path.join(adDir, "Stashboard", "remix-resume-instructions.txt");
    if(wsl) {
        hoardPath = convertPathToWSL(hoardPath);
    }
    return hoardPath;
}

function convertPathToWSL(windowPath) {
    return windowPath.replace(/\\/g, '/').replace(/^([A-Z]):/, (match, drive) => `/mnt/${drive.toLowerCase()}`);
}

module.exports = {
    getJobSquirrelRootDirectory,
    getAcornDepotDirectory,
    getHoardPath,
    getResumeDataDirectory,
    getResumeDataVectorStoreIdPath,
    getCustomResumeInstructions,
    getResumePersonalInformation,
    getTempHtmlToPDFPath,
    getJobListingMDPath,
    getRemixResumePath,
    getRemixResumeInstructionsPath,
    getSaveSessionIdInstructionsTemplatePath,
    getSessionIdData,
    convertPathToWSL
};