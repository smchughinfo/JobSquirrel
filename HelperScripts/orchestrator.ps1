# JobSquirrel File Watcher
# Monitors for creation of clipboard.tmp file, displays content, then deletes it

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$watchFile = Join-Path $scriptDir "clipboard.html"

Write-Host "Watching: $watchFile"
Write-Host ""

while ($true) {
    try {
        if (Test-Path $watchFile) {
            
            $content = Get-Content $watchFile -Raw -Encoding UTF8
            Write-Host $content
            
            # Start Claude in a new PowerShell window
            Start-Process powershell -ArgumentList "-Command", "wsl claude --dangerously-skip-permissions 'Hello Claude, please execute /WoodlandDirective/ThePlan.txt'."
        }
        
        while (Test-Path $watchFile) {
            Write-Host "Waiting on Claude..."
            Start-Sleep -Milliseconds 500
        }

        Write-Host "Waiting on job..."

        # Check every 500ms
        Start-Sleep -Milliseconds 500
        
    } catch {
        Write-Host "⚠️ Error processing file: $($_.Exception.Message)"
        Start-Sleep -Seconds 2
    }
}