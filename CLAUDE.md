# JobSquirrel Project

## Application Concept
JobSquirrel is a comprehensive job application automation ecosystem that streamlines the entire job application process from job discovery to tailored resume generation and PDF output. The system has evolved into a unified platform that combines automated job scraping, real-time processing, and AI-powered resume generation.

**Core Workflow**:
```
Job Discovery → AI Processing → Multiple Resume Versions → PDF Generation → Final Application
```

The system features a modern React-based web interface (Stashboard) with real-time streaming, tabbed resume management, and professional PDF generation with customizable margins. All components share the squirrel/woodland theme and work together to automate the job application process while maintaining full user control and customization.

## System Architecture Overview

JobSquirrel now operates as a unified ecosystem with two input methods feeding into a single processing pipeline:

### Unified JobSquirrel Architecture
```
┌─ Manual Capture (Scamper Browser Extension) ─┐
│                                              ▼
└─ Automated Scraping (Future: Advanced Scamper) ── Stashboard Web Interface ── Claude Processing ── Multiple Resume Versions ── PDF Generation ── Final Output
```

### Core Components

**Stashboard** - Modern React-based web interface with:
- Real-time job hoard display with live updates
- Tabbed resume management (HTML + PDF versions)
- Live Claude output streaming with expandable content
- Professional PDF generation with margin controls
- Server-Sent Events (SSE) for real-time updates

**Scamper** - Browser extension for manual job capture:
- One-click job posting capture
- Seamless integration with Stashboard processing
- Clean, reliable job data extraction

**Claude Integration** - AI-powered resume generation:
- Multiple resume versions per job (iterative improvements)
- Real-time output streaming to web interface
- Configurable processing with custom instructions

## File Structure

### Current & Future Simplified Structure
```
/JobSquirrel/
├── Stashboard/                 # Main web interface (React + Node.js)
│   ├── src/                   # React frontend components
│   ├── services/              # Backend services and utilities
│   ├── public/                # Static web assets
│   ├── server.js              # Express server with SSE
│   └── hoard.json            # Job data storage
├── Scamper/                   # Browser extension (renamed from BrowserExtension)
│   ├── manifest.json         # Extension configuration
│   ├── content.js            # Job page interaction
│   └── background.js         # Extension background tasks
├── ResumeData/               # User's career data sources
│   ├── resumes/              # Existing resume files
│   ├── cover-letters/        # Cover letter templates
│   ├── projects/             # Project descriptions
│   └── certifications/       # Professional certifications
├── GeneratedResumes/         # Final PDF and resume outputs
│   └── [Clean filename format: "Sean McHugh - Resume For [Job] - [Company].pdf"]
├── Cache/                    # Job scraping cache (HTML files)
└── Configuration Files
    ├── selectors.json        # CSS selectors for job sites
    ├── personal-information.txt  # User contact information
    └── custom-resume-instructions.txt  # Claude processing guidelines
```

### Architectural Simplification (Planned)
The following directories will be **removed** in the upcoming refactoring:
- ❌ `/HelperScripts/` - Functionality moved to Stashboard services
- ❌ `/ClaudeTest/` - No longer needed
- ❌ `/OllamaConfig/` - Configuration consolidated
- ❌ `/WoodlandDirectives/` - Functionality integrated into Stashboard
- ❌ `/AcornDepot/Scamper/` - C# scraper functionality retired
- ❌ `/AcornDepot/` structure - Only Stashboard retained and moved to root

## Stashboard: Modern Job Processing Interface

**Stashboard** is the unified web interface for the entire JobSquirrel ecosystem - a modern React-based application with real-time streaming, comprehensive job management, and professional resume generation capabilities.

### Stashboard Architecture

**Frontend** (React 19.1.0 + Vite 7.0.0):
- **Component-based UI**: Modern React hooks and component architecture
- **Real-time Updates**: Live job hoard with automatic refresh on changes
- **Tabbed Resume Management**: Multiple HTML resume versions with PDF generation
- **Responsive Design**: Professional woodland-themed interface with squirrel emojis
- **Event Streaming**: Real-time Claude output with expandable content cards

**Backend** (Node.js + Express):
- **Server-Sent Events (SSE)**: Real-time browser updates for all operations
- **Job Hoard Management**: Live file watching with event broadcasting
- **Claude Integration**: Seamless AI processing with live output streaming
- **PDF Generation**: Puppeteer-based PDF creation with margin controls
- **Path Management**: Centralized configuration via `jobSquirrelPaths.js`

