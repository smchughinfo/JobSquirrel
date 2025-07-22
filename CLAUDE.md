# JobSquirrel - AI-Powered Job Application Automation Platform

## Project Overview

**JobSquirrel** is a revolutionary AI-powered job application automation ecosystem that transforms the entire job search process from discovery to professional output. Built with modern web technologies and powered by Claude AI, JobSquirrel provides a unified platform combining automated job capture, real-time processing, and intelligent resume generation with an intuitive web interface.

**🚀 Complete Job Application Workflow**:
```
Job Discovery → AI Processing → Multiple Resume Versions → Creative Remix → Double Check → PDF Generation → Professional Output
```

The system features a modern React-based web interface (Stashboard) with real-time streaming, tabbed resume management, revolutionary remix functionality, comprehensive double check system, and professional PDF generation with customizable margins.

## ⚠️ Critical Technical Issue Documentation

**EventSource + React.StrictMode Bug**: A critical issue was discovered and resolved involving React.StrictMode causing dual EventSource connections that overwhelmed the Node.js event loop, making the entire application unresponsive. Full technical analysis and resolution details are documented in:

📄 **[EventSource-StrictMode-Issue.md](Documentation/EventSource-StrictMode-Issue.md)**

*This reference will be removed once the issue is fully behind us, but serves as important technical documentation for understanding React.StrictMode interactions with persistent connections.*

## System Architecture

### Core Components

**Stashboard** - Modern React-based web interface with:
- Real-time job hoard display with live updates
- Tabbed resume management (HTML + PDF versions)
- Revolutionary remix feature with natural language instructions
- Comprehensive double check system for quality assurance
- Live Claude output streaming with expandable content
- Professional PDF generation with margin controls
- Server-Sent Events (SSE) for real-time updates

**Scamper** - Browser extension for manual job capture:
- One-click job posting capture
- Seamless integration with Stashboard processing
- Clean, reliable job data extraction

**Claude Integration** - AI-powered resume generation and modification:
- Multiple resume versions per job (iterative improvements)
- Real-time output streaming to web interface
- Revolutionary remix functionality with natural language instructions
- Universal double check system for any resume version
- Configurable processing with custom instructions

## Revolutionary Features

### Multi-Version Resume Management System
**Revolutionary Resume Workflow**: Complete multi-version resume management system that fundamentally changed how JobSquirrel handles resume generation:

**HTML Array Architecture**:
- Resume HTML stored in arrays rather than single strings: `html: [version1, version2, version3...]`
- Each generation appends new version to existing array
- Tabbed interface for seamless version switching
- No filename conflicts or version management issues

**Benefits**:
- **Iterative Improvement**: Generate multiple versions to refine quality
- **Easy Comparison**: Switch between versions instantly via tabs
- **No Manual File Management**: System handles all version organization
- **Professional Workflow**: Clean, organized approach to resume iteration

### Revolutionary Remix Feature 🎨
**Natural Language Resume Modifications**: The most innovative feature that allows users to transform resumes with simple instructions:

**Remix Examples**:
- **"Make it more creative and engaging"** → Professional yet playful tone with enhanced visual appeal
- **"Emphasize leadership experience"** → Focus shifts to management and team leadership accomplishments
- **"Style like a space pirate obsessed with outer space"** → Complete thematic transformation:
  - **"Captain Sean 'Space Rover' McHugh"**
  - **"🚀 Interstellar Code Buccaneer & Cosmic .NET Navigator 🏴‍☠️"**
  - Skills become "🚀 Xamarin/MAUI doubloons", "⚡ Reactive Extensions stardust", "☁️ Azure cloud navigation charts"
  - Complete color scheme transformation (cosmic black/cyan/gold)
  - Maintains technical accuracy while enabling unlimited creativity

**Technical Innovation**: The remix feature demonstrates that AI can maintain technical accuracy while enabling unlimited creative expression - from conservative professional themes to wildly creative variations.

### Revolutionary Double Check System 🔍
**Universal Quality Assurance**: Comprehensive double check system enabling quality review of any resume version:

**Key Innovations**:
- **Universal Access**: Any resume version can be double checked, not just the latest
- **Fresh Session Architecture**: Each double check operation gets unique session data
- **Session Data Arrays**: Migrated from single session to array-based tracking: `nutNote.sessionData = []`
- **Clean Session Management**: Each operation gets fresh session with unique file paths
- **No Session Conflicts**: Fresh sessions eliminate Claude confusion and mixed signal issues

### Professional PDF Generation with Precision Controls
**Advanced PDF System**: Sophisticated PDF generation with pixel-perfect control:

**Technical Implementation**:
- **Puppeteer-based PDF engine** for consistent, high-quality output
- **User-configurable margin controls** (0-2 inches with 0.1-inch precision)
- **Clean filename format** without version suffixes: "Sean McHugh - [Company].pdf"
- **Automatic file overwriting** for clean file management
- **Instant preview** in new browser tab

