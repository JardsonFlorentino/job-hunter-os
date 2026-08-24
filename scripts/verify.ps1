$ErrorActionPreference = "Stop"

$workspaceRoot = Split-Path -Parent $PSScriptRoot

function Invoke-Step {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][scriptblock]$Action
  )

  Write-Host "[VERIFY] $Name"
  & $Action
  if ($LASTEXITCODE -ne 0) {
    throw "Falha na etapa: $Name (exit code $LASTEXITCODE)"
  }
}

Push-Location $workspaceRoot
try {
  Invoke-Step "Docker Compose config" { docker compose config --quiet }

  Invoke-Step "Secret patterns outside ignored private files" {
    $secretPattern = 'sk-or-v1-[A-Za-z0-9_-]{20,}|gsk_[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{30,}|AIza[0-9A-Za-z_-]{30,}'
    $matchedFiles = @(rg -l --hidden --glob '!**/node_modules/**' --glob '!**/.next/**' --glob '!**/dist/**' --glob '!backups/**' --glob '!.git/**' --glob '!.env' --glob '!.env.*' --glob '!*.log' $secretPattern . 2>$null)
    if ($LASTEXITCODE -gt 1) { throw "Falha ao executar scanner local de segredos." }
    if ($matchedFiles.Count -gt 0) { throw "Possível segredo encontrado fora de arquivos privados: $($matchedFiles -join ', ')" }
    $exampleFiles = @(".env.example", "backend/.env.example", "deploy/.env.example") | Where-Object { Test-Path $_ }
    foreach ($exampleFile in $exampleFiles) {
      $exampleMatches = @(rg -l $secretPattern $exampleFile 2>$null)
      if ($LASTEXITCODE -gt 1) { throw "Falha ao verificar o exemplo sanitizado: $exampleFile" }
      if ($exampleMatches.Count -gt 0) { throw "Possivel segredo encontrado em arquivo de exemplo: $exampleFile" }
    }
    $global:LASTEXITCODE = 0
  }

  Push-Location "backend"
  try {
    Invoke-Step "Prisma validate" { npx.cmd prisma validate --schema=src/prisma/schema.prisma }
    Invoke-Step "Backend TypeScript" { npm.cmd run build }
    Invoke-Step "Backend tests" { npm.cmd test }
  } finally {
    Pop-Location
  }

  Push-Location "frontend"
  try {
    Invoke-Step "Frontend tests" { npm.cmd run test }
    Invoke-Step "Frontend ESLint" { npm.cmd run lint }
    Invoke-Step "Frontend build" { npm.cmd run build }
  } finally {
    Pop-Location
  }


  Push-Location "extension"
  try {
    Invoke-Step "Extension TypeScript" { npm.cmd run build }
  } finally {
    Pop-Location
  }

  $runningServices = docker compose ps --services --filter status=running
  if ($LASTEXITCODE -ne 0) {
    throw "Não foi possível consultar os containers."
  }

  if ($runningServices -contains "frontend") {
    Write-Host "[VERIFY] Frontend HTTP"
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 20
    if ($response.StatusCode -ne 200) {
      throw "Frontend respondeu HTTP $($response.StatusCode)."
    }
  } else {
    Write-Host "[VERIFY] Frontend HTTP ignorado: container não está em execução."
  }

  Write-Host "[VERIFY] OK"
} finally {
  Pop-Location
}
