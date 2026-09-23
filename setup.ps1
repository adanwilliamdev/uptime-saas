# =====================================================
#  Bootstrap do Uptime SaaS
#  Executa: infraestrutura, backend e frontend
# =====================================================

Write-Host "`n=== 1. Subindo PostgreSQL e Redis ===" -ForegroundColor Cyan
Push-Location infra
docker compose up -d
Pop-Location

Write-Host "`nAguardando o Postgres ficar saudável..." -ForegroundColor Cyan
$pgReady = $false
for ($i = 0; $i -lt 24; $i++) {
    $status = docker inspect --format "{{.State.Health.Status}}" uptime_postgres 2>$null
    if ($status -eq "healthy") {
        $pgReady = $true
        break
    }
    Start-Sleep -Seconds 2
}

if (-not $pgReady) {
    Write-Host "`n❌ O container uptime_postgres não ficou saudável a tempo." -ForegroundColor Red
    Write-Host "   Rode 'docker compose -f infra/docker-compose.yml ps' e 'docker logs uptime_postgres' para investigar." -ForegroundColor Yellow
    Write-Host "   Causa comum no Windows: a porta do host (5433) caiu numa faixa reservada pelo Hyper-V/WSL2." -ForegroundColor Yellow
    Write-Host "   Verifique com: netsh interface ipv4 show excludedportrange protocol=tcp" -ForegroundColor Yellow
    Write-Host "   Abortando antes de rodar as migrations, para não gerar erros em cascata." -ForegroundColor Red
    exit 1
}

Write-Host "Postgres saudável. Prosseguindo." -ForegroundColor Green

Write-Host "`n=== 2. Preparando ambiente virtual Python ===" -ForegroundColor Cyan
Push-Location backend
python -m venv .venv
. .\.venv\Scripts\Activate.ps1

Write-Host "`n=== 3. Instalando dependências Python ===" -ForegroundColor Cyan
pip install --upgrade pip
pip install -r requirements.txt

Write-Host "`n=== 4. Rodando migrations Alembic ===" -ForegroundColor Cyan
alembic upgrade head
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ As migrations do Alembic falharam (código $LASTEXITCODE)." -ForegroundColor Red
    Write-Host "   Sem as tabelas criadas, a API/worker/scheduler vão falhar em cascata com 'relation ... does not exist'." -ForegroundColor Yellow
    Write-Host "   Confira o erro acima, resolva e rode o setup.ps1 novamente. Abortando." -ForegroundColor Red
    exit 1
}

Write-Host "`n=== 5. Iniciando FastAPI (porta 8000) ===" -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; . .\.venv\Scripts\Activate.ps1; uvicorn app.main:app --reload --port 8000"

Write-Host "`n=== 6. Iniciando Worker Taskiq ===" -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; . .\.venv\Scripts\Activate.ps1; taskiq worker app.workers.broker:broker app.workers.tasks"

Write-Host "`n=== 7. Iniciando Scheduler ===" -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; . .\.venv\Scripts\Activate.ps1; python -m app.workers.scheduler"

Pop-Location

Write-Host "`n=== 8. Instalando dependências do Frontend ===" -ForegroundColor Cyan
Push-Location frontend
npm install
Write-Host "`n=== 9. Iniciando Next.js (porta 3000) ===" -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"
Pop-Location

Write-Host "`n✅ Tudo pronto!" -ForegroundColor Green
Write-Host "   API:      http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Yellow
Write-Host "   Postgres: localhost:5433 (uptime / uptime_secret)" -ForegroundColor Yellow
Write-Host "   Redis:    localhost:6379" -ForegroundColor Yellow
