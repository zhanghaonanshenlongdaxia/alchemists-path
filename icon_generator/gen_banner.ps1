Add-Type -AssemblyName System.Drawing

$W = 1920; $H = 1080
$bmp = New-Object System.Drawing.Bitmap($W, $H)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

# ============ BACKGROUND ============
# Deep dark gradient: top-left purple -> center dark navy -> bottom-right near-black
$bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    [System.Drawing.Point]::new(0, 0),
    [System.Drawing.Point]::new($W, $H),
    [System.Drawing.Color]::FromArgb(255, 18, 8, 42),
    [System.Drawing.Color]::FromArgb(255, 5, 3, 15)
)
$g.FillRectangle($bgBrush, 0, 0, $W, $H)

# Radial glow in center-left (behind flask)
$glowPath = New-Object System.Drawing.Drawing2D.GraphicsPath
$glowPath.AddEllipse(200, 150, 900, 780)
$glowBrush = New-Object System.Drawing.Drawing2D.PathGradientBrush($glowPath)
$glowBrush.CenterColor = [System.Drawing.Color]::FromArgb(60, 40, 15, 90)
$glowBrush.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 0, 0, 0))
$g.FillPath($glowBrush, $glowPath)

# Green glow (behind center flask)
$greenGlowPath = New-Object System.Drawing.Drawing2D.GraphicsPath
$greenGlowPath.AddEllipse(380, 280, 560, 520)
$greenGlowBrush = New-Object System.Drawing.Drawing2D.PathGradientBrush($greenGlowPath)
$greenGlowBrush.CenterColor = [System.Drawing.Color]::FromArgb(50, 0, 200, 130)
$greenGlowBrush.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 0, 0, 0))
$g.FillPath($greenGlowBrush, $greenGlowPath)

# ============ SCATTERED PARTICLES (stars/dust) ============
$rand = New-Object System.Random(42)
for ($i = 0; $i -lt 200; $i++) {
    $px = $rand.Next(0, $W)
    $py = $rand.Next(0, $H)
    $pr = $rand.Next(1, 4)
    $pa = $rand.Next(40, 160)
    $colors = @(
        [System.Drawing.Color]::FromArgb($pa, 255, 220, 100),
        [System.Drawing.Color]::FromArgb($pa, 180, 120, 255),
        [System.Drawing.Color]::FromArgb($pa, 100, 255, 200),
        [System.Drawing.Color]::FromArgb($pa, 255, 255, 255)
    )
    $c = $colors[$rand.Next(0, 4)]
    $particleBrush = New-Object System.Drawing.SolidBrush($c)
    $g.FillEllipse($particleBrush, $px, $py, $pr, $pr)
    $particleBrush.Dispose()
}

# ============ RUNE CIRCLES (decorative arcs) ============
$arcPen1 = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(40, 200, 150, 255), 1.5)
$arcPen2 = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(35, 255, 200, 80), 1)
# Large rune circle behind flask
$g.DrawEllipse($arcPen1, 300, 200, 720, 720)
$g.DrawEllipse($arcPen2, 340, 240, 640, 640)
# Smaller inner rings
$g.DrawEllipse($arcPen1, 450, 340, 420, 420)

# Hexagram triangles
function DrawTri($g, $cx, $cy, $r, $rot, $penColor) {
    $pts = New-Object System.Drawing.PointF[] 3
    for ($i = 0; $i -lt 3; $i++) {
        $a = ($i * 2 * [Math]::PI / 3) + $rot
        $pts[$i] = [System.Drawing.PointF]::new(
            [float]($cx + $r * [Math]::Cos($a)),
            [float]($cy + $r * [Math]::Sin($a))
        )
    }
    $pen = New-Object System.Drawing.Pen($penColor, 2)
    $g.DrawPolygon($pen, $pts)
    $pen.Dispose()
}
$triGold   = [System.Drawing.Color]::FromArgb(80, 255, 200, 60)
$triPurple = [System.Drawing.Color]::FromArgb(80, 160, 80, 255)
DrawTri $g 660 550 280 (-([Math]::PI/2)) $triGold
DrawTri $g 660 550 280 ([Math]::PI/6)    $triPurple

# ============ CENTRAL FLASK ============
$cx = 660; $cy = 560