**Claude Integration**: 
- **WSL Command Execution**: Runs Claude Code through Windows Subsystem for Linux
- **TTY Emulation**: Uses `script -qec` to provide fake TTY for Claude requirements
- **Real-time Streaming**: Individual response lines broadcast to UI immediately
- **Multiple Resume Versions**: Stores HTML in arrays for iterative improvements
- **Smart Output Cleaning**: ANSI sequence removal and proper formatting

### Complete JobSquirrel Workflow

1. **Job Capture**: User utilizes Scamper browser extension
   - One-click capture of job postings from any job site
   - HTML content processed and added to job hoard
   - Real-time updates appear in Stashboard interface immediately

2. **Job Management**: Stashboard provides comprehensive job oversight
   - **Live Job Hoard**: Real-time display of all captured jobs with instant updates
   - **Job Cards**: Rich display with company, title, salary, location, requirements
   - **Interactive Controls**: Collapse/expand, delete, and direct links to original postings
   - **Real-time Sync**: File watching ensures UI stays synchronized with backend changes

3. **Resume Generation**: Multi-version resume creation with Claude AI
   - **"Generate Resume" button**: Initiates AI-powered resume creation
   - **Multiple Versions**: Each generation appends to HTML array (Resume 1, Resume 2, etc.)
   - **Live Streaming**: Real-time Claude output visible in dedicated panel
   - **Tabbed Interface**: Switch between different resume versions seamlessly

4. **PDF Creation**: Professional PDF generation with customization
   - **Margin Control**: 0-2 inch margin input with 0.1 precision
   - **Clean Naming**: Professional filename format without version suffixes
   - **Instant Preview**: PDF opens in new tab within interface
   - **File Overwriting**: New PDFs replace previous versions for clean file management

5. **Real-time Monitoring**: Complete visibility into all operations
   - **Claude Output Panel**: Live streaming of AI reasoning and generation
   - **Event Monitor**: System-wide operation tracking
   - **Expandable Content**: Click to view full responses and details

### Technical Innovations

**Multi-Version Resume Management**:
- HTML arrays store multiple resume iterations per job
- Tabbed interface for seamless version switching
- Iterative improvement workflow for resume quality
- No version conflicts or filename collisions

**Real-time Streaming Architecture**:
- Server-Sent Events (SSE) for instant browser updates
- React queue mechanism prevents state batching issues
- Individual Claude response lines broadcast immediately
- Event broadcasting with proper cleanup and error handling

**Professional PDF Generation**:
- Puppeteer-based PDF creation with precise control
- Customizable margin input (0-2 inches, 0.1 precision)
- Clean filename formatting for professional appearance
- Automatic file overwriting prevents version clutter

**Cross-Platform Integration**:
- WSL bridge enables Claude Code execution from Windows
- Node.js backend with React frontend for modern UX
- File watching with real-time UI synchronization
- Centralized path management via `jobSquirrelPaths.js`

**React-based Modern UI**:
- Component-based architecture with hooks
- Real-time job hoard with live updates
- Expandable content cards for large responses
- Professional woodland-themed design

### Key Features Overview

| Feature | Implementation | Benefits |
|---------|---------------|----------|
| **Job Capture** | Scamper browser extension | One-click job posting capture from any site |
| **Resume Versions** | HTML arrays with tabbed interface | Multiple resume iterations, easy comparison |
| **PDF Generation** | Puppeteer with margin controls | Professional output, customizable formatting |
| **Real-time Updates** | SSE + React queue mechanism | Instant UI updates, live progress tracking |
| **Claude Integration** | WSL bridge with streaming | Live AI reasoning visibility, cross-platform |
| **Job Management** | Interactive cards with controls | Rich job display, easy organization |
| **File Management** | Clean naming, overwriting | Professional filenames, no clutter |
| **UI/UX** | Modern React with woodland theme | Professional interface, excellent usability |

The current JobSquirrel system provides a comprehensive, professional job application automation solution with modern web technologies and seamless user experience.

## System Setup & Operation

### Prerequisites
1. **Career Data**: Place all career materials in `/ResumeData/`
   - Existing resumes, cover letters, project summaries
   - Professional certifications and achievements
   - Any relevant career documentation

2. **Configuration**: Set up user-specific files
   - `personal-information.txt` - Contact information and personal details
   - `custom-resume-instructions.txt` - Claude processing guidelines
   - `selectors.json` - CSS selectors for job site parsing

