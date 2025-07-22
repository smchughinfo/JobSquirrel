const express = require('express');
const router = express.Router();
const { 
    loadResumeProfiles,
    addResumeProfile,
    deleteResumeProfile,
    setActiveProfile,
    updateProfilePath
} = require('../services/resumeProfiles');

// GET /api/resume-profiles - Get all resume profiles
router.get('/', (req, res) => {
    try {
        const profiles = loadResumeProfiles();
        res.json({ success: true, profiles });
    } catch (error) {
        console.error('Error loading resume profiles:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/resume-profiles/add - Add a new profile
router.post('/add', (req, res) => {
    try {
        const { name } = req.body;
        
        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, error: 'Profile name is required' });
        }
        
        const newProfile = addResumeProfile(name.trim());
        res.json({ success: true, profile: newProfile });
    } catch (error) {
        console.error('Error adding resume profile:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/resume-profiles/:id - Delete a profile
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        deleteResumeProfile(id);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting resume profile:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/resume-profiles/set-active - Set active profile
router.post('/set-active', (req, res) => {
    try {
        const { profileId } = req.body;
        
        if (!profileId) {
            return res.status(400).json({ success: false, error: 'Profile ID is required' });
        }
        
        setActiveProfile(profileId);
        res.json({ success: true });
    } catch (error) {
        console.error('Error setting active profile:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/resume-profiles/update-path - Update profile file path
router.post('/update-path', (req, res) => {
    try {
        const { profileId, filePath } = req.body;
        
        if (!profileId || !filePath) {
            return res.status(400).json({ 
                success: false, 
                error: 'Profile ID and file path are required' 
            });
        }
        
        const updatedProfile = updateProfilePath(profileId, filePath);
        res.json({ success: true, profile: updatedProfile });
    } catch (error) {
        console.error('Error updating profile path:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;