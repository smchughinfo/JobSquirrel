const path = require("path");
const fs = require("fs");
const { askOllamaSync } = require('./llm');
const { getInnerText } = require('./htmlUtilities');
const { addNutNote, getHoard } = require('./hoard');
const { eventBroadcaster } = require('./eventBroadcaster');

const jsonExample = `
{
    "company": "string - The company name",
    "jobTitle": "string - The job title/position",
    "salary": "string - Salary range/amount or 'N/A' if not specified",
    "requirements": ["string", "string", "string"] - Array of key skills/qualifications required,
    "jobSummary": "string - Brief 2-3 sentence description of the role",
    "location": "string - Work location (remote/hybrid/on-site/city) or 'N/A'"
}`;

const clampClause = `Don't start your response with "Here are your results in the requested format" or anything like that.`;

async function processRawJobListing(rawJobListing) {
    try {
        const jobListingText = getInnerText(rawJobListing);

        const firstPass = await askOllamaAndLogWithImmediate("FIRST PASS", `Extract ONLY the detailed job posting from this page. Look for the main job that shows full details (company, title, description, requirements, salary, location). Ignore job lists, navigation, ads, and related jobs. Return ONLY the complete text of the one detailed job posting:\n\n\n\n${jobListingText}`);
        const markdown = await askOllamaAndLogWithImmediate("SECOND PASS", `Conver this to markdown. ${clampClause}\n\n\n\n${firstPass}`);
        
        let json = await askOllamaAndLogWithImmediate("GENERATE JSON", generateJSONPrompt(markdown));
        //json = await askOllamaAndLogWithImmediate("FIX JSON", `Can you fix any formatting errors with this JSON (don't edit any of the values). If there are formatting errors just return it as it. ${clampClause}. Just output JSON:\n\n${json}`);

        let nutNote = JSON.parse(json);
        nutNote.url = getInnerText(rawJobListing, "[data-job-squirrel-reference='url']");
        nutNote.rawJobListing = rawJobListing;
        nutNote.firstPass = firstPass;
        nutNote.markdown = markdown;

        nutNote = bumpCompanyAndJobTitle(nutNote);

        console.log(`🔧 Job processed: ${nutNote.company} - ${nutNote.jobTitle}`);
        addNutNote(nutNote);
        
    } catch (error) {
        console.error(`🔧 Job processing failed: ${error.message}`);
        
        eventBroadcaster.broadcast('job-processing-failed', {
            error: error.message,
            message: `Job processing failed: ${error.message}`
        });
        
        throw error;
    }
}

function bumpCompanyAndJobTitle(nutNote) {
    let hoard = getHoard();
    let companies = hoard.jobListings.map(n => n.company).join('|||||');
    let jobTitles = hoard.jobListings.map(n => n.jobTitle).join('|||||');

    const clampCommand = `Don't start your response with "Here are the results you requested" or anything like that. Just output the value.`;
    
    const normalizeCompanyPrompt = `Does this company: ${nutNote.company}\n\nExist anywhere in the following list of companies:\n${companies}\n\nIf so, which one? Return either NO or the company name from the list. Account for minor variations in the company's name when doing your evaluation. ${clampCommand}`;
    const normalizeCompanyResponse = askOllamaSync(normalizeCompanyPrompt);

    const normalizeJobTitlePrompt = `Does this job title: ${nutNote.jobTitle}\n\nExist anywhere in the following list of job titles:\n${jobTitles}\n\nIf so, which one? Return either NO or the job title from the list. Account for minor variations in the job title when doing your evaluation. ${clampCommand}`;
    const normalizeJobTitleResponse = askOllamaSync(normalizeJobTitlePrompt);

    const preExistingCompany = normalizeCompanyResponse != "NO";
    const preExistingJobTitle = normalizeJobTitleResponse != "NO";
    if(preExistingCompany && preExistingJobTitle) {
        nutNote.company = normalizeCompanyResponse;
        nutNote.jobTitle = normalizeJobTitleResponse;
    }
    return nutNote;
}


function askOllamaAndLogWithImmediate(logName, prompt, model = 'llama3:latest') {
    return new Promise((resolve, reject) => {
        try {
            eventBroadcaster.llmProcessingStarted(logName);
            
            setTimeout(() => {
                try {
                    const result = askOllamaSync(prompt, model);
                    eventBroadcaster.llmProcessingCompleted(logName, result);
                    resolve(result);
                } catch (error) {
                    console.error(`🧠 ${logName} failed: ${error.message}`);
                    eventBroadcaster.broadcast('llm-processing-failed', {
                        step: logName,
                        error: error.message,
                        message: `${logName} failed: ${error.message}`
                    });
                    reject(error);
                }
            }, 10);
            
        } catch (error) {
            console.error(`🧠 Setup error in ${logName}: ${error.message}`);
            reject(error);
        }
    });
}

function generateJSONPrompt(firstPass) {
    return `You are a precise job listing parser. Extract information from the job listing below and return ONLY valid JSON in the exact format specified.

CRITICAL REQUIREMENTS:
- Return ONLY the JSON object, no explanatory text
- All fields must be strings EXCEPT "requirements" which must be an array of strings
- If information is missing, use "N/A" for strings or [] for requirements array
- Ensure all quotes are properly escaped
- Do not add fields not shown in the format

REQUIRED JSON FORMAT:
${jsonExample}

EXAMPLE OUTPUT:
{
    "company": "Acme Corp",
    "jobTitle": "Software Engineer",
    "salary": "$80,000 - $100,000",
    "requirements": ["JavaScript", "React", "3+ years experience"],
    "jobSummary": "Develop and maintain web applications using modern technologies.",
    "location": "Remote"
}

JOB LISTING TO PARSE:
${firstPass}`
}

module.exports = {
    processJobListing: processRawJobListing
};