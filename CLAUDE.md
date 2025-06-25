# JobSquirrel Project

**Note**: This project contains additional CLAUDE.md files in subdirectories (`/AcornDepot/CLAUDE.md`) with component-specific documentation.

## Application Concept
JobSquirrel is a personalized resume and cover letter generator that tailors career information to specific job applications.

## File Structure
- `/ResumeData/` - Contains all career data (resumes, cover letters, certifications, career info, etc.)
- `/GeneratedResumes/[Company Name - Job Title]/` - Output folder for generated applications
  - `job-listing.md` - Job descriptions saved in markdown format
  - Generated resume and cover letter files
- `/AcornDepot/` - **NEW**: Comprehensive job scraper system with web interface (see `/AcornDepot/CLAUDE.md`)
  - `/Scamper/` - C# Selenium-based job scraper with stealth features
  - `/Stashboard/` - Node.js Express web interface with real-time streaming
  - `/Cache/` - Temporary storage for scraped job HTML and processed markdown files
- `selectors.json` - Global CSS selector configuration for all job sites (indeed, dice, etc.)

## AcornDepot: Autonomous Job Scraper System

**AcornDepot** represents a significant evolution of JobSquirrel - a complete autonomous job scraping and processing system with real-time web interface. Unlike the original browser extension + clipboard approach, AcornDepot provides fully automated job collection and processing.

### AcornDepot Architecture

