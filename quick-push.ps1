# 快速推送到Git（不执行同步，仅推送已有更改）
# 用于已经同步好文件后，直接提交并推送

$ErrorActionPreference = 'Stop'

Write-Host "=== 快速 Git 推送 ===" -ForegroundColor Cyan
Write-Host ""

# 检查git是否可用
try {
    git --version | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Git not found" }
} catch {
    Write-Host "错误: 未找到 Git" -ForegroundColor Red
    exit 1
}

# 检查是否有更改
$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "没有需要提交的更改" -ForegroundColor Yellow
    exit 0
}

Write-Host "检测到以下更改:" -ForegroundColor Gray
git status --short | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
Write-Host ""

# 添加所有更改
git add .

# 提交
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$commitMessage = "更新: $timestamp"

Write-Host "提交信息: $commitMessage" -ForegroundColor Gray
Write-Host "使用此提交信息? (Enter=是, 输入n自定义)" -ForegroundColor Yellow
$response = Read-Host
if ($response -eq 'n' -or $response -eq 'N') {
    Write-Host "请输入提交信息:" -ForegroundColor Yellow
    $commitMessage = Read-Host
}

git commit -m $commitMessage
if ($LASTEXITCODE -ne 0) {
    Write-Host "提交失败" -ForegroundColor Red
    exit 1
}

Write-Host "✓ 已提交" -ForegroundColor Green

# 推送到远程
$remotes = git remote
if ($remotes.Count -gt 0) {
    $branch = git branch --show-current
    if ([string]::IsNullOrWhiteSpace($branch)) {
        $branch = "main"
    }
    
    Write-Host "推送到远程仓库 ($branch)..." -ForegroundColor Cyan
    git push origin $branch
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ 已推送" -ForegroundColor Green
    } else {
        Write-Host "推送失败，请检查远程仓库配置" -ForegroundColor Yellow
    }
} else {
    Write-Host "未配置远程仓库，跳过推送" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "完成" -ForegroundColor Green
