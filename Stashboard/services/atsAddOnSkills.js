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

function hasNewSkills(skillsString) {
    const atsAddOnSkillsPath = getATSAddOnSkillsPath();
    const skillsArray = skillsString.split(',').map(skill => skill.trim());
    
    if (!fs.existsSync(atsAddOnSkillsPath)) {
        return skillsArray.length > 0;
    }
    
    const atsSkillAddOns = JSON.parse(fs.readFileSync(atsAddOnSkillsPath, 'utf8'));
    return skillsArray.some(skill => !atsSkillAddOns[skill]);
}

function getAllSkills() {
    const atsAddOnSkillsPath = getATSAddOnSkillsPath();
    
    if (!fs.existsSync(atsAddOnSkillsPath)) {
        return [];
    }
    
    const atsSkillAddOns = JSON.parse(fs.readFileSync(atsAddOnSkillsPath, 'utf8'));
    return Object.values(atsSkillAddOns);
}

function updateSkills(skillUpdates) {
    const atsAddOnSkillsPath = getATSAddOnSkillsPath();
    
    if (!fs.existsSync(atsAddOnSkillsPath)) {
        fs.writeFileSync(atsAddOnSkillsPath, JSON.stringify({}));
    }
    
    const atsSkillAddOns = JSON.parse(fs.readFileSync(atsAddOnSkillsPath, 'utf8'));
    
    for (const [skillName, includeValue] of Object.entries(skillUpdates)) {
        if (atsSkillAddOns[skillName]) {
            atsSkillAddOns[skillName].include = includeValue;
        }
    }
    
    fs.writeFileSync(atsAddOnSkillsPath, JSON.stringify(atsSkillAddOns, null, 2));
}

function getApprovedSkills() {
    const atsAddOnSkillsPath = getATSAddOnSkillsPath();
    
    if (!fs.existsSync(atsAddOnSkillsPath)) {
        return [];
    }
    
    const atsSkillAddOns = JSON.parse(fs.readFileSync(atsAddOnSkillsPath, 'utf8'));
    return Object.values(atsSkillAddOns)
        .filter(skill => skill.include)
        .map(skill => skill.name);
}

module.exports = { addSkills, hasNewSkills, getAllSkills, updateSkills, getApprovedSkills };