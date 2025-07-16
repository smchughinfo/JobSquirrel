const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const { getResumeTemplatesDirectory, getResumeDataDirectory, getResumeJSONPath } = require('../jobSquirrelPaths');
const { addSkills, hasNewSkills, getApprovedSkills } = require('../atsAddOnSkills');
const { addOrUpdateNutNote } = require('../hoard');
const { generateSessionData } = require('./common');
const { askOpenAI, getJSONAsync } = require('../llm/openai');
const { z } = require('zod');


async function getUnmatchedSkills(nutNote) {
    const formatClause = `CRITICAL: Only include specific technologies, frameworks, programming languages, and concrete methodologies that belong in a resume's technical skills section. 

    INCLUDE: React, Python, .NET MAUI, RESTful APIs, CI/CD, Docker, AWS, Git, Agile, TDD, etc.
    EXCLUDE: Soft skills (problem solving, attention to detail, communication), generic processes (application development, optimization, app deployment), business buzzwords (leadership, teamwork).
    
    Format as clean, searchable keywords that ATS systems scan for. Remove qualifiers like "(preferred)", "advanced", "5+ years". Just the core technology name.`;
    
    const schema = z.object({
        "skillDiffs": z.object({
            matchedSkills: z.string().describe(`Technical skills found in both candidate and job requirements. ${formatClause}`),
            unmatchedSkills: z.string().describe(`Technical skills from job requirements missing from candidate's skillset. ${formatClause}`),
        })
    });
    
    let prompt = `Analyze the candidate's technical skills against job requirements. Focus ONLY on concrete, ATS-scannable technical skills.
    
    RULES:
    - Include: Programming languages, frameworks, databases, cloud platforms, development tools, specific methodologies
    - Exclude: Soft skills, generic business terms, vague processes
    - Format: Clean keywords without qualifiers (e.g., "React" not "Advanced React (5+ years)")
    
    This analysis will be used to optimize ATS keyword matching.`
    // Read resume data to get candidate skills
    const resumeDataPath = getResumeJSONPath();
    const resumeData = JSON.parse(fs.readFileSync(resumeDataPath, 'utf8'));
    
    let data = {
        candidateSkills: resumeData.skills,
        jobListingSkills: nutNote.requirements
    };

    return (await getJSONAsync(prompt, schema, JSON.stringify(data))).skillDiffs.unmatchedSkills;
}

async function generateResume(nutNote, templateNumber = 1) {
    let sessionData = generateSessionData();
    nutNote.sessionData.push(sessionData);

    let unmatchedSkills = await getUnmatchedSkills(nutNote);
    
    // Check if there are new skills that need approval
    if (hasNewSkills(unmatchedSkills)) {
        addSkills(unmatchedSkills);
        throw new Error('NEW_SKILLS_NEED_APPROVAL');
    }

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

    // Get approved ATS skills and combine with resume skills
    const approvedATSSkills = getApprovedSkills();
    const combinedSkills = [...resumeData.skills, ...approvedATSSkills];

    // Compile the template
    const template = Handlebars.compile(templateSource);

    // Prepare data for template
    const templateData = {
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

    // Generate the HTML
    const html = template(templateData);

    nutNote.html.push(html);
    addOrUpdateNutNote(nutNote);
}

async function generateCoverLetter(nutNote, templateNumber = 1) {
    let sessionData = generateSessionData();
    nutNote.sessionData.push(sessionData);

    let unmatchedSkills = await getUnmatchedSkills(nutNote);
    
    // Check if there are new skills that need approval
    if (hasNewSkills(unmatchedSkills)) {
        addSkills(unmatchedSkills);
        throw new Error('NEW_SKILLS_NEED_APPROVAL');
    }

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

    // Get approved ATS skills and combine with resume skills
    const approvedATSSkills = getApprovedSkills();
    const combinedSkills = [...resumeData.skills, ...approvedATSSkills];

    // Compile the template
    const template = Handlebars.compile(templateSource);

    // Prepare data for template
    const templateData = {
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