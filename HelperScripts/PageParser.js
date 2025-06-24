const fs = require('fs');
const cheerio = require('cheerio');

function parseHTML(filePath, selector) {
    try {
        // Read the HTML file
        const htmlContent = fs.readFileSync(filePath, 'utf8');
        
        // Load HTML into Cheerio
        const $ = cheerio.load(htmlContent);
        
        // Find element using CSS selector
        const element = $(selector);
        
        if (element.length === 0) {
            throw new Error(`Element not found for selector: ${selector}`);
        }
        
        // Extract text content (automatically handles nested elements)
        const textContent = element.text().trim();
        
        return textContent;
        
    } catch (error) {
        console.error('Error parsing HTML:', error.message);
        process.exit(1);
    }
}

// Command line usage
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
        console.error('Usage: node PageParse.js <file-path> <css-selector>');
        process.exit(1);
    }
    
    const [filePath, selector] = args;
    const result = parseHTML(filePath, selector);
    console.log(result);
}

module.exports = { parseHTML };