# Sync web files to Android project
# Run this after making changes to game files
# Usage: .\sync-android.ps1 [--git]  (添加 --git 参数会自动推送到git)

param(
    [switch]$git
)

$files = @(
    "index.html", "style.css", "game.js", "sprites.js", "audio.js", "sw.js",
    "tilesheet.png", "bgm_forest.mp3", "bgm_cave.mp3", "bgm_swamp.mp3",
    "bgm_lab.mp3", "bgm_boss.mp3", "dynamic-icon.js"
)

Write-Host "同步文件到 www 目录..." -ForegroundColor Cyan
foreach ($f in $files) {
    if (Test-Path $f) {
        Copy-Item $f -Destination www/ -Force
        Write-Host "  ✓ $f" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "同步到 Android 项目..." -ForegroundColor Cyan
npx cap sync android
Write-Host "Android project synced!" -ForegroundColor Green

# 如果指定了 --git 参数，自动推送到git
if ($git) {
    Write-Host ""
    Write-Host "推送到 Git..." -ForegroundColor Cyan
    & "$PSScriptRoot\hot-update-push.ps1"
}
