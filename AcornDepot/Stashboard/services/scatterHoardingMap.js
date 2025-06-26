const path = require("path");
const fs = require("fs");
const { getScatterHoardinMapPath, getCacheDirectory } = require('./jobSquirrelPaths');
const { askOllamaSync } = require('./llm');
const NutNote = require('../NutNote');

const mapPath = getScatterHoardinMapPath();

function addAcornToScatterHoardingMap(nutNote) {  
    let map = recallScatterHoardingMap();
    map[nutNote.getIdentifier()] = nutNote.toJSON();
    memorizeScatterHoardingMap(map);
}

function recallScatterHoardingMap() {
    if(fs.existsSync(mapPath)) {
        return JSON.parse(fs.readFileSync(mapPath));
    }
    else {
        return {}
    }
}

function memorizeScatterHoardingMap(map) {
    const mapString = JSON.stringify(map, null, 2); // Pretty print JSON
    fs.writeFileSync(mapPath, mapString);
}

module.exports = {
    addAcornToScatterHoardingMap,
    recallScatterHoardingMap,
    memorizeScatterHoardingMap
};