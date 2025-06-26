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

function getHoardPath(wsl) {
    let rootDir = getJobSquirrelRootDirectory();
    let hoardPath = path.join(rootDir, "public", "hoard.json");
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
    convertPathToWSL
};