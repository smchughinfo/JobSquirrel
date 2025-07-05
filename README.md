# 🐿️ JobSquirrel - AI-Powered Job Application Automation

[![Video Intro](/Documentation/YouTube.png)](https://www.youtube.com/watch?v=L4lyqi66l9Q)

## JobSquirrel In A Nutshell

![JobSquirrel In A Nutshell](/Documentation/JobSquirrel%20in%20a%20nutshell.svg)
<hr>

## Beautiful And Varied Results

![Resume 1](/Documentation/resume1.svg)

<hr>

![Resume 2](/Documentation/resume2.svg)

<hr>

![Resume 3](/Documentation/resume3.svg)

<hr>

## ✨ Key Features

### 🎯 **Multi-Version Resume Management**
- Generate multiple resume versions per job for iterative improvement
- Tabbed interface for seamless version switching

### 🎨 **Remix Feature**
Transform resumes with natural language instructions:
- **"Make it more creative and engaging"** → Enhanced visual appeal
- **"Emphasize leadership experience"** → Management focus
- **"Style like a space pirate"** → Complete thematic transformation
- Maintains technical accuracy while enabling unlimited creativity

### ✅ **Double Check **
- Ask AI to double check resume accuracey with one-click

### 📝 **Direct HTML Editor**
- Edit resume and cover letter content directly in browser
- Monospace editor with syntax highlighting
- Real-time updates across all components

### 📄 **PDF Output**
- Customizable margins (0-2 inches with 0.1-inch precision)
- Clean filename format ready for HR submission

### 💉 **Job Listing Injection**
- Embed teh job listing inside your resume as (.01px, white font) to maximize keyword matching

## 🏗️ Architecture

### Core Components

**🌐 Stashboard** - Modern React web interface with:
- Web interface for job listings and resumes
- Live updates for server-side events

**🏃 Scamper** - Browser extension for job capture:
- One-click job posting capture

## 🚀 Quick Start

### Prerequisites
- **Node.js** (for Stashboard web server)
- **OpenAI API Key** (for job listing capture)
- **Claude Code** installed in WSL
- **Chrome browser** (for Scamper extension)
- **WSL** (Windows Subsystem for Linux)

### Installation

1. **Configure LLMs**
   - Set OPENAI_API_KEY environment variables
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
   ├── resumes/              # Existing resume files
   ├── cover-letters/        # Cover letter templates  
   ├── projects/             # Project descriptions
   └── certifications/       # Professional certifications
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
│   │   ├── components/             # JobListings, EventMonitor, ClaudeAssistant
│   │   └── hooks/                  # Custom React hooks for SSE
│   ├── services/                   # Backend services and utilities
│   │   ├── llm/anthropic.js        # Claude integration with streaming
│   │   ├── pdf.js                  # PDF generation service
│   │   ├── resumeGenerator.js      # Resume generation, remix & double check
│   │   ├── hoard.js                # Job data management
│   │   └── eventBroadcaster.js     # Real-time event system
│   ├── server.js                   # Express server with SSE endpoints
│   └── hoard.json                  # Job data storage with HTML arrays
├── Scamper/                        # Scamper browser extension
│   ├── manifest.json               # Extension configuration
│   ├── content.js                  # Job page interaction
│   └── background.js               # Extension background tasks
├── Config/                         # Configuration and career data
│   ├── ResumeData/                 # User's career data sources
│   ├── personal-information.txt    # Contact information
│   └── custom-resume-instructions.txt # AI processing guidelines
├── GeneratedResumes/               # Final PDF outputs
├── SessionIdS/                     # Session tracking and temp files
└── Cache/                          # Temporary processing files
```

## 🔧 Technology Stack

### Frontend
- **React 19.1.0** with modern hooks and component architecture
- **Vite 7.0.0** for lightning-fast development and building
- **Server-Sent Events** for real-time browser updates
- **Custom React hooks** for SSE integration

### Backend
- **Node.js + Express** with RESTful API design
- **Server-Sent Events** for real-time client communication
- **File watching** with debounced change detection
- **Event broadcasting** system for multi-client support

### AI Integration
- **Claude Code** via WSL bridge with TTY emulation
- **Real-time streaming** of AI reasoning and generation
- **Cross-platform compatibility** (Windows + WSL)
- **Custom instruction processing** for personalized results


## 🤖 Claude Code Credits

- **Co-author** Claude Code wrote most of the front end and was terrifically helpful throughout the entire development process. This project was completed in half the time thanks to Claude Code.
- **Self-improvement** It should be noted that among Claude Code's many amazing accomplishments during development was literal self-improvement. Claude wrote `ScriptsForClaude\get-current-session-id.sh` to retrieve its own session ID, which it cannot do out of the box and only seemed to discover that it could do after investigating its own configuration. I had first heard about self-improvement many years ago and then one night, while working on JobSquirrel, it happened in front of my eyes.

## ❓ Claude Code Credits
- **Help** As this project was a collaboration with Claude Code, the correct way to troubleshoot any problems you are having with it is to set your working directory to the JobSquirrel repository and ask Claude Code.


