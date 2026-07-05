Write-Host "=== GAME CODE CHECKER ===" -ForegroundColor Cyan
Write-Host ""

$root = "C:\Users\Taha\OneDrive\Desktop\New folder"
$errors = @()
$warnings = @()

# 1. Check all required files exist
Write-Host "[1] Checking file existence..." -ForegroundColor Yellow
$required = @(
    "index.html", "js/setup.js", "js/terrain.js", "js/player.js",
    "js/zones.js", "js/companion.js", "js/main.js"
)
foreach ($f in $required) {
    $path = Join-Path $root $f
    if (Test-Path $path) {
        Write-Host "  OK: $f" -ForegroundColor Green
    } else {
        Write-Host "  MISSING: $f" -ForegroundColor Red
        $errors += "Missing file: $f"
    }
}
Write-Host ""

# 2. Check script loading order in index.html
Write-Host "[2] Checking script loading order..." -ForegroundColor Yellow
$html = Get-Content (Join-Path $root "index.html") -Raw
$scripts = [regex]::Matches($html, '<script src="([^"]+)">') | ForEach-Object { $_.Groups[1].Value }
Write-Host "  Script order:"
foreach ($s in $scripts) {
    Write-Host "    $s"
}

# Check setup.js is loaded after THREE but before all game scripts
$setupIdx = -1
$threeIdx = -1
for ($i = 0; $i -lt $scripts.Count; $i++) {
    if ($scripts[$i] -like "*three*") { $threeIdx = $i }
    if ($scripts[$i] -like "*setup*") { $setupIdx = $i }
}
if ($threeIdx -ge 0 -and $setupIdx -ge 0 -and $setupIdx -gt $threeIdx) {
    Write-Host "  OK: setup.js loads after Three.js" -ForegroundColor Green
} else {
    Write-Host "  ERROR: setup.js must load after Three.js" -ForegroundColor Red
    $errors += "setup.js loading order wrong"
}

# Check main.js is last game script
$mainIdx = -1
for ($i = 0; $i -lt $scripts.Count; $i++) {
    if ($scripts[$i] -like "*main*") { $mainIdx = $i }
}
if ($mainIdx -eq $scripts.Count - 1) {
    Write-Host "  OK: main.js is last script" -ForegroundColor Green
} else {
    Write-Host "  WARNING: main.js should be last (was index $mainIdx of $($scripts.Count))" -ForegroundColor Yellow
    $warnings += "main.js should load last"
}
Write-Host ""

# 3. Check all window.exposed functions
Write-Host "[3] Checking window exports..." -ForegroundColor Yellow
$jsFiles = @("terrain.js", "player.js", "zones.js", "companion.js", "main.js")
$exports = @{}
foreach ($f in $jsFiles) {
    $content = Get-Content (Join-Path $root "js/$f") -Raw
    $matches = [regex]::Matches($content, 'window\.(\w+)\s*=\s*function')
    foreach ($m in $matches) { $exports[$m.Groups[1].Value] = $f }
    $matches2 = [regex]::Matches($content, 'window\.(\w+)\s*=')
    foreach ($m in $matches2) { 
        $name = $m.Groups[1].Value
        if (-not $exports.ContainsKey($name)) { $exports[$name] = $f }
    }
}
Write-Host "  Exported symbols:"
foreach ($e in $exports.Keys | Sort-Object) {
    Write-Host "    window.$e  ->  $($exports[$e])" -ForegroundColor Gray
}
Write-Host ""

# 4. Cross-reference check: functions called across files
Write-Host "[4] Checking cross-file references..." -ForegroundColor Yellow
$globalFns = @{
    "buildTerrain" = "terrain.js"
    "getHeight" = "terrain.js"
    "updatePlayer" = "player.js"
    "buildZones" = "zones.js"
    "updateZones" = "zones.js"
    "checkZoneCollect" = "zones.js"
    "advanceDialogue" = "zones.js"
    "playNote" = "zones.js"
    "buildCompanion" = "companion.js"
    "updateCompanion" = "companion.js"
    "initGame" = "main.js"
    "showNotification" = "main.js"
    "spawnParticles" = "main.js"
    "completeGame" = "main.js"
    "updateHUD" = "main.js"
}

