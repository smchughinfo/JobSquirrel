# AcornDepot - Autonomous Job Scraper System

**AcornDepot** is a comprehensive job scraping and processing system that automates the collection of job postings from multiple sites and processes them using AI (Claude/Ollama). It serves as the "automated" component of the larger JobSquirrel ecosystem, complementing the original manual workflow with bulk processing capabilities.

AcornDepot consists of three main components working together to provide a complete autonomous job collection solution, with plans for integration into the broader JobSquirrel resume generation workflow.

## System Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    Scamper      │───▶│     Cache       │───▶│   Stashboard    │
│  (C# Scraper)   │    │  (HTML Files)   │    │ (Web Interface) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       ▼
         │                       │              ┌─────────────────┐
         │                       │              │     Claude      │
         │                       │              │  (AI Processing)│
         │                       │              └─────────────────┘
         │                       │                       │
         │                       ▼                       ▼
         │              ┌─────────────────┐    ┌─────────────────┐
         │              │   Job HTML      │    │  Processed MD   │
         │              │  (Raw Data)     │    │ (Clean Format)  │
         │              └─────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐
│  selectors.json │
│ (Site Config)   │
└─────────────────┘
```

## Component Details

### 1. Scamper - C# Selenium Job Scraper
**Location**: `/AcornDepot/Scamper/`

**Architecture**: Territory-based design with modular site implementations

**Core Components**:
- **`Program.cs`**: Main entry point with stealth Chrome configuration
- **`Territory.cs`**: Abstract base class for site-specific scrapers
- **`Territories/Indeed.cs`**: Indeed.com scraper implementation
- **Future**: `Territories/Dice.cs`, `Territories/ZipRecruiter.cs`, etc.

**Key Features**:
```csharp
// Stealth Chrome Configuration
var options = new ChromeOptions();
options.AddArgument("--disable-blink-features=AutomationControlled");
options.AddArgument("--disable-dev-shm-usage");
options.AddArgument("--no-sandbox");
options.AddArgument($"--user-data-dir={userDataDir}"); // Separate profile
```

**Stealth Techniques**:
- **Separate Chrome Profile**: Uses `ScamperChrome` directory to avoid conflicts
- **Anti-Detection Flags**: Extensive Chrome options to appear human
- **Google OAuth**: Bypasses "are you human" challenges vs. email/password
- **Process Management**: `ChaseAwayRivals()` kills competing Chrome instances
- **Human-like Behavior**: Delays, scrolling, realistic interaction patterns

**Territory Pattern**:
```csharp
public abstract class Territory
{
    protected IWebDriver driver;
    protected Dictionary<string, string> selectors;
    
    public abstract void Forage(string searchTerm, string location);
    protected abstract void SearchJobAndLocation(string searchTerm, string location);
    protected abstract void Cache(string companyName, string jobTitle, string jobHtml);
}
```

### 2. Stashboard - Node.js Web Interface
**Location**: `/AcornDepot/Stashboard/`

**Technology Stack**:
- **Backend**: Node.js + Express
- **Frontend**: Vanilla JavaScript + Server-Sent Events
- **Styling**: CSS with squirrel/woodland theme
- **Real-time**: EventSource API for live updates

**Key Files**:
- **`server.js`**: Express server with streaming endpoints
- **`services/commandRunner.js`**: Process execution with SSE streaming
- **`services/acornProcessor.js`**: Event-driven job processing with cancellation support
- **`services/llm.js`**: Unified Claude/Ollama integration layer (uses jobSquirrelPaths for all path operations)
- **`services/jobSquirrelPaths.js`**: **REQUIRED** - Centralized path management for entire JobSquirrel ecosystem
- **`public/js/app.js`**: Frontend JavaScript for real-time UI updates
- **`public/index.html`**: Web interface with control buttons

**API Endpoints**:
```javascript
// Stream Scamper execution in real-time
GET /api/run-scamper
// Response: Server-Sent Events with stdout/stderr

// Process cached job files with Claude
GET /api/process-acorns  
// Response: Server-Sent Events with progress/result/error

// Test WSL commands for debugging
GET /api/test-wsl?cmd=<command>
// Response: JSON with command result
```

**Real-time Streaming Architecture**:
```javascript
// Server-Sent Events setup
res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
});

