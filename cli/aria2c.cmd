@echo off
pushd %~dp0
if not exist aria2c.exe goto :eof
if not exist aria2c.session type nul > aria2c.session
if "%1" equ "/s" goto :silent
if "%1" equ "/r" goto :install
if "%1" equ "/u" goto :uninstall
aria2c.exe --conf=aria2c.conf
:install
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "aria2c" /t "REG_SZ" /d "mshta vbscript:CreateObject(\"Shell.Application\").ShellExecute(\"aria2c.exe\",\"--conf=aria2c.conf\",\"%~dp0",\"\",0)(window.close)" /f
:silent
mshta vbscript:CreateObject("Shell.Application").ShellExecute("aria2c.exe","--conf=aria2c.conf","%~dp0","",0)(window.close)
goto :eof
:uninstall
taskkill /f /im "aria2c.exe" 2>nul
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "aria2c" /f
