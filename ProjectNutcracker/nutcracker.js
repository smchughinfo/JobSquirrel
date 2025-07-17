#!/usr/bin/env node

/**
 * 🥜 ProjectNutcracker - Dynamic Web Automation
 * Runtime script generation and injection for adaptive web interaction
 */

const puppeteer = require('puppeteer');

class ProjectNutcracker {
    constructor(options = {}) {
        this.browser = null;
        this.page = null;
        this.connected = false;
        this.headless = options.headless !== undefined ? options.headless : false;  // Default to visible
        this.debug = options.debug || false;
    }

    /**
     * Launch Chrome autonomously with dedicated profile
     */
    async connect() {
        console.log('🥜 ProjectNutcracker - Launching autonomous Chrome...');
        
        // Try different Chrome options for WSL
        const chromeOptions = [
            {
                name: 'System Chromium',
                executablePath: '/usr/bin/chromium-browser',
                userDataDir: './nutcracker-profile'
            },
            {
                name: 'Bundled Chromium',
                executablePath: undefined,  // Use Puppeteer's bundled Chromium
                userDataDir: './nutcracker-profile'
            }
        ];

        let lastError = null;
        
        for (const config of chromeOptions) {
            try {
                console.log(`🔧 Trying: ${config.name}...`);
                
                const launchOptions = {
                    headless: this.headless,  // Use the headless setting from constructor
                    userDataDir: config.userDataDir,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--no-first-run',
                        '--no-default-browser-check',
                        '--disable-sync',
                        '--disable-background-timer-throttling',
                        '--disable-renderer-backgrounding',
                        '--disable-backgrounding-occluded-windows',
                        '--disable-translate',
                        '--disable-web-security',
                        '--disable-gpu-sandbox',
                        '--use-gl=swiftshader',
                        '--disable-background-networking',
                        '--disable-default-apps',
                        '--disable-extensions',
                        '--disable-features=TranslateUI',
                        '--disable-ipc-flooding-protection',
                        '--enable-features=NetworkService,NetworkServiceLogging',
                        '--remote-debugging-port=0'  // Let Puppeteer choose the port
                    ]
                };
                
                if (config.executablePath) {
                    launchOptions.executablePath = config.executablePath;
                }
                
                this.browser = await puppeteer.launch(launchOptions);
                console.log(`✅ Success with: ${config.name}`);
                break;
                
            } catch (error) {
                console.log(`❌ Failed with ${config.name}: ${error.message}`);
                lastError = error;
                continue;
            }
        }
        
        if (!this.browser) {
            throw new Error(`Failed to launch Chrome with any method. Last error: ${lastError.message}`);
        }
        
        console.log(`✅ Chrome launched ${this.headless ? 'headless' : 'with GUI'}`);
        this.connected = true;

        // Get the default page
        const pages = await this.browser.pages();
        this.page = pages[0];
        console.log('📄 Using default page');

        // Utilities will be injected after first navigation
        
