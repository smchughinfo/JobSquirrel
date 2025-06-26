const path = require("path");
const fs = require("fs");
const { getHoardPath } = require('./jobSquirrelPaths');
const NutNote = require('../NutNote');

const hoardPath = getHoardPath();

function addNutNote(nutNote) {  
    let map = getHoard();
    map[nutNote.getIdentifier()] = nutNote.toJSON();
    saveHoard(map);
}

function getHoard() {
    if(fs.existsSync(hoardPath)) {
        return JSON.parse(fs.readFileSync(hoardPath));
    }
    else {
        return {}
    }
}

function saveHoard(map) {
    const mapString = JSON.stringify(map, null, 2); // Pretty print JSON
    fs.writeFileSync(hoardPath, mapString);
}

module.exports = {
    addNutNote,
    getHoard,
};