const fs = require('fs');
const path = require('path');
const { getSaveSessionIdInstructionsTemplatePath, getSessionIdData } = require('../jobSquirrelPaths');

function generateSessionData() {
    let sessionIdData = getSessionIdData();

    let sessionIdsDir = path.dirname(sessionIdData.sessionIdPath);
    if (!fs.existsSync(sessionIdsDir)) {
        fs.mkdirSync(sessionIdsDir, { recursive: true });
    }

    let templatePath = getSaveSessionIdInstructionsTemplatePath();
    let instructions = fs.readFileSync(templatePath).toString();
    instructions = instructions.replace("[SESSION ID PATH]", sessionIdData.sessionIdPath);
    fs.writeFileSync(sessionIdData.sessionIdInstructionsPath, instructions);
    return sessionIdData;
}

module.exports = {
    generateSessionData,
};