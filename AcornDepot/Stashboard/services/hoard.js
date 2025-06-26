const path = require("path");
const fs = require("fs");
const { getHoardPath } = require('./jobSquirrelPaths');
const NutNote = require('../NutNote');

const mapPath = getHoardPath();

function addNutNote(nutNote) {  
    let map = getHoard();
    map[nutNote.getIdentifier()] = nutNote.toJSON();
    saveHoard(map);
}

function getHoard() {
    if(fs.existsSync(mapPath)) {
        return JSON.parse(fs.readFileSync(mapPath));
    }
    else {
        return {}
    }
}

function saveHoard(map) {
    const mapString = JSON.stringify(map, null, 2); // Pretty print JSON
    fs.writeFileSync(mapPath, mapString);
}

module.exports = {
    addNutNote,
    getHoard,
    saveHoard
};