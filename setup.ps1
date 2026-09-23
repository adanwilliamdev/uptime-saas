# =====================================================
#  Bootstrap do Uptime SaaS
#  Executa: infraestrutura, backend e frontend
# =====================================================

Write-Host "`n=== 1. Subindo PostgreSQL e Redis ===" -ForegroundColor Cyan
Push-Location infra
docker compose up -d
Pop-Location

Start-Sleep -Seconds 5

Write-Host "`n=== 2. Preparando ambiente virtual Python ===" -ForegroundColor Cyan
Push-Location backend
python -m venv .venv
. .\.venv\Scripts\Activate.ps1

Write-Host "`n=== 3. Instalando dependências Python ===" -ForegroundColor Cyan
pip install --upgrade pip
pip install -r requirements.txt

Write-Host "`n=== 4. Rodando migrations Alembic ===" -ForegroundColor Cyan
alembic upgrade head

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
Write-Host "   Postgres: localhost:5432 (uptime / uptime_secret)" -ForegroundColor Yellow
Write-Host "   Redis:    localhost:6379" -ForegroundColor Yellow
