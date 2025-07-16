const fs = require('fs');
const { getATSAddOnSkillsPath } = require('./jobSquirrelPaths');

function addSkills(skillsString) {
    const atsAddOnSkillsPath = getATSAddOnSkillsPath();
    const skillsArray = skillsString.split(',').map(skill => skill.trim());
    
    if (!fs.existsSync(atsAddOnSkillsPath)) {
        fs.writeFileSync(atsAddOnSkillsPath, JSON.stringify({}));
    }
    
    const atsSkillAddOns = JSON.parse(fs.readFileSync(atsAddOnSkillsPath, 'utf8'));
    for (const skill of skillsArray) {
        if (!atsSkillAddOns[skill]) {
            atsSkillAddOns[skill] = {
                name: skill,
                include: false
            };
        }
    }
    
    fs.writeFileSync(atsAddOnSkillsPath, JSON.stringify(atsSkillAddOns, null, 2));
}

function getApprovedSkills() {
    const atsSkillAddOns = JSON.parse(fs.readFileSync(getATSAddOnSkillsPath(), 'utf8'));
    return Object.values(atsSkillAddOns)
        .filter(skill => skill.include)
        .map(skill => skill.name);
}

module.exports = { addSkills, getApprovedSkills };