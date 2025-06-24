# JobSquirrel

*Don't go nuts over job applications - let JobSquirrel gather the perfect resume for you!*

## What's This All About?

JobSquirrel is your career's best friend - a personalized resume and cover letter generator that tailors your professional acorns (resumes) to each job opportunity. No more one-size-fits-all applications that fall flat!

## Getting Started

1. Install VS Code Theme [Quiet Light for VSC](https://vscodethemes.com/e/onecrayon.theme-quietlight-vsc/quiet-light-for-vsc)
2. Install Claude Code (JobSquirrel development was done on Windows WSL)
3. Populate `ResumeData/` with your career information (resumes, cover letters, LLM memory dumps about you, personal project summaries, etc.)
4. Fill out personal-information.txt with your own information.
5. Fill out personal-resume-instructions.txt with resume generation instructions that are specific to you (e.g. address that job gap like so...).
6. [Install the Job Squirrel browser extension in /BrowserExtension.](https://claude.ai/share/9c00acf1-23bd-486d-85a4-300b63d6d24b)
7. run HelperScripts/start.bat
8. Go to a job website (indeed.com) and click on the browser extension.

Flow: Click browser extension -> Copies page html to clipboard with JobSquirrel identifier -> terminal applications launched from HelperScripts/start.bat notice the JobSquirrel clipboard message and save it to /HelperScripts/clipboard.html -> Claude code is then launched and told to execute /WoodlandDirectives/ThePlan.txt

*Remember: The early squirrel catches the job!*

## Restyle

If the resume doesn't look good after generation run HelperScripts/restyle-resume.bat to restyle it with more emphasis on print styling.

## File Structure

```
JobSquirrel/
    ResumeData/           # Your resumes, cover letters, and any other data sources you want claude to use as a data source for building your resume
    GeneratedResumes/     # This is where tailored resumes get output
    BrowserExtension/     # Location of JobSquirrel Chrome browser extension
    HelperScripts/        # Core squirrel logic
    WoodlandDirectives/   # AI prompts and instructions
```

## Commands

- `node HelperScripts/GenerateResume.js htmlFilePath pdfFilePath` - Converts html into pdf using Puppeteer (resumes are generated in html and then converted to pdf)
- `node HelperScripts/PageParser.js htmlFilePath cssSelector` - Gets outer html of element using cheerio (this makes searching documents easier for claude)

---

*Vibe coded in about 8 hours with claude code. I wrote half the code and claude code wrote the other half. All squirrel puns are from claude code.*