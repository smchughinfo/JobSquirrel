const puppeteer = require('puppeteer');
const fs = require("fs");
const { getResumePDFPath } = require('./jobSquirrelPaths');

async function htmlToPdf(htmlContent, companyName, jobTitle, marginInches = 0) {
    const outputPath = getResumePDFPath(`Resume For ${jobTitle} - ${companyName}`);
    
    // Ensure the GeneratedResumes directory exists
    const outputDir = require('path').dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setContent(htmlContent);
    
    // Inject the CSS for page margins using body padding instead of @page margins
    await page.addStyleTag({
        content: `
            @page {
                padding-top: 0.5in;
                padding-bottom: 0.5in;
                ${marginInches > 0 ? `margin-left: ${marginInches}in;` : ""}
                ${marginInches > 0 ? `margin-right: ${marginInches}in;` : ""}
            }
            @page :first {
                padding-top: 0;
                padding-bottom: 0.5in;
                ${marginInches > 0 ? `margin-left: ${marginInches}in;` : ""}
                ${marginInches > 0 ? `margin-right: ${marginInches}in;` : ""}
            }

        `
    });

    await page.pdf({
        path: outputPath,
        format: 'A4',
        printBackground: true,
        displayHeaderFooter: false
    });

    await browser.close();
    
    return outputPath;
}

module.exports = {
    htmlToPdf,
};

// Only run CLI logic if this file is executed directly (not required as a module)
if (require.main === module) {
    // Get command line arguments
    const args = process.argv.slice(2);

    if (args.length < 2) {
        console.log("🐿️ Usage: node GenerateResume.js <input-html-path> <output-pdf-path> [margin-inches]");
        console.log("📄 Example: node GenerateResume.js ResumeData/resume1.html ResumeData/resume1.pdf 0.5");
        console.log("📄 Example: node GenerateResume.js ResumeData/resume1.html ResumeData/resume1.pdf 0");
        process.exit(1);
    }

    const inputPath = args[0];
    const outputPath = args[1];
    const marginInches = parseFloat(args[2]) || 0;

    // Check if input file exists
    if (!fs.existsSync(inputPath)) {
        console.log(`⚠️ Error: Input file '${inputPath}' not found!`);
        process.exit(1);
    }

    console.log(`🌰 Converting ${inputPath} to ${outputPath}...`);

    let html = fs.readFileSync(inputPath).toString();
    htmlToPdf(html, outputPath, marginInches).then(() => {
        console.log(`✅ PDF generated successfully: ${outputPath}`);
    }).catch((error) => {
        console.log(`❌ Error generating PDF: ${error.message}`);
        process.exit(1);
    });
}