3. **Stashboard Launch**: Start the web interface
   ```bash
   cd Stashboard
   npm install
   npm run build
   node server.js
   ```
   - Interface available at `http://localhost:3000`
   - Real-time updates via Server-Sent Events

### Modern Workflow
1. **Job Discovery**: User finds interesting job posting
   - Navigate to job posting page
   - Click Scamper browser extension button
   - Job automatically added to Stashboard hoard

2. **Job Processing**: Stashboard manages all operations
   - Job appears in live hoard display immediately
   - Rich job cards show company, title, salary, requirements
   - Interactive controls for organization and management

3. **Resume Generation**: AI-powered resume creation
   - Click "Generate Resume" button on job card
   - Claude processes job requirements and creates tailored resume
   - Live streaming shows AI reasoning process in real-time
   - Multiple versions stored and accessible via tabs

4. **PDF Creation**: Professional output generation
   - Input desired margin size (0-2 inches)
   - Click "📄 PDF" button to generate professional PDF
   - Clean filename automatically generated
   - PDF opens in new tab for immediate review

5. **Final Application**: Use generated materials
   - Download PDF from `/GeneratedResumes/` directory
   - Submit application with tailored resume
   - Keep multiple versions for reference and improvement

### Technical Components

**Stashboard Web Interface**:
- **React Frontend**: Modern component-based UI with real-time updates
- **Express Backend**: RESTful API with Server-Sent Events streaming
- **Event Broadcasting**: Real-time synchronization across all components
- **File Watching**: Automatic detection of job hoard changes

**Scamper Browser Extension**:
- **Content Scripts**: Job posting extraction from any website
- **Background Workers**: Data processing and communication with Stashboard
- **Universal Compatibility**: Works across different job sites and layouts

**Claude Integration Services**:
- **WSL Bridge**: Cross-platform Claude Code execution
- **Streaming Output**: Real-time AI reasoning visibility
- **Resume Generation**: Multi-version HTML creation with iterative improvement
- **Cover Letter Support**: Tailored cover letter generation (upcoming feature)

**PDF Generation System**:
- **Puppeteer Engine**: High-quality PDF creation from HTML
- **Margin Controls**: Precise formatting with user-customizable margins
- **Clean File Management**: Professional naming without version clutter

### Architecture Benefits
- **Real-time Everything**: Instant updates across all components
- **Professional Output**: Clean PDFs ready for immediate submission
- **Version Management**: Multiple resume iterations without file conflicts
- **Modern UI/UX**: Responsive design with excellent usability
- **Cross-platform**: Works on Windows with WSL for Claude integration
- **Fully Observable**: Complete visibility into all processing operations

## Recent Major Improvements (December 2024)

### Multi-Version Resume Management System
**Revolutionary Resume Workflow**: Implemented a complete multi-version resume management system that fundamentally changed how JobSquirrel handles resume generation:

**HTML Array Architecture**:
- Resume HTML stored in arrays rather than single strings
- Each generation appends new version to existing array
- Tabbed interface for seamless version switching
- No filename conflicts or version management issues

**Benefits Achieved**:
- **Iterative Improvement**: Generate multiple versions to refine quality
- **Easy Comparison**: Switch between versions instantly via tabs
- **No Manual File Management**: System handles all version organization
- **Professional Workflow**: Clean, organized approach to resume iteration

### Professional PDF Generation with Margin Controls
**Advanced PDF System**: Implemented sophisticated PDF generation with precise control:

**Technical Implementation**:
- Puppeteer-based PDF engine for high-quality output
- User-configurable margin controls (0-2 inches, 0.1 precision)
- Clean filename format without version suffixes
- Automatic file overwriting for clean file management

**User Experience**:
- Margin input group with professional UI design
- Instant PDF preview in new tab within interface
- Professional filenames ready for HR submission
- No manual file renaming required

### Real-time Streaming Architecture Overhaul
**React Queue Mechanism**: Solved critical React state batching issues that were preventing real-time Claude output display:

**Problem Solved**: React was batching rapid Claude events, causing UI to miss updates
**Solution Implemented**: Event queue with 10ms processing delays
**Result**: Perfect capture of high-frequency streaming output with full visibility into Claude's reasoning process

### React Frontend Migration & Real-time Job Display
**Technology Stack Modernization**: Successfully migrated Stashboard from vanilla JavaScript to modern React with Vite build system:

