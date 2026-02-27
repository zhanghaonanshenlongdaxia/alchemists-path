# Sync web files to Android project
# Run this after making changes to game files

$files = @(
    "index.html", "style.css", "game.js", "sprites.js", "audio.js",
    "tilesheet.png", "bgm_forest.mp3", "bgm_cave.mp3", "bgm_swamp.mp3",
    "bgm_lab.mp3", "bgm_boss.mp3"
)

foreach ($f in $files) {
    Copy-Item $f -Destination www/ -Force
}

npx cap sync android
Write-Host "Android project synced!" -ForegroundColor Green
