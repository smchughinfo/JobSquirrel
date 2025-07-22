const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const { getResumeTemplatesDirectory, getResumeJSONPath, getCoverLetterPath } = require('../../jobSquirrelPaths');
const { addSkills, hasNewSkills, getApprovedSkillsFromList } = require('../../atsAddOnSkills');
const { addOrUpdateNutNote } = require('../../hoard');
const { generateSessionData } = require('../common');
const { getUnmatchedSkills } = require('./shared');

function validateCoverLetterTemplate(templateNumber) {
    if (![1].includes(templateNumber)) {
        throw new Error('Invalid template number. Use 1.');
    }
}

function getCoverLetterPaths(templateNumber) {
    const templatePath = path.join(getResumeTemplatesDirectory(), `cover-letter-template-${templateNumber}.txt`);
    const resumeDataPath = getResumeJSONPath();
    
    if (!fs.existsSync(templatePath)) {
        throw new Error(`Cover letter template ${templateNumber} not found at: ${templatePath}`);
    }
    
    if (!resumeDataPath || !fs.existsSync(resumeDataPath)) {
        throw new Error(`Resume data file not found at: ${resumeDataPath}. Please configure a resume profile.`);
    }
    
    return { templatePath, resumeDataPath };
}

function loadCoverLetterTemplate(templatePath, templateNumber) {
    console.log(`💌 Using cover letter template ${templateNumber}:`, templatePath);
    return fs.readFileSync(templatePath, 'utf8');
}

function loadResumeData(resumeDataPath) {
    console.log('Reading resume data from:', resumeDataPath);
    return JSON.parse(fs.readFileSync(resumeDataPath, 'utf8'));
}

function combineSkillsWithoutDuplicates(resumeSkills, approvedSkills) {
    const combinedSkillsWithDuplicates = [...resumeSkills, ...approvedSkills];
    
    // Remove exact duplicates (case-insensitive)
    return [...new Set(combinedSkillsWithDuplicates.map(skill => skill.toLowerCase()))]
        .map(lowerSkill => combinedSkillsWithDuplicates.find(skill => skill.toLowerCase() === lowerSkill));
}

function prepareCoverLetterTemplateData(resumeData, nutNote, combinedSkills) {
    return {
        name: resumeData.personal_information.name,
        title: nutNote.jobTitle,
        street: resumeData.personal_information.address.street,
        city: resumeData.personal_information.address.city,
        state: resumeData.personal_information.address.state,
        zip: resumeData.personal_information.address.zip,
        phone: resumeData.personal_information.phone,
        email: resumeData.personal_information.email,
        website: resumeData.personal_information.website,
        github: resumeData.personal_information.github,
        jobTitle: nutNote.jobTitle,
        company: nutNote.company,
        jobUrl: nutNote.url,
        JOB_TITLE: nutNote.jobTitle,
        COMPANY_NAME: nutNote.company,
        experience: resumeData.experience,
        skills: combinedSkills,
        education: resumeData.education,
        certifications_and_courses: resumeData.certifications_and_courses,
        projects: resumeData.projects,
        peripherals: resumeData.peripherals
    };
}

function saveCoverLetterAndUpdateNutNote(text, nutNote) {
    // Save cover letter to file (same as AI-generated cover letters)
    fs.writeFileSync(getCoverLetterPath(nutNote.company), text);

    // Initialize coverLetter array if it doesn't exist
    if (!nutNote.coverLetter) {
        nutNote.coverLetter = [];
    }

    nutNote.coverLetter.push(text);
    addOrUpdateNutNote(nutNote);
}

async function generateCoverLetter(nutNote, templateNumber = 1) {
    let sessionData = generateSessionData();
    nutNote.sessionData.push(sessionData);

    let unmatchedSkills = await getUnmatchedSkills(nutNote);
    
    // Check if there are new skills that need approval (only if not already reviewed)
    if (!nutNote.skillsReviewed && hasNewSkills(unmatchedSkills)) {
        addSkills(unmatchedSkills);
        nutNote.skillsReviewed = true; // Mark as reviewed
        throw new Error('NEW_SKILLS_NEED_APPROVAL');
    }
    
    // Get only the approved skills from the current job's unmatched skills
    const approvedCurrentJobSkills = getApprovedSkillsFromList(unmatchedSkills);

    validateCoverLetterTemplate(templateNumber);
    
    const { templatePath, resumeDataPath } = getCoverLetterPaths(templateNumber);
    const templateSource = loadCoverLetterTemplate(templatePath, templateNumber);
    const resumeData = loadResumeData(resumeDataPath);

    const combinedSkills = combineSkillsWithoutDuplicates(resumeData.skills, approvedCurrentJobSkills);

    // Compile the template
    const template = Handlebars.compile(templateSource);

    const templateData = prepareCoverLetterTemplateData(resumeData, nutNote, combinedSkills);

    // Generate the text content
    const text = template(templateData);

    saveCoverLetterAndUpdateNutNote(text, nutNote);
}

module.exports = { generateCoverLetter };