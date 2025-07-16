const express = require('express');
const router = express.Router();
const noTemplate = require('../services/generators/noTemplate');
const templatized = require('../services/generators/templatized');

// Generate resume endpoint (AI-based)
router.post('/generate-resume', async (req, res) => {
    const nutNote = req.body;
    await noTemplate.generateResume(nutNote);
    res.sendStatus(200);
});

// Generate resume endpoint (Template-based)
router.post('/generate-template-resume', async (req, res) => {
    try {
        const { nutNote, templateNumber } = req.body;
        
        if (!nutNote) {
            return res.status(400).json({ 
                error: 'Missing required parameter: nutNote' 
            });
        }
        
        console.log(`📋 Generating template resume (Template ${templateNumber || 1}) for: ${nutNote.company} - ${nutNote.jobTitle}`);
        
        await templatized.generateResume(nutNote, templateNumber || 1);
        
        res.json({ 
            success: true, 
            message: `Template resume generated successfully using Template ${templateNumber || 1}`
        });
        
    } catch (error) {
        console.error('❌ Template resume generation failed:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Use static resume endpoint (legacy)
router.post('/use-static-resume', async (req, res) => {
    const nutNote = req.body;
    await noTemplate.useStaticResume(nutNote);
    res.sendStatus(200);
});

// Generate cover letter endpoint (AI-based)
router.post('/generate-cover-letter', async (req, res) => {
    const nutNote = req.body;
    await noTemplate.generateCoverLetter(nutNote);
    res.sendStatus(200);
});

// Generate cover letter endpoint (Template-based)
router.post('/generate-template-cover-letter', async (req, res) => {
    try {
        const { nutNote, templateNumber } = req.body;
        
        if (!nutNote) {
            return res.status(400).json({ 
                error: 'Missing required parameter: nutNote' 
            });
        }
        
        console.log(`💌 Generating template cover letter (Template ${templateNumber || 1}) for: ${nutNote.company} - ${nutNote.jobTitle}`);
        
        await templatized.generateCoverLetter(nutNote, templateNumber || 1);
        
        res.json({ 
            success: true, 
            message: `Template cover letter generated successfully using Template ${templateNumber || 1}`
        });
        
    } catch (error) {
        console.error('❌ Template cover letter generation failed:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Double-check resume endpoint
router.post('/double-check-resume', async (req, res) => {
    try {
        const { nutNote, resumeIndex } = req.body;
        
        if (!nutNote || resumeIndex === undefined) {
            return res.status(400).json({ 
                error: 'Missing required parameters: nutNote, resumeIndex' 
            });
        }
        
        console.log(`✅ Starting double-check for resume version ${resumeIndex + 1} for ${nutNote.company} - ${nutNote.jobTitle}`);
        
        await noTemplate.doubleCheckResume(nutNote, resumeIndex);
        
        res.json({ 
            success: true, 
            message: `Resume double-check completed for version ${resumeIndex + 1}`
        });
        
    } catch (error) {
        console.error('❌ Resume double-check failed:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Remix resume endpoint
router.post('/remix-resume', async (req, res) => {
    try {
        const { nutNote, activeResumeIndex, currentResumeHtml, requestedChanges } = req.body;
        
        if (!nutNote || currentResumeHtml === undefined || !requestedChanges || activeResumeIndex === undefined) {
            return res.status(400).json({ 
                error: 'Missing required parameters: nutNote, activeResumeIndex, currentResumeHtml, requestedChanges' 
            });
        }
        
        console.log(`🎨 Starting resume remix for ${nutNote.company} - ${nutNote.jobTitle}`);
        console.log(`📝 Changes requested: ${requestedChanges}`);
        console.log(`📊 Remixing resume version ${activeResumeIndex + 1}`);
        
        // Call the actual remix function
        await noTemplate.remixResumeAnthropic(nutNote, requestedChanges, activeResumeIndex);
        
        res.json({ 
            success: true, 
            message: 'Resume remix completed successfully'
        });
        
    } catch (error) {
        console.error('❌ Resume remix failed:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Remix cover letter endpoint
router.post('/remix-cover-letter', async (req, res) => {
    try {
        const { nutNote, activeCoverLetterIndex, currentCoverLetterHtml, requestedChanges } = req.body;
        
        if (!nutNote || currentCoverLetterHtml === undefined || !requestedChanges || activeCoverLetterIndex === undefined) {
            return res.status(400).json({ 
                error: 'Missing required parameters: nutNote, activeCoverLetterIndex, currentCoverLetterHtml, requestedChanges' 
            });
        }
        
        console.log(`🎨 Starting cover letter remix for ${nutNote.company} - ${nutNote.jobTitle}`);
        console.log(`📝 Changes requested: ${requestedChanges}`);
        console.log(`📊 Remixing cover letter version ${activeCoverLetterIndex + 1}`);
        
        // Call the actual remix function
        await noTemplate.remixCoverLetterAnthropic(nutNote, requestedChanges, activeCoverLetterIndex);
        
        res.json({ 
            success: true, 
            message: 'Cover letter remix completed successfully'
        });
        
    } catch (error) {
        console.error('❌ Cover letter remix failed:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Double-check cover letter endpoint
router.post('/double-check-cover-letter', async (req, res) => {
    try {
        const { nutNote, coverLetterIndex } = req.body;
        
        if (!nutNote || coverLetterIndex === undefined) {
            return res.status(400).json({ 
                error: 'Missing required parameters: nutNote, coverLetterIndex' 
            });
        }
        
        console.log(`✅ Starting double-check for cover letter version ${coverLetterIndex + 1} for ${nutNote.company} - ${nutNote.jobTitle}`);
        
        await noTemplate.doubleCheckCoverLetterAnthropic(nutNote, coverLetterIndex);
        
        res.json({ 
            success: true, 
            message: `Cover letter double-check completed for version ${coverLetterIndex + 1}`
        });
        
    } catch (error) {
        console.error('❌ Cover letter double-check failed:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Upload resume data endpoint
router.post('/upload-resume-data', async (req, res) => {
    try {
        const vectorStoreId = await noTemplate.UploadResumeData();
        res.json({ success: true, vectorStoreId });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Test Claude streaming endpoint
router.post('/test-claude-stream', async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }
        
        console.log('🧪 Testing Claude streaming with message:', message);
        
        // Import AskClaude function
        const { AskClaude } = require('../services/llm/anthropic');
        const { eventBroadcaster } = require('../services/eventBroadcaster');
        
        // Call AskClaude (events are broadcast automatically)
        const result = await AskClaude(message, null);
        
        res.json({ 
            success: true, 
            result,
            message: 'Claude streaming test completed successfully'
        });
        
    } catch (error) {
        console.error('❌ Claude streaming test failed:', error.message);
        
        // Broadcast error to clients
        const { eventBroadcaster } = require('../services/eventBroadcaster');
        eventBroadcaster.broadcast('claude-stream', {
            type: 'error',
            message: `Claude streaming failed: ${error.message}`,
            error: error.message,
            timestamp: new Date().toISOString()
        });
        
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

module.exports = router;