// Sequential processing with immediate streaming
for (let file of unprocessedFiles) {
    res.write(`data: {"type":"progress","message":"Processing ${file}"}\n\n`);
    const result = await processFile(file);
    res.write(`data: {"type":"result","file":"${file}","result":"${result}"}\n\n`);
}
```

### 3. Claude Integration System
**Location**: Embedded within Stashboard services

**Challenge**: Running Claude Code from Windows Node.js server

**Solution**: WSL (Windows Subsystem for Linux) bridge with TTY emulation

**Technical Implementation**:
```javascript
// WSL command execution with TTY emulation
const command = `wsl -e bash -c "cd ${workingDir} && script -qec \\"claude --print --dangerously-skip-permissions '${message}'\\" /dev/null"`;
const result = execSync(command, { encoding: 'utf8', timeout: 600000 });
```

**Key Innovations**:
- **TTY Emulation**: Uses `script -qec` to provide fake TTY for Claude requirements
- **Message Escaping**: Proper JSON escaping for complex messages with quotes/newlines
- **Sequential Processing**: One file at a time to ensure proper streaming
- **Real-time Feedback**: Progress updates stream immediately to browser

**Message Flow**:
1. Browser triggers processing via `/api/process-acorns`
2. Server identifies unprocessed HTML files in `/Cache/`
3. For each file: WSL → Claude Code → Clean markdown output
4. Results stream live to browser as each file completes

## Cache Directory Structure
**Location**: Managed by `services/jobSquirrelPaths.js` - `getCacheDirectory()`

```
AcornDepot/Cache/
├── Company1 - Job Title1.html          (Raw scraped HTML)
├── Company1 - Job Title1.md            (AI-processed markdown)
├── Company2 - Job Title2.html
├── Company2 - Job Title2.md
└── ...
```

**File Lifecycle**:
1. **Scamper** scrapes job → saves `JobTitle.html` in Cache
2. **AcornProcessor** detects unprocessed files (HTML without corresponding MD)
3. **LLM (Claude/Ollama)** processes HTML → creates clean `JobTitle.md`
4. **Result**: Paired HTML/MD files for each job

**Future Integration**: Processed jobs will eventually flow from Cache → JobSquirrel's `GeneratedResumes/` workflow for resume generation.

## Configuration System

### Centralized Path Management
**Location**: `services/jobSquirrelPaths.js`

**Purpose**: Provides consistent path resolution across the entire JobSquirrel ecosystem

**Key Functions**:
```javascript
// Get root JobSquirrel directory (Windows or WSL paths)
getJobSquirrelRootDirectory(wsl = false)

// Get AcornDepot directory  
getAcornDepotDirectory(wsl = false)

// Get Cache directory for scraped jobs
getCacheDirectory(wsl = false) 

// Convert Windows paths to WSL format
convertPathToWSL(windowsPath)
```

**Usage Pattern**:
```javascript
const { getCacheDirectory, convertPathToWSL } = require('./services/jobSquirrelPaths');

// For file operations (Windows paths)
const cacheDir = getCacheDirectory();

// For WSL command execution  
const wslCacheDir = getCacheDirectory(true);

