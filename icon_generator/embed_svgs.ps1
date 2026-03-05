# Embed all SVG files as base64 data URLs in a JS file
$iconsDir = "d:\godotProject\test1\game3\www\icons"
$outFile   = "d:\godotProject\test1\game3\www\icons_embedded.js"

$lines = @()
$lines += "// Auto-generated: SVG icons embedded as data URLs"
$lines += "var ICON_DATA = {"

# Helper: read SVG and convert to base64 data URL
function SvgToDataUrl($path) {
    $bytes = [System.IO.File]::ReadAllBytes($path)
    $b64   = [System.Convert]::ToBase64String($bytes)
    return "data:image/svg+xml;base64,$b64"
}

# potions
$lines += "  potions: {"
$potions = @(
    @{key="healing_brew";   file="potions/healing_brew.svg"},
    @{key="greater_heal";   file="potions/greater_heal.svg"},
    @{key="strength_elixir";file="potions/strength_elixir.svg"},
    @{key="iron_skin";      file="potions/iron_skin.svg"},
    @{key="swift_potion";   file="potions/swift_potion.svg"},
    @{key="regen_potion";   file="potions/regen_potion.svg"},
    @{key="phoenix_draught";file="potions/phoenix_draught.svg"},
    @{key="venom_blade";    file="potions/venom_blade.svg"}
)
foreach ($p in $potions) {
    $fullPath = Join-Path $iconsDir $p.file
    if (Test-Path $fullPath) {
        $dataUrl = SvgToDataUrl $fullPath
        $lines += "    '$($p.key)': '$dataUrl',"
    }
}
$lines += "  },"

# status
$lines += "  status: {"
$statuses = @(
    @{key="poison";   file="status/poison.svg"},
    @{key="paralyze"; file="status/paralyze.svg"},
    @{key="sleep";    file="status/sleep.svg"},
    @{key="freeze";   file="status/freeze.svg"},
    @{key="burn";     file="status/burn.svg"},
    @{key="dizzy";    file="status/dizzy.svg"}
)
foreach ($s in $statuses) {
    $fullPath = Join-Path $iconsDir $s.file
    if (Test-Path $fullPath) {
        $dataUrl = SvgToDataUrl $fullPath
        $lines += "    '$($s.key)': '$dataUrl',"
    }
}
$lines += "  },"

# ui
$lines += "  ui: {"
$uis = @(
    @{key="settings"; file="ui/settings.svg"},
    @{key="bestiary"; file="ui/bestiary.svg"},
    @{key="exit";     file="ui/exit.svg"},
    @{key="minimap";  file="ui/minimap.svg"}
)
foreach ($u in $uis) {
    $fullPath = Join-Path $iconsDir $u.file
    if (Test-Path $fullPath) {
        $dataUrl = SvgToDataUrl $fullPath
        $lines += "    '$($u.key)': '$dataUrl',"
    }
}
$lines += "  }"

$lines += "};"
$lines += ""
$lines += "// Load all icons from embedded data URLs synchronously"
$lines += "function loadGameIcons(){"
$lines += "  return new Promise(function(resolve){"
$lines += "    var categories = ['potions','status','ui'];"
$lines += "    var pending = 0, done = 0;"
$lines += "    function tryResolve(){ if(done>=pending) resolve(); }"
$lines += "    categories.forEach(function(cat){"
$lines += "      var map = ICON_DATA[cat];"
$lines += "      if(!map) return;"
$lines += "      Object.keys(map).forEach(function(key){"
$lines += "        pending++;"
$lines += "        var img = new Image();"
$lines += "        img.onload = function(){ ICONS[cat][key]=img; done++; tryResolve(); };"
$lines += "        img.onerror = function(){ done++; tryResolve(); };"
$lines += "        img.src = map[key];"
$lines += "      });"
$lines += "    });"
$lines += "    if(pending===0) resolve();"
$lines += "  });"
$lines += "}"

$lines -join "`n" | Out-File $outFile -Encoding UTF8
Write-Host "Written: $outFile"
