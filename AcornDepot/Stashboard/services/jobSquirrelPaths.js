const path = require('path');

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

function getSaveSessionIdPath(wsl) {
    let rootDir = getJobSquirrelRootDirectory();
    let saveSessionIdPath = path.join(rootDir, "save-session-id-instructions.txt");
    if(wsl) {
        saveSessionIdPath = convertPathToWSL(saveSessionIdPath);
    }
    return saveSessionIdPath;
}

function getSessionIdPath(wsl) {
    let rootDir = getJobSquirrelRootDirectory();
    let sessionIdPath = path.join(rootDir, "session-id.txt");
    if(wsl) {
        sessionIdPath = convertPathToWSL(sessionIdPath);
    }
    return sessionIdPath;
}

function getRemixResumeInstructionsPath(wsl) {
    let adDir = getAcornDepotDirectory();
    let hoardPath = path.join(adDir, "Stashboard", "remix-resume-instructions.txt");
    if(wsl) {
        hoardPath = convertPathToWSL(hoardPath);
    }
    return hoardPath;
}

function getWorkingResumePath(wsl) {
    let adDir = getAcornDepotDirectory();
    let hoardPath = path.join(adDir, "Stashboard", "working-resume.html");
    if(wsl) {
        hoardPath = convertPathToWSL(hoardPath);
    }
    return hoardPath;
}

function getResumeChangesPath(wsl) {
    let adDir = getAcornDepotDirectory();
    let hoardPath = path.join(adDir, "Stashboard", "resume-changes.md");
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
    getSaveSessionIdPath,
    getSessionIdPath,
    getWorkingResumePath,
    getResumeChangesPath,
    convertPathToWSL
};