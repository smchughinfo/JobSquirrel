const express = require('express');
const router = express.Router();
const { getAllSkills, updateSkills } = require('../services/atsAddOnSkills');

// Get all ATS skills
router.get('/ats-skills', (req, res) => {
    try {
        const skills = getAllSkills();
        res.json({ success: true, skills });
    } catch (error) {
        console.error('❌ Error getting ATS skills:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update ATS skills
router.post('/ats-skills', (req, res) => {
    try {
        const { skillUpdates, preferredSpellings } = req.body;
        
        if (!skillUpdates || typeof skillUpdates !== 'object') {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing or invalid skillUpdates object' 
            });
        }
        
        updateSkills(skillUpdates, preferredSpellings);
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Error updating ATS skills:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;