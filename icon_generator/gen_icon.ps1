Add-Type -AssemblyName System.Drawing

$size = 512
$bmp = New-Object System.Drawing.Bitmap($size, $size)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

# Background: deep purple radial gradient simulation (solid + layers)
$bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    [System.Drawing.Point]::new(0, 0),
    [System.Drawing.Point]::new($size, $size),
    [System.Drawing.Color]::FromArgb(255, 30, 15, 60),
    [System.Drawing.Color]::FromArgb(255, 8, 5, 20)
)
$g.FillRectangle($bgBrush, 0, 0, $size, $size)

# Center radial glow (simulate with ellipse)
$glowPath = New-Object System.Drawing.Drawing2D.GraphicsPath
$glowPath.AddEllipse(100, 80, 312, 312)
$glowBrush = New-Object System.Drawing.Drawing2D.PathGradientBrush($glowPath)
$glowBrush.CenterColor = [System.Drawing.Color]::FromArgb(80, 60, 20, 120)
$glowBrush.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 0, 0, 0))
$g.FillPath($glowBrush, $glowPath)

$cx = 256; $cy = 240

# Draw hexagram (two triangles)
function DrawHex($g, $cx, $cy, $r, $rot, $penColor) {
    $pts = @()
    for ($i = 0; $i -lt 3; $i++) {
        $a = ($i * 2 * [Math]::PI / 3) + $rot
        $pts += [System.Drawing.PointF]::new($cx + $r * [Math]::Cos($a), $cy + $r * [Math]::Sin($a))
    }
    $pen = New-Object System.Drawing.Pen($penColor, 2.5)
    $g.DrawPolygon($pen, $pts)
}

$goldColor = [System.Drawing.Color]::FromArgb(160, 255, 200, 60)
$purpleColor = [System.Drawing.Color]::FromArgb(160, 160, 80, 255)
DrawHex $g $cx $cy 150 (-([Math]::PI / 2)) $goldColor
DrawHex $g $cx $cy 150 ([Math]::PI / 6) $purpleColor

# Outer rune circle
$circlePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(80, 180, 130, 255), 2)
$g.DrawEllipse($circlePen, $cx-200, $cy-200, 400, 400)

# Inner circle
$innerPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(60, 255, 200, 80), 1.5)
$g.DrawEllipse($innerPen, $cx-160, $cy-160, 320, 320)

# Flask body
$flaskPath = New-Object System.Drawing.Drawing2D.GraphicsPath
$flaskPath.AddBezier($cx-28, $cy-30, $cx-55, $cy-10, $cx-75, $cy+30, $cx-68, $cy+70)
$flaskPath.AddBezier($cx-68, $cy+70, $cx-60, $cy+105, $cx-35, $cy+115, $cx, $cy+115)
$flaskPath.AddBezier($cx, $cy+115, $cx+35, $cy+115, $cx+60, $cy+105, $cx+68, $cy+70)
$flaskPath.AddBezier($cx+68, $cy+70, $cx+75, $cy+30, $cx+55, $cy-10, $cx+28, $cy-30)
$flaskPath.CloseFigure()

# Liquid fill
$liquidBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    [System.Drawing.Point]::new($cx-60, $cy+20),
    [System.Drawing.Point]::new($cx+60, $cy+110),
    [System.Drawing.Color]::FromArgb(255, 0, 220, 160),
    [System.Drawing.Color]::FromArgb(255, 0, 110, 80)
)
$g.FillPath($liquidBrush, $flaskPath)

# Flask outline
$flaskPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(200, 100, 255, 190), 2.5)
$g.DrawPath($flaskPen, $flaskPath)

# Flask neck
$neckBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 20, 60, 40))
$g.FillRectangle($neckBrush, $cx-17, $cy-78, 34, 50)
$neckPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(150, 100, 255, 180), 1.5)
$g.DrawRectangle($neckPen, $cx-17, $cy-78, 34, 50)

