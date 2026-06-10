@echo off
echo Removing all Docker volumes...
for /f "tokens=*" %%i in ('docker volume ls -q') do (
    docker volume rm %%i
)
