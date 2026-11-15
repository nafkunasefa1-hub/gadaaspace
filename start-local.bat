@echo off
title GadaSpace - Team Horizon-X Local Dev Server
echo =======================================================================
echo   GadaSpace - Team Horizon-X: NASA Space Apps Challenge 2026
echo   Starting local dev server at http://localhost:5173
echo =======================================================================
echo.
cd /d "%~dp0frontend"
call npm run dev -- --open
pause
