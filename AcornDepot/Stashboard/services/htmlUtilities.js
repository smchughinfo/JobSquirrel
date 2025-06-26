const path = require("path");
const fs = require("fs");
const cheerio = require("cheerio");

function getInnerText(html, selector, removeStyleAndScripts = true) {  
    const htmlContent = "<jobSquirrel>" + html + "</jobSquirrel>";
    const $ = cheerio.load(htmlContent);

    if (removeStyleAndScripts) {
        $('style').remove();
        $('script').remove();
    }

    const element = $(selector ?? "jobSquirrel");
    return element.text().trim();
}

function getInnerTextFromFile(htmlFilePath, selector, removeStyleAndScripts = true) {  
    let html = fs.readFileSync(htmlFilePath, 'utf8')
    return getInnerText(html, selector, removeStyleAndScripts);
}

module.exports = {
    getInnerText,
    getInnerTextFromFile
};