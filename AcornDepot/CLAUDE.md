# AcornDepot - JobSquirrel's Modern Web Interface Hub

## Overview

**AcornDepot** serves as the central technology hub for the JobSquirrel ecosystem, housing **Stashboard** - the revolutionary React-based web interface that provides real-time job management, AI-powered resume generation, and professional PDF output capabilities.

## System Architecture

AcornDepot operates as the unified web platform that transforms job application automation from concept to reality:

### AcornDepot Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    AcornDepot Hub                           │
├─────────────────────────────────────────────────────────────┤
│                    Stashboard                               │
├─────────────────────────────────────────────────────────────┤
│  React Frontend  │  Node.js Backend  │  Real-time Events   │
├─────────────────────────────────────────────────────────────┤
│  Job Management  │  Resume Generator │  PDF Creation       │
├─────────────────────────────────────────────────────────────┤
│                Claude Integration                           │
├─────────────────────────────────────────────────────────────┤
│                    WSL Bridge                               │
└─────────────────────────────────────────────────────────────┘
```

## Stashboard: Revolutionary Web Interface

**Stashboard** is the crown jewel of AcornDepot - a modern React-based application that combines professional job management with cutting-edge AI capabilities and creative freedom.

### Core Features

#### 🌐 **Real-time Job Hoard Management**
- **Live job display** with instant updates as jobs are captured
- **Interactive job cards** showing company, title, salary, location, requirements as tags
- **Smart controls**: Collapse/expand, delete, direct links to original postings
- **File watching integration** with automatic UI synchronization

#### 🧠 **AI-Powered Resume Generation**
- **Multi-version resume system** with HTML array storage
- **Live Claude streaming** with complete transparency into AI reasoning
- **Custom instructions** integration for personalized generation
- **Cover letter generation** alongside resume creation
- **Real-time progress tracking** with event streaming

#### 🎨 **Revolutionary Remix Feature**
- **Natural language instructions** for resume modifications
- **Unlimited creative freedom** from professional polish to space pirate themes
- **Technical accuracy preservation** while enabling artistic expression
- **Iterative improvement** without losing previous versions
- **Tabbed interface** for easy version comparison

#### 📄 **Professional PDF Generation**
- **Precision margin controls** (0-2 inches with 0.1-inch increments)
- **Puppeteer-based rendering** for consistent, high-quality output
- **Clean filename formatting** ready for HR submission
- **Automatic file management** with intelligent overwriting
- **Instant preview** in new browser tabs

#### 📡 **Real-time Event Monitoring**
- **Live Claude output streaming** with expandable content
- **System activity tracking** with timestamped events
- **Performance metrics** including timing and API costs
- **Event filtering** with type-specific icons and colors
- **Queue-based processing** to handle high-frequency streams

### Technology Stack

#### Frontend
- **React 19.1.0** with modern hooks and component architecture
- **Vite 7.0.0** for lightning-fast development and building
- **Server-Sent Events** for real-time browser updates
- **Custom React hooks** (`useEventStream`) for SSE integration
- **Component-based design** with proper state management

#### Backend
- **Node.js + Express** with RESTful API design
- **Server-Sent Events** for real-time client communication
- **File watching** with debounced change detection
- **Event broadcasting** system for multi-client support
- **Path management** via centralized `jobSquirrelPaths.js`

#### AI Integration
- **Claude Code** via WSL bridge with TTY emulation
- **Real-time streaming** of AI reasoning and generation
- **Cross-platform compatibility** (Windows + WSL)
- **Custom instruction processing** for personalized results
- **Remix functionality** with natural language processing

### File Structure

```
/AcornDepot/Stashboard/
├── src/                           # React frontend source
│   ├── App.jsx                    # Main application component
│   ├── main.jsx                   # React application entry
│   ├── index.css                  # Global styling
│   ├── components/                # React components
│   │   ├── Header.jsx             # Navigation and branding
│   │   ├── JobListings.jsx        # Job management with multi-version resumes
│   │   ├── EventMonitor.jsx       # Real-time event display
│   │   └── ClaudeAssistant.jsx    # AI output streaming
│   └── hooks/                     # Custom React hooks
│       └── useEventStream.js      # SSE integration with queue mechanism
├── services/                      # Backend services
│   ├── llm/                       # AI integration
│   │   ├── anthropic.js           # Claude Code integration with streaming
│   │   ├── ollama.js              # Local LLM support
│   │   └── openai/                # OpenAI integration (legacy)
│   ├── resumeGenerator.js         # Resume generation & remix logic
│   ├── pdf.js                     # PDF generation service
│   ├── hoard.js                   # Job data management
│   ├── eventBroadcaster.js        # Real-time event system
│   ├── jobQueue.js                # Job processing queue
│   ├── clipboard.js               # Clipboard monitoring
│   └── jobSquirrelPaths.js        # Centralized path management
├── public/                        # Static web assets
│   └── index.html                 # Base HTML template
├── server.js                      # Express server with SSE endpoints
├── package.json                   # Dependencies and scripts
├── vite.config.mjs                # Vite build configuration
└── hoard.json                     # Job data storage with HTML arrays
```

### Revolutionary Features

#### Multi-Version Resume Management System
**HTML Array Architecture**: Revolutionary approach that stores multiple resume versions:
```javascript
// Job data structure with HTML arrays
{
  "company": "Example Corp",
  "jobTitle": "Software Engineer", 
  "html": [
    "<!DOCTYPE html>...", // Resume Version 1
    "<!DOCTYPE html>...", // Resume Version 2 
    "<!DOCTYPE html>..."  // Resume Version 3 (Remix)
  ]
}
```

**Benefits**:
- **No file conflicts**: Array-based storage eliminates version management issues
- **Easy comparison**: Seamless switching between versions via tabs
- **Iterative improvement**: Build upon previous versions without losing work
- **Professional workflow**: Clean, organized approach to resume development

#### Revolutionary Remix Feature 🎨
**Natural Language Resume Transformation**: The most innovative feature enabling unlimited creative expression:

**Real Examples**:
- **"Style like a space pirate obsessed with outer space"** → Complete thematic transformation:
  - Name becomes "Captain Sean 'Space Rover' McHugh"
  - Title becomes "🚀 Interstellar Code Buccaneer & Cosmic .NET Navigator 🏴‍☠️"
  - Skills become "🚀 Xamarin/MAUI doubloons", "⚡ Reactive Extensions stardust"
  - Complete cosmic color scheme (black/cyan/gold)
  - Maintains 100% technical accuracy while enabling unlimited creativity

**Processing Pipeline**:
1. User clicks "🎨 Remix" button on existing resume
2. Dialog appears with textarea for natural language instructions
3. Current resume saved to `cache/remix-resume.html`
4. User instructions saved to `cache/remix-instructions.txt`
5. Claude processes with full context (job + resume + instructions)
6. New version appended to HTML array
7. New tab appears instantly with remixed content

#### Real-time Streaming Revolution
**Event Queue Architecture**: Solved React state batching issues preventing real-time Claude visibility:

```javascript
// Queue mechanism in useEventStream.js
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
    }, 10); // Critical 10ms delay forces individual React renders
}
```

**Result**: Perfect capture of high-frequency Claude streams with zero data loss

### Key React Components

#### `JobListings.jsx` - Core Job Management
- **Real-time job cards** with rich information display
- **Multi-version resume management** with tabbed interface
- **Remix dialog** with natural language input
- **PDF generation controls** with margin precision
- **Interactive job controls** (collapse, delete, links)

#### `EventMonitor.jsx` - System Activity Tracking  
- **Live event display** with type-specific styling and icons
- **Expandable content** for large messages (>200 characters)
- **Connection status** indicator with visual feedback
- **Event history** with timestamp formatting

#### `ClaudeAssistant.jsx` - AI Output Streaming
- **Real-time Claude response** display with content filtering
- **Session tracking** and performance metrics
- **Expandable content cards** for large responses
- **Processing indicators** showing Claude active vs ready state

#### `useEventStream.js` - Custom SSE Hook
- **EventSource connection** management with automatic reconnection
- **Event queue processing** to prevent React batching issues
- **Event filtering** and type detection
- **Performance optimization** for high-frequency streams

### API Endpoints

#### Job Management
- **`GET /api/hoard`** - Retrieve all job listings with HTML arrays
- **`PATCH /api/nut-note`** - Update job information
- **`DELETE /api/nut-note`** - Remove job listing

#### Resume Operations
- **`POST /api/generate-resume`** - Create new resume version
- **`POST /api/remix-resume`** - Modify existing resume with natural language
- **`POST /api/generate-pdf`** - Convert any resume version to PDF

#### Real-time Events
- **`GET /api/events`** - Server-Sent Events stream
- **`GET /api/queue-status`** - Job processing queue status
- **`GET /api/events-status`** - Event broadcaster statistics

### Development Workflow

#### Quick Start
```bash
# Install dependencies
npm install

