const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const { getResumeTemplatesDirectory, getResumeJSONPath } = require('../../jobSquirrelPaths');
const { addSkills, hasNewSkills, getApprovedSkillsFromList, getApprovedSkills } = require('../../atsAddOnSkills');
const { addOrUpdateNutNote } = require('../../hoard');
const { generateSessionData } = require('../common');
const { getSkillDiffs, reduceSkillList, removeRedundantSkills } = require('./shared');
const { getJSONAsync } = require('../../llm/openai/openai');
const { z } = require('zod');

function validateResumeTemplate(templateNumber) {
    if (![1, 2, 3].includes(templateNumber)) {
        throw new Error('Invalid template number. Use 1, 2, or 3.');
    }
}

function getResumePaths(templateNumber) {
    const templatePath = path.join(getResumeTemplatesDirectory(), `resume-template-${templateNumber}.html`);
    const resumeDataPath = getResumeJSONPath();
    
    if (!fs.existsSync(templatePath)) {
        throw new Error(`Template ${templateNumber} not found at: ${templatePath}`);
    }
    
    if (!resumeDataPath || !fs.existsSync(resumeDataPath)) {
        throw new Error(`Resume data file not found at: ${resumeDataPath}. Please configure a resume profile.`);
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
        professionalSummary: resumeData.personal_information.professionalSummary,
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

async function generateResume(nutNote, templateNumber = 1, tailor = true, atsAddOns = false, reduce = false, removeRedundancies = false) {
    let sessionData = generateSessionData();
    nutNote.sessionData.push(sessionData);

    validateResumeTemplate(templateNumber);
    
    const { templatePath, resumeDataPath } = getResumePaths(templateNumber);
    const templateSource = loadResumeTemplate(templatePath, templateNumber);
    let resumeData = loadResumeData(resumeDataPath);
    const skillList = await getSkills(resumeData, nutNote, atsAddOns, reduce, removeRedundancies);

    if(tailor) {
        resumeData = await tailorResumeData(nutNote, resumeData);
    }

    // Compile the template
    const template = Handlebars.compile(templateSource);

    const templateData = prepareResumeTemplateData(resumeData, nutNote, skillList);

    // Generate the HTML
    const html = template(templateData);

    saveResumeAndUpdateNutNote(html, nutNote);
}

// 4o and 4o-mini don't perform well on this one. but with future models this code may work...
async function tailorResumeData(nutNote, resumeData) {

    const schema = z.object({
        "tailoredJobResponsibilities": z.object({
            tailoredJobResponsibilities: z.array(z.string()).describe("The revised responsibilities, tailored to match the provided job listing.")
        })
    });

    // Create a copy to avoid mutating the original
    const tailoredResumeData = JSON.parse(JSON.stringify(resumeData));

    for(const i in tailoredResumeData.experience) {
        let job = tailoredResumeData.experience[i];
        let data = { 
            jobResponsibilitiesFromResume: job.responsibilities, 
            jobApplicantSkills: resumeData.skills,
            jobListing: nutNote.jobListing || nutNote.requirements || nutNote.description
        };
        
        let result = await getJSONAsync("Each jobResponsibility here is from a resume. Make subtle changes to tailor it to the provided job listing. Don't change the actual skills used in each responsibility, only subtly reword or repaint to fit the job listing. If the job responsibility already closely matches the job listing, don't change it at all. The job applicant's full skill list is in jobApplicantSkills.", schema, JSON.stringify(data));
        
        // Extract the tailored responsibilities and update the job
        if (result && result.tailoredJobResponsibilities && result.tailoredJobResponsibilities.tailoredJobResponsibilities) {
            tailoredResumeData.experience[i].responsibilities = result.tailoredJobResponsibilities.tailoredJobResponsibilities;
        }
    }
    
    return tailoredResumeData;
}

async function getSkills(resumeData, nutNote, atsAddOns, reduce, removeRedundancies) {
    let skillList = resumeData.skills;
    
    if(atsAddOns) {
        const skillDiffs = await getSkillDiffs(nutNote);
        let unmatchedSkills = skillDiffs.unmatchedSkills;
    
        // Check if there are new skills that need approval (only if not already reviewed)
        if (!nutNote.skillsReviewed && hasNewSkills(unmatchedSkills)) {
            addSkills(unmatchedSkills);
            nutNote.skillsReviewed = true; // Mark as reviewed
            throw new Error('NEW_SKILLS_NEED_APPROVAL');
        }
        
        // Get approved skills from the current job's unmatched skills
        const approvedCurrentJobSkills = getApprovedSkillsFromList(unmatchedSkills);
        
        // Get all approved skills from the ATS library
        const approvedLibrarySkills = getApprovedSkills();
        
        // Combine all skill sources: base resume skills + job-specific skills + library skills
        const allAdditionalSkills = [...approvedCurrentJobSkills, ...approvedLibrarySkills];
        skillList = combineSkillsWithoutDuplicates(resumeData.skills, allAdditionalSkills);
    }

    if(reduce) {
        skillList = await reduceSkillList(skillList, nutNote);
    }

    if(removeRedundancies) {
        skillList = await removeRedundantSkills(skillList);
    }
    
    return skillList;
}

module.exports = { generateResume };