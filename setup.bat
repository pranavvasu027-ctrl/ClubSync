@echo off
echo ==============================================
echo       ClubSync Setup Script for Collaborators
echo ==============================================
echo.
echo [1/2] Installing Mobile App dependencies...
cd mobile
call npm install
cd ..
echo.
echo [2/2] Installing Web App dependencies...
cd web
call npm install
cd ..
echo.
echo ==============================================
echo Setup Complete! 
echo IMPORTANT: Remember to ask the project owner 
echo for the .env files for both mobile and web.
echo ==============================================
pause
