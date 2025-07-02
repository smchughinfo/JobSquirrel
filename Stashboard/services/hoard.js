const path = require("path");
const fs = require("fs");
const { getHoardPath } = require('./jobSquirrelPaths');

const hoardPath = getHoardPath();

function addOrUpdateNutNote(nutNote) {
    let map = getHoard();

    let nutNoteIndex = map.jobListings.findIndex(n => n.company == nutNote.company && n.jobTitle == nutNote.jobTitle);
    if(nutNoteIndex != -1) {
        deleteNutNote(nutNote.company, nutNote.jobTitle);
        map = getHoard();
    }

    map.jobListings.push(nutNote);
    saveHoard(map);
}

function getHoard() {
    if(!fs.existsSync(hoardPath)) {
        fs.writeFileSync(hoardPath, JSON.stringify({jobListings:[]}));
    }
    return JSON.parse(fs.readFileSync(hoardPath));
}

function saveHoard(map) {
    const mapString = JSON.stringify(map, null, 2); // Pretty print JSON
    fs.writeFileSync(hoardPath, mapString);
}

function getIdentifier(nutNote) {
    return nutNote.company + " - " + nutNote.jobTitle;
}

function deleteNutNote(companyName, jobTitle) {
    let hoard = getHoard().jobListings;
    let indexOfNutNoteToDelete = hoard.findIndex(n => n.company == companyName && n.jobTitle == jobTitle);
    hoard.splice(indexOfNutNoteToDelete, 1);
    saveHoard({
        jobListings: hoard
    });
}

function deleteNuteNoteByIndex(nutNote, resumeIndex) {
    let hoard = getHoard();
    let jobIndex = hoard.jobListings.findIndex(n => n.company == nutNote.company && n.jobTitle == nutNote.jobTitle);
    
    if (jobIndex === -1) {
        throw new Error(`Job not found: ${nutNote.company} - ${nutNote.jobTitle}`);
    }
    
    let job = hoard.jobListings[jobIndex];
    
    if (!job.html || !Array.isArray(job.html)) {
        throw new Error(`No resume versions found for job: ${nutNote.company} - ${nutNote.jobTitle}`);
    }
    
    if (resumeIndex < 0 || resumeIndex >= job.html.length) {
        throw new Error(`Invalid resume index ${resumeIndex}. Job has ${job.html.length} resume version(s)`);
    }
    
    // Remove the specific resume version
    job.html.splice(resumeIndex, 1);
    
    // If no resume versions left, remove the html property entirely
    if (job.html.length === 0) {
        delete job.html;
    }
    
    saveHoard(hoard);
}

function deleteCoverLetterByIndex(nutNote, coverLetterIndex) {
    let hoard = getHoard();
    let jobIndex = hoard.jobListings.findIndex(n => n.company == nutNote.company && n.jobTitle == nutNote.jobTitle);
    
    if (jobIndex === -1) {
        throw new Error(`Job not found: ${nutNote.company} - ${nutNote.jobTitle}`);
    }
    
    let job = hoard.jobListings[jobIndex];
    
    if (!job.coverLetter || !Array.isArray(job.coverLetter)) {
        throw new Error(`No cover letter versions found for job: ${nutNote.company} - ${nutNote.jobTitle}`);
    }
    
    if (coverLetterIndex < 0 || coverLetterIndex >= job.coverLetter.length) {
        throw new Error(`Invalid cover letter index ${coverLetterIndex}. Job has ${job.coverLetter.length} cover letter version(s)`);
    }
    
    // Remove the specific cover letter version
    job.coverLetter.splice(coverLetterIndex, 1);
    
    // If no cover letter versions left, remove the coverLetter property entirely
    if (job.coverLetter.length === 0) {
        delete job.coverLetter;
    }
    
    saveHoard(hoard);
}

function editResumeByIndex(nutNote, resumeIndex, newContent) {
    let hoard = getHoard();
    let jobIndex = hoard.jobListings.findIndex(n => n.company == nutNote.company && n.jobTitle == nutNote.jobTitle);
    
    if (jobIndex === -1) {
        throw new Error(`Job not found: ${nutNote.company} - ${nutNote.jobTitle}`);
    }
    
    let job = hoard.jobListings[jobIndex];
    
    if (!job.html || !Array.isArray(job.html)) {
        throw new Error(`No resume versions found for job: ${nutNote.company} - ${nutNote.jobTitle}`);
    }
    
    if (resumeIndex < 0 || resumeIndex >= job.html.length) {
        throw new Error(`Invalid resume index ${resumeIndex}. Job has ${job.html.length} resume version(s)`);
    }
    
    // Update the specific resume version
    job.html[resumeIndex] = newContent;
    
    saveHoard(hoard);
}

function editCoverLetterByIndex(nutNote, coverLetterIndex, newContent) {
    let hoard = getHoard();
    let jobIndex = hoard.jobListings.findIndex(n => n.company == nutNote.company && n.jobTitle == nutNote.jobTitle);
    
    if (jobIndex === -1) {
        throw new Error(`Job not found: ${nutNote.company} - ${nutNote.jobTitle}`);
    }
    
    let job = hoard.jobListings[jobIndex];
    
    if (!job.coverLetter || !Array.isArray(job.coverLetter)) {
        throw new Error(`No cover letter versions found for job: ${nutNote.company} - ${nutNote.jobTitle}`);
    }
    
    if (coverLetterIndex < 0 || coverLetterIndex >= job.coverLetter.length) {
        throw new Error(`Invalid cover letter index ${coverLetterIndex}. Job has ${job.coverLetter.length} cover letter version(s)`);
    }
    
    // Update the specific cover letter version
    job.coverLetter[coverLetterIndex] = newContent;
    
    saveHoard(hoard);
}

module.exports = {
    addOrUpdateNutNote,
    getHoard,
    getIdentifier,
    deleteNutNote,
    deleteNuteNoteByIndex,
    deleteCoverLetterByIndex,
    editResumeByIndex,
    editCoverLetterByIndex,
};