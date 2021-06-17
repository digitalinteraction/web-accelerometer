@echo off
rem openssl req -newkey rsa:2048 -new -nodes -keyout key.pem -out csr.pem && openssl x509 -req -days 365 -in csr.pem -signkey key.pem -out server.crt
rem http-server -S -K key.pem -C server.crt

::: Build
:::npm run build

::: Kill existing processes
taskkill /im "ngrok.exe" >nul
taskkill /im cmd.exe /fi "WINDOWTITLE eq http-server*"

::: HTTP server on port 8080
start "http-server" http-server docs

::: Ngrok to make public
start "ngrok" ngrok http 8080

::: Wait for Ngrok to start
:wait_for_ngrok
echo.Waiting for ngrok...
choice /C 0 /D 0 /T 1 >nul

::: Display Ngrok current forwarding details
SET TUNNEL=
FOR /F "tokens=* USEBACKQ" %%F IN (`curl -s http://127.0.0.1:4040/api/tunnels ^| bash -c "grep -o 'https://........\.ngrok\.io'"`) DO (
  SET TUNNEL=%%F
)
IF "%TUNNEL%"=="" GOTO wait_for_ngrok
ECHO TUNNEL= %TUNNEL%
rem adb shell am start -n com.android.chrome/org.chromium.chrome.browser.ChromeTabbedActivity -d "%TUNNEL%" --activity-clear-task
rem (open local Chrome and use "Send to your devices" to open on phone).
IF NOT "%TUNNEL%"=="" start chrome.exe "%TUNNEL%"

echo Rebuild then refresh:
echo   npm run build
