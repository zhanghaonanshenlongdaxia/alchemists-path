Add-Type -AssemblyName System.Drawing

$src = "d:\godotProject\test1\game3\icon_generator\icon_512.png"
$srcImg = [System.Drawing.Image]::FromFile($src)

$sizes = @{
    "mipmap-mdpi"    = 48
    "mipmap-hdpi"    = 72
    "mipmap-xhdpi"   = 96
    "mipmap-xxhdpi"  = 144
    "mipmap-xxxhdpi" = 192
}

$baseDir = "d:\godotProject\test1\game3\android\app\src\main\res"

foreach ($dir in $sizes.Keys) {
    $sz = $sizes[$dir]
    $bmp = New-Object System.Drawing.Bitmap($sz, $sz)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.DrawImage($srcImg, 0, 0, $sz, $sz)
    $g.Dispose()
    $outPath = "$baseDir\$dir\ic_launcher.png"
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Saved $sz x $sz -> $outPath"
}

$srcImg.Dispose()
Write-Host "All icons replaced!"