# Build React frontend  
npm run build

# Start production server
node server.js

# Development with hot reload
npm run dev
```

#### VS Code Integration
- **F5 Debug**: Automatic build and server start
- **Task Pipeline**: Dependencies → Build → Start
- **Error Handling**: Comprehensive logging and debugging

### Cross-Platform Architecture

#### WSL Bridge Implementation
**Challenge**: Run Claude Code from Windows Node.js server
**Solution**: WSL command bridge with TTY emulation

```javascript
// WSL command execution for Claude Code
const command = `wsl -e bash -c "cd ${workingDir} && script -qec \\"claude --print --dangerously-skip-permissions '${message}'\\" /dev/null"`;
const result = execSync(command, { encoding: 'utf8', timeout: 600000 });
```

**Key Innovations**:
- **TTY Emulation**: `script -qec` provides fake TTY for Claude requirements
- **Perfect Escaping**: Handles complex messages with quotes and newlines
- **Real-time Streaming**: Progress updates broadcast immediately to browser
- **ANSI Cleaning**: Automatic removal of control sequences and formatting

#### Centralized Path Management
**Location**: `services/jobSquirrelPaths.js`

**Critical Functions**:
```javascript
// Core path resolution functions
getJobSquirrelRootDirectory(wsl = false)
getResumeDataDirectory(wsl = false) 
getGeneratedResumesDirectory(wsl = false)
getJobListingMDPath(wsl = false)
getRemixResumePath(wsl = false)
getRemixResumeInstructionsPath(wsl = false)

