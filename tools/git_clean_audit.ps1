$ErrorActionPreference = 'Stop'

function Read-Bytes([byte[]]$bytes, [ref]$pos, [int]$n) {
  if ($pos.Value + $n -gt $bytes.Length) { throw "Unexpected EOF while reading .git/index" }
  $slice = $bytes[$pos.Value..($pos.Value + $n - 1)]
  $pos.Value += $n
  return ,$slice
}

function Read-U32BE([byte[]]$bytes, [ref]$pos) {
  $b = Read-Bytes $bytes $pos 4
  return [BitConverter]::ToUInt32(@($b[3], $b[2], $b[1], $b[0]), 0)
}

function Read-U16BE([byte[]]$bytes, [ref]$pos) {
  $b = Read-Bytes $bytes $pos 2
  return [BitConverter]::ToUInt16(@($b[1], $b[0]), 0)
}

function Resolve-GitDir([string]$repoRoot) {
  $dotGit = Join-Path $repoRoot ".git"
  if (Test-Path $dotGit -PathType Container) { return $dotGit }
  if (Test-Path $dotGit -PathType Leaf) {
    $content = (Get-Content $dotGit -Raw).Trim()
    if ($content -match '^gitdir:\s*(.+)$') {
      $gitDir = $Matches[1].Trim()
      if (-not [IO.Path]::IsPathRooted($gitDir)) { $gitDir = Join-Path $repoRoot $gitDir }
      return $gitDir
    }
  }
  throw "Cannot resolve .git directory from: $dotGit"
}

function Get-TrackedPathsFromIndex([string]$repoRoot) {
  $gitDir = Resolve-GitDir $repoRoot
  $indexPath = Join-Path $gitDir "index"
  if (-not (Test-Path $indexPath)) { throw "Missing .git/index: $indexPath" }

  $bytes = [IO.File]::ReadAllBytes($indexPath)
  $pos = 0
  $posRef = [ref]$pos

  $sig = [Text.Encoding]::ASCII.GetString((Read-Bytes $bytes $posRef 4))
  $ver = Read-U32BE $bytes $posRef
  $cnt = Read-U32BE $bytes $posRef

  if ($sig -ne "DIRC") { throw "Unexpected .git/index signature: $sig" }
  if ($ver -eq 4) { throw "Index version 4 is not supported by this script (path compression). Please use git.exe to inspect status." }

  $paths = New-Object System.Collections.Generic.List[string]
  for ($i = 0; $i -lt $cnt; $i++) {
    $pos += 40  # stat data (ctime/mtime/dev/ino/mode/uid/gid/size)
    $pos += 20  # sha1
    $flags = Read-U16BE $bytes $posRef
    $nameLen = $flags -band 0x0FFF

    [byte[]]$nameBytes = @()
    if ($nameLen -lt 0x0FFF) {
      if ($nameLen -gt 0) { $nameBytes = Read-Bytes $bytes $posRef $nameLen }
      [void](Read-Bytes $bytes $posRef 1) # NUL terminator
    }
    else {
      # read until NUL
      $tmp = New-Object System.Collections.Generic.List[byte]
      while ($true) {
        $b = Read-Bytes $bytes $posRef 1
        if ($b[0] -eq 0) { break }
        [void]$tmp.Add($b[0])
      }
      $nameBytes = $tmp.ToArray()
      $nameLen = $nameBytes.Length
    }

    $name = [Text.Encoding]::UTF8.GetString($nameBytes)
    $paths.Add($name)

    $entryLen = 62 + $nameLen + 1
    $pad = (8 - ($entryLen % 8)) % 8
    if ($pad -gt 0) { $pos += $pad }
  }

  return $paths
}

function Check-Path([string]$repoRoot, [string]$relativePath) {
  $full = Join-Path $repoRoot $relativePath
  return [PSCustomObject]@{
    Path = $relativePath
    Exists = (Test-Path $full)
    FullPath = $full
  }
}

$repoRoot = (Get-Location).Path

Write-Host "Repo root: $repoRoot"
Write-Host ""

# 1) Confirmed tracked vs missing (based on .git/index)
$tracked = Get-TrackedPathsFromIndex $repoRoot
$missingTracked = foreach ($p in $tracked) {
  $fs = Join-Path $repoRoot ($p -replace '/', '\')
  if (-not (Test-Path $fs)) { $p }
}

Write-Host "Tracked entries (.git/index): $($tracked.Count)"
Write-Host "Missing tracked files: $($missingTracked.Count)"
if ($missingTracked.Count -gt 0) {
  Write-Host "--- Missing tracked files ---"
  $missingTracked | Sort-Object | ForEach-Object { Write-Host $_ }
}
Write-Host ""

# 2) Common Capacitor/Android generated artifacts that git clean often removes
$checks = @(
  "package.json",
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "node_modules",
  "android\\local.properties",
  "android\\.gradle",
  "android\\build",
  "android\\app\\build",
  "android\\app\\src\\main\\assets",
  "android\\app\\src\\main\\assets\\public",
  "android\\app\\src\\main\\assets\\capacitor.config.json",
  "android\\app\\src\\main\\assets\\capacitor.plugins.json",
  "android\\app\\src\\main\\res\\xml\\config.xml"
)

Write-Host "--- Common generated/untracked paths (likely cleaned) ---"
foreach ($p in $checks) {
  $r = Check-Path $repoRoot $p
  $status = if ($r.Exists) { "PRESENT " } else { "MISSING " }
  Write-Host "$status $($r.Path)"
}

