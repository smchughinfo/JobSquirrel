# 🐿️ JobSquirrel - AI-Powered Job Application Automation

*The early squirrel catches the job!*

## Overview

**JobSquirrel** is a revolutionary AI-powered job application automation platform that transforms your entire job search workflow. From discovery to professional output, JobSquirrel combines automated job capture, real-time AI processing, and intelligent resume generation with an intuitive web interface.

### 🚀 Complete Workflow
```
Job Discovery → AI Processing → Multiple Resume Versions → Creative Remix → Quality Check → PDF Generation
```

## ✨ Key Features

### 🎯 **Multi-Version Resume Management**
- Generate multiple resume versions per job for iterative improvement
- Tabbed interface for seamless version switching
- Zero manual file management - system handles all organization

### 🎨 **Revolutionary Remix Feature**
Transform resumes with natural language instructions:
- **"Make it more creative and engaging"** → Enhanced visual appeal
- **"Emphasize leadership experience"** → Management focus
- **"Style like a space pirate"** → Complete thematic transformation
- Maintains technical accuracy while enabling unlimited creativity

### ✅ **Universal Double Check System**
- Review and improve ANY resume version
- Fresh session processing prevents AI confusion
- Quality assurance with custom instruction compliance

### 📝 **Direct HTML Editor**
- Edit resume and cover letter content directly in browser
- Monospace editor with syntax highlighting
- Real-time updates across all components

### 📄 **Professional PDF Generation**
- Customizable margins (0-2 inches with 0.1-inch precision)
- Clean filename format ready for HR submission
- One-click generation from any resume version

### 🔄 **Real-Time Everything**
- Live Claude AI output streaming
- Instant UI updates via Server-Sent Events
- Complete transparency into AI reasoning process

## 🏗️ Architecture

### Core Components

**🌐 Stashboard** - Modern React web interface with:
- Real-time job hoard display with live updates
- Tabbed resume management (HTML + PDF versions)
- Live Claude output streaming with expandable content
- Professional PDF generation with margin controls

**🏃 Scamper** - Browser extension for job capture:
- One-click job posting capture
- Seamless integration with Stashboard processing
- Clean, reliable job data extraction

**🤖 Claude Integration** - AI-powered processing:
- Multiple resume versions per job
- Real-time output streaming to web interface
- Natural language remix functionality
- Universal double check system

## 🚀 Quick Start

### Prerequisites
- **Node.js** (for Stashboard web server)
- **Claude Code** installed in WSL
- **Chrome browser** (for Scamper extension)
- **WSL** (Windows Subsystem for Linux)

### Installation

1. **Install Dependencies**
   ```bash
   cd Stashboard
   npm install
   ```

2. **Install Browser Extension**
   - Open Chrome → Extensions → Developer Mode
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
   - `Config/custom-resume-instructions.txt` - AI processing guidelines

5. **Launch System**
   ```bash
   cd Stashboard
   npm run build
   node server.js
   # Interface available at http://localhost:3000
   ```

## 🎯 Usage Workflow

### 1. **Job Capture**
- Navigate to any job posting website
- Click **Scamper browser extension** button
- Job automatically added to your hoard with real-time updates

### 2. **AI-Powered Resume Generation**
- Click **📄 Generate Resume** button
- Watch live Claude AI processing in real-time
- Multiple versions created automatically (Resume 1, Resume 2, etc.)

### 3. **Creative Customization**
- Use **🎨 Remix** for natural language modifications
- Example: *"Make this sound more technical and data-driven"*
- Each remix creates a new version while preserving originals

### 4. **Quality Assurance**
- Click **✅ Double Check** on any resume version
- AI reviews against your custom guidelines
- Creates improved version with quality enhancements

### 5. **Direct Editing**
- Use **📝 Edit** button for direct HTML modifications
- Professional monospace editor with real-time saving
- Perfect for fine-tuning specific details

### 6. **Professional Output**
- Configure margin settings (0-2 inches)
- Click **📄 PDF** for instant generation
- Professional filename: `Sean McHugh - Resume For [Job] - [Company].pdf`

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

## 🎨 Code Theme

All code uses consistent squirrel/woodland-themed language:

**Functions:**
- `forage()` - retrieving/gathering data
- `stash()` - saving/storing data
- `scamper()` - navigation/iteration operations
- `chatter()` - logging and communication

**Components:**
- **Stashboard** - Main web interface
- **Scamper** - Browser extension
- **Job Hoard** - Collection of captured jobs
- **Nut Note** - Individual job data structure

## 🌟 Innovation Highlights

### Multi-Version Architecture
Revolutionary approach to resume management with HTML arrays instead of single files, enabling true iterative improvement.

### Cross-Platform Integration
Seamless Claude Code execution from Windows Node.js server using WSL bridge with TTY emulation.

### Real-Time Streaming
React queue mechanism solving state batching issues for perfect high-frequency event capture.

### Creative AI Freedom
Demonstrates that AI can maintain technical accuracy while enabling unlimited creative expression.

## 🤝 Contributing

JobSquirrel was built through passionate human-AI collaboration, showcasing iterative development that exceeds what either human or AI could accomplish alone.

## 📄 License

This project demonstrates the perfect balance of professional capability and creative freedom in AI-powered career tools.

---

*JobSquirrel - Where woodland efficiency meets cutting-edge technology to revolutionize the job search experience! 🐿️🌰*
