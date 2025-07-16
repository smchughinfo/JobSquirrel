const { EventEmitter } = require('events');

class GenerationQueue extends EventEmitter {
    constructor() {
        super();
        this.queue = [];
        this.isProcessing = false;
    }

    async add(generationFunction, ...args) {
        return new Promise((resolve, reject) => {
            this.queue.push({
                fn: generationFunction,
                args: args,
                resolve: resolve,
                reject: reject
            });
            
            this.processNext();
        });
    }

    async processNext() {
        if (this.isProcessing || this.queue.length === 0) {
            return;
        }

        this.isProcessing = true;
        const item = this.queue.shift();

        try {
            console.log(`🔄 Processing generation queue item (${this.queue.length} remaining)`);
            const result = await item.fn(...item.args);
            item.resolve(result);
        } catch (error) {
            console.error('❌ Generation queue item failed:', error);
            item.reject(error);
        } finally {
            this.isProcessing = false;
            // Process next item if any
            if (this.queue.length > 0) {
                setImmediate(() => this.processNext());
            }
        }
    }

    getStatus() {
        return {
            queueLength: this.queue.length,
            isProcessing: this.isProcessing
        };
    }
}

// Create singleton instance
const generationQueue = new GenerationQueue();

module.exports = { generationQueue };