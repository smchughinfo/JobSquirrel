# JobSquirrel Project

**Note**: This project contains additional CLAUDE.md files in subdirectories (`/AcornDepot/CLAUDE.md`) with component-specific documentation.

## Application Concept
JobSquirrel is a comprehensive job application automation ecosystem that combines job scraping, processing, and personalized resume/cover letter generation. The system has evolved into two parallel workflows that will eventually be unified:

1. **Original JobSquirrel** - Manual job capture with browser extension → multi-phase Claude processing → tailored resumes/cover letters
2. **AcornDepot** - Automated job scraping with Selenium → bulk AI processing → structured job data

Both systems share the squirrel/woodland theme and aim to automate the job application process, with plans for architectural unification and cost optimization through local LLM integration.

## System Architecture Overview

JobSquirrel consists of two parallel workflows:

### Original JobSquirrel Workflow (Proven & Stable)
```
Browser Extension → Clipboard → Orchestrator → Claude Processing → Generated Resumes
```

### AcornDepot Workflow (Automated & Scalable)  
```
Scamper Scraper → Cache → Stashboard Processing → Structured Job Data
```

### Planned Integration
Both systems will eventually converge with:
- **Unified LLM Management**: Config-driven Claude vs Ollama selection
- **Shared Job Processing**: AcornDepot feeding into original resume generation
- **Cost Optimization**: Local Ollama for bulk processing, Claude for complex tasks

## File Structure

### Core JobSquirrel System
- `/ResumeData/` - All career data sources (resumes, cover letters, certifications, career info)
- `/GeneratedResumes/[Company - Job Title]/` - Final output for job applications
  - `job-listing.md` - Parsed job descriptions  
  - `session-id.txt` - Claude session tracking
  - `resume-changes.md` - Revision documentation
  - Generated resume and cover letter files
- `/HelperScripts/` - PowerShell orchestration and utility scripts
- `/WoodlandDirectives/` - AI instruction templates for multi-phase processing
- `/BrowserExtension/` - Manual job capture from web pages

### AcornDepot System  
- `/AcornDepot/` - Autonomous job scraper system (see `/AcornDepot/CLAUDE.md`)
  - `/Scamper/` - C# Selenium-based job scraper with stealth features
  - `/Stashboard/` - Node.js Express web interface with real-time streaming  
  - `/Cache/` - Raw scraped HTML and processed markdown files
  - `/services/jobSquirrelPaths.js` - Centralized path management

### Shared Configuration
- `selectors.json` - Global CSS selector configuration for job sites
- `personal-information.txt` - User data for resume customization

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

## Current Architectural State & Future Plans

### Present Reality: "Plate of Spaghetti" 🍝
The JobSquirrel ecosystem has evolved organically into two parallel systems with some architectural inconsistencies:

**What Works Well**:
- ✅ Original JobSquirrel workflow is proven and stable for daily use
- ✅ AcornDepot provides automated scraping and bulk processing capabilities  
- ✅ Both systems produce quality results for their intended use cases
- ✅ Real-time streaming and process control work reliably

**Architectural Challenges**:
- 🔄 Duplicate path management and configuration (being addressed with `jobSquirrelPaths.js`)
- 🔄 Inconsistent LLM integration patterns between systems
- 🔄 Unclear data flow between AcornDepot cache and GeneratedResumes
- 🔄 Mixed file-based signaling approaches

### Planned Architectural Evolution

**Phase 1: Stabilize Current Systems**
- ✅ Centralized path management (`jobSquirrelPaths.js`) 
- 🚧 Local LLM integration (Ollama) for cost optimization
- 🔜 Config-driven LLM selection system

**Phase 2: Incremental Integration**  
- 🔜 Bridge AcornDepot cache → GeneratedResumes workflow
- 🔜 Unified LLM service layer across both systems
- 🔜 Consistent event-driven processing patterns

**Phase 3: Architectural Unification**
- 🔜 Single job processing pipeline with multiple input sources
- 🔜 Unified configuration and state management
- 🔜 Consolidated user interface for both manual and automated workflows

**Design Philosophy**: "Don't break what works" - The original JobSquirrel workflow remains untouched while AcornDepot serves as an experimental platform for new approaches. Integration happens incrementally as patterns prove successful.

## Local LLM Integration with Ollama

**AcornDepot** supports both Claude AI (via API) and local LLM processing via Ollama for cost optimization and faster processing.

### Ollama Setup & Integration

**Installation**: Install Ollama on Windows for optimal GPU/CUDA performance

**WSL Integration**: Ollama Windows executables are directly accessible from WSL:
```bash
# From WSL, call Windows Ollama directly
ollama.exe --version
ollama.exe list
ollama.exe run llama3:latest "Your prompt here"
```

**Architecture Benefits**:
- **Native GPU Performance**: Full CUDA acceleration on Windows
- **Existing Infrastructure**: Uses same WSL command bridge as Claude Code
- **Cost Optimization**: Free local processing vs. expensive Claude API calls
- **A/B Testing**: Easy switching between Claude and Ollama processing

**Technical Implementation**:
```javascript
// Claude command:
wsl -e bash -c "cd ${workingDir} && script -qec \"claude --print --dangerously-skip-permissions '${message}'\" /dev/null"

// Ollama command:
wsl -e bash -c "cd ${workingDir} && ollama.exe run llama3:latest '${message}'"
```

**Output Cleaning**: Like Claude, Ollama outputs ANSI control sequences that require cleaning:
```javascript
const cleanResult = result
    .replace(/\x1b\[[0-9;]*[mGKHF]?/g, '')  // Remove ANSI sequences
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')  // Remove control chars
    .replace(/\?25[hl]/g, '')  // Remove cursor visibility sequences
    .trim();
```

**Model Management**:
- **List models**: `ollama.exe list`
- **Pull models**: `ollama.exe pull llama3.2`
- **Recommended models**: `llama3:latest`, `llama3.2`, `codellama` for different use cases

### Performance Comparison

| Aspect | Claude API | Ollama Local |
|--------|------------|--------------|
| **Cost** | ~$0.15 per 1K tokens | Free after setup |
| **Speed** | Network dependent | GPU dependent |
| **Quality** | Excellent | Good (model dependent) |
| **Availability** | Requires internet | Always available |
| **GPU Usage** | None | High (beneficial) |

**Planned Integration Strategy**: 
- **Config-driven LLM selection** - System-wide configuration for Claude vs Ollama per task type
- **Ollama for bulk processing** - Job HTML conversion, data extraction, simple transformations
- **Claude for agentic tasks** - Resume generation, cover letter writing, complex reasoning
- **Cost optimization** - Reduce API costs while maintaining quality where it matters
- **Unified ecosystem** - Both Original JobSquirrel and AcornDepot benefit from local LLM integration

**Future Convergence**:
The current parallel systems will eventually merge into a unified workflow:
```
Automated Scraping (Scamper) → Job Processing (Ollama) → Resume Generation (Claude) → Final Output
                              ↗
Manual Capture (Browser Extension) → [Same processing pipeline]
```

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