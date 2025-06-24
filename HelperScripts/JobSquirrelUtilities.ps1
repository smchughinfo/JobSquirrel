# JobSquirrel Utilities Module
# Contains shared utility functions for the JobSquirrel application

function Get-MostRecentSubdirectory {
    param(
        [Parameter(Mandatory=$true)]
        [string]$Path,
        
        [switch]$Recurse
    )
    
    # Validate that the path exists and is a directory
    if (!(Test-Path $Path -PathType Container)) {
        throw "Path '$Path' does not exist or is not a directory"
    }
    
    # Get all subdirectories
    $subdirectories = Get-ChildItem -Path $Path -Directory
    
    if ($subdirectories.Count -eq 0) {
        Write-Warning "No subdirectories found in '$Path'"
        return $null
    }
    
    $mostRecentDir = $null
    $mostRecentTime = [DateTime]::MinValue
    
    foreach ($dir in $subdirectories) {
        # Get all files in the subdirectory (recursively if specified)
        if ($Recurse) {
            $files = Get-ChildItem -Path $dir.FullName -File -Recurse -ErrorAction SilentlyContinue
        } else {
            $files = Get-ChildItem -Path $dir.FullName -File -ErrorAction SilentlyContinue
        }
        
        if ($files.Count -gt 0) {
            # Find the most recent LastWriteTime in this directory
            $dirMostRecent = ($files | Measure-Object -Property LastWriteTime -Maximum).Maximum
            
            # Compare with our current most recent
            if ($dirMostRecent -gt $mostRecentTime) {
                $mostRecentTime = $dirMostRecent
                $mostRecentDir = $dir
            }
            
            Write-Verbose "Directory: $($dir.Name) - Most recent file: $dirMostRecent"
        } else {
            Write-Verbose "Directory: $($dir.Name) - No files found"
        }
    }
    
    if ($mostRecentDir) {
        Write-Verbose "Most recent directory: $($mostRecentDir.Name) with timestamp: $mostRecentTime"
        return $mostRecentDir.FullName
    } else {
        Write-Warning "No files found in any subdirectory"
        return $null
    }
}

function Start-ClaudeCommand {
    param(
        [Parameter(Mandatory=$true)]
        [string]$Command,
        
        [string]$SessionId = $null
    )
    
    if ($SessionId) {
        $fullCommand = "wsl claude --dangerously-skip-permissions --resume $SessionId '$Command'"
    } else {
        $fullCommand = "wsl claude --dangerously-skip-permissions '$Command'"
    }
    
    Write-Host "Executing: $fullCommand"
    Start-Process powershell -ArgumentList "-Command", $fullCommand
}

function Wait-ForFileToDisappear {
    param(
        [Parameter(Mandatory=$true)]
        [string]$FilePath,
        
        [string]$StatusMessage = "Waiting for file to disappear...",
        [int]$IntervalMs = 500
    )
    
    while (Test-Path $FilePath) {
        Write-Host $StatusMessage
        Start-Sleep -Milliseconds $IntervalMs
    }
}

function Wait-ForFileToAppear {
    param(
        [Parameter(Mandatory=$true)]
        [string]$FilePath,
        
        [string]$StatusMessage = "Waiting for file to appear...",
        [int]$IntervalMs = 500
    )
    
    while (!(Test-Path $FilePath)) {
        Write-Host $StatusMessage
        Start-Sleep -Milliseconds $IntervalMs
    }
}

function Wait-ForMultipleFiles {
    param(
        [Parameter(Mandatory=$true)]
        [string[]]$FilePaths,
        
        [string]$StatusMessage = "Waiting for files to appear...",
        [int]$IntervalMs = 500
    )
    
    do {
        $allExist = $true
        foreach ($path in $FilePaths) {
            if (!(Test-Path $path)) {
                $allExist = $false
                break
            }
        }
        
        if (!$allExist) {
            Write-Host $StatusMessage
            Start-Sleep -Milliseconds $IntervalMs
        }
    } while (!$allExist)
}

function Get-ResumeDirectoryPaths {
    param(
        [Parameter(Mandatory=$true)]
        [string]$WorkingResumeDir
    )
    
    return [PSCustomObject]@{
        SessionId = Join-Path $WorkingResumeDir "session-id.txt"
        ResumeChanges = Join-Path $WorkingResumeDir "resume-changes.md"
        Resume = Join-Path $WorkingResumeDir "resume.pdf"
        CoverLetter = Join-Path $WorkingResumeDir "cover-letter.txt"
    }
}

function Get-SafeScriptDirectory {
    # Handle case where $MyInvocation.MyCommand.Path is null
    if ($MyInvocation.MyCommand.Path) {
        return Split-Path -Parent $MyInvocation.MyCommand.Path
    } else {
        return Get-Location
    }
}

# Functions are automatically available when dot-sourced