**Architecture Improvements**:
- **React 19.1.0 + Vite 7.0.0**: Latest frontend technologies for optimal performance
- **Component-based Design**: Modular, maintainable code structure
- **Real-time Job Hoard**: Live display with automatic updates on job changes
- **Professional UI/UX**: Woodland-themed interface with excellent usability

**Key React Components**:
```javascript
├── App.jsx (main container with event stream integration)
├── components/
│   ├── Header.jsx (squirrel-themed header with controls)
│   ├── EventMonitor.jsx (real-time system event display)
│   ├── ClaudeAssistant.jsx (live Claude output streaming)
│   └── JobListings.jsx (interactive job cards with resume management)
└── hooks/
    └── useEventStream.js (custom SSE hook with queue mechanism)
```

**Real-time Synchronization**: Implemented sophisticated file watching with event broadcasting to ensure UI stays perfectly synchronized with backend changes.

### Job Hoard Management System Evolution
**Interactive Job Cards**: Transformed job display from simple lists to rich, interactive cards:

**Features Implemented**:
- **Rich Job Information**: Company, title, salary, location, requirements as tags
- **Interactive Controls**: Collapse/expand, delete, direct links to original postings
- **Resume Count Display**: Shows number of generated versions ("View Resume (2)")
- **Real-time Updates**: Instant display of new jobs and resume generations
- **Professional Layout**: Clean card design with hover effects and proper spacing

**Technical Innovation**: File watching with count tracking ensures only relevant changes trigger UI updates, preventing unnecessary re-renders while maintaining perfect synchronization.

### Claude Integration Streaming System
**Transparent AI Processing**: Implemented comprehensive real-time streaming of Claude's reasoning process:

**Streaming Components**:
- **Individual Response Lines**: Real-time display of Claude's thinking process
- **Expandable Content Cards**: Click-to-expand for large responses (>200 chars)
- **Session Tracking**: Display Claude session IDs and processing status
- **Performance Monitoring**: Show request timing and API costs

**Technical Breakthrough**: Solved React state batching issues with event queue mechanism, enabling perfect capture of high-frequency Claude output streams.

## Current System State & Planned Refactoring

### Present Reality: Unified & Modern 🚀
JobSquirrel has successfully evolved into a cohesive, modern system with excellent user experience:

**What Works Exceptionally Well**:
- ✅ **Stashboard Web Interface**: Modern React-based UI with real-time everything
- ✅ **Multi-Version Resume Management**: Revolutionary approach to resume iteration
- ✅ **Professional PDF Generation**: Clean output with margin controls
- ✅ **Real-time Streaming**: Complete visibility into Claude processing
- ✅ **Centralized Path Management**: `jobSquirrelPaths.js` handles all file operations
- ✅ **Professional File Management**: Clean naming, no version clutter

**System Strengths**:
- **Modern Technology Stack**: React 19.1.0, Node.js, Puppeteer, Server-Sent Events
- **Excellent UX/UI**: Professional interface with woodland theming
- **Real-time Everything**: Instant updates, live streaming, immediate feedback
- **Professional Output**: PDFs ready for immediate submission to HR
- **No Manual File Management**: System handles all organization automatically

### Upcoming Architectural Simplification

**Major Cleanup Initiative**: Streamlining the project structure for maintainability and clarity:

**Directories Being Removed**:
- 🗑️ `/HelperScripts/` → Functionality moved to Stashboard services
- 🗑️ `/ClaudeTest/` → No longer needed
- 🗑️ `/OllamaConfig/` → Configuration consolidated
- 🗑️ `/WoodlandDirectives/` → Functionality integrated into Stashboard
- 🗑️ `/AcornDepot/Scamper/` → C# scraper functionality retired

**Structure Reorganization**:
- 📁 `/AcornDepot/Stashboard/` → `/Stashboard/` (moved to root)
- 📁 `/BrowserExtension/` → `/Scamper/` (renamed to match theme)

**Result**: Clean, focused structure with `/Stashboard/` as the central hub and `/Scamper/` as the input mechanism.

### Future Enhancements Pipeline

**Immediate Roadmap**:
- 🔜 **Cover Letter Generation**: Tailored cover letters with same multi-version approach
- 🔜 **Enhanced Job Site Support**: Improved parsing for additional job platforms
- 🔜 **Advanced PDF Formatting**: Additional layout and styling options
- 🔜 **Bulk Processing**: Handle multiple jobs simultaneously

**Long-term Vision**:
- 🔮 **AI-Powered Job Matching**: Automatic relevance scoring and recommendations
- 🔮 **Application Tracking**: Monitor application status and follow-ups
- 🔮 **Analytics Dashboard**: Track application success rates and optimize strategies

