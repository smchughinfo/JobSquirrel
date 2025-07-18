const fs = require('fs');
const { getATSAddOnSkillsPath } = require('./jobSquirrelPaths');

function addSkills(skillsString) {
    const atsAddOnSkillsPath = getATSAddOnSkillsPath();
    const skillsArray = skillsString.split(',').map(skill => skill.trim()).filter(skill => skill.length > 0);
    
    if (!fs.existsSync(atsAddOnSkillsPath)) {
        fs.writeFileSync(atsAddOnSkillsPath, JSON.stringify({}));
    }
    
    const atsSkillAddOns = JSON.parse(fs.readFileSync(atsAddOnSkillsPath, 'utf8'));
    const existingSkills = Object.keys(atsSkillAddOns);
    
    for (const skill of skillsArray) {
        // Don't add if it already exists
        if (atsSkillAddOns[skill]) {
            continue;
        }
        
        // Check if this is a variation of an existing skill
        const skillLower = skill.toLowerCase();
        const isVariation = existingSkills.some(existingSkill => {
            const existingLower = existingSkill.toLowerCase();
            return existingLower.includes(skillLower) || skillLower.includes(existingLower);
        });
        
        // Only add if it's not a variation of an existing skill
        if (!isVariation) {
            atsSkillAddOns[skill] = {
                name: skill,
                preferredSpelling: skill, // Default to original spelling
                include: false,
                isNew: true // Mark as truly new
            };
        }
    }
    
    fs.writeFileSync(atsAddOnSkillsPath, JSON.stringify(atsSkillAddOns, null, 2));
}

function hasNewSkills(skillsString) {
    const atsAddOnSkillsPath = getATSAddOnSkillsPath();
    const skillsArray = skillsString.split(',').map(skill => skill.trim()).filter(skill => skill.length > 0);
    
    if (!fs.existsSync(atsAddOnSkillsPath)) {
        return skillsArray.length > 0;
    }
    
    const atsSkillAddOns = JSON.parse(fs.readFileSync(atsAddOnSkillsPath, 'utf8'));
    const existingSkills = Object.keys(atsSkillAddOns);
    
    // Check if any skill is truly new (not just a slight variation)
    return skillsArray.some(skill => {
        // Exact match check first
        if (atsSkillAddOns[skill]) {
            return false; // Already exists
        }
        
        // Check for similar skills to avoid AI variation issues
        const skillLower = skill.toLowerCase();
        const isVariation = existingSkills.some(existingSkill => {
            const existingLower = existingSkill.toLowerCase();
            
            // Check if they're very similar (contains or contained by)
            return existingLower.includes(skillLower) || skillLower.includes(existingLower);
        });
        
        return !isVariation; // Only consider it new if it's not a variation
    });
}

function getAllSkills() {
    const atsAddOnSkillsPath = getATSAddOnSkillsPath();
    
    if (!fs.existsSync(atsAddOnSkillsPath)) {
        return [];
    }
    
    const atsSkillAddOns = JSON.parse(fs.readFileSync(atsAddOnSkillsPath, 'utf8'));
    
    // Load resume.json to check for skills that shouldn't be in ATS add-ons
    const { getResumeJSONPath } = require('./jobSquirrelPaths');
    let resumeSkills = [];
    
    try {
        const resumeDataPath = getResumeJSONPath();
        if (fs.existsSync(resumeDataPath)) {
            const resumeData = JSON.parse(fs.readFileSync(resumeDataPath, 'utf8'));
            resumeSkills = resumeData.skills.map(skill => skill.toLowerCase());
        }
    } catch (error) {
        console.log('Note: Could not load resume.json skills for ATS cleanup');
    }
    
    // Migration: Add isNew flag and preferredSpelling to existing skills that don't have it
    // Also remove any empty or null skill names and skills that are already in resume.json
    // Also remove giant concatenated skill strings that are AI artifacts
    let needsUpdate = false;
    for (const skillName in atsSkillAddOns) {
        // Remove empty or null skills
        if (!skillName || skillName.trim().length === 0) {
            delete atsSkillAddOns[skillName];
            needsUpdate = true;
            continue;
        }
        
        // Remove giant concatenated strings (likely AI artifacts)
        if (skillName.length > 100 || skillName.includes(';') || skillName.includes(' TypeScript ')) {
            console.log(`🧹 Removing AI artifact concatenated string: '${skillName.substring(0, 50)}...'`);
            delete atsSkillAddOns[skillName];
            needsUpdate = true;
            continue;
        }
        
        // Remove skills that are already in resume.json (they shouldn't be in ATS add-ons)
        if (resumeSkills.includes(skillName.toLowerCase())) {
            console.log(`🧹 Removing '${skillName}' from ATS add-ons (already in resume.json)`);
            delete atsSkillAddOns[skillName];
            needsUpdate = true;
            continue;
        }
        
        if (atsSkillAddOns[skillName].isNew === undefined) {
            atsSkillAddOns[skillName].isNew = false; // Existing skills are not new
            needsUpdate = true;
        }
        
        if (atsSkillAddOns[skillName].preferredSpelling === undefined) {
            atsSkillAddOns[skillName].preferredSpelling = skillName; // Default to original spelling
            needsUpdate = true;
        }
    }
    
    if (needsUpdate) {
        fs.writeFileSync(atsAddOnSkillsPath, JSON.stringify(atsSkillAddOns, null, 2));
    }
    
    return Object.values(atsSkillAddOns);
}

function updateSkills(skillUpdates, preferredSpellings = {}) {
    const atsAddOnSkillsPath = getATSAddOnSkillsPath();
    
    if (!fs.existsSync(atsAddOnSkillsPath)) {
        fs.writeFileSync(atsAddOnSkillsPath, JSON.stringify({}));
    }
    
    const atsSkillAddOns = JSON.parse(fs.readFileSync(atsAddOnSkillsPath, 'utf8'));
    
    for (const [skillName, includeValue] of Object.entries(skillUpdates)) {
        if (atsSkillAddOns[skillName]) {
            atsSkillAddOns[skillName].include = includeValue;
            // Clear the isNew flag once user has made a decision
            atsSkillAddOns[skillName].isNew = false;
            
            // Update preferred spelling if provided
            if (preferredSpellings[skillName]) {
                atsSkillAddOns[skillName].preferredSpelling = preferredSpellings[skillName];
            }
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

function getApprovedSkillsFromList(skillsString) {
    const atsAddOnSkillsPath = getATSAddOnSkillsPath();
    const skillsArray = skillsString.split(',').map(skill => skill.trim()).filter(skill => skill.length > 0);
    
    if (!fs.existsSync(atsAddOnSkillsPath)) {
        return [];
    }
    
    const atsSkillAddOns = JSON.parse(fs.readFileSync(atsAddOnSkillsPath, 'utf8'));
    return skillsArray
        .filter(skill => atsSkillAddOns[skill] && atsSkillAddOns[skill].include)
        .map(skill => atsSkillAddOns[skill].preferredSpelling || skill);
}

module.exports = { addSkills, hasNewSkills, getAllSkills, updateSkills, getApprovedSkills, getApprovedSkillsFromList };