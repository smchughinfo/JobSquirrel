const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { getJobSquirrelRootDirectory } = require('../services/jobSquirrelPaths');

// Get configuration files endpoint
router.get('/config-files', (req, res) => {
    try {
        const customResumeInstructionsPath = path.join(getJobSquirrelRootDirectory(), 'Config', 'custom-resume-instructions.txt');
        const personalInformationPath = path.join(getJobSquirrelRootDirectory(), 'Config', 'personal-information.txt');
        
        let customResumeInstructions = '';
        let personalInformation = '';
        
        if (fs.existsSync(customResumeInstructionsPath)) {
            customResumeInstructions = fs.readFileSync(customResumeInstructionsPath, 'utf8');
        }
        
        if (fs.existsSync(personalInformationPath)) {
            personalInformation = fs.readFileSync(personalInformationPath, 'utf8');
        }
        
        res.json({
            success: true,
            customResumeInstructions,
            personalInformation
        });
        
    } catch (error) {
        console.error('❌ Error reading config files:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Update configuration files endpoint
router.post('/update-config-file', (req, res) => {
    try {
        const { fileName, content } = req.body;
        
        if (!fileName || content === undefined) {
            return res.status(400).json({
                error: 'Missing required parameters: fileName, content'
            });
        }
        
        // Determine file path based on fileName
        let filePath;
        if (fileName === 'custom-resume-instructions.txt') {
            filePath = path.join(getJobSquirrelRootDirectory(), 'Config', 'custom-resume-instructions.txt');
        } else if (fileName === 'personal-information.txt') {
            filePath = path.join(getJobSquirrelRootDirectory(), 'Config', 'personal-information.txt');
        } else {
            return res.status(400).json({
                error: 'Invalid fileName. Must be custom-resume-instructions.txt or personal-information.txt'
            });
        }
        
        // Ensure Config directory exists
        const configDir = path.join(getJobSquirrelRootDirectory(), 'Config');
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
            console.log(`📁 Created Config directory: ${configDir}`);
        }
        
        // Write the file
        fs.writeFileSync(filePath, content, 'utf8');
        
        console.log(`🔧 Updated configuration file: ${fileName}`);
        console.log(`📁 File path: ${filePath}`);
        console.log(`📝 Content length: ${content.length} characters`);
        
        res.json({
            success: true,
            message: `Configuration file ${fileName} updated successfully`,
            filePath
        });
        
    } catch (error) {
        console.error('❌ Error updating config file:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;