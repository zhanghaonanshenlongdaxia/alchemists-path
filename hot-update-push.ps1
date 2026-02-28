# 热更新后自动推送到Git
# 此脚本会：1. 同步文件到www目录 2. 同步到Android 3. 提交到git 4. 推送到远程仓库

$ErrorActionPreference = 'Stop'

Write-Host "=== 热更新 Git 推送流程 ===" -ForegroundColor Cyan
Write-Host ""

# 检查git是否可用
try {
    $gitVersion = git --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Git not found"
    }
    Write-Host "Git 版本: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "错误: 未找到 Git，请先安装 Git 或将其添加到 PATH" -ForegroundColor Red
    Write-Host "下载地址: https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

# 检查是否在git仓库中
if (-not (Test-Path ".git")) {
    Write-Host "警告: 当前目录不是 Git 仓库" -ForegroundColor Yellow
    Write-Host "是否要初始化 Git 仓库? (y/n)" -ForegroundColor Yellow
    $response = Read-Host
    if ($response -eq 'y' -or $response -eq 'Y') {
        git init
        Write-Host "Git 仓库已初始化" -ForegroundColor Green
    } else {
        Write-Host "已取消操作" -ForegroundColor Yellow
        exit 0
    }
}

# 1. 同步文件到www目录
Write-Host ""
Write-Host "[1/4] 同步文件到 www 目录..." -ForegroundColor Cyan

$files = @(
    "index.html", "style.css", "game.js", "sprites.js", "audio.js", "sw.js",
    "tilesheet.png", "bgm_forest.mp3", "bgm_cave.mp3", "bgm_swamp.mp3",
    "bgm_lab.mp3", "bgm_boss.mp3", "dynamic-icon.js"
)

$copiedFiles = @()
foreach ($f in $files) {
    if (Test-Path $f) {
        Copy-Item $f -Destination www/ -Force
        $copiedFiles += $f
        Write-Host "  ✓ $f" -ForegroundColor Gray
    } else {
        Write-Host "  ⚠ $f 不存在，跳过" -ForegroundColor Yellow
    }
}

if ($copiedFiles.Count -eq 0) {
    Write-Host "  没有文件需要同步" -ForegroundColor Yellow
} else {
    Write-Host "  已同步 $($copiedFiles.Count) 个文件" -ForegroundColor Green
}

# 2. 同步到Android
Write-Host ""
Write-Host "[2/4] 同步到 Android 项目..." -ForegroundColor Cyan
try {
    npx cap sync android 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Android 项目已同步" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Android 同步可能有问题，但继续执行..." -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠ 无法执行 npx cap sync，可能未安装依赖" -ForegroundColor Yellow
    Write-Host "  提示: 运行 npm install 安装依赖" -ForegroundColor Gray
}

# 3. 检查git状态
Write-Host ""
Write-Host "[3/4] 检查 Git 状态..." -ForegroundColor Cyan

$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "  没有需要提交的更改" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "是否要检查远程仓库并拉取最新更改? (y/n)" -ForegroundColor Yellow
    $response = Read-Host
    if ($response -eq 'y' -or $response -eq 'Y') {
        Write-Host ""
        Write-Host "  拉取远程更改..." -ForegroundColor Cyan
        git pull
        Write-Host "  ✓ 拉取完成" -ForegroundColor Green
    }
    exit 0
}

Write-Host "  检测到以下更改:" -ForegroundColor Gray
git status --short | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }

# 4. 添加文件到git
Write-Host ""
Write-Host "[4/4] 提交并推送到 Git..." -ForegroundColor Cyan

# 添加所有更改的文件
git add .

# 生成提交信息
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$commitMessage = "热更新: $timestamp"

# 检查是否有远程仓库
$remotes = git remote
if ($remotes.Count -eq 0) {
    Write-Host ""
    Write-Host "  未配置远程仓库" -ForegroundColor Yellow
    Write-Host "  是否要添加远程仓库? (y/n)" -ForegroundColor Yellow
    $response = Read-Host
    if ($response -eq 'y' -or $response -eq 'Y') {
        Write-Host "  请输入远程仓库 URL (例如: https://github.com/user/repo.git):" -ForegroundColor Yellow
        $remoteUrl = Read-Host
        if (-not [string]::IsNullOrWhiteSpace($remoteUrl)) {
            git remote add origin $remoteUrl
            Write-Host "  ✓ 已添加远程仓库: $remoteUrl" -ForegroundColor Green
        }
    }
}

# 提交更改
Write-Host ""
Write-Host "  提交信息: $commitMessage" -ForegroundColor Gray
Write-Host "  是否使用此提交信息? (y/n，输入n可自定义)" -ForegroundColor Yellow
$response = Read-Host
if ($response -eq 'n' -or $response -eq 'N') {
    Write-Host "  请输入提交信息:" -ForegroundColor Yellow
    $commitMessage = Read-Host
}

git commit -m $commitMessage
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ 已提交更改" -ForegroundColor Green
} else {
    Write-Host "  ✗ 提交失败" -ForegroundColor Red
    exit 1
}

# 推送到远程仓库
$remotes = git remote
if ($remotes.Count -gt 0) {
    Write-Host ""
    Write-Host "  推送到远程仓库..." -ForegroundColor Cyan
    $branch = git branch --show-current
    if ([string]::IsNullOrWhiteSpace($branch)) {
        $branch = "main"
    }
    
    Write-Host "  分支: $branch" -ForegroundColor Gray
    
    # 尝试推送
    git push origin $branch 2>&1 | ForEach-Object {
        if ($_ -match "error|fatal") {
            Write-Host "  $_" -ForegroundColor Red
        } else {
            Write-Host "  $_" -ForegroundColor Gray
        }
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ 已推送到远程仓库" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "  ⚠ 推送失败，可能的原因:" -ForegroundColor Yellow
        Write-Host "    1. 远程仓库需要认证（请配置 SSH 密钥或使用 HTTPS 凭据）" -ForegroundColor Gray
        Write-Host "    2. 远程分支已更新，需要先拉取: git pull --rebase" -ForegroundColor Gray
        Write-Host "    3. 远程仓库不存在或URL错误" -ForegroundColor Gray
        Write-Host ""
        Write-Host "  本地提交已成功，可以稍后手动推送: git push origin $branch" -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "  ⚠ 未配置远程仓库，跳过推送" -ForegroundColor Yellow
    Write-Host "  本地提交已成功，配置远程仓库后可推送" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=== 完成 ===" -ForegroundColor Green
Write-Host ""
