# AcornDepot - Job Scraper System

## System Components

### Scamper - C# Selenium Job Scraper
**Location**: `/AcornDepot/Scamper/`

**Core Features**:
- **Territory-based Architecture**: Base `Territory` class with site-specific implementations (Currently: `Indeed.cs`)
- **Stealth Automation**: Chrome configured with anti-detection measures
- **Selector Configuration**: Uses `/selectors.json` for maintainable CSS selectors
- **Process Management**: `ChaseAwayRivals()` kills competing Chrome/ChromeDriver instances
- **Job Caching**: `Cache()` method stores scraped job data with sanitized filenames

**Key Functions**:
- `Forage(searchTerm, location)` - Main scraping method
- `ChaseAwayRivals()` - Process cleanup before starting
- `Cache(companyName, jobTitle, jobHtml)` - Store scraped data

### Stashboard - Express Web Interface  
**Location**: `/AcornDepot/Stashboard/`

**Core Features**:
- **Real-time Command Streaming**: Server-Sent Events (SSE) for live Scamper output
- **Squirrel-themed UI**: Brown/orange color scheme with woodland aesthetics
- **Control Interface**: Header buttons for triggering operations
- **Async Process Management**: Node.js `spawn()` with live stdout/stderr capture

**Key Endpoints**:
- `GET /api/run-scamper` - Streams Scamper execution in real-time
- `POST /api/process-acorns` - Processes cached job data

### Global Configuration
**`/selectors.json`**: Centralized CSS selector storage organized by job site
- Flattened key access (e.g., `selectors["searchTerm"]` instead of nested paths)  
- Site-specific selectors with utility functions for retrieval
- `Utilities.GetSelectorsForSite(siteName)` returns flattened dictionary

## Architecture Decisions

### Chrome Profile Strategy
Job sites heavily protect against automation detection:

**Problem**: Chrome automation requires non-default data directory, but default profile has login sessions

**Solution**: 
- Use separate Chrome profile (`ScamperChrome` directory) 
- **Authenticate via Google OAuth** instead of email/password
- Google's OAuth bypasses "are you human" challenges that email login triggers

### Real-time Streaming Architecture
**Server**: Uses Server-Sent Events (SSE) with Node.js child_process.spawn()
**Client**: EventSource for receiving live command output
**Benefits**: True real-time feedback, automatic process cleanup on disconnect

### Squirrel Naming Conventions
- `Forage()` - scraping/gathering data
- `Cache()` - storing collected data  
- `ChaseAwayRivals()` - eliminating competing processes
- `Territories` - different job sites to scrape
- `AcornDepot` - main system container
- `Stashboard` - viewing interface for cached data

## Implementation Notes
- **Windows Compatibility**: Uses `-n` flag for ping (not `-c`)
- **Admin Privileges**: May be required for Chrome process management
- **Working Directory**: Batch files use `%~dp0` for reliable path resolution
- **Error Handling**: Graceful fallbacks for automation detection and process failures