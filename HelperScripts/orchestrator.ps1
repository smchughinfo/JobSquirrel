# JobSquirrel Orchestrator - Main execution script
# Manages the complete job application processing workflow

# Import utility functions
$scriptDir = if ($MyInvocation.MyCommand.Path) { 
    Split-Path -Parent $MyInvocation.MyCommand.Path 
} else { 
    Get-Location 
}
$utilitiesPath = Join-Path $scriptDir "JobSquirrelUtilities.ps1"
. $utilitiesPath

function Process-JobApplication {
    param(
        [Parameter(Mandatory=$true)]
        [string]$RawHTMLFilePath
    )
    
    Write-Host "Processing new job application..."
    
    # Display the job content
    $content = Get-Content $RawHTMLFilePath -Raw -Encoding UTF8
    Write-Host $content
    
    # Phase 1: Start initial processing
    Write-Host "Starting Phase 1: Initial job analysis..."
    Start-ClaudeCommand -Command "Hello Claude, please execute /WoodlandDirectives/ThePlan.txt"
    
    # Wait for Phase 1 completion (file deletion signals completion)
    Wait-ForFileToDisappear -FilePath $RawHTMLFilePath -StatusMessage "Waiting on first draft..."
    
    # Get the working directory and file paths
    $workingResumeDir = Get-MostRecentSubdirectory -Path "/GeneratedResumes"
    $paths = Get-ResumeDirectoryPaths -WorkingResumeDir $workingResumeDir
    
    # Phase 2: Resume refinement
    Write-Host "Starting Phase 2: Resume refinement..."
    $sessionId = Get-Content $paths.SessionId -Raw
    Start-ClaudeCommand -Command "please execute /WoodlandDirectives/ThePlan2.txt" -SessionId $sessionId
    
    # Wait for Phase 2 completion
    Wait-ForFileToAppear -FilePath $paths.ResumeChanges -StatusMessage "Waiting on second draft..."
    
    # Phase 3: Final generation
    Write-Host "Starting Phase 3: Final document generation..."
    Start-ClaudeCommand -Command "please execute /WoodlandDirectives/ThePlan3.txt" -SessionId $sessionId
    
    # Wait for final documents
    Wait-ForMultipleFiles -FilePaths @($paths.Resume, $paths.CoverLetter) -StatusMessage "Waiting on resume pdf and cover letter..."
    
    Write-Host "Job application processing complete!"
    Write-Host "Files generated in: $workingResumeDir"
}

function Start-JobSquirrelOrchestrator {
    # Initialize paths
    $scriptDir = Get-SafeScriptDirectory
    $rawHTMLFilePath = Join-Path $scriptDir "clipboard.html"
    
    Write-Host "JobSquirrel Orchestrator Started"
    Write-Host "Watching: $rawHTMLFilePath"
    Write-Host "Waiting for job postings to process..."
    
    while ($true) {
        try {
            # Check if a new job posting has arrived
            if (Test-Path $rawHTMLFilePath) {
                Process-JobApplication -RawHTMLFilePath $rawHTMLFilePath
                
                Write-Host "Waiting for more resumes to squirrel..."
                Start-Sleep -Milliseconds 500
            }
            
            # Small delay to prevent excessive CPU usage
            Start-Sleep -Milliseconds 100
            
        } catch {
            Write-Host "Error processing job application: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "Continuing to watch for new jobs..." -ForegroundColor Yellow
            Start-Sleep -Seconds 2
        }
    }
}

# Start the orchestrator
Start-JobSquirrelOrchestrator