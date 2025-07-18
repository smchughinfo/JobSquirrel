const express = require('express');
const router = express.Router();
const { executeProjectNutcracker } = require('../services/project-nutcracker');

router.post('/execute', async (req, res) => {
    try {
        console.log('🥜 ProjectNutcracker: Starting execution...');
        
        const instructionFile = 'ProjectNutcracker/Instructions/screenshot.txt';
        const result = await executeProjectNutcracker(instructionFile);
        
        res.json({ success: true, result });
    } catch (error) {
        console.error('ProjectNutcracker error:', error);
        res.json({ success: false, error: error.message });
    }
});

module.exports = router;