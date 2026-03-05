# Save with UTF-8 BOM to ensure Chinese chars work
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Drawing

$size = 512
$bmp = New-Object System.Drawing.Bitmap($size, $size)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

# Background gradient
$bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    [System.Drawing.Point]::new(0, 0),
    [System.Drawing.Point]::new($size, $size),
    [System.Drawing.Color]::FromArgb(255, 30, 15, 60),
    [System.Drawing.Color]::FromArgb(255, 8, 5, 20)
)
$g.FillRectangle($bgBrush, 0, 0, $size, $size)

# Center glow
$glowPath = New-Object System.Drawing.Drawing2D.GraphicsPath
$glowPath.AddEllipse(100, 80, 312, 312)
$glowBrush = New-Object System.Drawing.Drawing2D.PathGradientBrush($glowPath)
$glowBrush.CenterColor = [System.Drawing.Color]::FromArgb(80, 60, 20, 120)
$glowBrush.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 0, 0, 0))
$g.FillPath($glowBrush, $glowPath)

$cx = 256; $cy = 240

# Two triangles (hexagram)
function DrawTriangle($g, $cx, $cy, $r, $rot, $penColor) {
    $pts = New-Object System.Drawing.PointF[] 3
    for ($i = 0; $i -lt 3; $i++) {
        $a = ($i * 2 * [Math]::PI / 3) + $rot
        $pts[$i] = [System.Drawing.PointF]::new(
            [float]($cx + $r * [Math]::Cos($a)),
            [float]($cy + $r * [Math]::Sin($a))
        )
    }
    $pen = New-Object System.Drawing.Pen($penColor, 2.5)
    $g.DrawPolygon($pen, $pts)
    $pen.Dispose()
}

$goldColor   = [System.Drawing.Color]::FromArgb(160, 255, 200, 60)
$purpleColor = [System.Drawing.Color]::FromArgb(160, 160, 80, 255)
DrawTriangle $g $cx $cy 150 (-([Math]::PI / 2)) $goldColor
DrawTriangle $g $cx $cy 150 ([Math]::PI / 6)    $purpleColor

# Circles
$circlePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(80, 180, 130, 255), 2)
$g.DrawEllipse($circlePen, $cx-200, $cy-200, 400, 400)
$innerPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(60, 255, 200, 80), 1.5)
$g.DrawEllipse($innerPen, $cx-160, $cy-160, 320, 320)

# Flask body path
$flaskPath = New-Object System.Drawing.Drawing2D.GraphicsPath
$flaskPath.AddBezier(
    [float]($cx-28), [float]($cy-30),
    [float]($cx-55), [float]($cy-10),
    [float]($cx-75), [float]($cy+30),
    [float]($cx-68), [float]($cy+70)
)
$flaskPath.AddBezier(
    [float]($cx-68), [float]($cy+70),
    [float]($cx-60), [float]($cy+105),
    [float]($cx-35), [float]($cy+115),
    [float]($cx),    [float]($cy+115)
)
$flaskPath.AddBezier(
    [float]($cx),    [float]($cy+115),
    [float]($cx+35), [float]($cy+115),
    [float]($cx+60), [float]($cy+105),
    [float]($cx+68), [float]($cy+70)
)
$flaskPath.AddBezier(
    [float]($cx+68), [float]($cy+70),
    [float]($cx+75), [float]($cy+30),
    [float]($cx+55), [float]($cy-10),
    [float]($cx+28), [float]($cy-30)
)
$flaskPath.CloseFigure()

# Liquid fill
$liquidBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    [System.Drawing.Point]::new([int]($cx-60), [int]($cy+20)),
    [System.Drawing.Point]::new([int]($cx+60), [int]($cy+110)),
    [System.Drawing.Color]::FromArgb(255, 0, 220, 160),
    [System.Drawing.Color]::FromArgb(255, 0, 110, 80)
)
$g.FillPath($liquidBrush, $flaskPath)

# Flask outline
$flaskPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(200, 100, 255, 190), 2.5)
$g.DrawPath($flaskPen, $flaskPath)

# Neck
$neckBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 20, 60, 40))
$g.FillRectangle($neckBrush, [int]($cx-17), [int]($cy-78), 34, 50)
$neckPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(150, 100, 255, 180), 1.5)
$g.DrawRectangle($neckPen, [int]($cx-17), [int]($cy-78), 34, 50)

