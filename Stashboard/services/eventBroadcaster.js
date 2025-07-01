const { EventEmitter } = require('events');

class EventBroadcaster extends EventEmitter {
    constructor() {
        super();
        this.clients = new Set(); // Track connected clients
        this.chatter = (message) => console.log(`📡 EventBroadcaster: ${message}`);
    }

    // Add a new client connection
    addClient(response) {
        this.clients.add(response);
        this.chatter(`Client connected. Total clients: ${this.clients.size}`);

        // Clean up when client disconnects
        response.on('close', () => {
            this.clients.delete(response);
            this.chatter(`Client disconnected. Total clients: ${this.clients.size}`);
        });

        response.on('error', (error) => {
            this.chatter(`Client error: ${error.message}`);
            this.clients.delete(response);
        });
    }

    // Broadcast event to all connected clients
    broadcast(eventType, data = {}) {
        if (this.clients.size === 0) {
            this.chatter(`No clients connected - event discarded: ${eventType}`);
            return;
        }

        const eventData = {
            type: eventType,
            timestamp: new Date().toISOString(),
            ...data
        };

        const message = `data: ${JSON.stringify(eventData)}\n\n`;
        
        // Send to all connected clients
        const disconnectedClients = [];
        
        for (const client of this.clients) {
            try {
                client.write(message);
            } catch (error) {
                this.chatter(`Failed to send to client: ${error.message}`);
                disconnectedClients.push(client);
            }
        }

        // Clean up disconnected clients
        disconnectedClients.forEach(client => {
            this.clients.delete(client);
        });

        this.chatter(`Broadcasted '${eventType}' to ${this.clients.size} clients`);
    }

    // Convenience methods for common events
    jobQueued(jobId, filename) {
        this.broadcast('job-queued', { 
            message: `Job queued: ${filename}`,
            jobId, 
            filename 
        });
    }

    jobStarted(jobId, filename) {
        this.broadcast('job-started', { 
            message: `Processing job: ${filename}`,
            jobId, 
            filename 
        });
    }

    jobCompleted(jobId, filename, result = {}) {
        this.broadcast('job-completed', { 
            message: `Job completed: ${filename}`,
            jobId, 
            filename,
            result
        });
    }

    jobFailed(jobId, filename, error) {
        this.broadcast('job-failed', { 
            message: `Job failed: ${filename} - ${error}`,
            jobId, 
            filename,
            error: error.toString()
        });
    }

    clipboardChanged(preview) {
        this.broadcast('clipboard-changed', { 
            message: `Clipboard changed: ${preview}`,
            preview 
        });
    }

    systemStatus(status, message) {
        this.broadcast('system-status', { 
            message: `System: ${message}`,
            status, 
            details: message 
        });
    }

    llmProcessingStarted(step, details = {}) {
        this.broadcast('llm-processing-started', {
            message: `${step} - Processing with Ollama...`,
            step,
            status: 'started',
            ...details
        });
    }

    llmProcessingCompleted(step, result, preview = null) {
        this.broadcast('llm-processing-completed', {
            message: `${step} - Completed (${result.length} chars)`,
            step,
            status: 'completed',
            preview: preview || (result.length <= 100 ? result : result.substring(0, 100) + "..."),
            resultLength: result.length
        });
    }

    // Get current stats
    getStats() {
        return {
            connectedClients: this.clients.size,
            isActive: this.clients.size > 0
        };
    }
}

// Singleton instance for global use
const eventBroadcaster = new EventBroadcaster();

module.exports = { EventBroadcaster, eventBroadcaster };