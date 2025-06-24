@echo off
REM JobSquirrel Resume Generator - Windows Bridge Script
REM Passes arguments from WSL to Windows Node.js context

if "%~2"=="" (
    echo 🐿️ Usage: GenerateResume.bat ^<input-html-path^> ^<output-pdf-path^>
    echo 📄 Example: GenerateResume.bat ResumeData\resume1.html ResumeData\resume1.pdf
    exit /b 1
)

echo 🌰 Generating PDF via Windows Node.js...
cd /d "%~dp0"
node GenerateResume.js "%~1" "%~2" 