// Manual path conversion when needed
const wslPath = convertPathToWSL(windowsPath);
```

**IMPORTANT**: All AcornDepot services MUST use `jobSquirrelPaths.js` for path operations. Never manually construct paths or do Windows→WSL conversion in service files. This ensures consistency and makes path changes manageable from a single location.

**Benefits**:
- ✅ Single source of truth for all path resolution
- ✅ Automatic Windows ↔ WSL path conversion
- ✅ Consistent across AcornDepot and future unified JobSquirrel system
- ✅ Easy to relocate directories without code changes

### selectors.json - Global Site Configuration
**Location**: `/selectors.json` (project root)

**Purpose**: Centralized CSS selector storage for all job sites

**Structure**:
```json
{
  "sites": {
    "indeed": {
      "mainPage": {
        "highlightedJob": ".jobsearch-RightPane",
        "searchFields": {
          "searchTerm": "#text-input-what",
          "searchLocation": "#text-input-where"
        },
        "submitButton": ".yosegi-InlineWhatWhere-primaryButton"
      },
      "resultPage": {
        "jobCards": "[data-jk]",
        "nextButton": "a[aria-label='Next Page']"
      }
    }
  }
}
```

**Usage in C#**:
```csharp
// Utilities class flattens nested selectors for easy access
var selectors = Utilities.GetSelectorsForSite("indeed");
string searchField = selectors["searchTerm"]; // "#text-input-what"
```

## Development Workflow

### Running the System

1. **Start Stashboard Web Server**:
   ```bash
   cd AcornDepot/Stashboard
   node server.js
   # Server runs at http://localhost:3000
   ```

2. **Access Web Interface**: Open browser to `http://localhost:3000`

3. **Run Job Scraping**: Click "🐿️ Run Scamper" button
   - Real-time output streams to browser
   - Job HTML files saved to `/Cache/`

4. **Process Jobs**: Click "🌰 Process Acorns" button  
   - Claude converts HTML → clean markdown
   - Progress updates stream live
   - Results appear immediately as each file completes

### Development Setup