# Cork
$corkBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    [System.Drawing.Point]::new($cx-14, $cy-96),
    [System.Drawing.Point]::new($cx+14, $cy-78),
    [System.Drawing.Color]::FromArgb(255, 200, 145, 40),
    [System.Drawing.Color]::FromArgb(255, 130, 85, 20)
)
$g.FillRectangle($corkBrush, $cx-13, $cy-96, 26, 19)
$corkPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(180, 255, 200, 100), 1)
$g.DrawRectangle($corkPen, $cx-13, $cy-96, 26, 19)

# Bubbles inside flask
$bubblePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(140, 255, 255, 255), 1.5)
$g.DrawEllipse($bubblePen, $cx-40, $cy+38, 18, 18)
$g.DrawEllipse($bubblePen, $cx+12, $cy+58, 14, 14)
$g.DrawEllipse($bubblePen, $cx-18, $cy+80, 12, 12)

# Green glow behind flask
$glowPath2 = New-Object System.Drawing.Drawing2D.GraphicsPath
$glowPath2.AddEllipse($cx-100, $cy-20, 200, 180)
$glowBrush2 = New-Object System.Drawing.Drawing2D.PathGradientBrush($glowPath2)
$glowBrush2.CenterColor = [System.Drawing.Color]::FromArgb(60, 0, 255, 160)
$glowBrush2.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 0, 0, 0))
# Draw glow behind (we do it first concept so draw again as overlay with blend)

# Sparkle stars
function DrawStar($g, $x, $y, $s, $color) {
    $pen = New-Object System.Drawing.Pen($color, 1.5)
    $g.DrawLine($pen, $x, $y-$s, $x, $y+$s)
    $g.DrawLine($pen, $x-$s, $y, $x+$s, $y)
    $d = [int]($s * 0.7)
    $g.DrawLine($pen, $x-$d, $y-$d, $x+$d, $y+$d)
    $g.DrawLine($pen, $x+$d, $y-$d, $x-$d, $y+$d)
}
$starColor = [System.Drawing.Color]::FromArgb(200, 255, 230, 100)
DrawStar $g ($cx-92) ($cy-65) 10 $starColor
DrawStar $g ($cx+95) ($cy-45) 9 $starColor
DrawStar $g ($cx-98) ($cy+62) 8 $starColor
DrawStar $g ($cx+96) ($cy+78) 9 $starColor
DrawStar $g ($cx+58) ($cy-85) 7 $starColor

# Title text: 炼金之路
$fontFamily = "Microsoft YaHei"
$font = New-Object System.Drawing.Font($fontFamily, 44, [System.Drawing.FontStyle]::Bold)
$textBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    [System.Drawing.Point]::new(156, 440),
    [System.Drawing.Point]::new(356, 480),
    [System.Drawing.Color]::FromArgb(255, 255, 220, 80),
    [System.Drawing.Color]::FromArgb(255, 255, 165, 30)
)
$shadowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(180, 80, 20, 160))
$textStr = [System.Text.Encoding]::Unicode.GetString([byte[]]@(0x3C,0x70,0x91,0x91,0x4E,0x4B,0x8F,0x8C))
$sf = New-Object System.Drawing.StringFormat
$sf.Alignment = [System.Drawing.StringAlignment]::Center
$sf.LineAlignment = [System.Drawing.StringAlignment]::Center
$textRect = New-Object System.Drawing.RectangleF(56, 432, 400, 64)
# Shadow
$shadowRect = New-Object System.Drawing.RectangleF(60, 436, 400, 64)
$g.DrawString($textStr, $font, $shadowBrush, $shadowRect, $sf)
# Main text
$g.DrawString($textStr, $font, $textBrush, $textRect, $sf)

# Corner marks
$cornerPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(120, 255, 200, 80), 1.5)
foreach ($corner in @(@(35,35), @($size-35,35), @(35,$size-35), @($size-35,$size-35))) {
    $cx2 = $corner[0]; $cy2 = $corner[1]
    $g.DrawEllipse($cornerPen, $cx2-10, $cy2-10, 20, 20)
    $g.DrawLine($cornerPen, $cx2-7, $cy2, $cx2+7, $cy2)
    $g.DrawLine($cornerPen, $cx2, $cy2-7, $cx2, $cy2+7)
}

# Save
$outPath = "d:\godotProject\test1\game3\icon_generator\icon_512.png"
$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()
Write-Host "Saved to $outPath"
