@echo off
cd /d "%~dp0../"
setlocal enabledelayedexpansion

set "mostRecentDir="

for /f "delims=" %%D in ('dir "GeneratedResumes" /b /ad /od 2^>nul') do (
    set "mostRecentDir=GeneratedResumes\%%D"
)

set "message=Hello Claude, can you make modification to resume.html in this directory '!mostRecentDir!'"
set "message=!message! Keep the resume's formatting the same. You just need to make some small text adjustments."
set "message=!message! Use the files in /ResumeData as your data source for the resume's information. "
set "message=!message! Use the information /personal-information.txt as the authoratative source for things like names, phone numbers, email, personal urls, etc."
set "message=!message! Prompt the user for what changes they need made:"
set "message=!message! 1. Job History or Titles are wrong. Please consult /ResumeData and fix."
set "message=!message! 2. Skills misrepresent the truth. Please consult /ResumeData and fix."
set "message=!message! 3. Other, please tell me what needs adjusted."
set "message=!message! Once the user makes a selection, make the desired change to resume.html"

wsl claude --dangerously-skip-permissions "!message!"