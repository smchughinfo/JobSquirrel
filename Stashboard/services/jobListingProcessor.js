const path = require("path");
const fs = require("fs");
const { AskOllama } = require('./llm/ollama');
const { askOpenAI, getJSONAsync } = require('./llm/openai');
const { getInnerText } = require('./htmlUtilities');
const { addOrUpdateNutNote, getHoard } = require('./hoard');
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

function getUrl(rawJobListing, company, jobTitle) {
    let url = getInnerText(rawJobListing, "[data-job-squirrel-reference='url']");
    
    // Check if URL contains IDs using regex patterns
    const hasNumericId = /\d{3,}/.test(url); // 3+ consecutive digits
    const hasUuid = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i.test(url); // UUID pattern
    const hasHexId = /[a-f0-9]{6,}/i.test(url); // 6+ character hex strings
    const isJobUrl = /\/(job|career|posting|position)s?\//i.test(url); // Contains job-related path
    
    // If URL looks like it has an ID or is a proper job URL, use it
    if ((hasNumericId || hasUuid || hasHexId || isJobUrl) && url && url !== 'N/A' && url.startsWith('http')) {
        return url;
    } else {
        // Extract domain name for Google search
        let domainName = '';
        if (url && url !== 'N/A' && url.includes('.')) {
            try {
                // Extract just the domain (handle both full URLs and partial domains)
                if (url.startsWith('http')) {
                    const urlObj = new URL(url);
                    domainName = urlObj.hostname;
                } else {
                    // Handle cases like "company.com" or "www.company.com/careers"
                    domainName = url.split('/')[0].replace(/^www\./, '');
                }
            } catch (error) {
                // If URL parsing fails, try simple regex extraction
                const domainMatch = url.match(/(?:https?:\/\/)?(?:www\.)?([^\/\s]+)/);
                domainName = domainMatch ? domainMatch[1] : '';
            }
        }
        
        // Create Google search query with domain (if we have one)
        const searchTerms = domainName ? 
            `site:${domainName} ${company} ${jobTitle} job` : 
            `${company} ${jobTitle} job`;
        const searchQuery = encodeURIComponent(searchTerms);
        return `https://www.google.com/search?q=${searchQuery}`;
    }
}

async function processRawJobListing_OpenAI(rawJobListing) {
    let jobListingInnerText = getInnerText(rawJobListing);

    let extractPrompt = `Extract ONLY the detailed job posting from this page. Look for the main job that shows full details (company, title, description, requirements, salary, location). Ignore job lists, navigation, ads, and related jobs.`;
    let mdPrompt = `${extractPrompt} Return your response in markdown format. Don't wrap your responde in a code block indicating that it is markdown. Just output the markdown itself.\n\n\n\n${jobListingInnerText}`

    let json = await getJSONAsync(extractPrompt, schema, jobListingInnerText);
    let md = (await askOpenAI(mdPrompt)).output_text;

    let nutNote = json.jobPage;
    nutNote.url = getUrl(rawJobListing, nutNote.company, nutNote.jobTitle);
    nutNote.markdown = md;
    nutNote.scrapeDate = new Date();
    nutNote.collapsed = false; // Default to expanded state
    nutNote.html = [];
    nutNote.coverLetter = [];
    nutNote.pdfPath = "";
    nutNote.sessionData = [];

    console.log(`🔧 Job processed: ${nutNote.company} - ${nutNote.jobTitle}`);
    addOrUpdateNutNote(nutNote);
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

//const CLAMP_CLAUSE = `Don't start your response with "Here are your results in the requested format" or anything like that.`;
const CLAMP_CLAUSE = `Do not include any preamble, commentary, or code block formatting. Output only the final content, nothing else.`;

async function processRawJobListing_Ollama(rawJobListing) {
    try {
        const jobListingText = getInnerText(rawJobListing);

        const firstPass = await AskOllama("First Pass", `Extract ONLY the detailed job posting from this page. Look for the main job that shows full details (company, title, description, requirements, salary, location). Ignore job lists, navigation, ads, and related jobs. Return ONLY the complete text of the one detailed job posting:\n\n\n\n${jobListingText}`, true);
        const markdown = await AskOllama("Convert to Markdown", `Convert this to markdown. ${CLAMP_CLAUSE}\n\n\n\n${firstPass}`, true);
        
        let json = await AskOllama("Convert to JSON", generateJSONPrompt(markdown), true);
        json = await AskOllama("Clean JSON", `Can you fix any formatting errors with this JSON (don't edit any of the values). If there are formatting errors just return it as it. ${CLAMP_CLAUSE}. Just output JSON:\n\n${json}`, true);

        let nutNote = JSON.parse(json);
        nutNote.url = getInnerText(rawJobListing, "[data-job-squirrel-reference='url']");
        nutNote.rawJobListing = rawJobListing;
        nutNote.firstPass = firstPass;
        nutNote.markdown = markdown;
        nutNote.collapsed = false; // Default to expanded state
        nutNote.scrapeDate = new Date();
        nutNote.html = "";
        nutNote.coverLetter = [];
        nutNote.pdfPath = "";
        nutNote.sessionData = [];

        console.log(`🔧 Job processed: ${nutNote.company} - ${nutNote.jobTitle}`);
        addOrUpdateNutNote(nutNote);
        
    } catch (error) {
        console.error(`🔧 Job processing failed: ${error.message}`);
        
        eventBroadcaster.broadcast('job-processing-failed', {
            error: error.message,
            message: `Job processing failed: ${error.message}`
        });
        
        throw error;
    }
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