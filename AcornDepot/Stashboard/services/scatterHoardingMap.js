const fs = require("fs");
const { getScatterHoardinMapPath } = require('./jobSquirrelPaths');

const mapPath = getScatterHoardinMapPath();

function addAcornToScatterHoardingMap(fileName) {
    let map = recallScatterHoardingMap(fileName);
    map[fileName] = {};
    memorizeScatterHoardingMap(map)
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
    const mapString = JSON.stringify(map);
    fs.writeFileSync(mapPath, mapString);
}

module.exports = {
    addAcornToScatterHoardingMap
};