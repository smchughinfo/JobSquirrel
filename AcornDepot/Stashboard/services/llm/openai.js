const OpenAI = require('openai');
const { zodTextFormat } = require('openai/helpers/zod');
const { z } = require('zod');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

let jsonParserModel = "gpt-4o-mini";
let completionModel = "gpt-4o-mini";

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


module.exports = {
    getJSONAsync,
    askOpenAI,
    jsonParserModel,
};