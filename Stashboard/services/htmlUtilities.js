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

function embedHiddenText(htmlDocument, textToInject) {
    const $ = cheerio.load(htmlDocument);
    
    // Create hidden div with invisible text
    const hiddenDiv = $('<div>');
    
    // Set the style attribute properly
    hiddenDiv.attr('style', 'color:white;font-size:.01px;');
    
    // Add the text to inject (escaped for safety)
    hiddenDiv.text(textToInject);
    
    // Inject at the end of body, or create body if it doesn't exist
    if ($('body').length > 0) {
        $('body').append(hiddenDiv);
    } else {
        // If no body tag, wrap content and add hidden div
        const bodyContent = $.html();
        $.root().empty();
        $.root().append(`<html><body>${bodyContent}</body></html>`);
        $('body').append(hiddenDiv);
    }
    
    return $.html();
}

module.exports = {
    getInnerText,
    getInnerTextFromFile,
    embedHiddenText
};