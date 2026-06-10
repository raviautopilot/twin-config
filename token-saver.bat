@echo off
setlocal enabledelayedexpansion

:: Check if graphify is installed
where graphify >nul 2>&1
if !ERRORLEVEL! neq 0 (
    echo graphify could not be found, installing...
    pip install graphify
    if !ERRORLEVEL! neq 0 (
        echo Error: pip failed to install graphify.
        exit /b 1
    )
)

graphify extract . --backend gemini
endlocal
