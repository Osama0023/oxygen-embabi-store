# Test local cache simulation and count edge requests (HIT vs MISS)
# Run: $env:ENABLE_CACHE_SIMULATION="1"; npm run dev
# Then: .\scripts\test-local-cache.ps1

$base = "http://localhost:3000"
$urls = @(
  "/en",
  "/ar",
  "/en/products",
  "/en/categories",
  "/en/deals",
  "/en/contact"
)

$hits = 0
$misses = 0
$errors = 0

function Test-Pass {
  param($label, $expect)
  $script:hits = 0
  $script:misses = 0
  $script:errors = 0
  Write-Host "`n=== $label ===" -ForegroundColor Cyan
  foreach ($path in $urls) {
    try {
      $r = Invoke-WebRequest -Uri "$base$path" -Method Get -UseBasicParsing -TimeoutSec 15
      $sim = $r.Headers["X-Local-Cache-Sim"]
      if ($sim -eq "HIT") { $script:hits++ }
      elseif ($sim -eq "MISS") { $script:misses++ }
      $color = if ($sim -eq "HIT") { "Green" } elseif ($sim -eq "MISS") { "Yellow" } else { "Gray" }
      Write-Host "  $path -> $sim" -ForegroundColor $color
    } catch {
      $script:errors++
      Write-Host "  $path -> Error" -ForegroundColor Red
    }
  }
  $total = $script:hits + $script:misses
  Write-Host "  ---" -ForegroundColor Gray
  Write-Host "  Edge requests: $total total | HIT: $($script:hits) | MISS: $($script:misses) | Errors: $($script:errors)" -ForegroundColor White
}

Test-Pass "First pass (expect MISS)" "MISS"
Test-Pass "Second pass (expect HIT)" "HIT"

Write-Host "`nTip: ENABLE_CACHE_SIMULATION=1 must be set before starting the dev server" -ForegroundColor Gray
Write-Host "On Vercel: Usage -> Networking -> Edge Requests for real cached/uncached counts" -ForegroundColor Gray