        return this;
    }

    /**
     * Inject utility functions into the page context
     */
    async injectUtilities() {
        await this.page.addScriptTag({
            content: `
                window.nutcrackerUtils = {
                    // Find interactive elements by type and characteristics
                    findElements: (criteria) => {
                        const elements = [];
                        const all = document.querySelectorAll('*');
                        
                        for (let el of all) {
                            if (criteria.type === 'clickable' && (
                                el.tagName === 'BUTTON' || 
                                el.tagName === 'A' || 
                                el.onclick ||
                                el.style.cursor === 'pointer' ||
                                getComputedStyle(el).cursor === 'pointer'
                            )) {
                                elements.push({
                                    element: el,
                                    text: el.innerText?.trim(),
                                    tag: el.tagName,
                                    href: el.href,
                                    classes: el.className,
                                    id: el.id
                                });
                            }
                        }
                        return elements;
                    },

                    // Get page structure analysis
                    analyzePage: () => {
                        return {
                            title: document.title,
                            url: window.location.href,
                            links: Array.from(document.links).map(link => ({
                                text: link.innerText?.trim(),
                                href: link.href,
                                target: link.target
                            })),
                            clickableElements: window.nutcrackerUtils.findElements({ type: 'clickable' }),
                            forms: Array.from(document.forms).length,
                            images: Array.from(document.images).length
                        };
                    },

                    // Smart clicking with fallbacks
                    smartClick: (element) => {
                        if (element.click) {
                            element.click();
                        } else {
                            element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                        }
                    }
                };
            `
        });
        console.log('🛠️ Utility toolkit injected');
    }

    /**
     * Navigate to URL
     */
    async goto(url) {
        console.log(`🌐 Navigating to: ${url}`);
        await this.page.goto(url, { waitUntil: 'networkidle2' });
        
        // Inject utilities after navigation
        await this.injectUtilities();
        
        const title = await this.page.title();
        console.log(`📄 Page loaded: ${title}`);
        
        return title;
    }

    /**
     * Analyze current page structure
     */
    async analyzePage() {
        console.log('📊 Analyzing page structure...');
        
        const analysis = await this.page.evaluate(() => {
            return window.nutcrackerUtils.analyzePage();
        });
        
        console.log(`📋 Found: ${analysis.links.length} links, ${analysis.clickableElements.length} clickable elements`);
        return analysis;
    }

    /**
     * Click around intelligently - find interesting links and click them
     */
    async exploreAndClick() {
        const analysis = await this.analyzePage();
        
        // Find interesting links to click (filter out common navigation)
        const interestingLinks = analysis.clickableElements.filter(el => {
            const text = el.text?.toLowerCase() || '';
            const isNavigationJunk = ['home', 'contact', 'about', 'privacy', 'terms', 'login', 'sign up'].includes(text);
            const hasText = text.length > 0 && text.length < 50;
            return hasText && !isNavigationJunk;
        });

        console.log(`🎯 Found ${interestingLinks.length} interesting clickable elements`);
        
        for (let i = 0; i < Math.min(3, interestingLinks.length); i++) {
            const link = interestingLinks[i];
            console.log(`🖱️ Clicking: "${link.text}" (${link.tag})`);
            
            try {
                // Generate and execute click script
                await this.page.evaluate((linkData) => {
                    const elements = document.querySelectorAll('*');
                    for (let el of elements) {
                        if (el.innerText?.trim() === linkData.text && 
                            el.tagName === linkData.tag) {
                            window.nutcrackerUtils.smartClick(el);
                            break;
                        }
                    }
                }, link);
                
                // Wait for page changes
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Check if we're on a new page
                const newTitle = await this.page.title();
                console.log(`📄 Now on: ${newTitle}`);
                
                // Go back if it's a different page
                if (newTitle !== analysis.title) {
                    console.log('⬅️ Going back...');
                    await this.page.goBack();
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                
            } catch (error) {
                console.log(`❌ Failed to click "${link.text}": ${error.message}`);
            }
        }
    }

    /**
     * Take a screenshot
     */
    async screenshot(filename) {
        const path = `screenshots/${filename}`;
        await this.page.screenshot({ path });
        console.log(`📸 Screenshot saved: ${path}`);
        return path;
    }

    /**
     * Close Chrome completely
     */
    async disconnect() {
        if (this.browser) {
            console.log('🔌 Closing Chrome...');
            await this.browser.close();
            this.connected = false;
        }
    }
}

// Demo: Navigate to Sean's site and click around
async function demo() {
    console.log('🎬 Running ProjectNutcracker demo...');
    console.log('🤖 Headless mode with screenshots for visibility');
    console.log('');
    
    // Headless with screenshots for visibility
    const nutcracker = new ProjectNutcracker({ headless: true, debug: true });
    
    try {
        await nutcracker.connect();
        await nutcracker.goto('https://seanmchugh.dev');
        
        // Take screenshot of the page
        await nutcracker.screenshot('demo-page.png');
        
        await nutcracker.exploreAndClick();
        
        console.log('🎉 Demo completed!');
        
    } catch (error) {
        console.error('❌ Demo failed:', error.message);
    } finally {
        await nutcracker.disconnect();
    }
}

// Run demo if called directly
if (require.main === module) {
    demo();
}

module.exports = ProjectNutcracker;