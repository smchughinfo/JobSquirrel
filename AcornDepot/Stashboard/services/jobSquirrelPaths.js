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

function getCacheDirectory(wsl) {
    let adDir = getAcornDepotDirectory();
    let cacheDir = path.join(adDir, "Cache");
    if(wsl) {
        cacheDir = convertPathToWSL(cacheDir);
    }
    return cacheDir;
}

function convertPathToWSL(windowPath) {
    return windowPath.replace(/\\/g, '/').replace(/^([A-Z]):/, (match, drive) => `/mnt/${drive.toLowerCase()}`);
}

module.exports = {
    getJobSquirrelRootDirectory,
    getCacheDirectory,
    getAcornDepotDirectory,
    convertPathToWSL
};