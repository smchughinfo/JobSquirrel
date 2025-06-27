const path = require("path");
const fs = require("fs");
const { getHoardPath } = require('./jobSquirrelPaths');

const hoardPath = getHoardPath();

function addNutNote(nutNote) {  
    let map = getHoard();
    map.jobListings.push(nutNote);
    saveHoard(map);
}

function getHoard() {
    if(!fs.existsSync(hoardPath)) {
        fs.writeFileSync(hoardPath, JSON.stringify({jobListings:[]}));
    }
    return JSON.parse(fs.readFileSync(hoardPath));
}

function saveHoard(map) {
    const mapString = JSON.stringify(map, null, 2); // Pretty print JSON
    fs.writeFileSync(hoardPath, mapString);
}

function getIdentifier(nutNote) {
    return nutNote.company + " - " + nutNote.jobTitle;
}

module.exports = {
    addNutNote,
    getHoard,
};