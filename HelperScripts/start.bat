if exist "%~dp0\clipboard.html" del "%~dp0\clipboard.html"
start powershell -ExecutionPolicy Bypass -File "%~dp0\clipboard-watcher.ps1"
start powershell -ExecutionPolicy Bypass -File "%~dp0\orchestrator.ps1"