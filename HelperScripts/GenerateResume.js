const puppeteer = require('puppeteer');
const fs = require("fs");

async function htmlToPdf(htmlContent, outputPath) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setContent(htmlContent);
    // Inject the CSS for page margins
    await page.addStyleTag({
        content: `
            @page { 
                margin-top: 0.5in; 
                margin-bottom: 0.5in; 
            } 
            @page :first { 
                margin-top: 0; 
                margin-bottom: 0.5in; 
            }
        `
    })
    await page.pdf({
        path: outputPath,
        format: 'A4',
        printBackground: true,
        displayHeaderFooter: false
    });

    await browser.close();
}

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
    console.log("🐿️ Usage: node GenerateResume.js <input-html-path> <output-pdf-path>");
    console.log("📄 Example: node GenerateResume.js ResumeData/resume1.html ResumeData/resume1.pdf");
    process.exit(1);
}

const inputPath = args[0];
const outputPath = args[1];

// Check if input file exists
if (!fs.existsSync(inputPath)) {
    console.log(`⚠️ Error: Input file '${inputPath}' not found!`);
    process.exit(1);
}

console.log(`🌰 Converting ${inputPath} to ${outputPath}...`);

let html = fs.readFileSync(inputPath).toString();
htmlToPdf(html, outputPath).then(() => {
    console.log(`✅ PDF generated successfully: ${outputPath}`);
}).catch((error) => {
    console.log(`❌ Error generating PDF: ${error.message}`);
    process.exit(1);
});