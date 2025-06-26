/**
 * NutNote - Simple data class for job metadata in the hoard
 * Represents essential information about a cached job posting
 */
class NutNote {
    constructor(company = '', jobTitle = '', resumeGenerated = false) {
        this.company = company;
        this.jobTitle = jobTitle;
        this.resumeGenerated = resumeGenerated;
        this.salary = null;
        this.workSummary = null;
        this.location = null;
        this.url = null;
    }

    /**
     * Create NutNote from filename (Company - Job Title.html format)
     * @param {string} fileName - HTML filename to parse
     * @returns {NutNote} - New NutNote instance
     */
    static fromFileName(fileName) {
        // Remove .html extension
        const baseName = fileName.replace(/\.html$/, '');
        
        // Split on first " - " to separate company from job title
        const dashIndex = baseName.indexOf(' - ');
        
        if (dashIndex === -1) {
            // No dash found, treat entire name as company
            return new NutNote(baseName, '', false);
        }
        
        const company = baseName.substring(0, dashIndex);
        const jobTitle = baseName.substring(dashIndex + 3); // +3 for " - "
        
        return new NutNote(company, jobTitle, false);
    }

    /**
     * Convert to plain object for JSON serialization
     * @returns {Object} - Plain object representation
     */
    toJSON() {
        return {
            company: this.company,
            jobTitle: this.jobTitle,
            url: this.url,
            resumeGenerated: this.resumeGenerated,
            salary: this.salary,
            workSummary: this.workSummary,
            location: this.location
        };
    }

    getIdentifier() {
        return this.company + " - " + this.jobTitle;
    }

    /**
     * Create NutNote from plain object (for deserialization)
     * @param {Object} obj - Plain object with NutNote properties
     * @returns {NutNote} - New NutNote instance
     */
    static fromJSON(obj) {
        const nutNote = new NutNote(
            obj.company || '',
            obj.jobTitle || '',
            obj.resumeGenerated || false
        );
        
        // Set additional fields that don't come from constructor
        nutNote.salary = obj.salary || null;
        nutNote.workSummary = obj.workSummary || null;
        nutNote.location = obj.location || null;
        
        return nutNote;
    }
}

module.exports = NutNote;