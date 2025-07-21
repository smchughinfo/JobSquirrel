// Re-export functions from modular files for backward compatibility
const { generateResume } = require('./templatized/resume');
const { generateCoverLetter } = require('./templatized/coverLetter');

module.exports = { generateResume, generateCoverLetter };