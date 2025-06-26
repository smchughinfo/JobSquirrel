const path = require('path');
const fs = require('fs');
const EventEmitter = require('events');
const { askClaudeSync, askOllamaSync } = require('./llm');
const { getCacheDirectory } = require('./jobSquirrelPaths');
const { addAcornToScatterHoardingMap } = require('./scatterHoardingMap');
const cheerio = require('cheerio');

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
     * @param {string} htmlFilePath - HTML filename to process
     * @returns {Promise<string>} Processing result message
     */
    async processAcorn(fileName) {
        //const htmlFilePath = path.join(getCacheDirectory(), fileName);
        //const mdFilePath = this.convertToMarkdown(htmlFilePath)
        addAcornToScatterHoardingMap(fileName.replace(/.html$/, )); 





        return fileName;
        //return mdFilePath;
    }

    convertToMarkdown(htmlFilePath) {
        const mdFilePath = htmlFilePath.replace(/html$/, "md");

        const htmlContent = "<jobSquirrel>" + fs.readFileSync(htmlFilePath, 'utf8') + "</jobSquirrel>";
        const $ = cheerio.load(htmlContent);
        $('style').remove();
        $('script').remove();
        const element = $("jobSquirrel");
        const textContent = element.text().trim();
        
        const prompt = `Return a complete description of this job listing in .md format. Don't lose any details. Organize it into sections that are easy for a human to read:\n\n\n\n${textContent}`;
        const result = askOllamaSync(prompt);

        fs.writeFileSync(mdFilePath, result);

        return mdFilePath;
    }

    /**
     * Process all unprocessed acorn files
     * Emits events throughout the process for real-time feedback
     */
    async processAllAcorns() {
        try {
            let files = this.getUnProcessedAcorns();
            
            //files = [files[0]];
            //console.log("DOING DEBUG PROCESSING. ALL ACORNS ---> " - files.join(","))

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
                    const result = await this.processAcorn(file);
                    
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