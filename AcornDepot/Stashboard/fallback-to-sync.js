// Fallback approach - use sync but with immediate event broadcasting
const { eventBroadcaster } = require('./services/eventBroadcaster');
const { askOllamaSync } = require('./services/llm');

console.log('🧪 Testing sync with immediate events...');

function askOllamaAndLogImmediate(logName, prompt) {
    // Broadcast start event immediately
    eventBroadcaster.llmProcessingStarted(logName);
    console.log(`🧠 Broadcasting start event for ${logName}`);
    
    // Add a small delay to let the event broadcast 
    setTimeout(() => {
        console.log(`🧠 Event should have been sent, now calling sync Ollama for ${logName}`);
        
        try {
            const result = askOllamaSync(prompt);
            
            // Broadcast completion event immediately
            eventBroadcaster.llmProcessingCompleted(logName, result);
            console.log(`🧠 Broadcasting completion event for ${logName}`);
            
        } catch (error) {
            console.error(`🧠 ERROR in ${logName}: ${error.message}`);
            eventBroadcaster.broadcast('llm-processing-failed', {
                step: logName,
                error: error.message,
                message: `${logName} failed: ${error.message}`
            });
        }
    }, 100); // Small delay to let event go out
}

// Test sync approach with immediate broadcasting
askOllamaAndLogImmediate('TEST SYNC', "Say exactly: 'Hello from sync test'");

console.log('🧪 Sync test initiated - events should appear immediately');