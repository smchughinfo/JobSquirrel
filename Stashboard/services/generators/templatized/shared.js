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

async function reduceSkillList_OLD(skillList, nutNote) {
    const schema = z.object({
        "reducedSkillList": z.object({
            reducedSkillList: z.array(z.string()).describe(`The reduced skill list`)
        })
    });
    
    let prompt = `Reduce this skill list slightly to match the job listing. Don't add any new skills to your output. Only reduce the size of skillList. Use a light touch and include peripheral skills but throw out redundances and obvious misfits.`
    
    // Read resume data to get candidate skills
    const resumeDataPath = getResumeJSONPath();
    const resumeData = JSON.parse(fs.readFileSync(resumeDataPath, 'utf8'));
    
    let data = {
        skillList: skillList,
        jobListing: nutNote.jobSummary + "\n\nRequirements:\n\n" + nutNote.requirements.join(",")
    };

    const aiResult = await getJSONAsync(prompt, schema, JSON.stringify(data));
    return aiResult.reducedSkillList.reducedSkillList;
}

async function reduceSkillList(skillList, nutNote) {
    let skillMatchList = {};
    skillList.forEach(skill => {
        skillMatchList[skill] = z.boolean().describe(`True if the skill matches the job listing. False if the skill does not match the job listing.`)
    });
    const schema = z.object({ "skillMatchList": z.object(skillMatchList) });
    
    let prompt = `Mark each skill as True or False depending on whether or not it matches the job listing. It doesn't have to match 100% perfectly. Peripheral matches are okay. For example if the job listing is for web development then include the skill if it's related to web development, even though it's not mentioned in the job description. Only consider the skill to not match if it's extremely different.`;    
    let data = {
        skillList: skillList,
        jobListing: nutNote.jobSummary + "\n\nRequirements:\n\n" + nutNote.requirements.join(",")
    };

    const aiResult = await getJSONAsync(prompt, schema, JSON.stringify(data));
    const matchedSkills = skillList.filter(skill => aiResult.skillMatchList[skill]);
    return matchedSkills;
}

// this doesn't work either. it's too hard to explain what you want it to do in a general way.
async function removeRedundantSkills(skillList) {
    const schema = z.object({
        "reducedSkillList": z.object({
            reducedSkillList: z.array(z.string()).describe(`The reduced skill list`)
        })
    });
    
    let prompt = `If there are any skills in this list that are exactly the same but spelled or phrased differently remove the redundant instance(s) and keep the more canonical instance.`
    
    let data = {
        skillList: skillList
    };

    const aiResult = await getJSONAsync(prompt, schema, JSON.stringify(data));
    return aiResult.reducedSkillList.reducedSkillList;
}

module.exports = { getSkillDiffs, getUnmatchedSkills, reduceSkillList, removeRedundantSkills };