### Real-time Streaming Architecture
**React Queue Mechanism**: Solved critical React state batching issues that were preventing real-time Claude output display:

**Problem Solved**: React was batching rapid Claude events, causing UI to miss updates and lose streaming visibility
**Solution Implemented**: Event queue with 10ms processing delays to force individual React renders
**Result**: Perfect capture of high-frequency streaming output with complete visibility into Claude's reasoning process

### Revolutionary Resume Profiles System 🗂️
**Multi-Profile Resume Management**: Advanced resume profile management system enabling users to maintain multiple resume.json configurations for different career paths or applications:

**Profile Management Features**:
- **Named Profiles**: Create profiles like "Senior Developer", "Technical Lead", "Product Manager" with custom names
- **Path-Based Configuration**: Each profile points to its own resume.json file via full file path specification
- **Active Profile System**: One profile marked as currently active for all template generation operations
- **Professional Dialog Interface**: Clean modal with profile management, inline path editing, and status indicators
- **Real-time Path Editing**: Text input with monospace font for easy path specification and editing
- **Dynamic System Integration**: Template generators automatically use active profile without code changes

**Technical Architecture**:
- **File Storage**: Profiles persisted in `Stashboard/resume-profiles.txt` with JSON structure including id, name, filePath, active status
- **Service Layer**: `resumeProfiles.js` provides complete CRUD operations for profile management
- **Path Resolution**: `jobSquirrelPaths.getResumeJSONPath()` dynamically returns active profile path
- **Template Integration**: Both resume and cover letter generators use active profile automatically
- **RESTful API**: Complete `/api/resume-profiles` endpoints for frontend integration
- **Error Handling**: Comprehensive validation and helpful error messages for missing files or configurations

**User Interface**:
- **Hamburger Menu Access**: "🗂️ Resume Profiles" option in main navigation menu  
- **Profile Cards**: Visual cards showing profile name, active status, file path, and management controls
- **Inline Path Editing**: Click "📝 Set Path" to edit file paths with text input and Save/Cancel actions
- **Active Profile Indicators**: Clear visual indication of which profile is currently active
- **Profile Actions**: Set Active, Delete, and Path editing with appropriate button states and validation

**System Benefits**:
- **Career Flexibility**: Maintain separate resume data for different career tracks or industries
- **Project Separation**: Different profiles for freelance vs full-time vs consulting work
- **Version Control**: Keep multiple resume versions without file management overhead
- **Seamless Switching**: Change active profile and all subsequent generations use new data automatically
- **Zero Configuration**: Default profile created automatically pointing to existing resume.json

### Revolutionary ATS Skills Optimization System 🎯
**Intelligent Keyword Management**: Advanced ATS (Applicant Tracking System) skills optimization with user approval workflow that transforms template-based resume generation:

**Smart Skills Detection**:
- **Automatic Analysis**: AI compares job requirements against existing skill set during template generation
- **New Skill Identification**: System detects unmatched skills from job postings that could enhance ATS compatibility
- **Generation Pause**: Template generation intelligently pauses when new skills are discovered
- **User Approval Workflow**: Professional dialog presents all skills with new ones highlighted for review

**ATS Skills Approval Dialog**:
- **Professional Interface**: Clean modal with skill matrix display and checkbox controls
- **Smart Highlighting**: New skills prominently displayed at top with "NEW" badges
- **Comprehensive View**: Shows all existing ATS skills alongside new discoveries
- **Instant Integration**: Approved skills immediately available for current and future generations

**Seamless Workflow Integration**:
- **Template Generation Enhancement**: Approved ATS skills automatically appended to resume.json skills
- **Dynamic Skill Combination**: `[...resumeData.skills, ...approvedATSSkills]` for optimal keyword coverage
- **Universal Application**: Same enhancement applies to both resume and cover letter generation
- **Hamburger Menu Access**: "🎯 Manage ATS Skills" button for ongoing skill library management

**Technical Architecture**:
- **File-Based Storage**: Skills persisted in `ats-add-on-skills.json` with include/exclude flags
- **Modular Service Design**: `atsAddOnSkills.js` provides clean API for skill management
- **React Dialog Component**: `ATSSkillsDialog.jsx` with responsive grid layout and professional styling
- **API Integration**: RESTful endpoints for skill retrieval and updates (`/api/ats-skills`)

**Key Benefits**:
- **ATS Optimization**: Maximizes keyword matching for automated recruiting systems
- **Non-Destructive**: Original skills preserved while adding targeted job-specific keywords
- **User Control**: Complete transparency and approval control over skill additions
- **Persistent Library**: Approved skills available across all future job applications