# Cork
$corkBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    [System.Drawing.Point]::new([int]($cx-14), [int]($cy-96)),
    [System.Drawing.Point]::new([int]($cx+14), [int]($cy-78)),
    [System.Drawing.Color]::FromArgb(255, 200, 145, 40),
    [System.Drawing.Color]::FromArgb(255, 130, 85, 20)
)
$g.FillRectangle($corkBrush, [int]($cx-13), [int]($cy-96), 26, 19)

# Bubbles
$bubblePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(140, 255, 255, 255), 1.5)
$g.DrawEllipse($bubblePen, [int]($cx-40), [int]($cy+38), 18, 18)
$g.DrawEllipse($bubblePen, [int]($cx+12), [int]($cy+58), 14, 14)
$g.DrawEllipse($bubblePen, [int]($cx-18), [int]($cy+80), 12, 12)

# Sparkle stars
function DrawStar($g, $sx, $sy, $s, $color) {
    $pen = New-Object System.Drawing.Pen($color, 1.5)
    $g.DrawLine($pen, [int]($sx), [int]($sy-$s), [int]($sx), [int]($sy+$s))
    $g.DrawLine($pen, [int]($sx-$s), [int]($sy), [int]($sx+$s), [int]($sy))
    $d = [int]($s * 0.7)
    $g.DrawLine($pen, [int]($sx-$d), [int]($sy-$d), [int]($sx+$d), [int]($sy+$d))
    $g.DrawLine($pen, [int]($sx+$d), [int]($sy-$d), [int]($sx-$d), [int]($sy+$d))
    $pen.Dispose()
}
$starColor = [System.Drawing.Color]::FromArgb(200, 255, 230, 100)
DrawStar $g ($cx-92) ($cy-65) 10 $starColor
DrawStar $g ($cx+95) ($cy-45) 9  $starColor
DrawStar $g ($cx-98) ($cy+62) 8  $starColor
DrawStar $g ($cx+96) ($cy+78) 9  $starColor
DrawStar $g ($cx+58) ($cy-85) 7  $starColor

# Text: use Unicode char codes for Chinese
# 炼=0x70BC 金=0x91D1 之=0x4E4B 路=0x8DEF
$textStr = [string][char]0x70BC + [char]0x91D1 + [char]0x4E4B + [char]0x8DEF

$fontFamily = "Microsoft YaHei"
$font = New-Object System.Drawing.Font($fontFamily, 46, [System.Drawing.FontStyle]::Bold)

$textBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    [System.Drawing.Point]::new(156, 440),
    [System.Drawing.Point]::new(356, 490),
    [System.Drawing.Color]::FromArgb(255, 255, 225, 80),
    [System.Drawing.Color]::FromArgb(255, 255, 160, 30)
)
$shadowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(200, 60, 10, 120))

$sf = New-Object System.Drawing.StringFormat
$sf.Alignment = [System.Drawing.StringAlignment]::Center
$sf.LineAlignment = [System.Drawing.StringAlignment]::Center

$shadowRect = New-Object System.Drawing.RectangleF(60.0, 438.0, 400.0, 64.0)
$textRect   = New-Object System.Drawing.RectangleF(56.0, 434.0, 400.0, 64.0)
$g.DrawString($textStr, $font, $shadowBrush, $shadowRect, $sf)
$g.DrawString($textStr, $font, $textBrush,   $textRect,   $sf)

# Corner marks
$cornerPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(120, 255, 200, 80), 1.5)
$corners = @(
    @(35,    35   ),
    @(477,   35   ),
    @(35,    477  ),
    @(477,   477  )
)
foreach ($corner in $corners) {
    $cx2 = [int]$corner[0]; $cy2 = [int]$corner[1]
    $g.DrawEllipse($cornerPen, $cx2-10, $cy2-10, 20, 20)
    $g.DrawLine($cornerPen, $cx2-7, $cy2, $cx2+7, $cy2)
    $g.DrawLine($cornerPen, $cx2, $cy2-7, $cx2, $cy2+7)
}

$outPath = "d:\godotProject\test1\game3\icon_generator\icon_512.png"
$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
Write-Host "Done: $outPath"
