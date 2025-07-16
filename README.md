# 🐿️ JobSquirrel - AI Resume Tailor

[![Video Intro](/Documentation/YouTube.png)](https://www.youtube.com/watch?v=L4lyqi66l9Q)

## JobSquirrel In A Nutshell

![JobSquirrel In A Nutshell](https://seanmchugh.dev/github-images/JobSquirrel%20in%20a%20nutshell.svg)
<hr>

## Beautiful And Varied Results

![Resume 1](/Documentation/resume1.svg)

<hr>

![Resume 2](/Documentation/resume2.svg)

<hr>

![Resume 3](/Documentation/resume3.svg)

<hr>

## ✨ Key Features

### 🎯 **Hybrid Resume Generation System**
- **AI-Generated Resumes**: Claude's creative intelligence for unique, tailored content
- **Template-Based Resumes**: Clean, consistent, ATS-friendly formatting with Handlebars
- Unified interface with comprehensive generation options

### 🎯 **Multi-Version Resume Management**
- Generate multiple resume versions per job for iterative improvement
- Tabbed interface for seamless version switching
- Array-based storage eliminates version conflicts

### 🎨 **Revolutionary Remix Feature**
Transform resumes with natural language instructions:
- **"Make it more creative and engaging"** → Enhanced visual appeal
- **"Emphasize leadership experience"** → Management focus
- **"Style like a space pirate"** → Complete thematic transformation
- Maintains technical accuracy while enabling unlimited creativity

### ✅ **Universal Double Check System**
- Quality review for any resume version, not just the latest
- Fresh session architecture eliminates Claude confusion
- One-click quality assurance with custom guidelines compliance

### 📝 **Direct HTML Editor**
- Edit resume and cover letter content directly in browser
- Real-time updates with event broadcasting

### 📄 **Professional PDF Generation**
- Customizable margins (0-2 inches with 0.1-inch precision)
- Clean filename format ready for HR submission
- Automatic file overwriting for clean management

### 💉 **Job Listing Injection**
- Embed the job listing inside your resume (.01px, white font) to maximize keyword matching

## 🏗️ Architecture

### Core Components

**🌐 Stashboard** - Modern React web interface with:
- Real-time job hoard display with live updates
- Tabbed resume management (HTML + PDF versions)
- Revolutionary remix feature with natural language instructions
- Comprehensive double check system for quality assurance
- Live Claude output streaming with expandable content
- Professional PDF generation with margin controls
- Server-Sent Events (SSE) for real-time updates

**🏃 Scamper** - Browser extension for manual job capture:
- One-click job posting capture
- Seamless integration with Stashboard processing

## 🚀 Quick Start

### Prerequisites
- **Node.js** (for Stashboard web server)
- **OpenAI API Key** (for job listing capture)
- **Claude Code** installed in WSL
- **Chrome browser** (for Scamper extension)
- **WSL** (Windows Subsystem for Linux)

### Installation

1. **Configure LLMs**
   - Set OPENAI_API_KEY environment variable
   - Install and run Claude Code

2. **Install Dependencies**
   ```bash
   cd Stashboard
   npm install
   ```

2. **Install Browser Extension**
   - [Open Chrome → Extensions → Developer Mode](https://claude.ai/share/9c00acf1-23bd-486d-85a4-300b63d6d24b)
   - Load unpacked extension from `/Scamper`

3. **Configure Career Data**
   ```
   JobSquirrel/Config/ResumeData/
   ├── resume1.pdf
   ├── resume2.pdf
   ├── cover-lettet.txt
   ├── personal-project-summary.md
   ├── etc.
   ```

4. **Set Configuration Files**
   - `Config/personal-information.txt` - Contact information
   - `Config/custom-resume-instructions.txt` - Your custom instructions to the AI for how you want the resume and cover letter generated

5. **Launch System**
   ```bash
   cd Stashboard
   npm run build
   node server.js
   # Interface available at http://localhost:3000
   ```


## 📁 Project Structure

```
JobSquirrel/
├── Stashboard/                     # Main web interface (React + Node.js)
│   ├── src/                        # React frontend components
│   │   ├── components/             # Core UI components
│   │   │   ├── JobListings.jsx     # Job cards + multi-version resume + remix + double check
│   │   │   ├── EventMonitor.jsx    # Real-time system event display
│   │   │   ├── ClaudeAssistant.jsx # Live Claude output streaming
│   │   │   ├── Header.jsx          # Squirrel-themed navigation
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
│   │   │   └── templatized.js      # Template-based resume generation
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
│   │   ├── pdf.js                  # PDF generation endpoints
│   │   ├── config.js               # Configuration endpoints
│   │   └── events.js               # SSE and monitoring endpoints
│   ├── public/                     # Static web assets (built by Vite)
│   │   └── assets/                 # Built CSS/JS assets
│   ├── queue/                      # Job queue storage
│   ├── server.js                   # Express server with modular routes
│   └── hoard.json                  # Job data storage with HTML arrays
├── Scamper/                        # Browser extension
│   ├── manifest.json               # Extension configuration
│   ├── content.js                  # Job page interaction
│   └── background.js               # Extension background tasks
├── Static/                         # Template files and static assets
│   ├── resume-template-1.html      # ATS-friendly resume template
│   ├── resume-template-2.html      # Enhanced design resume template
│   └── generate-resume.js          # Template generation script
├── Config/                         # Configuration and career data
│   ├── ResumeData/                 # User's career data sources
│   │   ├── chat-gpt-career-related-memory-dump.md
│   │   ├── nutkins cover letter template.txt
│   │   ├── resume1.txt             # Resume data file
│   │   └── resume2.txt             # Resume data file
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

## 🔧 Technology Stack

### Frontend
- **React 19.1.0** with modern hooks and component architecture
- **Vite 7.0.0** for lightning-fast development and building
- **Server-Sent Events** for real-time browser updates
- **Custom React hooks** for SSE integration

### Backend
- **Node.js + Express** with modular route architecture
- **Server-Sent Events** for real-time client communication
- **File watching** with debounced change detection
- **Event broadcasting** system for multi-client support
- **Handlebars templating** for template-based resume generation

### AI Integration
- **Claude Code** via WSL bridge with TTY emulation
- **Real-time streaming** of AI reasoning and generation
- **Cross-platform compatibility** (Windows + WSL)
- **Custom instruction processing** for personalized results

## 🤖 Claude Code Credits

- **Co-author** Claude Code wrote most of the front end and was terrifically helpful throughout the entire development process. This project was completed in half the time thanks to Claude Code.
- **Self-improvement** It should be noted that among Claude Code's many amazing accomplishments during development was literal self-improvement. Claude wrote `/ScriptsForClaude/get-current-session-id.sh` to retrieve its own session ID, which it cannot do out of the box and only seemed to discover that it could do after investigating its own configuration. I first heard about self-improvement years ago and then one night, while working on JobSquirrel, it happened in front of my eyes.

## ❓ Help
- **Help** As this project was a collaboration with Claude Code, the correct way to troubleshoot any problems you are having with it is to set your working directory to the JobSquirrel repository and ask Claude Code.


