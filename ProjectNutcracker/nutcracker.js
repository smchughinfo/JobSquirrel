#!/usr/bin/env node

/**
 * 🥜 ProjectNutcracker - Web Automation for Job Discovery
 * 
 * Main module that demonstrates the three core capabilities:
 * 1. Browse to any URL
 * 2. Read the current state of the page (live DOM)
 * 3. Interact with page controls
 */

const puppeteer = require('puppeteer');

class ProjectNutcracker {
    constructor() {
        this.browser = null;
        this.page = null;
        this.connected = false;
    }

    /**
     * Connect to Chrome debugging session
     */
    async connect() {
        console.log('🥜 ProjectNutcracker - Initializing...');
        
        const connectionURLs = [
            'http://localhost:9222',
            'http://127.0.0.1:9222',
            'http://172.29.64.1:9222'
        ];

        for (const browserURL of connectionURLs) {
            try {
                console.log(`🔌 Trying to connect to: ${browserURL}...`);
                this.browser = await puppeteer.connect({
                    browserURL: browserURL,
                    defaultViewport: null
                });
                console.log(`✅ Connected successfully to: ${browserURL}`);
                this.connected = true;
                break;
            } catch (e) {
                console.log(`❌ Failed to connect to: ${browserURL}`);
            }
        }

        if (!this.connected) {
            throw new Error('❌ Could not connect to Chrome. Make sure Chrome is running with debugging enabled.');
        }

        // Get or create a page
        const pages = await this.browser.pages();
        if (pages.length > 0) {
            this.page = pages[0];
            console.log('📄 Using existing tab');
        } else {
            this.page = await this.browser.newPage();
            console.log('📄 Created new tab');
        }

        return this;
    }

    /**
     * Capability 1: Browse to any URL
     */
    async browseToURL(url) {
        if (!this.connected) {
            throw new Error('Not connected to Chrome. Call connect() first.');
        }

        console.log(`🌐 Navigating to: ${url}`);
        await this.page.goto(url, { waitUntil: 'networkidle2' });
        
        const title = await this.page.title();
        console.log(`📄 Page loaded: ${title}`);
        
        return {
            url: this.page.url(),
            title: title
        };
    }

    /**
     * Capability 2: Read the current state of the page (live DOM)
     */
    async readCurrentPageState() {
        if (!this.connected) {
            throw new Error('Not connected to Chrome. Call connect() first.');
        }

        console.log('📖 Reading current page state...');

        const pageState = await this.page.evaluate(() => {
            return {
                url: window.location.href,
                title: document.title,
                bodyText: document.body.innerText.substring(0, 500),
                forms: Array.from(document.forms).map(form => ({
                    action: form.action,
                    method: form.method,
                    inputs: Array.from(form.elements).map(el => ({
                        type: el.type,
                        name: el.name,
                        placeholder: el.placeholder,
                        value: el.value
                    }))
                })),
                links: Array.from(document.links).slice(0, 10).map(link => ({
                    text: link.innerText.trim(),
                    href: link.href
                })),
                inputs: Array.from(document.querySelectorAll('input, textarea, select')).map(el => ({
                    type: el.type,
                    name: el.name,
                    placeholder: el.placeholder,
                    id: el.id,
                    className: el.className
                })),
                buttons: Array.from(document.querySelectorAll('button, input[type="submit"]')).map(btn => ({
                    text: btn.innerText || btn.value,
                    type: btn.type,
                    name: btn.name
                }))
            };
        });

        console.log('✅ Page state captured');
        return pageState;
    }

    /**
     * Capability 3: Interact with page controls
     */
    async interactWithPage(actions) {
        if (!this.connected) {
            throw new Error('Not connected to Chrome. Call connect() first.');
        }

        console.log('🎮 Interacting with page controls...');

        for (const action of actions) {
            console.log(`   → ${action.type}: ${action.selector || action.text || action.url}`);

            switch (action.type) {
                case 'click':
                    await this.page.click(action.selector);
                    break;
                
                case 'type':
                    await this.page.type(action.selector, action.text);
                    break;
                
                case 'select':
                    await this.page.select(action.selector, action.value);
                    break;
                
                case 'wait':
                    await this.page.waitForTimeout(action.milliseconds || 1000);
                    break;
                
                case 'wait_for_selector':
                    await this.page.waitForSelector(action.selector);
                    break;
                
                case 'screenshot':
                    await this.page.screenshot({ path: action.filename || 'screenshot.png' });
                    console.log(`📸 Screenshot saved: ${action.filename || 'screenshot.png'}`);
                    break;

                default:
                    console.log(`⚠️  Unknown action type: ${action.type}`);
            }

            // Small delay between actions for visibility
            await this.page.waitForTimeout(500);
        }

        console.log('✅ Page interactions completed');
    }

    /**
     * Disconnect from Chrome (but leave it running)
     */
    disconnect() {
        if (this.browser) {
            console.log('🔌 Disconnecting from Chrome...');
            this.browser.disconnect();
            this.connected = false;
        }
    }

    /**
     * Demo function that showcases all three capabilities
     */
    async runDemo() {
        try {
            // Connect to Chrome
            await this.connect();

            // Capability 1: Browse to URL
            await this.browseToURL('https://www.google.com');

            // Capability 2: Read page state
            const pageState = await this.readCurrentPageState();
            console.log('\n📊 Page State Summary:');
            console.log(`   Title: ${pageState.title}`);
            console.log(`   Inputs found: ${pageState.inputs.length}`);
            console.log(`   Buttons found: ${pageState.buttons.length}`);
            console.log(`   Links found: ${pageState.links.length}`);

            // Capability 3: Interact with page
            await this.interactWithPage([
                { type: 'type', selector: 'textarea[name="q"]', text: 'ProjectNutcracker job search automation' },
                { type: 'wait', milliseconds: 1000 },
                { type: 'click', selector: 'input[name="btnK"]' },
                { type: 'wait_for_selector', selector: '#search' },
                { type: 'wait', milliseconds: 2000 }
            ]);

            // Read page state after interaction
            const searchResults = await this.readCurrentPageState();
            console.log('\n🔍 Search Results Summary:');
            console.log(`   New title: ${searchResults.title}`);
            console.log(`   Found ${searchResults.links.length} result links`);

            console.log('\n🎉 ProjectNutcracker demo completed successfully!');
            console.log('All three capabilities working:');
            console.log('   ✅ 1. Browse to any URL');
            console.log('   ✅ 2. Read live DOM state');
            console.log('   ✅ 3. Interact with page controls');

        } catch (error) {
            console.error('❌ Demo failed:', error.message);
        } finally {
            this.disconnect();
        }
    }
}

// If this script is run directly, run the demo
if (require.main === module) {
    const nutcracker = new ProjectNutcracker();
    nutcracker.runDemo();
}

module.exports = ProjectNutcracker;