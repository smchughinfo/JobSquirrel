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

function getCustomeResumeInstructions(wsl) {
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

function convertPathToWSL(windowPath) {
    return windowPath.replace(/\\/g, '/').replace(/^([A-Z]):/, (match, drive) => `/mnt/${drive.toLowerCase()}`);
}

module.exports = {
    getJobSquirrelRootDirectory,
    getAcornDepotDirectory,
    getHoardPath,
    getResumeDataDirectory,
    getResumeDataVectorStoreIdPath,
    getCustomeResumeInstructions,
    getResumePersonalInformation,
    convertPathToWSL
};