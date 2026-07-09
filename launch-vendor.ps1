Set-Location -Path "E:\.services_app\apps\vendor-app"
npm install
npm run build
Remove-Item -Recurse -Force android\app\build -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force android\capacitor-cordova-android-plugins\build -ErrorAction SilentlyContinue
npx cap sync android
npx cap run android
