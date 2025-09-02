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

### Core Components

**🌐 Stashboard** - React web interface with:
- Real-time job display
- Tabbed resume management (HTML + PDF versions)
- Easy resume and cover letter remix
- Output custom resume as PDF

**🏃 Scamper** - Browser extension for manual job capture:
- One-click job posting capture
- Seamless integration with Stashboard

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


## 🤖 Claude Code Credits

- **Co-author** Claude Code wrote most of the front end and was terrifically helpful throughout the entire development process.


