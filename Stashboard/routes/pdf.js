const express = require('express');
const router = express.Router();
const path = require('path');
const { htmlToPdf } = require('../services/pdf');
const { getJobSquirrelRootDirectory } = require('../services/jobSquirrelPaths');

// Generate PDF endpoint
router.post('/generate-pdf', async (req, res) => {
    try {
        const { nutNote, resumeHtml, marginInches } = req.body;
        
        if (!nutNote || !resumeHtml) {
            return res.status(400).json({
                error: 'Missing required parameters: nutNote, resumeHtml'
            });
        }
        
        console.log(`📄 Generating PDF for ${nutNote.company} - ${nutNote.jobTitle}`);
        console.log(`📏 Using margin: ${marginInches || 0} inches`);
        
        // Generate PDF using the provided resume HTML
        const pdfPath = await htmlToPdf(resumeHtml, nutNote.company, nutNote.jobTitle, marginInches || 0);
        
        // Convert absolute path to relative URL for serving via static route
        const filename = path.basename(pdfPath);
        const pdfUrl = `/GeneratedResumes/${encodeURIComponent(filename)}`;
        
        res.json({
            success: true,
            pdfPath: pdfUrl,
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