### Dynamic Job Title Integration 🎯
**Perfect Job Matching**: Revolutionary approach to resume personalization using actual job listing titles instead of generic personal titles:

**Technical Implementation**:
- **Template Data Enhancement**: `title: nutNote.jobTitle` replaces `title: resumeData.personal_information.title`
- **Both Resume & Cover Letter**: Consistent job title integration across all template generation
- **Automatic Alignment**: Every generated document perfectly matches the specific job posting

**Professional Benefits**:
- **Perfect ATS Matching**: Resume titles now exactly match recruiter expectations
- **Job-Specific Optimization**: No more generic "Software Engineer" when applying for "Senior React Developer"
- **Professional Consistency**: Complete alignment between job posting and application materials
- **Automatic Personalization**: Zero manual effort required for perfect job title matching

## Technology Stack

### Frontend
- **React 19.1.0** with modern hooks and component architecture
- **Vite 7.0.0** for lightning-fast development and building
- **Server-Sent Events** for real-time browser updates
- **Custom React hooks** (`useEventStream`) for SSE integration
- **Component-based design** with proper state management
- **ATS Skills Dialog** (`ATSSkillsDialog.jsx`) with responsive grid layout and professional styling
- **Template Generation Integration** with both AI and template-based resume systems

### Backend
- **Node.js + Express** with RESTful API design
- **Modular Route Architecture** with organized endpoint structure (`routes/` directory)
- **ATS Skills Management** (`atsAddOnSkills.js`) with file-based persistence
- **Template Generation System** (`templatized.js`) with Handlebars integration
- **Server-Sent Events** for real-time client communication
- **File watching** with debounced change detection
- **Event broadcasting** system for multi-client support
- **Path management** via centralized `jobSquirrelPaths.js`

### AI Integration
- **Claude Code** via WSL bridge with TTY emulation
- **Real-time streaming** of AI reasoning and generation
- **Cross-platform compatibility** (Windows + WSL)
- **Custom instruction processing** for personalized results
- **Remix functionality** with natural language processing
- **Error handling** with comprehensive logging

### File Management
- **JSON-based job storage** (`hoard.json`) with atomic updates
- **HTML array storage** for multi-version resume management
- **ATS Skills Persistence** (`ats-add-on-skills.json`) with include/exclude flags
- **Template Storage** (`static/` directory) with resume and cover letter templates
- **Automatic PDF organization** in `GeneratedResumes/` directory
- **Temp file management** for Claude processing workflows
- **Clean filename conventions** for professional output

## File Structure

