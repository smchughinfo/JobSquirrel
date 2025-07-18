#!/usr/bin/env node

/**
 * 🥜 ProjectNutcracker - Main Orchestrator
 * Coordinates the complete job discovery and scraping pipeline
 */

const DiscoveryManager = require('./discovery-manager');
const InstructionGenerator = require('./instruction-generator');
const ScrapingManager = require('./scraping-manager');
const JobSiteManager = require('./job-site-manager');

class NutcrackerOrchestrator {
    constructor() {
        this.discoveryManager = new DiscoveryManager();
        this.instructionGenerator = new InstructionGenerator();
        this.scrapingManager = new ScrapingManager();
        this.jobSiteManager = new JobSiteManager();
    }

    /**oka
     * Run the complete pipeline: discovery → instruction generation → scraping
     */
    async runCompletePipeline() {
        console.log('🚀 Starting ProjectNutcracker complete pipeline...');
        console.log('📋 Pipeline stages: Discovery → Instruction Generation → Scraping');
        console.log('');

        try {
            // Stage 1: Discovery Phase
            console.log('🔍 === STAGE 1: DISCOVERY PHASE ===');
            await this.discoveryManager.resumeDiscovery();
            console.log('✅ Discovery phase completed');
            console.log('');

            // Stage 2: Instruction Generation Phase
            console.log('📝 === STAGE 2: INSTRUCTION GENERATION ===');
            const generatedFiles = await this.instructionGenerator.generateAllInstructions();
            console.log(`✅ Generated ${generatedFiles.length} instruction files`);
            console.log('');

            // Stage 3: Scraping Phase
            console.log('🕸️ === STAGE 3: SCRAPING PHASE ===');
            await this.scrapingManager.resumeScraping();
            console.log('✅ Scraping phase completed');
            console.log('');

            // Final Statistics
            console.log('📊 === FINAL PIPELINE STATISTICS ===');
            const finalStats = await this.getFinalStats();
            console.log(JSON.stringify(finalStats, null, 2));

            console.log('');
            console.log('🎉 ProjectNutcracker pipeline completed successfully!');
            console.log('💤 Ready for overnight job hunting automation');

            return finalStats;

        } catch (error) {
            console.error('❌ Pipeline failed:', error.message);
            console.error('🔍 Check logs and individual stage status for debugging');
            throw error;
        }
    }

    /**
     * Run only the discovery phase
     */
    async runDiscoveryOnly() {
        console.log('🔍 Running discovery phase only...');
        return await this.discoveryManager.resumeDiscovery();
    }

    /**
     * Run only the scraping phase (assumes discovery is complete)
     */
    async runScrapingOnly() {
        console.log('🕸️ Running scraping phase only...');
        
        // Generate instruction files if needed
        const pendingFiles = await this.instructionGenerator.getPendingInstructions();
        if (pendingFiles.length === 0) {
            console.log('📝 Generating instruction files first...');
            await this.instructionGenerator.generateAllInstructions();
        }
        
        return await this.scrapingManager.resumeScraping();
    }

