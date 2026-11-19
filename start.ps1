param(
    [ValidateRange(1, 65535)]
    [int]$Port = 5173
)

$ErrorActionPreference = 'Stop'
$taskNode = Get-Command node -ErrorAction SilentlyContinue
if (-not $taskNode) {
    throw 'Node.js 18 or newer is required. Install Node.js, then run this script again.'
}

$taskPreviousPort = $env:PORT
try {
    $env:PORT = [string]$Port
    & $taskNode.Source (Join-Path $PSScriptRoot 'scripts/serve.mjs')
    if ($LASTEXITCODE -ne 0) {
        throw "Local server exited with code $LASTEXITCODE."
    }
}
finally {
    $env:PORT = $taskPreviousPort
}