### Current Simplified Structure
```
/JobSquirrel/
├── Stashboard/                     # Main web interface (React + Node.js)
│   ├── src/                        # React frontend components
│   │   ├── components/             # Core UI components
│   │   │   ├── JobListings.jsx     # Job cards + multi-version resume + remix + double check
│   │   │   ├── EventMonitor.jsx    # Real-time system event display
│   │   │   ├── ClaudeAssistant.jsx # Live Claude output streaming
│   │   │   ├── Header.jsx          # Squirrel-themed navigation with ATS skills access
│   │   │   ├── ATSSkillsDialog.jsx # ATS skills approval and management dialog
│   │   │   ├── ResumeProfilesDialog.jsx # Resume profiles management dialog
│   │   │   └── ClipboardMonitor.jsx # Clipboard monitoring component
│   │   └── hooks/                  # Custom React hooks
│   │       └── useEventStream.js   # SSE integration with queue mechanism
│   ├── services/                   # Backend services and utilities
│   │   ├── llm/                    # AI integration services
│   │   │   ├── anthropic.js        # Claude integration with streaming
│   │   │   ├── ollama.js           # Ollama local LLM integration (deprecated)
│   │   │   └── openai/             # OpenAI services
│   │   │       ├── assistant.js    # OpenAI assistant integration (deprecated)
│   │   │       ├── index.js        # OpenAI main service
│   │   │       └── openai.js       # OpenAI API wrapper
│   │   ├── generators/             # Resume generation engines
│   │   │   ├── common.js           # Shared generation utilities
│   │   │   ├── noTemplate.js       # AI-based resume generation
│   │   │   └── templatized.js      # Template-based resume generation with ATS skills
│   │   ├── atsAddOnSkills.js       # ATS skills management service
│   │   ├── resumeProfiles.js       # Resume profiles management service
│   │   ├── pdf.js                  # PDF generation service
│   │   ├── hoard.js                # Job data management
│   │   ├── eventBroadcaster.js     # Real-time event system
│   │   ├── jobSquirrelPaths.js     # Centralized path management
│   │   ├── clipboard.js            # Clipboard monitoring service
│   │   ├── jobQueue.js             # Job processing queue
│   │   ├── jobListingProcessor.js  # Job listing processing logic
│   │   ├── htmlUtilities.js        # HTML processing utilities
│   │   ├── commandRunner.js        # Command execution service
│   │   └── utilities.js            # General utility functions
│   ├── routes/                     # Modular API route handlers
│   │   ├── index.js                # Route registration hub
│   │   ├── hoard.js                # Job listing endpoints
│   │   ├── generation.js           # Resume/cover letter generation endpoints
│   │   ├── atsSkills.js            # ATS skills management endpoints
│   │   ├── resumeProfiles.js       # Resume profiles management endpoints
│   │   ├── pdf.js                  # PDF generation endpoints
│   │   ├── config.js               # Configuration endpoints
│   │   └── events.js               # SSE and monitoring endpoints
│   ├── public/                     # Static web assets (built by Vite)
│   │   └── assets/                 # Built CSS/JS assets
│   ├── static/                     # Template files and static assets
│   │   ├── resume-template-1.html  # ATS-friendly resume template
│   │   ├── resume-template-2.html  # Enhanced design resume template
│   │   └── cover-letter-template-1.txt # Professional cover letter template
│   ├── queue/                      # Job queue storage
│   ├── server.js                   # Express server with modular routes
│   ├── hoard.json                  # Job data storage with HTML arrays
│   ├── ats-add-on-skills.json      # ATS skills library with approval flags
│   └── resume-profiles.txt         # Resume profiles configuration with active profile tracking
├── Scamper/                        # Browser extension
│   ├── manifest.json               # Extension configuration
│   ├── content.js                  # Job page interaction
│   └── background.js               # Extension background tasks
├── Config/                         # Configuration and career data
│   ├── ResumeData/                 # User's career data sources
│   │   ├── chat-gpt-career-related-memory-dump.md
│   │   ├── nutkins cover letter template.txt
│   │   ├── resume1.txt             # Resume data file
│   │   └── resume2.txt             # Resume data file
│   │   └── resume.json             # Required for templatized resumes
│   ├── personal-information.txt    # Contact information
│   └── custom-resume-instructions.txt # AI processing guidelines
├── Cache/                          # Session tracking and temp files
│   ├── working-resume-[uid].html   # Resume generation temp files
│   ├── double-checked-resume-[uid].html # Double check output files
│   ├── session-id-[uid].txt        # Claude session tracking
│   ├── cover-letter-[uid].txt      # Cover letter temp files
│   ├── job-listing-[uid].md        # Job listing temp files
│   ├── remix-resume-[uid].html     # Resume being remixed
│   ├── remix-resume-instructions-[uid].txt # User's remix instructions
│   └── save-session-id-[uid]-instructions.txt # Session save instructions
├── ScriptsForClaude/               # Claude Code utility scripts
│   ├── get-current-session-id.sh   # Session ID retrieval script
│   └── save-session-id-instructions-template.txt # Template for session instructions
├── Documentation/                  # Project documentation
│   ├── JobSquirrel in a nutshell.svg
│   ├── YouTube.png
│   ├── resume1.svg
│   ├── resume2.svg
│   └── resume3.svg
└── GeneratedResumes/               # Final PDF and resume outputs (created dynamically)
    ├── [Company Name] - Sean McHugh.pdf # Resume PDFs
    └── [Company Name] - Sean McHugh.txt # Cover letter files
```

## Complete JobSquirrel Workflow

### 1. **Job Capture**: Seamless job discovery
- User navigates to any job posting website
- Single click on **Scamper browser extension** button
- Job HTML content automatically processed and added to job hoard
- Real-time updates appear in Stashboard interface immediately

### 2. **Job Management**: Comprehensive oversight with rich interface
- **Live Job Hoard**: Real-time display of all captured jobs with instant updates
- **Interactive Job Cards**: Rich display with company, title, salary, location, requirements as tags
- **Smart Controls**: Collapse/expand, delete, and direct links to original postings
- **Real-time Sync**: File watching ensures UI stays perfectly synchronized with backend changes

### 3. **Resume Profile Management**: Multi-profile career data organization 🗂️
- **"🗂️ Resume Profiles" menu**: Access via hamburger menu for complete profile management
- **Multiple Career Profiles**: Maintain separate resume.json files for different career paths (Senior Developer, Technical Lead, Product Manager)
- **Active Profile System**: Set any profile as active for all template generation operations
- **Path-Based Configuration**: Each profile points to its own resume.json file via full file path
- **Inline Path Editing**: Click "📝 Set Path" to edit file paths with professional text input interface
- **Dynamic Integration**: All template generation automatically uses active profile data without user intervention
- **Default Profile Creation**: System automatically creates default profile pointing to existing resume.json
- **Profile Management**: Add, delete, activate profiles with comprehensive validation and error handling

