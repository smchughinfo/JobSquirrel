const fs = require('fs');
const path = require('path');
const { getJobSquirrelRootDirectory } = require('./jobSquirrelPaths');
const { generateUUID } = require('./utilities');

function getResumeProfilesPath() {
    return path.join(getJobSquirrelRootDirectory(), 'Stashboard', 'resume-profiles.txt');
}

function loadResumeProfiles() {
    const profilesPath = getResumeProfilesPath();
    
    if (!fs.existsSync(profilesPath)) {
        const defaultProfiles = [
            {
                id: generateUUID(),
                name: 'Default',
                filePath: path.join(getJobSquirrelRootDirectory(), 'Config', 'ResumeData', 'resume.json'),
                active: true,
                createdAt: new Date().toISOString()
            }
        ];
        saveResumeProfiles(defaultProfiles);
        return defaultProfiles;
    }

    try {
        const data = fs.readFileSync(profilesPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading resume profiles:', error);
        return [];
    }
}

function saveResumeProfiles(profiles) {
    const profilesPath = getResumeProfilesPath();
    
    try {
        fs.writeFileSync(profilesPath, JSON.stringify(profiles, null, 2));
    } catch (error) {
        console.error('Error saving resume profiles:', error);
        throw error;
    }
}

function addResumeProfile(name) {
    const profiles = loadResumeProfiles();
    
    const newProfile = {
        id: generateUUID(),
        name,
        filePath: null,
        active: false,
        createdAt: new Date().toISOString()
    };
    
    profiles.push(newProfile);
    saveResumeProfiles(profiles);
    
    return newProfile;
}

function deleteResumeProfile(profileId) {
    const profiles = loadResumeProfiles();
    const filteredProfiles = profiles.filter(p => p.id !== profileId);
    
    if (filteredProfiles.length === profiles.length) {
        throw new Error('Profile not found');
    }
    
    // If we deleted the active profile, set the first remaining profile as active
    const deletedProfile = profiles.find(p => p.id === profileId);
    if (deletedProfile && deletedProfile.active && filteredProfiles.length > 0) {
        filteredProfiles[0].active = true;
    }
    
    saveResumeProfiles(filteredProfiles);
    return true;
}

function setActiveProfile(profileId) {
    const profiles = loadResumeProfiles();
    let found = false;
    
    profiles.forEach(profile => {
        if (profile.id === profileId) {
            profile.active = true;
            found = true;
        } else {
            profile.active = false;
        }
    });
    
    if (!found) {
        throw new Error('Profile not found');
    }
    
    saveResumeProfiles(profiles);
    return true;
}

function updateProfilePath(profileId, filePath) {
    const profiles = loadResumeProfiles();
    const profile = profiles.find(p => p.id === profileId);
    
    if (!profile) {
        throw new Error('Profile not found');
    }
    
    profile.filePath = filePath;
    profile.updatedAt = new Date().toISOString();
    
    saveResumeProfiles(profiles);
    return profile;
}

function getActiveProfile() {
    const profiles = loadResumeProfiles();
    return profiles.find(p => p.active) || profiles[0];
}

function getActiveResumeJsonPath() {
    const activeProfile = getActiveProfile();
    return activeProfile ? activeProfile.filePath : null;
}

module.exports = {
    loadResumeProfiles,
    saveResumeProfiles,
    addResumeProfile,
    deleteResumeProfile,
    setActiveProfile,
    updateProfilePath,
    getActiveProfile,
    getActiveResumeJsonPath
};