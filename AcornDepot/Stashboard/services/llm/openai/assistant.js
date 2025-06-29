const fs = require('fs');
const { getResumeDataVectorStoreIdPath } = require('../../jobSquirrelPaths');
const { eventBroadcaster } = require('../../eventBroadcaster');

if (!globalThis.File) {
    globalThis.File = require('node:buffer').File;
}

const OpenAI = require('openai');

class Assistant {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
        this.assistantModel = "gpt-4-turbo";
    }

    async AskAssistant(prompt, useVectorStore = false) {
        eventBroadcaster.broadcast('assistant-started', { message: 'Starting assistant query', prompt: prompt.substring(0, 100) + '...' });
        await this.clearAssistantData();
        eventBroadcaster.broadcast('assistant-cleanup', { message: 'Cleared existing assistant data' });
        let assistant = await this.createAssistant(useVectorStore);
        eventBroadcaster.broadcast('assistant-created', { message: 'Assistant created successfully' });
        let response = await this.messageAssistant(assistant, prompt);
        await this.clearAssistantData();
        eventBroadcaster.broadcast('assistant-completed', { message: 'Assistant query completed successfully' });
        return response;
    }

    async CreateVectorStore(filePathArray) {
        eventBroadcaster.broadcast('vector-store-started', { message: `Starting vector store creation with ${filePathArray.length} files` });
        await this.clearUploadsData();
        eventBroadcaster.broadcast('vector-store-cleanup', { message: 'Cleared existing upload data' });
        let vectorStoreId = await this.createVectorStore(filePathArray);
        fs.writeFileSync(getResumeDataVectorStoreIdPath(), vectorStoreId);
        eventBroadcaster.broadcast('vector-store-completed', { message: 'Vector store created and saved successfully', vectorStoreId });
        return vectorStoreId;
    }

    async createAssistant(useVectorStore) {
        let vectorStoreId = null;
        if (useVectorStore) {
            vectorStoreId = fs.readFileSync(getResumeDataVectorStoreIdPath(), 'utf8').trim();
        }

        let options = {
            name: "Assistant",
            model: this.assistantModel,
        };

        if (vectorStoreId) {
            options.tools = [{ type: "file_search" }];
            options.tool_resources = {
                "file_search": {
                    "vector_store_ids": [vectorStoreId]
                }
            }
        }

        let assistant = await this.openai.beta.assistants.create(options);
        return assistant;
    }

    async messageAssistant(assistant, prompt) {
        eventBroadcaster.broadcast('assistant-thread-creating', { message: 'Creating conversation thread' });
        let threadId = await this.createThread(assistant);
        await this.openai.beta.threads.messages.create(threadId, {
            role: "user",
            content: prompt
        });
        eventBroadcaster.broadcast('assistant-processing', { message: 'Assistant is processing your request...' });
        let run = await this.openai.beta.threads.runs.createAndPoll(threadId, { assistant_id: assistant.id, });
        eventBroadcaster.broadcast('assistant-retrieving', { message: 'Retrieving assistant response' });
        const messages = await this.openai.beta.threads.messages.list(run.thread_id);
        eventBroadcaster.broadcast('assistant-response-ready', { message: 'Assistant response received' });
        const lastMessage = messages.data.reverse().find(m => m.role === "assistant").content[0].text.value;
        return lastMessage;
    }

    async createThread(assistant) {
        let options = {}
        if (assistant?.tool_resources?.file_search?.vector_store_ids?.[0]) {
            let vectorStoreId = assistant.tool_resources.file_search.vector_store_ids[0];
            options.tool_resources = {
                "file_search": {
                    "vector_store_ids": [vectorStoreId]
                }
            }
        }
        const thread = await this.openai.beta.threads.create(options);
        return thread.id;
    }

    async uploadAssistantFiles(files) {
        let fileIds = [];
        const uploadPromises = files.map(f => this.uploadFile(f));
        fileIds = await Promise.all(uploadPromises);
        return fileIds;
    }

    async uploadFile(filePath) {
        const file = await this.openai.files.create({
            file: fs.createReadStream(filePath),
            purpose: "assistants",
        });
        return file.id;
    }

    async createVectorStore(filePathArray) {
        const vectorStoreName = "vs_job_squirrel";
        let fileIds = await this.uploadAssistantFiles(filePathArray);
        const vectorStore = await this.openai.vectorStores.create({ name: vectorStoreName });
        await this.openai.vectorStores.fileBatches.createAndPoll(vectorStore.id, { file_ids: fileIds });
        await this.waitForVectorStoreReady(vectorStore.id);
        return vectorStore.id;
    }

    async waitForVectorStoreReady(vectorStoreId) {
        while (true) {
            const status = (await this.openai.vectorStores.retrieve(vectorStoreId)).status;
            if (status === "completed") {
                return;
            }
            if (status === "failed") throw new Error("Vector store failed to process files.");
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    async clearAssistantData() {
        await this.deleteAllAssistants();
    }
    
    async clearUploadsData() {
        //await this.deleteAllVectorStores();
        await this.deleteAllUploadedFiles();
    }

    async deleteAllUploadedFiles() {
        const allFiles = await this.listAllUploadedFiles();
        await Promise.all(allFiles.map(f => this.deleteUploadedFile(f)));
    }

    async listAllUploadedFiles() {
        const files = (await this.openai.files.list()).data;
        return files;
    }

    async deleteUploadedFile(file) {
        await this.openai.files.delete(file.id);
    }

    async deleteAllAssistants() {
        let cursor = null;
        while (true) {
            const response = await this.openai.beta.assistants.list({ after: cursor });
            const assistants = response.data;
            for (const assistant of assistants) {
                await this.openai.beta.assistants.delete(assistant.id);
            }
            if (!response.has_more) break;
            cursor = response.last_id;
        }
    }

    async deleteAllVectorStores() {
        let cursor = null;
        let totalVectorStoreCount = await countAllVectorStores();
        while (true) {
            const response = await this.openai.vectorStores.list({ after: cursor });
            const stores = response.data;

            let storesDeleted = 0;

            await Promise.all(stores.map(async (store) => {
                await this.openai.vectorStores.delete(store.id);
                console.log(`Deleting vector store: ${store.name} (id: ${store.id})`);
            }));

            if (!response.has_more) break;
            cursor = response.last_id;
        }
    }
}

module.exports = { Assistant };