### 4. **Hybrid Resume Generation**: AI and template-based options with ATS optimization
- **"🚀 Resume & Cover Letter" button**: Opens unified generation dialog
- **AI-Generated Resumes**: Claude's creative intelligence for unique, tailored content
- **Template-Based Resumes**: Clean, consistent, ATS-friendly formatting with Handlebars and automatic skills optimization
- **Active Profile Integration**: Template generation automatically uses currently active resume profile
- **ATS Skills Integration**: Template generation automatically detects and incorporates job-specific keywords
- **Skills Approval Workflow**: New skills trigger professional approval dialog with smart highlighting
- **Dynamic Job Title Matching**: Resume titles automatically use job posting titles for perfect ATS alignment
- **Template Selection**: Choose between "ATS Friendly" or "Enhanced Design" templates
- **Multiple Versions**: Each generation appends to HTML array (Resume 1, Resume 2, etc.)
- **Live Streaming**: Real-time Claude output visible in dedicated panel with expandable content
- **Tabbed Interface**: Switch between different resume versions seamlessly
- **Cover Letter Generation**: Automatic cover letter creation alongside resume with same ATS optimization

### 5. **Revolutionary Creative Variations**: The Remix Feature 🎨
- **"🎨 Remix" button**: Opens remix dialog for existing resumes
- **Natural Language Instructions**: Users describe desired changes in plain English
- **Unlimited Creative Freedom**: From subtle professional polish to complete thematic transformations
- **Technical Accuracy Maintained**: AI preserves job relevance while enabling creative expression
- **Iterative Process**: Build upon previous versions without file conflicts or management overhead

### 6. **Quality Assurance**: The Double Check System ✅
- **"✅ Double Check" button**: Available on any resume version
- **Universal Review**: Any resume can be reviewed and improved, not just the latest
- **Fresh Session Processing**: Each double check gets unique session data for clean separation
- **Guidelines Compliance**: Reviews resume against custom instructions for quality assurance
- **Version Creation**: Creates new improved version while preserving original

### 7. **ATS Skills Optimization**: Intelligent keyword management 🎯
- **Automatic Detection**: System identifies job-specific skills missing from resume during template generation
- **Smart Approval Dialog**: Professional interface shows all skills with new ones highlighted and badged
- **Hamburger Menu Access**: "🎯 Manage ATS Skills" for ongoing library management and review
- **Skill Matrix Interface**: Responsive grid layout with checkboxes for easy selection
- **Persistent Skills Library**: Approved skills automatically included in all future generations
- **Dynamic Integration**: `[...resumeData.skills, ...approvedATSSkills]` for optimal keyword coverage

### 8. **Professional PDF Creation**: Precision output generation
- **Customizable Margins**: 0-2 inch margin control with 0.1-inch precision
- **One-Click Generation**: Instant PDF creation from any resume version
- **Clean Naming**: Professional filename format ready for HR submission
- **Instant Preview**: PDF opens in new tab for immediate review
- **Automatic Management**: File overwriting prevents version clutter

### 9. **Complete Real-time Monitoring**: Full transparency
- **Claude Output Panel**: Live streaming of AI reasoning and generation process
- **Event Monitor**: System-wide operation tracking with timestamped events
- **Expandable Content**: Click to view full responses and detailed information
- **Performance Metrics**: Request timing, API costs, and processing statistics

## Key Technical Innovations

### Cross-Platform Integration Excellence
**WSL Bridge Architecture**: Seamless Claude Code execution from Windows Node.js server

**Technical Implementation**:
```javascript
// WSL command execution with TTY emulation for Claude Code requirements
const command = `wsl -e bash -c "cd ${workingDir} && script -qec \\"claude --print --dangerously-skip-permissions '${message}'\\" /dev/null"`;
const result = execSync(command, { encoding: 'utf8', timeout: 600000 });
```

**Key Innovations**:
- **TTY Emulation**: Uses `script -qec` to provide fake TTY for Claude requirements
- **Perfect Message Escaping**: Handles complex messages with quotes, newlines, and special characters
- **Sequential File Processing**: One file at a time ensures proper streaming order
- **Real-time Feedback**: Progress updates stream immediately to browser interface

### Server-Sent Events (SSE) Architecture
**Real-time Browser Updates**: Complete event-driven architecture for instant UI updates

**Event Types with Visual Design**:
- **🔧 System Events**: Configuration, startup, file operations (cyan color)
- **🥜 Job Events**: Queue operations, processing status (orange color)
- **💬 Claude Response Lines**: Individual AI reasoning steps (blue color)
- **🤖 Claude Full Responses**: Complete generated content (green color)
- **✅ Completion Events**: Performance metrics, timing, costs (green color)
- **❌ Error Events**: Failures, warnings, debugging info (red color)

### Advanced React Component Architecture

**Key React Components**:

