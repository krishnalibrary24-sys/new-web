@echo off
title Krishna Library Git Deploy Helper
echo ===================================================
echo   Krishna Library Git Deployment Helper
echo ===================================================
echo.
echo This script will help you resolve the 403 Permission Denied
echo error when pushing to github.com/krishnalibrary24-sys/new-web.git
echo by using a GitHub Personal Access Token (PAT).
echo.
echo If you do not have a PAT yet:
echo 1. Go to https://github.com/settings/tokens
echo 2. Click "Generate new token" -> "Generate new token (classic)"
echo 3. Select the "repo" checkmark (crucial for pushing code)
echo 4. Click "Generate token" at the bottom and copy it.
echo.
set /p PAT_TOKEN="Please paste your GitHub Personal Access Token (PAT): "

if "%PAT_TOKEN%"=="" (
    echo Error: Token cannot be empty.
    pause
    exit /b
)

echo.
echo [1/3] Removing old remote 'origin' if exists...
git remote remove origin 2>nul

echo [2/3] Adding new remote origin with authentication token...
git remote add origin https://%PAT_TOKEN%@github.com/krishnalibrary24-sys/new-web.git

echo [3/3] Pushing to main branch...
git push -u origin main

if %ERRORLEVEL% equ 0 (
    echo.
    echo ===================================================
    echo SUCCESS: Code successfully pushed to GitHub!
    echo ===================================================
) else (
    echo.
    echo ===================================================
    echo FAILED: Could not push code. Please verify your PAT
    echo has repository scope permissions and is typed correctly.
    echo ===================================================
)
pause
