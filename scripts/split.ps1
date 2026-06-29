Remove-Item -Recurse -Force apps\consumer-web, apps\vendor-web, apps\admin-web -ErrorAction SilentlyContinue

Copy-Item -Recurse apps\web apps\consumer-web
Copy-Item -Recurse apps\web apps\vendor-web
Copy-Item -Recurse apps\web apps\admin-web

(Get-Content apps\consumer-web\vite.config.ts) -replace 'port: \d+', 'port: 8080' | Set-Content apps\consumer-web\vite.config.ts
(Get-Content apps\vendor-web\vite.config.ts) -replace 'port: \d+', 'port: 8081' | Set-Content apps\vendor-web\vite.config.ts
(Get-Content apps\admin-web\vite.config.ts) -replace 'port: \d+', 'port: 8082' | Set-Content apps\admin-web\vite.config.ts

Remove-Item -Recurse -Force apps\consumer-web\src\routes\_app\vendor -ErrorAction SilentlyContinue
Set-Location apps\consumer-web
npx tsr generate
Set-Location ..\..

Remove-Item -Recurse -Force apps\vendor-web\src\routes\_app\consumer -ErrorAction SilentlyContinue
Set-Location apps\vendor-web
npx tsr generate
Set-Location ..\..

Remove-Item -Recurse -Force apps\admin-web\src\routes\_app\consumer, apps\admin-web\src\routes\_app\vendor -ErrorAction SilentlyContinue
Set-Location apps\admin-web
npx tsr generate
Set-Location ..\..

Write-Host "Apps successfully split and ports updated."