**Prerequisites**:
- .NET 8.0 SDK (for Scamper C# project)
- Node.js (for Stashboard web server)
- Chrome browser (for Selenium automation)
- WSL with Claude Code installed (for AI processing)

**Build Process**:
```bash
# Build C# Scamper project
cd AcornDepot/Scamper
dotnet build

# Install Node.js dependencies
cd ../Stashboard  
npm install

# Start web server
node server.js
```

## Architecture Decisions & Design Evolution

### Chrome Automation Strategy

**Challenge**: Job sites aggressively detect and block automation

**Failed Approaches**:
- **Puppeteer**: Consistently failed "I am human" tests
- **Playwright**: Usability issues (window positioning, resolution control)
- **Chrome CDP**: Too complex for WSL environment

**Successful Solution**:
- **Separate Chrome Profile**: Avoids conflicts with user's normal browsing
- **Google OAuth**: Bypasses most bot detection vs. email/password login
- **Stealth Configuration**: Extensive Chrome flags to appear non-automated
- **Human Simulation**: Realistic delays, scrolling, interaction patterns

### Real-time Streaming Implementation

**Challenge**: Provide live feedback for long-running operations

**Technical Solution**:
- **Server-Sent Events (SSE)**: Standard-compliant streaming from server to browser
- **Sequential Processing**: Process one file at a time for proper streaming order
- **JSON Escaping**: Handle complex Claude responses with quotes/newlines
- **Forced Delays**: Small delays to ensure messages stream individually vs. batching

**Message Types**:
```javascript
// Progress indicator
{"type":"progress","message":"Processing file 1: Company - Job.html"}

// Successful result  
{"type":"result","file":"Company - Job.html","result":"Done! Created markdown file."}

// Error handling
{"type":"error","file":"Company - Job.html","error":"Processing failed: reason"}

// Completion signal
{"type":"end","message":"All acorns processed!"}
```

### WSL Integration Strategy

**Challenge**: Run Claude Code from Windows Node.js application

**Solution**: WSL command bridge with TTY emulation
- **Command Structure**: `wsl -e bash -c "cd ${dir} && script -qec \"claude --args\" /dev/null"`
- **TTY Requirement**: Claude Code requires TTY; `script -qec` provides fake TTY
- **Path Conversion**: Windows paths → WSL paths (`C:\Users\...` → `/mnt/c/Users/...`)
- **Error Handling**: Comprehensive error capture and user feedback

## Debugging & Troubleshooting

### Common Issues

**1. Chrome Automation Blocked**:
- Ensure Google OAuth login (not email/password)
- Check Chrome profile separation (ScamperChrome directory)
- Verify stealth flags in Chrome configuration

**2. WSL/Claude Integration Fails**:
- Test basic WSL connectivity: `GET /api/test-wsl?cmd=ls`
- Verify Claude Code installation in WSL
- Check working directory path conversion

**3. Streaming Not Working**:
- Disable browser cache for `/api/process-acorns` endpoint
- Check for proxy/firewall blocking SSE connections
- Verify sequential processing (not parallel)

### Debug Endpoints

**WSL Command Testing**:
```bash
# Test basic WSL functionality
curl "http://localhost:3000/api/test-wsl?cmd=ls"

# Test Claude availability  
curl "http://localhost:3000/api/test-wsl?cmd=which%20claude"

# Test working directory
curl "http://localhost:3000/api/test-wsl?cmd=pwd"
```

**Log Analysis**:
- Server console shows timestamped operations
- Browser console shows streaming message flow
- Network tab shows SSE message timeline

## Squirrel Naming Theme

All components follow woodland/squirrel naming conventions:

**Actions**:
- `Forage()` - scraping/gathering data
- `Cache()` - storing collected data
- `ChaseAwayRivals()` - eliminating competing processes
- `scamper()` - navigation/iteration  
- `chatter()` - logging/communication

**Components**:
- `AcornDepot` - main system container
- `Scamper` - the scraper that gathers acorns (jobs)
- `Stashboard` - interface for viewing winter cache
- `Territories` - different areas to forage for jobs
- `Cache` - winter storage for collected acorns

**UI Elements**:
- 🐿️ Squirrel emoji for Scamper operations
- 🌰 Acorn emoji for processing operations
- 🥜 Nut emoji for cached data
- Brown/orange color scheme throughout interface

This thematic consistency makes the codebase more memorable and fun to work with while maintaining professional functionality.

## Future Enhancements

**Additional Job Sites**:
- `Territories/Dice.cs` - Dice.com scraper
- `Territories/ZipRecruiter.cs` - ZipRecruiter scraper
- `Territories/LinkedIn.cs` - LinkedIn job scraper (challenging due to auth)

**Enhanced Processing**:
- Parallel processing for multiple files
- Custom Claude prompts per job site
- Job deduplication across sites
- Automatic application generation integration

**UI Improvements**:
- Job display and search interface
- Export functionality for processed jobs
- Statistics and analytics dashboard
- Mobile-responsive design

**Ecosystem Integration**:
- **Connect to original JobSquirrel**: Bridge Cache → GeneratedResumes workflow
- **Unified LLM management**: Shared Claude/Ollama service layer
- **Config-driven processing**: System-wide LLM selection based on task complexity
- **Consistent user experience**: Eventually merge Stashboard with original JobSquirrel UI

**Technical Improvements**:
- **Parallel processing**: Multiple files simultaneously vs. current sequential approach
- **Database storage**: Replace file-based cache with proper data persistence
- **API endpoints**: RESTful interfaces for external system integration
- **Cloud deployment**: Containerized deployment options for scalability

## Relationship to JobSquirrel Ecosystem

AcornDepot serves as the "automated job collection" component within the larger JobSquirrel system:

**Current State**: Parallel Systems
```
Original JobSquirrel:  Browser Extension → Manual Processing → Resume Generation
AcornDepot:           Scamper → Automated Processing → Structured Data
```

**Future Integration**: Unified Pipeline  
```
┌─ Manual Capture (Browser Extension) ─┐
│                                      ▼
└─ Automated Capture (Scamper) ────── Job Processing ── Resume Generation ── Final Output
                                      (Ollama/Claude)    (Claude)
```

**Architectural Benefits**:
- **Best of both worlds**: Manual precision + automated scale
- **Cost optimization**: Bulk processing with local LLM, quality tasks with Claude
- **Incremental migration**: Proven workflows remain stable during integration
- **Unified configuration**: Single path management and LLM selection system