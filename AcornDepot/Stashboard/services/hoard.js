const path = require("path");
const fs = require("fs");
const { getHoardPath } = require('./jobSquirrelPaths');

const hoardPath = getHoardPath();

function addOrUpdateNutNote(nutNote) {
    let map = getHoard();

    let nutNoteIndex = map.jobListings.findIndex(n => n.company == nutNote.company && n.jobTitle == nutNote.jobTitle);
    if(nutNoteIndex != -1) {
        deleteNutNote(nutNote.company, nutNote.jobTitle);
        map = getHoard();
    }

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

function deleteNutNote(companyName, jobTitle) {
    let hoard = getHoard().jobListings;
    let indexOfNutNoteToDelete = hoard.findIndex(n => n.company == companyName && n.jobTitle == jobTitle);
    hoard.splice(indexOfNutNoteToDelete, 1);
    saveHoard({
        jobListings: hoard
    });
}

module.exports = {
    addOrUpdateNutNote,
    getHoard,
    getIdentifier,
    deleteNutNote,
};