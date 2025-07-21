const fs = require('fs');
const { getResumeJSONPath } = require('../../jobSquirrelPaths');
const { getJSONAsync } = require('../../llm/openai');
const { z } = require('zod');

async function getSkillDiffs(nutNote) {
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

    const aiResult = await getJSONAsync(prompt, schema, JSON.stringify(data));
    return aiResult.skillDiffs;
}

async function getUnmatchedSkills(nutNote) {
    const skillDiffs = await getSkillDiffs(nutNote);
    
    // Post-process to ensure we don't include skills that are already in resume.json
    // Sometimes AI doesn't perfectly filter, so we do a final check
    const aiSkills = skillDiffs.unmatchedSkills.split(',').map(skill => skill.trim()).filter(skill => skill.length > 0);
    
    // Read resume data to get candidate skills for filtering
    const resumeDataPath = getResumeJSONPath();
    const resumeData = JSON.parse(fs.readFileSync(resumeDataPath, 'utf8'));
    const resumeSkills = resumeData.skills.map(skill => skill.toLowerCase());
    
    const trulyUnmatchedSkills = aiSkills.filter(skill => 
        !resumeSkills.includes(skill.toLowerCase())
    );
    
    return trulyUnmatchedSkills.join(', ');
}

async function reduceSkillList(skillList, nutNote) {
    const schema = z.object({
        "reducedSkillList": z.object({
            reducedSkillList: z.array(z.string()).describe(`The reduced skill list`)
        })
    });
    
    let prompt = `Reduce this skill list to match the job listing. Include peripheral tech but try to eliminate redundancy and just in general, trim it down to a more maneagable size so a hiring manager doesn't see a jack of all trades.`
    
    // Read resume data to get candidate skills
    const resumeDataPath = getResumeJSONPath();
    const resumeData = JSON.parse(fs.readFileSync(resumeDataPath, 'utf8'));
    
    let data = {
        skillList: skillList,
        jobListing: nutNote.jobListing
    };

    const aiResult = await getJSONAsync(prompt, schema, JSON.stringify(data));
    return aiResult.reducedSkillList.reducedSkillList;
}

module.exports = { getSkillDiffs, getUnmatchedSkills, reduceSkillList };