# Extra glow ring
$flaskGlowPath = New-Object System.Drawing.Drawing2D.GraphicsPath
$flaskGlowPath.AddEllipse($cx-220, $cy-200, 440, 440)
$flaskGlowBrush = New-Object System.Drawing.Drawing2D.PathGradientBrush($flaskGlowPath)
$flaskGlowBrush.CenterColor = [System.Drawing.Color]::FromArgb(70, 0, 255, 160)
$flaskGlowBrush.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 0, 0, 0))
$g.FillPath($flaskGlowBrush, $flaskGlowPath)

# Flask body (scaled up x2.5 from 512 version)
$scale = 2.2
$flaskPath = New-Object System.Drawing.Drawing2D.GraphicsPath
$flaskPath.AddBezier(
    [float]($cx - 28*$scale), [float]($cy - 30*$scale),
    [float]($cx - 55*$scale), [float]($cy - 10*$scale),
    [float]($cx - 75*$scale), [float]($cy + 30*$scale),
    [float]($cx - 68*$scale), [float]($cy + 70*$scale)
)
$flaskPath.AddBezier(
    [float]($cx - 68*$scale), [float]($cy + 70*$scale),
    [float]($cx - 60*$scale), [float]($cy + 105*$scale),
    [float]($cx - 35*$scale), [float]($cy + 115*$scale),
    [float]($cx),             [float]($cy + 115*$scale)
)
$flaskPath.AddBezier(
    [float]($cx),             [float]($cy + 115*$scale),
    [float]($cx + 35*$scale), [float]($cy + 115*$scale),
    [float]($cx + 60*$scale), [float]($cy + 105*$scale),
    [float]($cx + 68*$scale), [float]($cy + 70*$scale)
)
$flaskPath.AddBezier(
    [float]($cx + 68*$scale), [float]($cy + 70*$scale),
    [float]($cx + 75*$scale), [float]($cy + 30*$scale),
    [float]($cx + 55*$scale), [float]($cy - 10*$scale),
    [float]($cx + 28*$scale), [float]($cy - 30*$scale)
)
$flaskPath.CloseFigure()

$liquidBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    [System.Drawing.Point]::new([int]($cx - 60*$scale), [int]($cy + 20*$scale)),
    [System.Drawing.Point]::new([int]($cx + 60*$scale), [int]($cy + 110*$scale)),
    [System.Drawing.Color]::FromArgb(255, 0, 230, 170),
    [System.Drawing.Color]::FromArgb(255, 0, 120, 85)
)
$g.FillPath($liquidBrush, $flaskPath)

# Flask glass outline
$flaskPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(220, 120, 255, 200), 3)
$g.DrawPath($flaskPen, $flaskPath)

# Shine highlight
$shinePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(80, 255, 255, 255), 12)
$shinePen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$shinePen.EndCap   = [System.Drawing.Drawing2D.LineCap]::Round
$g.DrawLine($shinePen, [int]($cx-80*$scale/2), [int]($cy+10*$scale), [int]($cx-60*$scale/2), [int]($cy+80*$scale))

# Neck
$neckBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 15, 50, 35))
$g.FillRectangle($neckBrush, [int]($cx-17*$scale), [int]($cy-78*$scale), [int](34*$scale), [int](50*$scale))
$neckPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(160, 100, 255, 180), 2)
$g.DrawRectangle($neckPen, [int]($cx-17*$scale), [int]($cy-78*$scale), [int](34*$scale), [int](50*$scale))

# Cork
$corkBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    [System.Drawing.Point]::new([int]($cx-14*$scale), [int]($cy-96*$scale)),
    [System.Drawing.Point]::new([int]($cx+14*$scale), [int]($cy-78*$scale)),
    [System.Drawing.Color]::FromArgb(255, 210, 155, 45),
    [System.Drawing.Color]::FromArgb(255, 135, 90, 20)
)
$g.FillRectangle($corkBrush, [int]($cx-13*$scale), [int]($cy-96*$scale), [int](26*$scale), [int](20*$scale))

# Bubbles
$bubblePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(160, 255, 255, 255), 2)
$g.DrawEllipse($bubblePen, [int]($cx-40*$scale), [int]($cy+38*$scale), [int](18*$scale), [int](18*$scale))
$g.DrawEllipse($bubblePen, [int]($cx+12*$scale), [int]($cy+58*$scale), [int](14*$scale), [int](14*$scale))
$g.DrawEllipse($bubblePen, [int]($cx-18*$scale), [int]($cy+80*$scale), [int](12*$scale), [int](12*$scale))

