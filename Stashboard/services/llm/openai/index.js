const { getJSONAsync, askOpenAI } = require('./openai');
const { Assistant } = require('./assistant');

const assistant = new Assistant();

module.exports = {
    getJSONAsync,
    askOpenAI,
    AskAssistant: assistant.AskAssistant.bind(assistant),
    CreateVectorStore: assistant.CreateVectorStore.bind(assistant)
};