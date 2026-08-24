$ErrorActionPreference = "Stop"

$workspaceRoot = Split-Path -Parent $PSScriptRoot
$databaseName = "jobhunter_integration_test"
$testDatabaseUrl = "postgresql://admin:admin123@localhost:5432/${databaseName}?schema=public"

Push-Location $workspaceRoot
try {
  docker compose exec -T postgres dropdb -U admin --if-exists $databaseName
  if ($LASTEXITCODE -ne 0) { throw "Falha ao preparar o banco temporário." }

  docker compose exec -T postgres createdb -U admin $databaseName
  if ($LASTEXITCODE -ne 0) { throw "Falha ao criar o banco temporário." }

  Push-Location "backend"
  try {
    $env:DATABASE_URL = $testDatabaseUrl
    npx.cmd prisma db push --schema=src/prisma/schema.prisma --skip-generate
    if ($LASTEXITCODE -ne 0) { throw "Falha ao aplicar o schema de teste." }

    $env:TEST_DATABASE_URL = $testDatabaseUrl
    npm.cmd test -- --no-file-parallelism src/jobs/job-repository.integration.test.ts src/opportunities/opportunity-repository.integration.test.ts src/queue/queue-service.integration.test.ts src/materials/repository.integration.test.ts
    if ($LASTEXITCODE -ne 0) { throw "Falha nos testes de integração." }
  } finally {
    Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
    Remove-Item Env:TEST_DATABASE_URL -ErrorAction SilentlyContinue
    Pop-Location
  }
} finally {
  docker compose exec -T postgres dropdb -U admin --if-exists $databaseName
  Pop-Location
}
