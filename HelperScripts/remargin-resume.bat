@echo off
cd /d "%~dp0../"
setlocal enabledelayedexpansion

set "mostRecentDir="

for /f "delims=" %%D in ('dir "GeneratedResumes" /b /ad /od 2^>nul') do (
    set "mostRecentDir=GeneratedResumes\%%D"
)

set "marginInches=%~1"
if "%marginInches%"=="" set "marginInches=0"

echo Most recent directory: !mostRecentDir!
echo Full input path: !mostRecentDir!\resume.html
echo Full output path: !mostRecentDir!\resume.pdf
echo Margin inches: %marginInches%

node HelperScripts/GenerateResume.js "!mostRecentDir!\resume.html" "!mostRecentDir!\resume.pdf" %marginInches%