**Design Philosophy**: "Modern, Clean, Professional" - Focus on excellent user experience, professional output, and maintainable architecture.

## Local LLM Integration with Ollama

**Stashboard** supports both Claude AI (via API) and local LLM processing via Ollama for cost optimization and faster processing. This hybrid approach enables cost-effective bulk processing while maintaining Claude's superior quality for complex resume generation tasks.

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

**Integration Strategy**: 
- **Config-driven LLM selection** - System-wide configuration for Claude vs Ollama per task type
- **Ollama for bulk processing** - Job HTML conversion, data extraction, simple transformations
- **Claude for complex tasks** - Resume generation, cover letter writing, complex reasoning
- **Cost optimization** - Reduce API costs while maintaining quality where it matters
- **Unified ecosystem** - Stashboard benefits from both local and cloud LLM integration

**Current Unified Workflow**:
```
Job Capture (Scamper) → Job Processing (Ollama/Claude) → Resume Generation (Claude) → PDF Output (Puppeteer)
                       ↑
                    Stashboard Web Interface (React + SSE)
```

## Claude Session Management

**Modern Approach**: Stashboard handles Claude session management automatically through its integrated services, eliminating the need for manual session detection.

**Current Implementation**:
- **Automatic Session Handling**: Claude integration manages sessions transparently
- **Real-time Session Tracking**: Session IDs displayed in Claude Output panel
- **No Manual Intervention**: System handles all session management automatically
- **WSL Integration**: Seamless Claude Code execution via WSL bridge

**Session Display**: Claude session IDs are automatically captured and displayed in the real-time Claude Output panel, providing complete visibility without manual configuration.

## Real-time Claude Output Display System

**Stashboard** features a revolutionary real-time Claude output monitoring system that transforms AI interaction from a "black box" into a completely transparent, observable process.

### Claude Output Panel Architecture

**Location**: Dedicated panel in Stashboard left sidebar with integrated event monitoring

**Key Features**:
- ✅ **Real-time streaming** of Claude's output during resume generation and processing
- ✅ **Reverse chronological display** with scroll-to-top behavior for newest events
- ✅ **Multiple event types** with distinct visual styling and icons
- ✅ **Expandable content cards** with click-to-expand for long messages (>200 chars)
- ✅ **Session tracking** with automatic Claude session ID display
- ✅ **Processing indicators** showing when Claude is active vs ready
- ✅ **Performance monitoring** with request timing and API cost tracking
- ✅ **Queue-based event processing** that solves React state batching issues

### Event Types and Visual Design

**System Events** (🔧):
- Claude initialization and configuration
- Process startup, WSL detection, command execution
- File operations and cleanup
- Session management and completion status
- Real-time system health monitoring

**Response Lines** (💬):
- Individual lines from Claude's reasoning process
- Real-time streaming as Claude generates responses
- Compact styling optimized for high-frequency updates
- Immediate display with no batching delays

**Full Responses** (🤖):
- Complete response chunks as they're assembled
- Primary Claude output content for resume generation
- Expandable for long HTML/content generation
- Clean formatting with ANSI sequence removal

**Completion Info** (✅):
- Processing duration, API costs, final status
- Session completion and cleanup confirmation
- Performance metrics for optimization tracking
- Success/failure indicators with detailed error reporting

### Technical Implementation

**Advanced Event Broadcasting Architecture**:
```javascript
// anthropic.js broadcasts events with real-time streaming
eventBroadcaster.broadcast('claude-stream', {
    type: 'response-line',
    content: responseLine,
    timestamp: new Date().toISOString()
});

// useEventStream.js with queue mechanism
const eventQueue = [];
let processing = false;

function processQueue() {
    if (processing || eventQueue.length === 0) return;
    processing = true;
    const nextEvent = eventQueue.shift();
    setLastEvent(nextEvent);
    setTimeout(() => {
        processing = false;
        processQueue();
    }, 10); // Critical 10ms delay ensures React processes each event individually
}
```

**Queue-based Event Processing Breakthrough**:
- **Problem Solved**: React's state batching was causing rapid Claude events to be overwritten
- **Solution**: Event queue with 10ms processing delay ensures each event triggers individual React renders
- **Result**: Perfect capture of high-frequency streaming output with zero data loss
- **Performance**: Handles hundreds of events per second without UI lag