foreach ($fn in $globalFns.Keys) {
    $definedIn = $globalFns[$fn]
    foreach ($f in $jsFiles) {
        $content = Get-Content (Join-Path $root "js/$f") -Raw
        # Check if it's called in this file
        if ($content -match "[^.]\b$fn\(" -and $f -ne $definedIn) {
            $calls = [regex]::Matches($content, "[^.]\b$fn\(").Count
            if ($definedIn -ne "main.js") {
                # Check if defining file loads before using file
                $defIdx = $jsFiles.IndexOf($definedIn)
                $useIdx = $jsFiles.IndexOf($f)
                if ($defIdx -ge 0 -and $useIdx -ge 0 -and $defIdx -gt $useIdx) {
                    Write-Host "  WARNING: $fn defined in $definedIn but used in $f (might load after)" -ForegroundColor Yellow
                    $warnings += "$fn used in $f but defined in $definedIn"
                } else {
                    Write-Host "  OK: $fn used in $f (defined in $definedIn)" -ForegroundColor Gray
                }
            }
        }
    }
}
Write-Host ""

# 5. Check player.js character animation indices
Write-Host "[5] Checking character animation indices..." -ForegroundColor Yellow
$playerContent = Get-Content (Join-Path $root "js/player.js") -Raw
if ($playerContent -match 'idx === (\d+)') {
    Write-Host "  Found animation indices:"
    $indices = [regex]::Matches($playerContent, 'idx === (\d+)')
    foreach ($m in $indices) {
        Write-Host "    Referencing child index $($m.Groups[1].Value)" -ForegroundColor Gray
    }
    # Count children created
    $createCount = [regex]::Matches($playerContent, 'characterGroup\.add\(').Count
    Write-Host "  Children created: $createCount" -ForegroundColor Cyan
    if ($createCount -ne 10) {
        Write-Host "  WARNING: Expected 10 children (torso, head, hair, lArm, rArm, lLeg, rLeg, lShoe, rShoe, shadow)" -ForegroundColor Yellow
    }
    # Check if any index >= child count
    $maxIdx = 0
    foreach ($m in $indices) {
        $idx = [int]$m.Groups[1].Value
        if ($idx -gt $maxIdx) { $maxIdx = $idx }
    }
    if ($maxIdx -ge $createCount) {
        Write-Host "  ERROR: Animation references index $maxIdx but only $createCount children exist!" -ForegroundColor Red
        $errors += "Character animation out of bounds: index $maxIdx >= $createCount children"
    } else {
        Write-Host "  OK: All animation indices within range (0-$($createCount-1))" -ForegroundColor Green
    }
}
Write-Host ""

# 6. Check zones reference
Write-Host "[6] Checking zone definitions..." -ForegroundColor Yellow
$zoneContent = Get-Content (Join-Path $root "js/zones.js") -Raw
$zoneMatches = [regex]::Matches($zoneContent, "id:\s*(\d+)")
$zoneCount = $zoneMatches.Count
Write-Host "  Zones defined: $zoneCount" -ForegroundColor Cyan
if ($zoneCount -ne 3) {
    Write-Host "  WARNING: Expected 3 zones, found $zoneCount" -ForegroundColor Yellow
    $warnings += "Expected 3 zones, found $zoneCount"
}
# Check fragments match zones
$fragCount = [regex]::Matches($zoneContent, "collected:\s*false").Count
Write-Host "  Fragments: $zoneCount (zones) -> should match 3" -ForegroundColor Cyan
Write-Host ""

# 7. Check for undefined variables
Write-Host "[7] Checking for common issues..." -ForegroundColor Yellow
# Check 'M' variable not used (old code remnant)
foreach ($f in $jsFiles) {
    $content = Get-Content (Join-Path $root "js/$f") -Raw
    if ($content -match '\bM\b' -and $f -ne "main.js") {
        # M might be a global, check context
        $lines = $content -split "`n"
        foreach ($line in $lines) {
            if ($line -match '\bM\b' -and $line -notmatch '//' -and $line -notmatch 'THREE\.') {
                Write-Host "  WARNING: '$f' uses variable 'M' (possible old code remnant)" -ForegroundColor Yellow
                $warnings += "Possible old 'M' variable in $f"
                break
            }
        }
    }
}
Write-Host ""

# Summary
Write-Host "=== RESULTS ===" -ForegroundColor Cyan
if ($errors.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host "ALL CHECKS PASSED" -ForegroundColor Green
} else {
    if ($errors.Count -gt 0) {
        Write-Host "ERRORS ($($errors.Count)):" -ForegroundColor Red
        foreach ($e in $errors) { Write-Host "  - $e" -ForegroundColor Red }
    }
    if ($warnings.Count -gt 0) {
        Write-Host "WARNINGS ($($warnings.Count)):" -ForegroundColor Yellow
        foreach ($w in $warnings) { Write-Host "  - $w" -ForegroundColor Yellow }
    }
}
Write-Host ""
Write-Host "Done." -ForegroundColor Cyan
