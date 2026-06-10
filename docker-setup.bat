@echo off
setlocal enabledelayedexpansion

:: Check if Docker is installed. If not, install it.
where docker >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Docker is not installed on this Windows machine.
    echo Attempting to install Docker Desktop using winget...
    where winget >nul 2>&1
    if %ERRORLEVEL% equ 0 (
        echo Running: winget install -e --id Docker.DockerDesktop --accept-package-agreements --accept-source-agreements
        winget install -e --id Docker.DockerDesktop --accept-package-agreements --accept-source-agreements
        if !ERRORLEVEL! equ 0 (
            echo.
            echo Docker Desktop has been successfully installed.
            echo IMPORTANT: You must start the Docker Desktop application and possibly restart your terminal/computer before running this script again.
            exit /b 0
        ) else (
            echo winget installation failed with exit code !ERRORLEVEL!.
            echo Please install Docker Desktop manually: https://www.docker.com/products/docker-desktop/
            exit /b 1
        )
    ) else (
        echo winget is not available on this system.
        echo Please download and install Docker Desktop manually: https://www.docker.com/products/docker-desktop/
        exit /b 1
    )
)

set COMMAND=%1
set COMPOSE_FILE=docker-compose.yml
set SERVICE=%2

if "%COMMAND%" == "" goto usage

if /I "%COMMAND%" == "start" goto start
if /I "%COMMAND%" == "stop" goto stop
if /I "%COMMAND%" == "status" goto status
if /I "%COMMAND%" == "delete" goto delete
if /I "%COMMAND%" == "logs" goto logs
if /I "%COMMAND%" == "build" goto build
goto usage

:start
set BUILD_KARMA=0
if "%SERVICE%" == "" set BUILD_KARMA=1
if /I "%SERVICE%" == "karma" set BUILD_KARMA=1

if %BUILD_KARMA% equ 1 (
    call :build_karma_locally
    if !ERRORLEVEL! neq 0 exit /b !ERRORLEVEL!
)
echo Starting the full stack (db, brahma, karma)...
docker compose -f %COMPOSE_FILE% up -d %SERVICE%

:: Generate usage.md
echo # Application Usage Guide > usage.md
echo. >> usage.md
echo This document provides details on how to access and use the deployed applications. >> usage.md
echo. >> usage.md
echo ## Services >> usage.md
echo. >> usage.md
echo ### Karma (Frontend) >> usage.md
echo. >> usage.md
echo *   **URL**: [http://localhost:3000](http://localhost:3000) >> usage.md
echo *   **Description**: The main web interface for the application. >> usage.md
echo. >> usage.md
echo ### Brahma (Configuration Service) >> usage.md
echo. >> usage.md
echo *   **URL**: [http://localhost:8080](http://localhost:8080) >> usage.md
echo *   **Description**: The backend API server responsible for configuration. You can use this for direct API calls or for debugging. >> usage.md
echo. >> usage.md
echo ### Kaalam (PostgreSQL Database) >> usage.md
echo. >> usage.md
echo *   **Host**: localhost >> usage.md
echo *   **Port**: 5432 >> usage.md
echo *   **Username**: twin_user >> usage.md
echo *   **Password**: twin_pass >> usage.md
echo *   **Database Name**: digital_twin >> usage.md
echo *   **Description**: The Kaalam PostgreSQL database. You can connect to it using any standard SQL client. >> usage.md

echo usage.md file generated with access details.
goto end

:stop
echo Stopping the full stack...
docker compose -f %COMPOSE_FILE% down
goto end

:status
echo Status of all services:
docker compose -f %COMPOSE_FILE% ps
goto end

:delete
echo Deleting all containers and volumes...
docker compose -f %COMPOSE_FILE% down -v
goto end

:logs
echo Showing logs for all services. Use 'logs [service_name]' for specific logs.
docker compose -f %COMPOSE_FILE% logs -f %SERVICE%
goto end

:build
set BUILD_KARMA=0
if "%SERVICE%" == "" set BUILD_KARMA=1
if /I "%SERVICE%" == "karma" set BUILD_KARMA=1

if %BUILD_KARMA% equ 1 (
    call :build_karma_locally
    if !ERRORLEVEL! neq 0 exit /b !ERRORLEVEL!
)
echo Building all services...
docker compose -f %COMPOSE_FILE% build %SERVICE%
goto end

:usage
echo Usage: %~nx0 {start^|stop^|status^|delete^|logs^|build} [service_name]
echo Service names: db, brahma, karma
exit /b 1

:end
endlocal
exit /b 0

:build_karma_locally
echo Checking dependencies and compiling karma assets locally...
where npm >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Error: Node.js/npm is not installed on the host. Please install Node.js to build karma locally.
    exit /b 1
)
pushd karma
call npm ci
if !ERRORLEVEL! neq 0 (
    echo Error running npm ci in karma.
    popd
    exit /b !ERRORLEVEL!
)
call npm run build
if !ERRORLEVEL! neq 0 (
    echo Error running npm run build in karma.
    popd
    exit /b !ERRORLEVEL!
)
popd
exit /b 0
