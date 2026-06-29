Remove-Item -Recurse -Force apps\consumer-web, apps\vendor-web, apps\admin-web -ErrorAction SilentlyContinue

Copy-Item -Recurse temp_fixit_repo\artifacts\fixit apps\consumer-web
Copy-Item -Recurse temp_fixit_repo\artifacts\fixit apps\vendor-web
Copy-Item -Recurse temp_fixit_repo\artifacts\fixit apps\admin-web

# Give them unique names to avoid EDUPLICATEWORKSPACE
(Get-Content apps\consumer-web\package.json) -replace '"name": ".*"', '"name": "consumer-web"' | Set-Content apps\consumer-web\package.json
(Get-Content apps\vendor-web\package.json) -replace '"name": ".*"', '"name": "vendor-web"' | Set-Content apps\vendor-web\package.json
(Get-Content apps\admin-web\package.json) -replace '"name": ".*"', '"name": "admin-web"' | Set-Content apps\admin-web\package.json

# Update Vite ports
(Get-Content apps\consumer-web\vite.config.ts) -replace 'port: \d+', 'port: 8080' | Set-Content apps\consumer-web\vite.config.ts
(Get-Content apps\vendor-web\vite.config.ts) -replace 'port: \d+', 'port: 8081' | Set-Content apps\vendor-web\vite.config.ts
(Get-Content apps\admin-web\vite.config.ts) -replace 'port: \d+', 'port: 8082' | Set-Content apps\admin-web\vite.config.ts

# Remove monolithic routing overlap
Remove-Item -Recurse -Force apps\consumer-web\src\pages\vendor, apps\consumer-web\src\pages\admin -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force apps\vendor-web\src\pages\consumer, apps\vendor-web\src\pages\admin -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force apps\admin-web\src\pages\consumer, apps\admin-web\src\pages\vendor -ErrorAction SilentlyContinue

Write-Host "GitHub UI successfully split into Consumer, Vendor, and Admin apps."
