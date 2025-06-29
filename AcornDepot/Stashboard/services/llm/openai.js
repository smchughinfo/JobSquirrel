const fs = require('fs');
const path = require('path');

// Polyfill for Node.js versions < 20
if (!globalThis.File) {
    globalThis.File = require('node:buffer').File;
}

const OpenAI = require('openai');
const { Configuration } = require('openai/helpers/zod');
const { z } = require('zod');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

let jsonParserModel = "gpt-4o-mini";
let completionModel = "gpt-4o-mini";
let assistantModel = "gpt-4-turbo"; 

async function getJSONAsync(prompt, schema, unstructuredData) {
    let schemaName = getSingleKeyFromZodObject(schema);
    const response = await openai.responses.parse({
        model: jsonParserModel,
        input: [
            {
                role: "system",
                content: prompt,
            },
            { role: "user", content: unstructuredData },
        ],
        text: {
            format: zodTextFormat(schema, schemaName),
        },
    });

    return response.output_parsed;
}

async function askOpenAI(prompt) {
    const client = new OpenAI();
    const response = await client.responses.create({
        model: completionModel,
        input: prompt
    });
    return response;
}

function getSingleKeyFromZodObject(zodSchema) {
    if (!(zodSchema instanceof z.ZodObject)) {
        throw new Error("Schema must be a Zod object");
    }

    const shape = zodSchema.shape;
    const keys = Object.keys(shape);

    if (keys.length !== 1) {
        throw new Error(`Expected exactly one root key, but found ${keys.length}`);
    }

    return keys[0];
}

//////////////////////////////////////////////////////////////////////////////////////////////////
////////// ASSISTANT /////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////

async function AskAssistant(prompt, files=null) {
    await clearAssistantData();

    let assistant = await createAssistant(files);
    let response = await messageAssistant(assistant, prompt);

    await clearAssistantData(); 

    return response;
}

async function createAssistant(files) {
    let vectorStoreId = null;
    if(files) {
        vectorStoreId = await createVectorStore(files);
    }

    let options = {
        name: "Assistant",
        model: assistantModel,
    };

    if(vectorStoreId) {
        options.tools = [{ type: "file_search" }];
        options.tool_resources = {
            "file_search": {
                "vector_store_ids": [vectorStoreId]
            }
        }
    }

    let assistant = await openai.beta.assistants.create(options);
    return assistant;
}

async function messageAssistant(assistant, prompt) {
    let threadId = await createThread(assistant);
    await openai.beta.threads.messages.create(threadId, {
        role: "user",
        content: prompt
    });

    let run = await openai.beta.threads.runs.createAndPoll(threadId, { assistant_id: assistant.id, });
    const messages = await openai.beta.threads.messages.list(run.thread_id);
    const lastMessage = messages.data.reverse().find(m => m.role === "assistant").content[0].text.value;
    return lastMessage;
}

////////// SECOND-TIER HELPER FUNCTIONS ///////////////////////////////////////////////////////////

async function createThread(assistant) {
    let options = {}
    if (assistant?.tool_resources?.file_search?.vector_store_ids?.[0]) {
        let vectorStoreId = assistant.tool_resources.file_search.vector_store_ids[0];
        options.tool_resources = {
            "file_search": {
                "vector_store_ids": [vectorStoreId]
            }
        }
    }
    const thread = await openai.beta.threads.create(options);
    return thread.id;
}

async function uploadAssistantFiles(files) {
    let fileIds = [];

     const uploadPromises = files.map(f => uploadFile(f));
     fileIds = await Promise.all(uploadPromises);
    
    return fileIds;
}

async function uploadFile(filePath) {
    const file = await openai.files.create({
        file: fs.createReadStream(filePath),
        purpose: "assistants",
    });

    return file.id;
}

async function createVectorStore(files) {
    const vectorStoreName = "vs_job_squirrel";

    let fileIds = await uploadAssistantFiles(files);

    const vectorStore = await openai.vectorStores.create({ name: vectorStoreName });

    await openai.vectorStores.fileBatches.createAndPoll(vectorStore.id, { file_ids: fileIds });

    await waitForVectorStoreReady(vectorStore.id);

    return vectorStore.id;
}

async function waitForVectorStoreReady(vectorStoreId) {
    while (true) {
        const status = (await openai.vectorStores.retrieve(vectorStoreId)).status;
        if (status === "completed") {
            console.log("Vector store ready!");
            return;
        }
        if (status === "failed") throw new Error("Vector store failed to process files.");
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}

////////// SANITATION /////////////////////////////////////////////////////////////////////////////

async function clearAssistantData() {
    await deleteAllAssistants()
    //await deleteAllVectorStores();
    await deleteAllUploadedFiles();
}

async function deleteAllVectorStores() {
    let cursor = null;
    let totalVectorStoreCount = await countAllVectorStores();
    while (true) {
        const response = await openai.vectorStores.list({ after: cursor });
        const stores = response.data;

        let storesDeleted = 0;
        // Run deletions in parallel
        await Promise.all(stores.map(async (store) => {
            await openai.vectorStores.delete(store.id);
            console.log(`Deleting vector store: ${store.name} (id: ${store.id})`);
        }));

        if (!response.has_more) break;
        cursor = response.last_id;
    }

    console.log("All vector stores deleted.");
}

async function deleteAllUploadedFiles() {
    const allFiles = await listALLUploadedFiles();
    await Promise.all(allFiles.map(f => deleteUploadedFile(f)));
}

async function listALLUploadedFiles() {
    const files = (await openai.files.list()).data;
    
    if (files.length === 0) {
        console.log("No uploaded files found.");
        return [];
    }

    console.log(`Found ${files.length} uploaded file(s):`);
    files.forEach(file => {
        console.log(`- ${file.id} | ${file.filename} | ${file.bytes} bytes | uploaded ${new Date(file.created_at * 1000).toLocaleString()}`);
    });

    return files;
}

async function deleteUploadedFile(file) {
    await openai.files.delete(file.id);
    console.log(`Deleted ${file.filename} (${file.id})`);
}

async function deleteAllAssistants() {
    let cursor = null;

    while (true) {
        const response = await openai.beta.assistants.list({ after: cursor });
        const assistants = response.data;

        for (const assistant of assistants) {
            console.log(`Deleting assistant: ${assistant.id} (${assistant.name})`);
            await openai.beta.assistants.delete(assistant.id);
        }

        if (!response.has_more) break;
        cursor = response.last_id;
    }

    console.log("All assistants deleted.");
}


// --------------------- MOVE THIS LATER

module.exports = {
    getJSONAsync,
    askOpenAI,
    AskAssistant
};