@echo off
TITLE QUANTUM PORTABLE v1.1 - Sovereign Intelligence Core
COLOR 0B

echo.
echo    🌌 QUANTUM PORTABLE
echo    [Sovereign Intelligence Suite]
echo    -------------------------------
echo.

:: Check for Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed. Please install it to continue.
    pause
    exit /b
)

:: Check for dependencies
if not exist node_modules (
    echo [INFO] First run detected. Installing lightweight cognitive dependencies...
    npm install
)

echo [READY] Initializing Quantum Core...
echo [READY] Connecting Gemini 3 High-Fidelity Gateway...
echo.

:: Start the Portable Oracle
npm start

pause
