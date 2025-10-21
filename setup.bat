@echo off
REM POS Frontend Setup Script
REM This script helps set up the environment for the POS frontend application

echo Setting up POS Frontend...
echo.

REM Check if .env file already exists
if exist .env (
    echo .env file already exists
    echo.
    echo Current configuration:
    type .env
    echo.
    set /p OVERWRITE="Do you want to overwrite it? (y/N): "
    if /i not "%OVERWRITE%"=="y" (
        echo Keeping existing .env file
        exit /b 0
    )
)

REM Copy .env.example to .env
if exist .env.example (
    copy .env.example .env >nul
    echo Created .env file from .env.example
    echo.
    echo Default configuration:
    type .env
    echo.
    echo Setup complete!
    echo.
    echo You can now run:
    echo   npm install  # Install dependencies
    echo   npm run dev  # Start development server
    echo.
    echo To customize the API URL, edit the .env file
) else (
    echo Error: .env.example file not found
    exit /b 1
)
