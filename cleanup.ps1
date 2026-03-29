# Remove problematic icon files
Remove-Item -Path "c:\Users\USER\cabox\src\app\icon.ico" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "c:\Users\USER\cabox\src\app\favicon.ico" -Force -ErrorAction SilentlyContinue  
Remove-Item -Path "c:\Users\USER\cabox\src\app\favicon.ts" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "c:\Users\USER\cabox\cleanup.py" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "c:\Users\USER\cabox\cleanup.bat" -Force -ErrorAction SilentlyContinue

Write-Host "Cleanup complete - all problematic files removed"
