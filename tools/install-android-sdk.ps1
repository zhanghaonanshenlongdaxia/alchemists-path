param(
  [string]$SdkRoot = "$PSScriptRoot\android-sdk",
  [string]$JavaHome = "$PSScriptRoot\jdk17",
  [string]$Platform = "android-34",
  [string]$BuildTools = "34.0.0"
)

$ErrorActionPreference = "Stop"

if (!(Test-Path $SdkRoot)) { throw "SDK root not found: $SdkRoot" }
if (!(Test-Path $JavaHome)) { throw "JDK not found: $JavaHome" }

$env:JAVA_HOME = (Resolve-Path $JavaHome).Path
$env:ANDROID_SDK_ROOT = (Resolve-Path $SdkRoot).Path
$env:ANDROID_HOME = $env:ANDROID_SDK_ROOT

$sdkmanager = Join-Path $env:ANDROID_SDK_ROOT "cmdline-tools\latest\bin\sdkmanager.bat"
if (!(Test-Path $sdkmanager)) {
  throw "sdkmanager.bat not found at: $sdkmanager"
}

Write-Host "JAVA_HOME        = $env:JAVA_HOME"
Write-Host "ANDROID_SDK_ROOT  = $env:ANDROID_SDK_ROOT"

Write-Host "Accepting Android SDK licenses..."
1..200 | ForEach-Object { "y" } | & $sdkmanager "--sdk_root=$env:ANDROID_SDK_ROOT" --licenses | Out-Host

Write-Host "Installing required SDK packages..."
& $sdkmanager "--sdk_root=$env:ANDROID_SDK_ROOT" `
  "platform-tools" `
  "platforms;$Platform" `
  "build-tools;$BuildTools" | Out-Host

Write-Host "Done. Installed: platforms;$Platform, build-tools;$BuildTools, platform-tools" -ForegroundColor Green

