@echo off
cd /d "%~dp0../"
setlocal enabledelayedexpansion

set "mostRecentDir="

for /f "delims=" %%D in ('dir "GeneratedResumes" /b /ad /od 2^>nul') do (
    set "mostRecentDir=GeneratedResumes\%%D"
)

set "message=Hello Claude, please restyle resume.html in this directory '!mostRecentDir!'"
set "message=!message! and output a new resume.pdf."
set "message=!message! Use 'WoodlandDirectives\ConvertToPDF.txt' for guidance on HTML to PDF conversion."
set "message=!message! This restyle has been requested because after converting !mostRecentDir!/resume.html to !mostRecentDir!/resume.pdf, the formatting was off"
set "message=!message! (typically large elements not fitting on the page after print styles are applied, creating large gaps of whitespace)."
set "message=!message! So when you rewrite it, try to focus on print-friendly styles."
set "message=!message! You can overwrite the old resume.html and !mostRecentDir!/resume.pdf, but try to keep most of the text."
set "message=!message! Try to just restyle what's there, but if you need additional information to accommodate the style change,"
set "message=!message! feel free to pull from /ResumeData to match the job description found in !mostRecentDir!/job-listing.md."
set "message=!message! If you do add additional information, please adhere to the guidelines in 'WoodlandDirectives\GenerateResumeAndCoverLetter.txt', but only restyle"
set "message=!message! the resume. Don't worry about the cover letter."

wsl claude --dangerously-skip-permissions "!message!"