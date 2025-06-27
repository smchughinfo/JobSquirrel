const path = require("path");
const fs = require("fs");
const { askOllamaSync } = require('./llm');
const { getInnerText } = require('./htmlUtilities');
const { addNutNote } = require('./hoard');
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

async function processRawJobListing(rawJobListing) {
    try {
        const jobListingText = getInnerText(rawJobListing);

        const firstPass = await askOllamaAndLogWithImmediate("FIRST PASS", `This is the innerText of a job site seach page. It contains a list of jobs but only one of them is shown in detail. Remove all information from the jobs that are not shown in detail and return the full text of the job that is shown in detail. Dont start your response with "Here are the results you requested" or anything like that. Just output the job listing:\n\n\n\n${jobListingText}`);
        
        let json = await askOllamaAndLogWithImmediate("GENERATE JSON", generateJSONPrompt(firstPass));
        json = await askOllamaAndLogWithImmediate("FIX JSON", `Can you fix any formatting errors with this JSON (don't edit any of the values). If there are formatting errors just return it as it. Don't start your response with "Here are your results in the requested format" or anything like that. Just output JSON:\n\n${json}`);
        
        json = JSON.parse(json);
        json.url = getInnerText(rawJobListing, "[data-job-squirrel-reference='url']");
        
        console.log(`🔧 Job processed: ${json.company} - ${json.jobTitle}`);
        addNutNote(json);
        
    } catch (error) {
        console.error(`🔧 Job processing failed: ${error.message}`);
        
        eventBroadcaster.broadcast('job-processing-failed', {
            error: error.message,
            message: `Job processing failed: ${error.message}`
        });
        
        throw error;
    }
}

function askOllamaAndLogWithImmediate(logName, prompt) {
    return new Promise((resolve, reject) => {
        try {
            eventBroadcaster.llmProcessingStarted(logName);
            
            setTimeout(() => {
                try {
                    const result = askOllamaSync(prompt);
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