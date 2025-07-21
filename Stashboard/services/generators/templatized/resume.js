const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const { getResumeTemplatesDirectory, getResumeDataDirectory } = require('../../jobSquirrelPaths');
const { addSkills, hasNewSkills, getApprovedSkillsFromList } = require('../../atsAddOnSkills');
const { addOrUpdateNutNote } = require('../../hoard');
const { generateSessionData } = require('../common');
const { getUnmatchedSkills } = require('./shared');

function validateResumeTemplate(templateNumber) {
    if (![1, 2].includes(templateNumber)) {
        throw new Error('Invalid template number. Use 1 or 2.');
    }
}

function getResumePaths(templateNumber) {
    const templatePath = path.join(getResumeTemplatesDirectory(), `resume-template-${templateNumber}.html`);
    const resumeDataPath = path.join(getResumeDataDirectory(), 'resume.json');
    
    if (!fs.existsSync(templatePath)) {
        throw new Error(`Template ${templateNumber} not found at: ${templatePath}`);
    }
    
    return { templatePath, resumeDataPath };
}

function loadResumeTemplate(templatePath, templateNumber) {
    console.log(`📄 Using template ${templateNumber}:`, templatePath);
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

function prepareResumeTemplateData(resumeData, nutNote, combinedSkills) {
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
        experience: resumeData.experience,
        skills: combinedSkills,
        education: resumeData.education,
        certifications_and_courses: resumeData.certifications_and_courses,
        projects: resumeData.projects,
        peripherals: resumeData.peripherals
    };
}

function saveResumeAndUpdateNutNote(html, nutNote) {
    nutNote.html.push(html);
    addOrUpdateNutNote(nutNote);
}

async function generateResume(nutNote, templateNumber = 1) {
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

    validateResumeTemplate(templateNumber);
    
    const { templatePath, resumeDataPath } = getResumePaths(templateNumber);
    const templateSource = loadResumeTemplate(templatePath, templateNumber);
    const resumeData = loadResumeData(resumeDataPath);

    const combinedSkills = combineSkillsWithoutDuplicates(resumeData.skills, approvedCurrentJobSkills);

    // Compile the template
    const template = Handlebars.compile(templateSource);

    const templateData = prepareResumeTemplateData(resumeData, nutNote, combinedSkills);

    // Generate the HTML
    const html = template(templateData);

    saveResumeAndUpdateNutNote(html, nutNote);
}

module.exports = { generateResume };