    /**
     * Get comprehensive status of all pipeline stages
     */
    async getCompleteStatus() {
        const discoveryStatus = await this.discoveryManager.getStatus();
        const generationStats = await this.instructionGenerator.getStats();
        const scrapingStatus = await this.scrapingManager.getStatus();
        
        return {
            pipeline: {
                stage: this.determinePipelineStage(discoveryStatus, generationStats, scrapingStatus),
                overallProgress: this.calculateOverallProgress(discoveryStatus, generationStats, scrapingStatus)
            },
            discovery: discoveryStatus,
            instructionGeneration: generationStats,
            scraping: scrapingStatus,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Determine current pipeline stage
     */
    determinePipelineStage(discoveryStatus, generationStats, scrapingStatus) {
        if (discoveryStatus.status !== 'completed') {
            return 'discovery';
        } else if (generationStats.queuedForScraping === 0 && generationStats.discoveredSites > 0) {
            return 'instruction_generation';
        } else if (scrapingStatus.status !== 'completed') {
            return 'scraping';
        } else {
            return 'completed';
        }
    }

    /**
     * Calculate overall pipeline progress percentage
     */
    calculateOverallProgress(discoveryStatus, generationStats, scrapingStatus) {
        let progress = 0;
        
        // Discovery phase (0-33%)
        if (discoveryStatus.progress.isComplete) {
            progress += 33;
        } else {
            progress += Math.round((discoveryStatus.progress.percentage / 100) * 33);
        }
        
        // Instruction generation phase (33-66%)
        if (generationStats.queuedForScraping > 0) {
            progress += 33;
        } else if (generationStats.discoveredSites > 0) {
            progress += Math.round((generationStats.queuedForScraping / generationStats.discoveredSites) * 33);
        }
        
        // Scraping phase (66-100%)
        if (scrapingStatus.progress.isComplete) {
            progress += 34;
        } else if (scrapingStatus.progress.total > 0) {
            progress += Math.round((scrapingStatus.progress.percentage / 100) * 34);
        }
        
        return Math.min(progress, 100);
    }

    /**
     * Get final statistics after pipeline completion
     */
    async getFinalStats() {
        const stats = await this.jobSiteManager.getStats();
        const data = await this.jobSiteManager.load();
        
        return {
            summary: {
                totalCompaniesDiscovered: stats.totalSites,
                successfullyScraped: stats.scrapableCount,
                totalJobsFound: stats.totalJobsFound,
                scrapingSuccessRate: stats.totalSites > 0 ? 
                    Math.round((stats.scrapableCount / stats.totalSites) * 100) : 0
            },
            breakdown: {
                byStatus: stats.byStatus,
                bySector: stats.bySector
            },
            performance: {
                discoveryStarted: data.meta.lastDiscoveryRun,
                scrapingStarted: data.meta.lastScrapingRun,
                lastUpdated: data.meta.lastUpdated
            }
        };
    }

    /**
     * Reset the entire pipeline (useful for testing)
     */
    async resetPipeline() {
        console.log('🔄 Resetting ProjectNutcracker pipeline...');
        
        // Clean up instruction files
        await this.instructionGenerator.cleanup();
        
        // Reset job sites database
        const defaultData = this.jobSiteManager.getDefaultData();
        await this.jobSiteManager.save(defaultData);
        
        console.log('✅ Pipeline reset completed');
    }

    /**
     * Emergency pause - stop all operations and save state
     */
    async emergencyPause() {
        console.log('🛑 Emergency pause activated...');
        
        // Update all running statuses to paused
        const data = await this.jobSiteManager.load();
        
        if (data.meta.discoveryStatus === 'running') {
            data.meta.discoveryStatus = 'paused';
        }
        if (data.meta.scrapingStatus === 'running') {
            data.meta.scrapingStatus = 'paused';
        }
        
        await this.jobSiteManager.save(data);
        console.log('✅ Pipeline paused, state saved');
    }

    /**
     * Resume from emergency pause
     */
    async resumeFromPause() {
        console.log('▶️ Resuming from pause...');
        
        const data = await this.jobSiteManager.load();
        
        if (data.meta.discoveryStatus === 'paused') {
            console.log('🔍 Resuming discovery phase...');
            return await this.discoveryManager.resumeDiscovery();
        } else if (data.meta.scrapingStatus === 'paused') {
            console.log('🕸️ Resuming scraping phase...');
            return await this.scrapingManager.resumeScraping();
        } else {
            console.log('ℹ️ No paused operations found');
            return await this.runCompletePipeline();
        }
    }
}

// CLI interface
if (require.main === module) {
    const orchestrator = new NutcrackerOrchestrator();
    
    const command = process.argv[2] || 'pipeline';
    
    switch (command) {
        case 'pipeline':
        case 'full':
            orchestrator.runCompletePipeline().catch(console.error);
            break;
        case 'discovery':
            orchestrator.runDiscoveryOnly().catch(console.error);
            break;
        case 'scraping':
            orchestrator.runScrapingOnly().catch(console.error);
            break;
        case 'status':
            orchestrator.getCompleteStatus().then(status => {
                console.log('📊 Complete Pipeline Status:');
                console.log(JSON.stringify(status, null, 2));
            }).catch(console.error);
            break;
        case 'stats':
            orchestrator.getFinalStats().then(stats => {
                console.log('📈 Final Pipeline Statistics:');
                console.log(JSON.stringify(stats, null, 2));
            }).catch(console.error);
            break;
        case 'reset':
            orchestrator.resetPipeline().catch(console.error);
            break;
        case 'pause':
            orchestrator.emergencyPause().catch(console.error);
            break;
        case 'resume':
            orchestrator.resumeFromPause().catch(console.error);
            break;
        default:
            console.log('Usage: node nutcracker-orchestrator.js [pipeline|discovery|scraping|status|stats|reset|pause|resume]');
            console.log('');
            console.log('Commands:');
            console.log('  pipeline - Run complete discovery → scraping pipeline');
            console.log('  discovery - Run only discovery phase');
            console.log('  scraping - Run only scraping phase');
            console.log('  status - Show complete pipeline status');
            console.log('  stats - Show final statistics');
            console.log('  reset - Reset entire pipeline');
            console.log('  pause - Emergency pause all operations');
            console.log('  resume - Resume from pause');
    }
}

module.exports = NutcrackerOrchestrator;