const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const { getResumeTemplatesDirectory, getResumeDataDirectory } = require('../jobSquirrelPaths');
const { addOrUpdateNutNote } = require('../hoard');
const { generateSessionData } = require('./common');

function generateResume(nutNote, templateNumber = 1) {
    let sessionData = generateSessionData();
    nutNote.sessionData.push(sessionData);

    // Validate template number
    if (![1, 2].includes(templateNumber)) {
        throw new Error('Invalid template number. Use 1 or 2.');
    }

    // Define paths based on template number
    const templatePath = path.join(getResumeTemplatesDirectory(), `resume-template-${templateNumber}.html`);
    const resumeDataPath = path.join(getResumeDataDirectory(), 'resume.json');

    // Check if template exists
    if (!fs.existsSync(templatePath)) {
        throw new Error(`Template ${templateNumber} not found at: ${templatePath}`);
    }

    // Read the template file
    console.log(`📄 Using template ${templateNumber}:`, templatePath);
    const templateSource = fs.readFileSync(templatePath, 'utf8');

    // Read the resume data
    console.log('Reading resume data from:', resumeDataPath);
    const resumeData = JSON.parse(fs.readFileSync(resumeDataPath, 'utf8'));

    // Compile the template
    const template = Handlebars.compile(templateSource);

    // Prepare data for template
    const templateData = {
        name: resumeData.personal_information.name,
        title: resumeData.personal_information.title,
        street: resumeData.personal_information.address.street,
        city: resumeData.personal_information.address.city,
        state: resumeData.personal_information.address.state,
        zip: resumeData.personal_information.address.zip,
        phone: resumeData.personal_information.phone,
        email: resumeData.personal_information.email,
        website: resumeData.personal_information.website,
        github: resumeData.personal_information.github,
        experience: resumeData.experience,
        skills: resumeData.skills,
        education: resumeData.education,
        certifications_and_courses: resumeData.certifications_and_courses,
        projects: resumeData.projects,
        peripherals: resumeData.peripherals
    };

    // Generate the HTML
    const html = template(templateData);

    nutNote.html.push(html);
    addOrUpdateNutNote(nutNote);
}

function generateCoverLetter(nutNote, templateNumber = 1) {
    let sessionData = generateSessionData();
    nutNote.sessionData.push(sessionData);

    // Validate template number
    if (![1].includes(templateNumber)) {
        throw new Error('Invalid template number. Use 1.');
    }

    // Define paths based on template number
    const templatePath = path.join(getResumeTemplatesDirectory(), `cover-letter-template-${templateNumber}.txt`);
    const resumeDataPath = path.join(getResumeDataDirectory(), 'resume.json');

    // Check if template exists
    if (!fs.existsSync(templatePath)) {
        throw new Error(`Cover letter template ${templateNumber} not found at: ${templatePath}`);
    }

    // Read the template file
    console.log(`💌 Using cover letter template ${templateNumber}:`, templatePath);
    const templateSource = fs.readFileSync(templatePath, 'utf8');

    // Read the resume data
    console.log('Reading resume data from:', resumeDataPath);
    const resumeData = JSON.parse(fs.readFileSync(resumeDataPath, 'utf8'));

    // Compile the template
    const template = Handlebars.compile(templateSource);

    // Prepare data for template
    const templateData = {
        name: resumeData.personal_information.name,
        title: resumeData.personal_information.title,
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
        skills: resumeData.skills,
        education: resumeData.education,
        certifications_and_courses: resumeData.certifications_and_courses,
        projects: resumeData.projects,
        peripherals: resumeData.peripherals
    };

    // Generate the text content
    const text = template(templateData);

    // Initialize coverLetter array if it doesn't exist
    if (!nutNote.coverLetter) {
        nutNote.coverLetter = [];
    }

    nutNote.coverLetter.push(text);
    addOrUpdateNutNote(nutNote);
}

module.exports = { generateResume, generateCoverLetter };