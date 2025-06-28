const path = require("path");
const fs = require("fs");
const { askOllamaSync } = require('./llm/ollama');
const { getJSONAsync } = require('./llm/openai');
const { getInnerText } = require('./htmlUtilities');
const { addNutNote, getHoard } = require('./hoard');
const { eventBroadcaster } = require('./eventBroadcaster');
const { z } = require('zod');

async function processRawJobListing(rawJobListing) {
    let model = "OpenAI";
    if(model == "OpenAI") {
        await processRawJobListing_OpenAI(rawJobListing);
    }
    else if (model == "Ollama"){
        await processRawJobListing_Ollama(rawJobListing);
    }
}

//////////////////////////////////////////////////////////////////////////////////////////////////
////////// OpenAI ////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////

async function processRawJobListing_OpenAI(rawJobListing) {

    const schema = z.object({
        "jobPage": z.object({
            company: z.string().describe("The complete company name exactly as it appears, including all legal entity suffixes (LLC, Inc, Corp, Ltd, etc.), punctuation, and formatting. Use the most official and complete version found. Examples: 'Govcio LLC' not 'GovCIO', 'Apple Inc.' not 'Apple'"),
            jobTitle: z.string().describe("The exact job title as posted, preserving all original formatting, abbreviations, punctuation, and capitalization. Do not paraphrase or shorten. Examples: 'Sr. Software Engineer' not 'Senior Software Engineer', 'Full Stack Developer/Architect' not 'Full Stack Developer'"),
            salary: z.string().describe("Salary range/amount or 'N/A' if not specified"),
            requirements: z.array(z.string()).describe("Array of key skills/qualifications required"),
            jobSummary: z.string().describe("Brief 2-3 sentence description of the role"),
            location: z.string().describe("Work location (remote/hybrid/on-site/city) or 'N/A'")  
        })
    });
        rawJobListing = getInnerText(rawJobListing);

                let prompt = `Extract ONLY the detailed job posting from this page. Look for the main job that shows full details (company, title, description, requirements, salary, location). Ignore job lists, navigation, ads, and related jobs.`;
                let response = await getJSONAsync(prompt, schema, rawJobListing);
                let nutNote = response.jobPage;
                nutNote.url = getInnerText(rawJobListing, "[data-job-squirrel-reference='url']");
                nutNote.rawJobListing = rawJobListing;
                nutNote.firstPass = "";
                nutNote.markdown = "";

                console.log(`🔧 Job processed: ${nutNote.company} - ${nutNote.jobTitle}`);
                addNutNote(nutNote);
}

//////////////////////////////////////////////////////////////////////////////////////////////////
/// OLLAMA (PROBABLY DEPRECATED. IT DOES WORK BUT 4o-mini IS MUCH BETTER AND FASTER AND CHEAP) ///
//////////////////////////////////////////////////////////////////////////////////////////////////

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

async function processRawJobListing_Ollama(rawJobListing) {
    try {
        const jobListingText = getInnerText(rawJobListing);

        const firstPass = await askOllamaAndLogWithImmediate("FIRST PASS", `Extract ONLY the detailed job posting from this page. Look for the main job that shows full details (company, title, description, requirements, salary, location). Ignore job lists, navigation, ads, and related jobs. Return ONLY the complete text of the one detailed job posting:\n\n\n\n${jobListingText}`);
        const markdown = await askOllamaAndLogWithImmediate("SECOND PASS", `Conver this to markdown. ${clampClause}\n\n\n\n${firstPass}`);
        
        let json = await askOllamaAndLogWithImmediate("GENERATE JSON", generateJSONPrompt(markdown));
        json = await askOllamaAndLogWithImmediate("FIX JSON", `Can you fix any formatting errors with this JSON (don't edit any of the values). If there are formatting errors just return it as it. ${clampClause}. Just output JSON:\n\n${json}`);

        let nutNote = JSON.parse(json);
        nutNote.url = getInnerText(rawJobListing, "[data-job-squirrel-reference='url']");
        nutNote.rawJobListing = rawJobListing;
        nutNote.firstPass = firstPass;
        nutNote.markdown = markdown;

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