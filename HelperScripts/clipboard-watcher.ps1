Write-Host "Watching clipboard..."

Add-Type -AssemblyName System.Windows.Forms

$lastProcessedMessage = ""
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$outputPath = Join-Path $scriptDir "clipboard.html"

while ($true) {
    $currentClipboard = [System.Windows.Forms.Clipboard]::GetText()
    
    if ($currentClipboard -match "^JobSquirrelBrowserExtensionMessage:\s*(.*)") {
        Set-Clipboard "."
        Write-Host "saved string to file"
        $currentClipboard.Substring(35) | Out-File -FilePath $outputPath -Encoding UTF8 -Force
    }
    
    Start-Sleep -Milliseconds 500
}