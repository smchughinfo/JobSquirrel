const path = require("path");
const fs = require("fs");
const cheerio = require("cheerio");

function getInnerText(html, selector = "jobSquirrel", removeStyleAndScripts = true) {  
    const htmlContent = "<jobSquirrel>" + html + "</jobSquirrel>";
    const $ = cheerio.load(htmlContent);

    if (removeStyleAndScripts) {
        $('style').remove();
        $('script').remove();
    }

    // Add spaces after block elements to prevent word smooshing
    const blockElements = 'div,p,h1,h2,h3,h4,h5,h6,li,ul,ol,br,hr,section,article,header,footer,nav,aside,main,figure,figcaption,table,tr,td,th,thead,tbody,tfoot';
    $(blockElements).each(function() {
        $(this).after(' ');
    });

    const element = $(selector);
    return element.text().replace(/\s+/g, ' ').trim(); // Normalize multiple spaces to single spaces
}

function getInnerTextFromFile(htmlFilePath, selector, removeStyleAndScripts = true) {  
    let html = fs.readFileSync(htmlFilePath, 'utf8')
    return getInnerText(html, selector, removeStyleAndScripts);
}

module.exports = {
    getInnerText,
    getInnerTextFromFile
};