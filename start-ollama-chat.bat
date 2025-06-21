@echo off
echo ========================================
echo  Ollama Chat Interface - Auto Setup
echo ========================================
echo.

REM Set script directory as working directory
cd /d "%~dp0"

REM Check if Python is installed
echo [1/9] Checking Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python not found. Installing Python...
    echo Please download and install Python from: https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation
    echo After installing Python, run this script again.
    pause
    exit /b 1
) else (
    echo Python is installed.
)

REM Check if Node.js is installed
echo [2/9] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js not found. Installing Node.js...
    echo Please download and install Node.js from: https://nodejs.org/
    echo After installing Node.js, run this script again.
    pause
    exit /b 1
) else (
    echo Node.js is installed.
)

REM Check if Poetry is installed
echo [3/9] Checking Poetry installation...
poetry --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Poetry not found. Installing Poetry...
    curl -sSL https://install.python-poetry.org | python -
    if %errorlevel% neq 0 (
        echo Failed to install Poetry automatically.
        echo Please install Poetry manually: https://python-poetry.org/docs/#installation
        echo Then run this script again.
        pause
        exit /b 1
    )
    echo Poetry installed. Please restart your command prompt and run this script again.
    pause
    exit /b 1
) else (
    echo Poetry is installed.
)

REM Ask user for Ollama port configuration
echo [4/9] Configuring Ollama connection...
set /p "ollama_port=Enter your Ollama port (default: 11434): "
if "%ollama_port%"=="" set ollama_port=11434

REM Create .env file for backend
echo [5/9] Setting up backend environment...
cd backend
echo OLLAMA_BASE_URL=http://localhost:%ollama_port% > .env
echo Backend .env created with OLLAMA_BASE_URL=http://localhost:%ollama_port%

REM Install backend dependencies
echo [6/9] Installing backend dependencies...
poetry install
if %errorlevel% neq 0 (
    echo Failed to install backend dependencies.
    pause
    exit /b 1
)

REM Install aiofiles package
echo [7/9] Installing aiofiles package...
poetry add aiofiles
if %errorlevel% neq 0 (
    echo Failed to install aiofiles package.
    pause
    exit /b 1
)

REM Install Pillow package
echo [8/9] Installing Pillow package...
poetry add Pillow
if %errorlevel% neq 0 (
    echo Failed to install Pillow package.
    pause
    exit /b 1
)

REM Install frontend dependencies
echo [9/9] Installing frontend dependencies...
cd ..\frontend
call npm install
if %errorlevel% neq 0 (
    echo Failed to install frontend dependencies.
    pause
    exit /b 1
)

REM Create .env file for frontend
echo VITE_API_URL=http://localhost:8000 > .env
echo Frontend .env created with VITE_API_URL=http://localhost:8000

echo [8/8] Starting servers...
echo.
echo ========================================
echo  Starting Ollama Chat Interface
echo ========================================
echo.
echo Backend will start on: http://localhost:8000
echo Frontend will start on: http://localhost:5173
echo.
echo IMPORTANT: Make sure Ollama is running with: ollama serve
echo.
echo Press Ctrl+C to stop both servers
echo.

REM Start backend in background
cd ..\backend
start "Ollama Chat Backend" cmd /k "poetry run fastapi dev app/main.py"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend
cd ..\frontend
start "Ollama Chat Frontend" cmd /k "npm run dev"

echo.
echo Both servers are starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo You can close this window. The servers are running in separate windows.
pause
