Add-Type -AssemblyName System.Drawing

$srcDir = "d:\godotProject\test1\game3\jietu"
$outDir = "d:\godotProject\test1\game3\jietu\720p"
if (!(Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

$targetW = 1280
$targetH = 720

Get-ChildItem "$srcDir\*.png" | ForEach-Object {
    $srcImg = [System.Drawing.Image]::FromFile($_.FullName)
    
    $bmp = New-Object System.Drawing.Bitmap($targetW, $targetH)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    # Fill black background first
    $g.Clear([System.Drawing.Color]::Black)
    
    # Scale to fit width, center vertically
    $srcRatio = [float]$srcImg.Width / [float]$srcImg.Height
    $dstW = $targetW
    $dstH = [int]($targetW / $srcRatio)
    $offsetY = [int](($targetH - $dstH) / 2)
    
    if ($dstH -gt $targetH) {
        $dstH = $targetH
        $dstW = [int]($targetH * $srcRatio)
        $offsetY = 0
        $offsetX = [int](($targetW - $dstW) / 2)
    } else {
        $offsetX = 0
    }
    
    $g.DrawImage($srcImg, $offsetX, $offsetY, $dstW, $dstH)
    $g.Dispose()
    $srcImg.Dispose()
    
    $outPath = Join-Path $outDir $_.Name
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Upscaled: $($_.Name) -> $targetW x $targetH"
}

Write-Host "Done! Files saved to $outDir"
