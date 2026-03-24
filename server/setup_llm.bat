@echo off
REM Setup script for local LLM service (Windows)

echo Setting up local LLM service...

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed. Please install Python 3.8 or higher.
    exit /b 1
)

echo Python version:
python --version

REM Check if pip is installed
pip --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: pip is not installed. Please install pip.
    exit /b 1
)

REM Install Python dependencies
echo Installing Python dependencies...
pip install -r requirements.txt

if errorlevel 1 (
    echo ERROR: Failed to install dependencies.
    exit /b 1
)

echo.
echo Setup complete!
echo.
echo Note: The model will be downloaded automatically on first use.
echo This may take several minutes and require several GB of disk space.

pause