**`JobListings.jsx`** - Core job management with multi-version resume system:
- Real-time job card display with hover effects
- Multi-version resume management with tabbed interface
- Revolutionary remix dialog with natural language input
- Universal double check system for quality assurance
- PDF generation controls with margin precision
- Interactive job controls (collapse, delete, links)

**`EventMonitor.jsx`** - Real-time activity tracking:
- Live event display with type-specific styling and icons
- Expandable content for large messages (>200 characters)
- Connection status indicator with visual feedback
- Event history with timestamp formatting

**`ClaudeAssistant.jsx`** - AI output streaming panel:
- Real-time Claude response display with content filtering
- Session tracking and performance metrics
- Expandable content cards for large responses
- Processing indicators showing Claude active vs ready state

**`useEventStream.js`** - Custom SSE hook with queue mechanism:
- EventSource connection management with automatic reconnection
- Event queue processing to prevent React batching issues
- Event filtering and type detection
- Performance optimization for high-frequency streams

### Centralized Path Management System
**Location**: `services/jobSquirrelPaths.js`

**Purpose**: Provides consistent path resolution across the entire JobSquirrel ecosystem

**Critical Functions**:
```javascript
// Get root JobSquirrel directory (Windows or WSL paths)
getJobSquirrelRootDirectory(wsl = false)

// Specialized paths for different operations
getResumeDataDirectory(wsl = false)
getGeneratedResumesDirectory(wsl = false)
getJobListingMDPath(wsl = false)
getRemixResumePath(wsl = false)
getRemixResumeInstructionsPath(wsl = false)
getSessionIdData(wsl = false) // Session management

// Automatic Windows → WSL path conversion
convertPathToWSL(windowsPath)
```

**CRITICAL REQUIREMENT**: All JobSquirrel services MUST use `jobSquirrelPaths.js` for path operations. Never manually construct paths or perform Windows→WSL conversion in service files. This ensures consistency and makes the system maintainable.

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
- **Remix** - Creative resume modification feature
- **Double Check** - Quality assurance feature

**File & Directory Names**:
- `hoard.json` - Main job storage file with HTML arrays
- `jobSquirrelPaths.js` - Centralized path management
- `remix-resume.html` - Current resume being modified
- `remix-instructions.txt` - User's creative instructions
- `SessionIdS/` - Session tracking directory

**UI Elements**:
- 🐿️ Squirrel emoji for main system operations
- 🌰 Acorn emoji for job processing operations  
- 🥜 Nut emoji for stored data and cache operations
- 🎨 Artist palette emoji for remix functionality
- ✅ Check mark emoji for double check system
- Brown/orange/woodland color scheme throughout interface

This consistent theming makes the codebase memorable, fun to work with, and maintains a cohesive identity while providing professional functionality.

## Recent Major Improvements (January 2025)

### Revolutionary Resume Profiles System Implementation (Current Session)
**Multi-Profile Career Management**: Implemented comprehensive resume profile management system enabling users to maintain multiple resume configurations for different career paths:

**Complete Frontend Implementation**:
- **ResumeProfilesDialog.jsx**: Professional modal dialog with profile cards, inline path editing, and management controls
- **Header.jsx Integration**: Added "🗂️ Resume Profiles" option to hamburger menu with proper state management
- **App.css Styling**: Complete styling system with profile cards, active indicators, and inline editing forms

**Robust Backend Architecture**:
- **resumeProfiles.js Service**: Complete CRUD operations for profile management with JSON persistence
- **routes/resumeProfiles.js**: RESTful API endpoints (`/api/resume-profiles/*`) for all profile operations
- **Dynamic Path Resolution**: Updated `jobSquirrelPaths.getResumeJSONPath()` to dynamically return active profile path

**Template System Integration**:
- **Generator Updates**: Both `templatized/resume.js` and `templatized/coverLetter.js` now use active profile automatically
- **Error Handling**: Comprehensive validation and helpful error messages for missing configurations
- **Backward Compatibility**: Default profile created automatically pointing to existing resume.json

**User Experience Excellence**:
- **Text-Based Path Input**: Professional text input with monospace font for easy path specification (avoided browser file chooser limitations)
- **Inline Editing**: Click "📝 Set Path" for seamless path editing with Save/Cancel workflow
- **Active Profile Indicators**: Clear visual indication of currently active profile with professional styling
- **Profile Management**: Add, delete, activate profiles with proper validation and user feedback

**Technical Benefits**:
- **Career Flexibility**: Separate resume data for different career tracks (Senior Developer, Technical Lead, Product Manager)
- **Zero Configuration**: System automatically creates default profile and handles all path management
- **Dynamic Integration**: All existing template generation automatically uses active profile without code changes
- **Professional File Management**: Full file paths stored with comprehensive error handling and validation