// Automatic Windows → WSL conversion
convertPathToWSL(windowsPath)
```

**CRITICAL**: All AcornDepot services MUST use `jobSquirrelPaths.js` for path operations

### Event System Architecture

#### Event Types with Visual Design
- **🔧 System Events**: Configuration, startup, file operations
- **🥜 Job Events**: Queue operations, processing status  
- **💬 Claude Response Lines**: Individual AI reasoning steps
- **🤖 Claude Full Responses**: Complete generated content
- **✅ Completion Events**: Performance metrics, timing, costs
- **❌ Error Events**: Failures, warnings, debugging info

#### Real-time Features
- **Instant UI updates** when jobs are captured
- **Live resume generation** with streaming progress
- **Real-time file monitoring** with automatic refresh
- **Performance tracking** with cost and timing metrics

### Performance Optimizations

#### React Optimizations
- **Proper hooks usage** preventing unnecessary re-renders
- **Event queue processing** handling high-frequency Claude streams
- **Debounced updates** with intelligent file watching filtering
- **Component memoization** for optimized render cycles

#### Server Performance
- **File watching debouncing** (100ms delays prevent event spam)
- **Event broadcasting** for efficient multi-client support
- **Static file serving** with optimized asset delivery
- **Connection management** with proper SSE client lifecycle

### Code Theme Integration

All AcornDepot code follows the consistent squirrel/woodland theme:

**Action Functions**:
- `forage()` - retrieving/gathering data
- `stash()` - saving/storing data
- `scamper()` - navigation/iteration
- `chatter()` - logging/communication

**Component Names**:
- **Stashboard** - Main interface where squirrels manage their winter stash
- **Job Hoard** - Collection of captured job postings
- **Nut Note** - Individual job data structure
- **Remix** - Creative resume modification feature

**UI Elements**:
- 🐿️ Main system operations
- 🌰 Job processing operations
- 🥜 Stored data and cache operations
- 🎨 Remix functionality
- Woodland color scheme throughout

## Recent Major Achievements

### Revolutionary Remix Implementation
**Game-Changing Innovation**: Natural language resume modification that maintains technical accuracy while enabling unlimited creative expression:

- **Space Pirate Theme**: Complete visual and textual transformation while preserving all technical qualifications
- **Professional Polish**: Subtle improvements to tone and presentation
- **Industry Focus**: Dynamic emphasis shifts based on user instructions
- **Creative Freedom**: Unlimited artistic expression with professional relevance

### React Migration Success
**Modern Technology Stack**: Successfully migrated from vanilla JavaScript to cutting-edge React ecosystem:

- **Component Architecture**: Modular, maintainable code structure
- **Real-time Integration**: Perfect SSE integration with React state management
- **Performance Excellence**: Optimized rendering with queue-based event processing
- **Professional UI/UX**: Woodland-themed interface with excellent usability

### Streaming Architecture Breakthrough
**Technical Innovation**: Solved complex React state batching issues:

- **Event Queue System**: 10ms processing delays force individual React renders
- **Zero Data Loss**: Perfect capture of high-frequency Claude output streams
- **Real-time Transparency**: Complete visibility into AI decision-making process
- **Performance Optimization**: Handles hundreds of events per second without lag

## Future Enhancements

### Enhanced Creative Features
- **Template Library**: Pre-built creative themes for different industries
- **Style Inheritance**: Apply successful remix patterns across jobs
- **A/B Testing**: Compare resume performance across creative approaches
- **Collaboration Tools**: Share creative variations with career coaches

### Advanced AI Integration
- **Multi-Model Support**: Ollama local processing for cost optimization
- **Bulk Processing**: Parallel resume generation for multiple jobs
- **Smart Suggestions**: AI-recommended improvements based on job analysis
- **Performance Analytics**: Track success rates across different resume styles

### Professional Platform Features
- **Application Tracking**: Monitor status and follow-ups
- **Interview Preparation**: AI-generated questions based on resume and job
- **Salary Analytics**: Market analysis and negotiation recommendations
- **Career Progression**: Long-term career path optimization

---

## Development Philosophy

**"Professional Excellence with Creative Freedom"** - AcornDepot demonstrates that technology can enhance human creativity rather than constraining it.

**Core Principles**:
- **Real-time Transparency**: Every operation provides immediate, complete visibility
- **Professional Quality**: Output ready for immediate HR submission
- **Creative Empowerment**: Technology enables unlimited human expression
- **User-Centric Design**: Powerful features with intuitive interfaces
- **AI-Human Collaboration**: Technology amplifies creativity and decision-making

**Innovation Legacy**: AcornDepot proves that AI can understand context deeply enough to preserve technical accuracy while enabling complete creative transformation - from space pirate themes to conservative professional presentations.

*AcornDepot - Where cutting-edge technology meets unlimited creative expression to revolutionize the job search experience! 🐿️🎨*

---

*The digital winter cache where all your career opportunities are stored, processed, and transformed into professional success with a touch of creative magic.*