**Scamper** (C# Selenium Scraper):
- **Stealth Automation**: Chrome configured with extensive anti-detection measures
- **Territory Pattern**: Modular site-specific implementations (Indeed.cs, future: Dice.cs, etc.)
- **Smart Authentication**: Uses Google OAuth instead of email/password to bypass "human" challenges
- **Process Management**: Kills competing Chrome instances before starting
- **Intelligent Caching**: Sanitizes filenames and stores job HTML in `/Cache/`

**Stashboard** (Node.js Web Interface):
- **Real-time Streaming**: Server-Sent Events (SSE) for live command output
- **Dual Operations**: Scamper execution + Claude processing with separate streaming endpoints
- **Squirrel Theming**: Brown/orange woodland aesthetic with squirrel emojis
- **Process Control**: Start/stop operations with live feedback

**Claude Integration**: 
- **WSL Command Execution**: Runs Claude Code through Windows Subsystem for Linux
- **TTY Emulation**: Uses `script -qec` to provide fake TTY for Claude requirements
- **Sequential Processing**: Processes cached jobs one-by-one with immediate streaming results
- **Smart Escaping**: Base64 encoding to handle complex messages with quotes/newlines

### AcornDepot Workflow

1. **Job Scraping**: User clicks "Run Scamper" in Stashboard web interface
   - Scamper launches with stealth Chrome configuration
   - Navigates to job sites using Territory pattern
   - Scrapes job listings and caches HTML files in `/Cache/`
   - Live output streams to browser via Server-Sent Events

2. **Job Processing**: User clicks "Process Acorns" in Stashboard
   - System identifies unprocessed HTML files (those without corresponding .md files)
   - Sequential Claude processing: converts each HTML job listing to clean markdown
   - Real-time progress updates show each file being processed individually
   - Results stream live to browser as each file completes

### Technical Innovations

**Stealth Web Scraping**:
- Separate Chrome profile (`ScamperChrome`) to avoid conflicts
- Google OAuth authentication bypasses most bot detection
- Human-like delays and scrolling patterns
- Extensive Chrome flags to appear non-automated

**Real-time Web Streaming**:
- Server-Sent Events (SSE) for live command output
- JSON message escaping handles complex Claude responses
- Sequential processing with forced delays ensures proper streaming
- Browser receives updates immediately, not batched

**Cross-Platform Integration**:
- C# Selenium scraper runs natively on Windows
- Node.js web server provides cross-platform interface  
- WSL integration allows Claude Code execution from Windows
- File-based coordination between components

### Vs. Original JobSquirrel System

| Aspect | Original JobSquirrel | AcornDepot |
|--------|---------------------|------------|
| **Job Capture** | Manual browser extension click | Automated scraping |
| **Processing** | Multi-phase Claude workflow | Real-time Claude streaming |
| **Interface** | File-based signals | Web interface with live updates |
| **Authentication** | Manual login required | OAuth automation |
| **Scale** | One job at a time | Bulk scraping + processing |
| **Feedback** | File completion signals | Real-time streaming UI |

AcornDepot represents the "scaled up" version of JobSquirrel - moving from manual job-by-job processing to automated bulk collection and processing with a professional web interface.

## Complete System Architecture & Workflow

### Prerequisites
1. Place all career data sources in `/ResumeData/` (resumes, cover letters, project summaries, reports, etc.)
2. Run `start.bat` to launch background processes:
   - `clipboard-watcher.ps1` - monitors clipboard for JobSquirrel-marked content
   - `orchestrator.ps1` - manages the multi-phase Claude processing workflow

### Automated Workflow
1. **Job Capture**: User clicks browser extension button on job posting page
   - Browser extension copies DOM HTML to clipboard with JobSquirrel identifier
   - `clipboard-watcher.ps1` detects JobSquirrel marker and saves content to `clipboard.html`

2. **Phase 1 - Job Processing** (`ThePlan.txt`):
   - `orchestrator.ps1` detects `clipboard.html` and launches Claude with `ThePlan.txt`
   - Claude processes job posting using `ScrapeJob.txt` directive
   - Creates `/GeneratedResumes/[Company - Job Title]/job-listing.md`
   - Generates first draft of resume and cover letter
   - Saves `session-id.txt` for subsequent phases
   - Deletes `clipboard.html` (used as completion signal)

3. **Phase 2 - Resume Revision** (`ThePlan2.txt`):
   - `orchestrator.ps1` continues with existing Claude session
   - Claude revises the resume for better quality
   - Creates `resume-changes.md` documenting improvements

4. **Phase 3 - Final Processing** (`ThePlan3.txt`):
   - `orchestrator.ps1` completes final phase
   - Final resume and cover letter saved in company folder

### File Lifecycle & Signaling
- **Wait Signals**: `orchestrator.ps1` uses file creation/deletion as inter-phase signals
- **Current**: Waits for `clipboard.html` deletion (spaghetti code, could be improved)
- **Better**: Could wait for `session-id.txt` creation instead
- **Output Structure**: Each job creates `/GeneratedResumes/[Company - Job Title]/` containing:
  - `job-listing.md` - parsed job description
  - `session-id.txt` - Claude session identifier
  - `resume-changes.md` - revision documentation
  - Final resume and cover letter files

### Technical Components
- **Browser Extension**: `/BrowserExtension/` - captures job postings from web pages
- **Orchestrator**: `orchestrator.ps1` - manages multi-phase workflow and file signaling
- **Clipboard Monitor**: `clipboard-watcher.ps1` - detects and saves JobSquirrel clipboard content
- **HTML Parser**: `/HelperScripts/PageParser.js` - Cheerio-based tool for parsing large HTML files
- **PDF Text Extraction**: `pdftotext` (poppler-utils) - converts PDF resume files to text for Claude processing
- **Woodland Directives**: `/WoodlandDirectives/` - "poor man's MCP server" - bridge between deterministic code and Claude's AI capabilities
  - `ScrapeJob.txt` - job parsing instructions (includes site-specific selectors for indeed.com)
  - `ThePlan.txt`, `ThePlan2.txt`, `ThePlan3.txt` - multi-phase processing instructions
  - `GenerateResumeAndCoverLetter.txt` - resume/cover letter generation
  - `ConvertToPDF.txt`, `SubstitutePersonalInformation.txt` - additional processing directives

### Architecture Notes
- **Single-threaded**: Only processes one job at a time (limitation for future improvement)
- **Multi-phase Design**: Broken into phases because Claude follows instructions better with multiple focused passes
- **Hybrid Deterministic/AI**: Uses file-based signaling for deterministic flow control while leveraging Claude's AI for content generation
- **Selector-based Parsing**: Uses manually-researched CSS selectors for reliable job posting extraction (currently optimized for indeed.com)
- **Fully Automated**: Complete end-to-end automation from browser click to final documents (user still submits applications manually)

## Development History & Design Evolution

### The Browser Automation Challenge
The current browser extension + clipboard approach was the result of extensive experimentation with automated web scraping solutions. Multiple approaches were attempted before settling on the current architecture:

**Puppeteer Attempt**: Initially tried using Puppeteer for automated job posting extraction, but it consistently failed "I am human" tests on job sites, even with manual intervention and extensive configuration of flags and settings. Despite many attempts to configure Puppeteer to appear more human-like, job sites reliably detected and blocked the automation.

**Playwright Issues**: Playwright was tested as an alternative to Puppeteer, but presented usability problems that made it impractical for daily use. It insisted on controlling browser positioning, constantly moving windows around when opening new tabs, and forcing odd screen resolutions that disrupted the user's normal browsing experience.

**Chrome CDP Integration**: Chrome DevTools Protocol was explored as a more direct approach, but integrating it with Claude across the WSL (Windows Subsystem for Linux) environment became prohibitively complex, creating too many technical hurdles for reliable daily operation.

**Current Solution**: The browser extension approach emerged as the most reliable method. By having the user manually trigger the capture with a browser extension button, it completely bypasses anti-automation measures while still providing the HTML content needed for processing. The clipboard-based transfer mechanism works seamlessly across different operating system environments.

### The Multi-Phase Claude Architecture
The current three-phase processing system evolved from lessons learned about Claude's instruction-following behavior:

**Original Single-Phase**: Initially, all processing instructions were contained in a single `ThePlan.txt` file. However, this approach had significant quality issues - Claude would not consistently follow all directives when presented with a large, complex instruction set.

**Quality Through Iteration**: The breakthrough insight was that Claude produces significantly better results when asked to revise its own work. A second pass at resume generation consistently yielded much higher quality output than trying to get everything perfect in a single attempt.

**Pragmatic Phase Division**: The current three-phase structure (`ThePlan.txt`, `ThePlan2.txt`, `ThePlan3.txt`) represents a pragmatic division of the original comprehensive instructions. While the specific task division between phases is somewhat arbitrary, the multi-phase approach enables programmatic interaction with Claude - allowing the system to wait for completion of one phase before requesting improvements in the next.

### The "Poor Man's MCP Server" Concept
The Woodland Directives represent a hybrid approach between traditional deterministic programming and AI instruction:

**Bridging Deterministic and AI**: The directives are designed to be "code-ish enough" that Claude will predictably follow instructions, while remaining flexible enough to handle the variability inherent in job postings and resume generation. They serve as a bridge between typical deterministic software behavior and Claude's "magical super powers."

**Reliability Through Structure**: While the system's deterministic logic ultimately relies on Claude actually following the provided instructions (making it imperfect), the structured approach provides enough reliability to be "definitely good enough" for practical daily use.

**File-Based State Management**: The current file-based signaling system (using creation/deletion of files like `clipboard.html`, `session-id.txt`, and `resume-changes.md` as coordination mechanisms) represents functional but admittedly "spaghetti code" architecture. This approach works reliably but could be improved - for example, waiting for `session-id.txt` creation instead of `clipboard.html` deletion would be cleaner.

### HTML Processing Evolution
The current Cheerio-based parsing approach addresses the reality of modern web job postings:

**Scale Challenge**: Job posting HTML files can be enormous (20,000+ lines), making direct processing challenging and expensive in terms of token usage.

**Cheerio Solution**: `/HelperScripts/PageParser.js` provides Claude with a tool to efficiently query large HTML documents using CSS selectors, dramatically reducing the token overhead while maintaining parsing reliability.

**Site-Specific Optimization**: Currently optimized for indeed.com with manually-researched selectors stored in the `ScrapeJob.txt` directive. While Claude is intended to be as general-purpose as possible, the indeed.com-specific selectors were added to solve immediate reliability problems. Other job sites may work without custom selectors, but this will need to be evaluated case-by-case.

**Autonomy vs. Reliability Trade-off**: The current approach trades some of Claude's autonomous adaptability for increased reliability and reduced token costs. The manually-researched selectors ensure consistent parsing, though ideally Claude would have more autonomy than the current "Cheerio + predefined selectors" approach.

### Current Limitations & Technical Debt
Several aspects of the current system are acknowledged as areas for future improvement:

**Single-Threaded Processing**: The application can only handle one job at a time, which could become a bottleneck for heavy usage.

**File-Based Signaling**: The current approach of using file creation/deletion as inter-process signals works but creates coupling between the orchestrator logic and the Claude directives. Paths are duplicated across regular code and directive files, requiring caution when making changes.

**Session Management**: The `session-id.txt` approach works but could be more elegant. The file serves both as a state store and a completion signal.

**Resume Changes Tracking**: The `resume-changes.md` file is functionally unnecessary - it exists primarily as a completion flag for the orchestrator rather than serving a genuine functional purpose.

These limitations represent conscious trade-offs between development speed, reliability, and architectural purity. The current system prioritizes getting a working solution operational over perfect architecture, with the understanding that improvements can be made iteratively.

## Getting Current Claude Code Session ID

**Problem**: Claude instances need to know their own session ID for multi-phase workflows, but `/status` command is not accessible from Bash tool.

**Solution**: Use `/HelperScripts/get-current-session-id.sh` script that analyzes Claude's todo files in `~/.claude/todos/`.

### Session ID Detection Method
Claude stores session data in files with format: `{SESSION_ID}-agent-{SESSION_ID}.json`

**For maximum accuracy with multiple Claude windows open:**

1. **Create a unique todo marker**:
```bash
TodoWrite: [{"id": "session-marker", "content": "JobSquirrel session marker", "status": "pending", "priority": "low"}]
```

2. **Get session ID with content matching**:
```bash
/HelperScripts/get-current-session-id.sh "JobSquirrel session marker"
```

3. **Script scoring system**:
   - Recent activity: +up to 30 points (sessions active in last 30 min)
   - Content size: +up to 100 points (larger todo files)
   - **Content matching**: +1000 points (decisive)

**Testing Results**:
- Without content matching: May pick wrong session with multiple Claude windows
- With content matching: 100% accuracy

**Usage in directives**: Always create unique todo first, then use content matching for reliable session detection.

## Code Theme
All code uses squirrel-themed language:
- `forage()` instead of get/retrieve
- `stash()` instead of save/store
- `SquirrelManager` for main controllers
- `AcornProcessor` for data handlers
- `NutCache` for storage
- `winterStash` for saved state
- `scamper()` for navigation/iteration
- `chatter()` for logging