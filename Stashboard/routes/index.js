const express = require('express');
const router = express.Router();

// Import route modules
const eventsRoutes = require('./events');
const hoardRoutes = require('./hoard');
const generationRoutes = require('./generation');
const pdfRoutes = require('./pdf');
const configRoutes = require('./config');
const atsSkillsRoutes = require('./atsSkills');
const resumeProfilesRoutes = require('./resumeProfiles');
const nutcrackerRoutes = require('./nutcracker');

// Register route modules
router.use('/api', eventsRoutes);
router.use('/api', hoardRoutes);
router.use('/api', generationRoutes);
router.use('/api', pdfRoutes);
router.use('/api', configRoutes);
router.use('/api', atsSkillsRoutes);
router.use('/api/resume-profiles', resumeProfilesRoutes);
router.use('/api/nutcracker', nutcrackerRoutes);

module.exports = router;