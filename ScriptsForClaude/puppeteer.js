const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Global browser and page instances
let browser = null;
let page = null;

// File paths for DOM and console output
const DOM_FILE = '/mnt/c/Users/seanm/Desktop/JobSquirrel/Cache/current-dom.html';
const CONSOLE_FILE = '/mnt/c/Users/seanm/Desktop/JobSquirrel/Cache/current-console.txt';

async function openBrowser() {
    if (browser) {
        console.log('⚠️ Browser already open');
        return;
    }
    
    console.log('🚀 Opening browser...');
    browser = await puppeteer.launch({ headless: true });
    page = await browser.newPage();
    
    // Set up console logging
    page.on('console', msg => {
        const logEntry = `[${new Date().toISOString()}] ${msg.type()}: ${msg.text()}\n`;
        fs.appendFileSync(CONSOLE_FILE, logEntry);
    });
    
    console.log('✅ Browser opened');
}

async function closeBrowser() {
    if (!browser) {
        console.log('⚠️ No browser to close');
        return;
    }
    
    console.log('🔒 Closing browser...');
    await browser.close();
    browser = null;
    page = null;
    console.log('✅ Browser closed');
}

async function navigate(url) {
    if (!page) {
        throw new Error('Browser not open. Call openBrowser() first.');
    }
    
    console.log(`🌐 Navigating to: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2' });
    console.log('✅ Navigation complete');
}

async function screenshot(filename = null) {
    if (!page) {
        throw new Error('Browser not open. Call openBrowser() first.');
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotPath = filename || `/mnt/c/Users/seanm/Desktop/JobSquirrel/Cache/screenshot-${timestamp}.png`;
    
    console.log(`📸 Taking screenshot: ${screenshotPath}`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log('✅ Screenshot saved');
    return screenshotPath;
}

async function getDOM() {
    if (!page) {
        throw new Error('Browser not open. Call openBrowser() first.');
    }
    
    console.log('📄 Getting DOM...');
    const html = await page.content();
    fs.writeFileSync(DOM_FILE, html);
    console.log(`✅ DOM saved to: ${DOM_FILE}`);
    return DOM_FILE;
}

async function getConsole() {
    console.log('📝 Getting console logs...');
    
    if (!fs.existsSync(CONSOLE_FILE)) {
        fs.writeFileSync(CONSOLE_FILE, '');
    }
    
    const fullLog = fs.readFileSync(CONSOLE_FILE, 'utf8');
    const lines = fullLog.split('\n');
    
    // Keep last 100 lines
    const trimmedLines = lines.slice(-100);
    const trimmedLog = trimmedLines.join('\n');
    
    fs.writeFileSync(CONSOLE_FILE, trimmedLog);
    console.log(`✅ Console logs trimmed and saved to: ${CONSOLE_FILE}`);
    return CONSOLE_FILE;
}

async function injectJavaScript(code) {
    if (!page) {
        throw new Error('Browser not open. Call openBrowser() first.');
    }
    
    console.log('⚡ Injecting JavaScript...');
    const result = await page.evaluate(code);
    console.log('✅ JavaScript executed');
    return result;
}

module.exports = {
    openBrowser,
    closeBrowser,
    navigate,
    screenshot,
    getDOM,
    getConsole,
    injectJavaScript
};