**Key Files Created/Modified**:
- `src/components/ResumeProfilesDialog.jsx` - New profile management component
- `services/resumeProfiles.js` - New profile management service  
- `routes/resumeProfiles.js` - New API endpoints
- `src/components/Header.jsx` - Added menu option and dialog integration
- `src/App.css` - Added comprehensive profile dialog styling
- `services/jobSquirrelPaths.js` - Updated to use dynamic profile resolution
- `services/generators/templatized/*.js` - Updated to use active profile paths

**System Impact**: Template-based resume and cover letter generation now supports unlimited career profiles with seamless switching and zero manual configuration overhead.

### Advanced Configuration Management & PDF Processing System (Current Session)
**Complete Configuration Overhaul**: Implemented comprehensive configuration management with real-time file watching and editing capabilities:

**Server-Side File Watching**: Added automatic monitoring of configuration files with real-time logging:
- **`custom-resume-instructions.txt`** and **`personal-information.txt`** watched for changes
- **Dual console logging**: Both server console and browser console receive real-time updates
- **Cross-platform integration**: Uses existing WSL bridge architecture for seamless monitoring

**Advanced Configuration Dialog System**: Replaced simple console logging with professional editing interface:
- **Hamburger Menu**: Moved configuration access to elegant dropdown menu (☰)
- **Modal Dialog Editor**: Full-screen editing with monospace fonts and proper styling
- **Real-time Persistence**: Changes saved immediately to disk via `/api/update-config-file` endpoint
- **Professional UI**: Clean modal with Update/Cancel buttons and proper error handling

**Revolutionary PDF Processing Pipeline**: Implemented automated PDF-to-text conversion system:
```javascript
// Automated PDF processing workflow
processPDFsInResumeData() → pdftotext via WSL → text extraction → file organization
```

**Key Technical Achievements**:
- **Cross-Platform PDF Processing**: Uses WSL bridge to execute `pdftotext` from Windows Node.js
- **Intelligent File Management**: PDFs converted to text, backed up to Cache, removed from ResumeData
- **Error Recovery**: Comprehensive error handling with cleanup and retry logic
- **Real-time Feedback**: Progress updates streamed via existing event broadcasting system

**Hidden Job Data Embedding System**: Implemented revolutionary resume context preservation:
```javascript
// Invisible job data embedding in PDFs
embedHiddenText(resumeHTML, "Job Listing used by JobSquirrel to tailor resume: " + jobData)
```

**Technical Innovation**:
- **Stealth Data Storage**: `color:white;font-size:.01px;` renders invisible but extractable
- **Professional Context**: Job data embedded with clear attribution for transparency
- **PDF Text Extraction Ready**: Hidden content captured by `pdftotext` for future AI processing
- **Self-Contained Resumes**: Each PDF contains complete job context for perfect AI tailoring

**Enhanced Job URL Processing**: Streamlined URL detection and Google search fallback:
- **Simplified Regex Detection**: Focus on actual ID patterns (numeric, UUID, hex) for reliable URL validation
- **Smart Google Search**: Full URL included in search query for maximum context
- **Cost Optimization**: Eliminated expensive OpenAI calls, replaced with instant regex processing
- **Cross-Platform Reliability**: Robust URL processing with proper encoding and fallback handling

### Modular Server Architecture & Template System Integration (Latest Session)
**Complete Server Refactoring**: Transformed monolithic 850+ line server.js into clean modular architecture:

**Modular Route System**: Created focused, maintainable route files:
- **`routes/index.js`** - Central route registration hub
- **`routes/hoard.js`** - Job listing management endpoints  
- **`routes/generation.js`** - Resume/cover letter generation endpoints
- **`routes/pdf.js`** - PDF generation endpoints
- **`routes/config.js`** - Configuration file management endpoints
- **`routes/events.js`** - Server-Sent Events and monitoring endpoints

**Template-Based Resume Generation**: Implemented hybrid AI/template system:
```javascript
// New template generation endpoint
/api/generate-template-resume → templatized.generateResume(nutNote, templateNumber)
```

**Key Technical Achievements**:
- **Clean Separation of Concerns**: Each route file handles specific functionality domain
- **Maintained Functionality**: All existing endpoints preserved during refactoring
- **Template Integration**: Handlebars-based resume generation with user data from resume.json
- **Path Organization**: Static directory properly organized outside Vite build process
- **UI Integration**: Template selector dropdown with real-time generation

**Hybrid Generation System**: Users now have comprehensive options:
- **AI-Generated Resumes**: Claude's creative intelligence for unique, tailored content
- **Template-Based Resumes**: Clean, consistent, ATS-friendly formatting
- **Template Selection**: "ATS Friendly" vs "Enhanced Design" options
- **Unified Interface**: Single dialog with comprehensive generation options

