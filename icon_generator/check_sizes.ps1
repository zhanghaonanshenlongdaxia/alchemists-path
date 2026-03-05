Add-Type -AssemblyName System.Drawing
$dir = "d:\godotProject\test1\game3\jietu"
Get-ChildItem "$dir\*.png" | ForEach-Object {
    $img = [System.Drawing.Image]::FromFile($_.FullName)
    Write-Host "$($_.Name): $($img.Width) x $($img.Height)"
    $img.Dispose()
}
