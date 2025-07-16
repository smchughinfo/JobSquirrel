const express = require('express');
const router = express.Router();
const { htmlToPdf } = require('../services/pdf');

// Generate PDF endpoint
router.post('/generate-pdf', async (req, res) => {
    try {
        const { nutNote, resumeIndex, marginInches } = req.body;
        
        if (!nutNote || resumeIndex === undefined) {
            return res.status(400).json({
                error: 'Missing required parameters: nutNote, resumeIndex'
            });
        }
        
        // Validate that the resume index exists
        if (!nutNote.html || !Array.isArray(nutNote.html) || resumeIndex >= nutNote.html.length) {
            return res.status(400).json({
                error: 'Invalid resume index or no resumes available'
            });
        }
        
        console.log(`📄 Generating PDF for ${nutNote.company} - ${nutNote.jobTitle}, resume version ${resumeIndex + 1}`);
        console.log(`📏 Using margin: ${marginInches || 0} inches`);
        
        // Generate PDF using the specified resume version
        const resumeHtml = nutNote.html[resumeIndex];
        const pdfPath = await htmlToPdf(resumeHtml, nutNote.company, nutNote.jobTitle, marginInches || 0);
        
        res.json({
            success: true,
            pdfPath,
            message: `PDF generated successfully with ${marginInches || 0} inch margins`
        });
        
    } catch (error) {
        console.error('❌ PDF generation failed:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;