**File Organization Improvements**:
- **Static Directory**: Moved to proper JobSquirrel root location (`JobSquirrel/Static/`)
- **Build Process Safety**: Templates stored outside Vite public folder to prevent overwriting
- **Template Files**: `resume-template-1.html` (ATS) and `resume-template-2.html` (Enhanced)
- **Path Configuration**: Updated `jobSquirrelPaths.js` for correct template resolution

### Cover Letter Feature Parity Implementation
**Complete Remix, Double Check & Delete**: Implemented full feature parity between resumes and cover letters with complete UI consistency and tabbed interface management.

### Double Check System Implementation
**Quality Assurance**: Comprehensive double check system enabling quality review of any resume version with fresh session architecture and clean session management.

### React Frontend Migration & Real-time System
**Technology Stack Modernization**: Successfully migrated from vanilla JavaScript to React 19.1.0 + Vite 7.0.0 with component-based design and real-time job hoard display.

## Current System State: Modern & Professional 🚀

JobSquirrel has evolved into a sophisticated system that balances professional capability with creative freedom:

**Key Achievements**:
- ✅ **Modern React-based Interface**: Professional UI with real-time updates
- ✅ **Multi-Version Resume Management**: Revolutionary approach to resume iteration
- ✅ **Remix Feature**: Natural language modifications from professional to wildly creative
- ✅ **Universal Double Check System**: Quality assurance for any resume version
- ✅ **Professional PDF Generation**: Enterprise-quality output with precision controls
- ✅ **Real-time Streaming**: Complete transparency into Claude's AI reasoning process
- ✅ **Zero Manual File Management**: System handles all organization automatically

**System Strengths**:
- **Cutting-Edge Technology**: React 19.1.0, Node.js, Puppeteer, Server-Sent Events
- **Professional Excellence**: Output ready for immediate HR submission
- **Creative Innovation**: Unlimited artistic expression while maintaining technical accuracy
- **User Experience**: Intuitive interface with powerful features
- **Cross-Platform Integration**: Seamless Windows + WSL + Claude Code execution

**Unique Value Proposition**: JobSquirrel combines professional-grade output with unlimited creative expression, demonstrating that AI can enhance human creativity rather than constraining it.

## Development Setup & Usage

### Prerequisites
- **Node.js** (for Stashboard web server)
- **Claude Code** installed in WSL (for AI processing)
- **Chrome browser** (for Scamper extension)
- **WSL** (Windows Subsystem for Linux)

### Quick Start
```bash
# Launch Stashboard
cd Stashboard
npm install
npm run build
node server.js
# Interface available at http://localhost:3000

# Install Browser Extension
# Load /BrowserExtension as unpacked extension in Chrome
```

### Configuration Files
- `personal-information.txt` - Contact information and personal details
- `custom-resume-instructions.txt` - Claude processing guidelines
- `selectors.json` - CSS selectors for job site parsing (auto-configured)

### Career Data Setup
```
JobSquirrel/ResumeData/
├── resumes/              # Existing resume files
├── cover-letters/        # Cover letter templates  
├── projects/             # Project descriptions
└── certifications/       # Professional certifications
```

## Future Enhancements

### Enhanced Creative Features
- **Template Library**: Pre-built creative themes (corporate, startup, creative, technical)
- **Style Inheritance**: Apply successful remix patterns to new jobs
- **A/B Testing**: Compare resume performance across different creative approaches

### Advanced AI Integration
- **Multi-Model Support**: Ollama local processing for cost optimization
- **Bulk Processing**: Parallel resume generation for multiple jobs
- **Smart Suggestions**: AI-recommended improvements based on job analysis

### Professional Platform Features
- **Application Tracking**: Monitor application status and follow-ups
- **Interview Preparation**: AI-generated interview questions based on resume and job
- **Salary Analytics**: Market analysis and negotiation recommendations

---

## Development Philosophy

**"Professional Excellence with Creative Freedom"** - JobSquirrel demonstrates that technology can enhance human creativity rather than constraining it.

**Core Principles**:
- **Real-time Transparency**: Every operation provides immediate, complete visibility
- **Professional Quality**: Output ready for immediate HR submission without modification
- **Creative Empowerment**: Technology enables rather than limits human expression
- **User-Centric Design**: Powerful features with intuitive, enjoyable interfaces
- **AI-Human Collaboration**: Technology amplifies human creativity and decision-making
- **Iterative Excellence**: Multi-version systems enable continuous improvement

**Innovation Demonstration**: The space pirate resume feature exemplifies JobSquirrel's unique value - maintaining perfect technical qualifications while enabling complete creative transformation.

*Remember: The early squirrel catches the job, but the creative squirrel catches the dream job! 🐿️🎨*

---

*JobSquirrel - Where woodland efficiency meets cutting-edge technology to revolutionize the job search experience.*