**Advanced Cross-Platform Integration**:
- **Windows WSL Bridge**: Commands executed via `wsl -e bash -c "claude --args"`
- **Real-time File Monitoring**: Live monitoring of Claude's JSON output streams
- **ANSI Sequence Cleaning**: Automatic removal of control characters and formatting codes
- **Event Types**: System, response, response-line, complete, error with consistent icons
- **Automatic Session Tracking**: Claude session IDs captured and displayed automatically

### Advanced UI Features

**Expandable Content Cards**:
- Messages >200 characters automatically truncated with "..." 
- **▼ More** / **▲ Less** click-to-expand functionality
- Character count display for long messages
- Maintains UI responsiveness while preserving full content access
- Smooth animations and professional styling

**Real-time Scroll Management**:
- **Scroll-to-top behavior** for reverse chronological display
- Newest events always visible immediately
- Automatic scroll management during high-frequency updates
- No manual scrolling required during active processing

**Professional Visual Design**:
- **Consistent icon system**: 🔧 System, 💬 Response lines, 🤖 Full responses, ✅ Completion
- **Color-coded events**: Different event types with distinct styling
- **Processing indicators**: Live status showing Claude active vs ready
- **Woodland theme integration**: Consistent with overall JobSquirrel aesthetic

### Integration with Complete JobSquirrel Ecosystem

**Multi-Version Resume Workflow**:
1. User clicks "Generate Resume" on job card
2. Claude Output panel shows real-time progress:
   - 🔧 System initialization and WSL setup
   - 💬 Individual reasoning steps as Claude processes job requirements
   - 🤖 HTML resume generation chunks with live streaming
   - ✅ Completion with timing, cost, and version information

**PDF Generation Integration**:
- Real-time monitoring of PDF creation process
- Margin control changes reflected in processing output
- Puppeteer execution visibility with complete transparency
- File path and success confirmation in output stream

**Professional Development Experience**:
- **Complete transparency** into AI decision-making process
- **Performance monitoring** with request timing and API cost tracking
- **Error tracking** with detailed error message display and debugging info
- **Session management** for complex multi-step workflows
- **Development debugging** with full visibility into all operations

This revolutionary system transforms AI interaction from a "black box" into a completely transparent, observable process, providing unprecedented insights for both users and developers while maintaining excellent performance and professional user experience.

## Code Theme & Naming Conventions

All code uses consistent squirrel/woodland-themed language throughout the ecosystem:

**Action Functions**:
- `forage()` - retrieving/gathering data (instead of get/fetch)
- `stash()` - saving/storing data (instead of save/store)
- `scamper()` - navigation/iteration operations
- `chatter()` - logging and communication

**Component Names**:
- **Stashboard** - Main web interface (where squirrels manage their winter stash)
- **Scamper** - Browser extension (squirrels scampering around collecting jobs)
- **Job Hoard** - Collection of captured job postings
- **Nut Note** - Individual job data structure
- **AcornProcessor** - Data processing handlers
- **NutCache** - Temporary storage systems

**File & Directory Names**:
- `hoard.json` - Main job storage file
- `jobSquirrelPaths.js` - Centralized path management
- Cache directories and temp files follow woodland theme

**UI Elements**:
- 🐿️ Squirrel emoji for main system operations
- 🌰 Acorn emoji for job processing operations  
- 🥜 Nut emoji for stored data and cache operations
- Brown/orange color scheme throughout interface
- Woodland terminology in user-facing text

This consistent theming makes the codebase memorable, fun to work with, and maintains a cohesive identity while providing professional functionality.

---

## Current System Summary

**JobSquirrel** has evolved into a sophisticated, modern job application automation ecosystem that successfully combines:

✅ **Modern Technology Stack**: React 19.1.0, Node.js, Puppeteer, Server-Sent Events  
✅ **Revolutionary Resume Management**: Multi-version HTML arrays with tabbed interface  
✅ **Professional PDF Generation**: Customizable margins with clean file management  
✅ **Real-time Everything**: Live streaming, instant updates, complete transparency  
✅ **Excellent User Experience**: Professional interface with woodland theming  
✅ **Cross-platform Integration**: Windows + WSL with seamless Claude Code execution  
✅ **Zero Manual File Management**: System handles all organization automatically  

**Upcoming Features**: Cover letter generation, enhanced job site support, bulk processing capabilities

**Planned Refactoring**: Simplified directory structure with `/Stashboard/` as central hub and `/Scamper/` as input mechanism

JobSquirrel represents a complete solution for job application automation with modern web technologies, professional output quality, and exceptional user experience. 🚀