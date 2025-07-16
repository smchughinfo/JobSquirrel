const express = require('express');
const router = express.Router();
const { getHoard, addOrUpdateNutNote, getIdentifier, deleteNutNote, deleteNuteNoteByIndex, deleteCoverLetterByIndex, editResumeByIndex, editCoverLetterByIndex } = require('../services/hoard');
const { eventBroadcaster } = require('../services/eventBroadcaster');

// Hoard endpoint to serve current job listings
router.get('/hoard', (req, res) => {
    const hoard = getHoard();
    res.json({ success: true, jobs: hoard.jobListings, count: hoard.jobListings.length });
});

// Update nut note endpoint (accepts full nut note object)
router.patch('/nut-note', (req, res) => {
    const nutNote = req.body;
    addOrUpdateNutNote(nutNote);
    res.sendStatus(200);
});

// Delete nut note endpoint
router.delete('/nut-note', (req, res) => {
    const { company, jobTitle } = req.body;
    deleteNutNote(company, jobTitle);
    res.sendStatus(200);
});

// Delete specific resume version endpoint
router.delete('/resume-version', (req, res) => {
    try {
        const { nutNote, resumeIndex } = req.body;
        
        if (!nutNote || resumeIndex === undefined) {
            return res.status(400).json({ 
                error: 'Missing required parameters: nutNote, resumeIndex' 
            });
        }
        
        console.log(`🗑️ Deleting resume version ${resumeIndex + 1} for ${nutNote.company} - ${nutNote.jobTitle}`);
        
        deleteNuteNoteByIndex(nutNote, resumeIndex);
        
        res.json({ 
            success: true, 
            message: `Resume version ${resumeIndex + 1} deleted successfully`
        });
        
    } catch (error) {
        console.error('❌ Resume version deletion failed:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Delete specific cover letter version endpoint
router.delete('/cover-letter-version', (req, res) => {
    try {
        const { nutNote, coverLetterIndex } = req.body;
        
        if (!nutNote || coverLetterIndex === undefined) {
            return res.status(400).json({ 
                error: 'Missing required parameters: nutNote, coverLetterIndex' 
            });
        }
        
        console.log(`🗑️ Deleting cover letter version ${coverLetterIndex + 1} for ${nutNote.company} - ${nutNote.jobTitle}`);
        
        deleteCoverLetterByIndex(nutNote, coverLetterIndex);
        
        res.json({ 
            success: true, 
            message: `Cover letter version ${coverLetterIndex + 1} deleted successfully`
        });
        
    } catch (error) {
        console.error('❌ Cover letter version deletion failed:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Edit resume endpoint
router.post('/edit-resume', async (req, res) => {
    try {
        const { nutNote, resumeIndex, newContent } = req.body;
        
        if (!nutNote || resumeIndex === undefined || !newContent) {
            return res.status(400).json({ 
                error: 'Missing required parameters: nutNote, resumeIndex, newContent' 
            });
        }
        
        console.log(`📝 Editing resume version ${resumeIndex + 1} for ${nutNote.company} - ${nutNote.jobTitle}`);
        
        editResumeByIndex(nutNote, resumeIndex, newContent);
        
        // Broadcast hoard update event
        eventBroadcaster.broadcast('hoard-updated', {
            type: 'resume-edited',
            content: `Resume version ${resumeIndex + 1} edited for ${nutNote.company} - ${nutNote.jobTitle}`
        });
        
        res.json({ 
            success: true, 
            message: `Resume version ${resumeIndex + 1} updated successfully`
        });
        
    } catch (error) {
        console.error('❌ Resume edit failed:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Edit cover letter endpoint
router.post('/edit-cover-letter', async (req, res) => {
    try {
        const { nutNote, coverLetterIndex, newContent } = req.body;
        
        if (!nutNote || coverLetterIndex === undefined || !newContent) {
            return res.status(400).json({ 
                error: 'Missing required parameters: nutNote, coverLetterIndex, newContent' 
            });
        }
        
        console.log(`📝 Editing cover letter version ${coverLetterIndex + 1} for ${nutNote.company} - ${nutNote.jobTitle}`);
        
        editCoverLetterByIndex(nutNote, coverLetterIndex, newContent);
        
        // Broadcast hoard update event
        eventBroadcaster.broadcast('hoard-updated', {
            type: 'cover-letter-edited',
            content: `Cover letter version ${coverLetterIndex + 1} edited for ${nutNote.company} - ${nutNote.jobTitle}`
        });
        
        res.json({ 
            success: true, 
            message: `Cover letter version ${coverLetterIndex + 1} updated successfully`
        });
        
    } catch (error) {
        console.error('❌ Cover letter edit failed:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

module.exports = router;