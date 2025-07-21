const fs = require('fs');
const { getResumeJSONPath } = require('../../jobSquirrelPaths');
const { getJSONAsync } = require('../../llm/openai');
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

    const aiResult = (await getJSONAsync(prompt, schema, JSON.stringify(data))).skillDiffs.unmatchedSkills;
    
    // Post-process to ensure we don't include skills that are already in resume.json
    // Sometimes AI doesn't perfectly filter, so we do a final check
    const aiSkills = aiResult.split(',').map(skill => skill.trim()).filter(skill => skill.length > 0);
    const resumeSkills = resumeData.skills.map(skill => skill.toLowerCase());
    
    const trulyUnmatchedSkills = aiSkills.filter(skill => 
        !resumeSkills.includes(skill.toLowerCase())
    );
    
    return trulyUnmatchedSkills.join(', ');
}

module.exports = { getUnmatchedSkills };