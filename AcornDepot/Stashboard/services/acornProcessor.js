const path = require('path');
const fs = require('fs');
const EventEmitter = require('events');
const { askClaudeSync } = require('./llm');
const { getCacheDirectory } = require('./jobSquirrelPaths');

/**
 * Event-driven AcornProcessor for converting job HTML files to markdown
 * Emits events: start, progress, result, error, cancelled, complete
 */
class AcornProcessor extends EventEmitter {
    constructor() {
        super();
        this.cancelled = false;
    }

    /**
     * Get list of HTML files that don't have corresponding MD files
     * @returns {Array} Array of unprocessed HTML filenames
     */
    getUnProcessedAcorns() {
        const cacheDir = getCacheDirectory();
        console.log(`🌰 Looking for cached files in: ${cacheDir}`);

        const htmlFiles = fs.readdirSync(cacheDir).filter(f => f.endsWith(".html"));
        const mdFiles = fs.readdirSync(cacheDir).filter(f => f.endsWith(".md"));
        let unprocessedFiles = [];
        
        htmlFiles.forEach(html => {
            const baseName = html.replace(/\.html$/, "");
            const hasProcessedVersion = mdFiles.some(md => md.replace(/\.md$/, "") === baseName);
            
            if (!hasProcessedVersion) {
                // Return just the filename, not the full path
                unprocessedFiles.push(html);
            }
        });

        console.log(`🌰 Found ${htmlFiles.length} HTML files, ${mdFiles.length} MD files`);
        console.log(`🌰 ${unprocessedFiles.length} unprocessed acorns`);
        
        return unprocessedFiles;
    }

    /**
     * Process a single HTML file with Claude/Ollama
     * @param {string} filename - HTML filename to process
     * @returns {Promise<string>} Processing result message
     */
    async processFile(filename) {
        console.log("OKAY GONNA PROCESS " + filename);
        // 1. convert 
        //const messageToClaude = `Hi Claude, can you copy what you see in ${filename}. to a file called ${filename.replace(/html$/, "")}md.`;
        
        // Use Claude for now, can be swapped for Ollama later
        //const result = askClaudeSync(messageToClaude);
        
        //return result;
    }

    /**
     * Process all unprocessed acorn files
     * Emits events throughout the process for real-time feedback
     */
    async processAllAcorns() {
        try {
            let files = this.getUnProcessedAcorns();
            
            files = [files[0]];
            console.log("DOING DEBUG PROCESSING. ALL ACORNS ---> " - files.join(","))

            // Emit start event
            this.emit('start', { 
                total: files.length,
                message: `Processing ${files.length} acorns...`
            });

            // Process each file sequentially
            for (let index = 0; index < files.length; index++) {
                // Check for cancellation
                if (this.cancelled) {
                    console.log('🔪 Acorn processing cancelled by user');
                    this.emit('cancelled', { 
                        message: 'Acorn processing cancelled by user'
                    });
                    return;
                }

                const file = files[index];
                
                // Emit progress event
                this.emit('progress', {
                    file: file,
                    index: index + 1,
                    total: files.length,
                    message: `Processing file ${index + 1}/${files.length}: ${file}`
                });

                try {
                    console.log(`🐿️ [${new Date().toISOString()}] Starting file ${index + 1}: ${file}`);
                    
                    // Process the file
                    const result = await this.processFile(file);
                    
                    console.log(`🐿️ [${new Date().toISOString()}] Completed file ${index + 1}: ${file}`);
                    
                    // Emit result event
                    this.emit('result', {
                        file: file,
                        result: result,
                        index: index + 1,
                        total: files.length
                    });
                    
                } catch (error) {
                    console.log(`🐿️ [${new Date().toISOString()}] Error with file ${index + 1}: ${file} - ${error.message}`);
                    
                    // Emit error event
                    this.emit('error', {
                        file: file,
                        error: error.message,
                        index: index + 1,
                        total: files.length
                    });
                }

                // Small delay for streaming purposes
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Emit completion event
            if (!this.cancelled) {
                this.emit('complete', {
                    message: 'All acorns processed!',
                    totalProcessed: files.length
                });
            }

        } catch (error) {
            this.emit('error', {
                error: `Failed to start processing: ${error.message}`
            });
        }
    }

    /**
     * Cancel the processing operation
     */
    cancel() {
        console.log('🔪 Cancelling acorn processing...');
        this.cancelled = true;
    }

    /**
     * Reset the processor for reuse
     */
    reset() {
        this.cancelled = false;
    }
}

module.exports = {
    AcornProcessor,
    // Export the legacy function for backward compatibility during transition
    getUnProcessedAcorns: () => {
        const processor = new AcornProcessor();
        return processor.getUnProcessedAcorns();
    }
};