# ============ SPARKLE STARS ============
function DrawStar2($g, $sx, $sy, $s, $color) {
    $pen = New-Object System.Drawing.Pen($color, 2)
    $g.DrawLine($pen, [int]$sx, [int]($sy-$s), [int]$sx, [int]($sy+$s))
    $g.DrawLine($pen, [int]($sx-$s), [int]$sy, [int]($sx+$s), [int]$sy)
    $d = [int]($s * 0.65)
    $g.DrawLine($pen, [int]($sx-$d), [int]($sy-$d), [int]($sx+$d), [int]($sy+$d))
    $g.DrawLine($pen, [int]($sx+$d), [int]($sy-$d), [int]($sx-$d), [int]($sy+$d))
    $pen.Dispose()
}
$starC = [System.Drawing.Color]::FromArgb(220, 255, 235, 110)
DrawStar2 $g ($cx-200) ($cy-160) 18 $starC
DrawStar2 $g ($cx+210) ($cy-120) 15 $starC
DrawStar2 $g ($cx-220) ($cy+160) 13 $starC
DrawStar2 $g ($cx+220) ($cy+180) 16 $starC
DrawStar2 $g ($cx+100) ($cy-200) 12 $starC
DrawStar2 $g ($cx-120) ($cy+260) 10 $starC
DrawStar2 $g 150 200 20 $starC
DrawStar2 $g 180 800 16 $starC

# ============ RIGHT SIDE: TITLE 炼金之路 (centered vertically) ============
$titleStr = [string][char]0x70BC + [char]0x91D1 + [char]0x4E4B + [char]0x8DEF  # 炼金之路

# Right half: x=960..1920, vertically centered
$titleY   = 380  # top of title text area

$bigFont = New-Object System.Drawing.Font("Microsoft YaHei", 110, [System.Drawing.FontStyle]::Bold)

$sf = New-Object System.Drawing.StringFormat
$sf.Alignment     = [System.Drawing.StringAlignment]::Center
$sf.LineAlignment = [System.Drawing.StringAlignment]::Center

# Glow behind title
$titleGlowPath = New-Object System.Drawing.Drawing2D.GraphicsPath
$titleGlowPath.AddEllipse(960, 280, 960, 520)
$titleGlowBrush = New-Object System.Drawing.Drawing2D.PathGradientBrush($titleGlowPath)
$titleGlowBrush.CenterColor = [System.Drawing.Color]::FromArgb(40, 200, 150, 0)
$titleGlowBrush.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 0, 0, 0))
$g.FillPath($titleGlowBrush, $titleGlowPath)

# Shadow layers
$shadowBrush1 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(130, 80, 20, 180))
$shadowRect1  = New-Object System.Drawing.RectangleF(966.0, [float]($titleY+6), 960.0, 200.0)
$g.DrawString($titleStr, $bigFont, $shadowBrush1, $shadowRect1, $sf)

$shadowBrush2 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(90, 60, 10, 140))
$shadowRect2  = New-Object System.Drawing.RectangleF(970.0, [float]($titleY+10), 960.0, 200.0)
$g.DrawString($titleStr, $bigFont, $shadowBrush2, $shadowRect2, $sf)

# Gold gradient fill
$mainRect = New-Object System.Drawing.RectangleF(960.0, [float]$titleY, 960.0, 200.0)
$gradBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    [System.Drawing.Point]::new(960, $titleY),
    [System.Drawing.Point]::new(1920, ($titleY+200)),
    [System.Drawing.Color]::FromArgb(255, 255, 240, 100),
    [System.Drawing.Color]::FromArgb(255, 255, 155, 20)
)
$g.DrawString($titleStr, $bigFont, $gradBrush, $mainRect, $sf)


# ============ BOTTOM AMBIENT ============
# Vignette effect (darken corners)
$vigPath = New-Object System.Drawing.Drawing2D.GraphicsPath
$vigPath.AddRectangle([System.Drawing.RectangleF]::new(0, 0, $W, $H))
$vigBrush = New-Object System.Drawing.Drawing2D.PathGradientBrush($vigPath)
$vigBrush.CenterColor = [System.Drawing.Color]::FromArgb(0, 0, 0, 0)
$vigBrush.SurroundColors = @([System.Drawing.Color]::FromArgb(180, 0, 0, 0))
$vigBrush.CenterPoint = [System.Drawing.PointF]::new($W/2, $H/2)
$g.FillPath($vigBrush, $vigPath)

$outPath = "d:\godotProject\test1\game3\jietu\banner_1920x1080.png"
$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
Write-Host "Banner saved: $outPath"
