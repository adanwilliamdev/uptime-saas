# Uptime SaaS

> Plataforma full-stack para monitoramento de disponibilidade, latência e incidentes de endpoints HTTP em tempo real.

## ✨ Visão geral

O **Uptime SaaS** permite cadastrar endpoints HTTP, acompanhar sua disponibilidade e latência, registrar histórico de verificações e monitorar incidentes em tempo real.

A aplicação utiliza uma arquitetura distribuída com **FastAPI**, **Next.js**, **PostgreSQL**, **Redis**, **Taskiq** e **WebSocket**, separando a API, persistência, processamento assíncrono e interface web.

## 🛠️ Stack

| Camada | Tecnologias |
|---|---|
| **Backend** | FastAPI · SQLAlchemy Async · PostgreSQL · Redis · Taskiq · WebSocket |
| **Frontend** | Next.js 16 · React 19 · TanStack Query · Tailwind CSS |
| **Autenticação** | JWT · Password Hashing |
| **Infraestrutura** | Docker Compose |
| **Migrations** | Alembic |

## 🏗️ Arquitetura

```text
┌──────────────────┐
│     Frontend     │
│ Next.js + React  │
└────────┬─────────┘
         │ REST + WebSocket
         ▼
┌──────────────────┐
│     FastAPI      │
│      Backend     │
└────────┬─────────┘
         │
    ┌────┴───────────────┐
    ▼                    ▼
┌─────────────┐    ┌─────────────┐
│ PostgreSQL  │    │    Redis    │
│    Dados    │    │ Fila/PubSub │
└─────────────┘    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │Taskiq Worker│
                    │ + Scheduler │
                    └──────┬──────┘
                           │
                           ▼
                    HTTP Health Checks
                    dos monitores ativos
```

### Fluxo de monitoramento

1. O **Scheduler** verifica os monitores ativos a cada 10 segundos.
2. Uma task `check_endpoint` é enfileirada para cada monitor.
3. O **Worker Taskiq** executa a requisição HTTP.
4. O resultado é armazenado em `ping_logs`.
5. Incidentes são abertos ou encerrados conforme o status do endpoint.
6. Os eventos são publicados no canal Redis `incidents`.
7. O endpoint `/ws/incidents` encaminha os eventos ao frontend em tempo real.

## 📁 Estrutura do projeto

```text
uptime-saas/
├── backend/
│   ├── app/
│   │   ├── api/v1/           # Rotas HTTP e WebSocket
│   │   ├── core/             # Configurações e segurança
│   │   ├── db/               # Engine e sessões SQLAlchemy
│   │   ├── models/           # Modelos ORM
│   │   ├── schemas/          # Schemas Pydantic
│   │   ├── services/         # Regras de negócio
│   │   └── workers/          # Broker, tasks e scheduler
│   ├── alembic/              # Migrations
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── app/              # Páginas do App Router
│   │   ├── components/ui/    # Componentes reutilizáveis
│   │   ├── hooks/            # Hooks de dados
│   │   ├── lib/              # Axios e utilitários
│   │   └── types/            # Tipos TypeScript
│   └── package.json
│
├── infra/
│   └── docker-compose.yml    # PostgreSQL + Redis
│
└── setup.ps1                 # Bootstrap automatizado para Windows
```

## 🚀 Pré-requisitos

- Python 3.12+
- Node.js 20+
- npm
- Docker
- Windows + PowerShell para utilizar o `setup.ps1`

> Em Linux e macOS, os componentes podem ser executados manualmente seguindo os comandos abaixo.

## ⚙️ Configuração

### 1. Infraestrutura

Na raiz do projeto:

```bash
cd infra
docker compose up -d
cd ..
```

Isso inicia os serviços de **PostgreSQL** e **Redis**.

### 2. Backend

#### macOS / Linux

```bash
cd backend

python3 -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt
alembic upgrade head

uvicorn app.main:app --reload --port 8000
```

#### Windows PowerShell

```powershell
cd backend

python -m venv .venv
.\.venv\Scripts\Activate.ps1

pip install -r requirements.txt
alembic upgrade head

uvicorn app.main:app --reload --port 8000
```

Se o PowerShell bloquear a ativação do ambiente virtual:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

> Confirme que o ambiente virtual está ativo antes de executar `pip install`. O terminal deve exibir `(.venv)` no início da linha.

### 3. Worker

Abra um novo terminal com o ambiente virtual ativado:

```bash
cd backend
taskiq worker app.workers.broker:broker app.workers.tasks
```

### 4. Scheduler

Em outro terminal:

```bash
cd backend
python -m app.workers.scheduler
```

### 5. Frontend

A partir da raiz do projeto:

```bash
cd frontend
npm install
npm run dev
```

### 🌐 URLs locais

| Serviço | URL |
|---|---|
| Frontend | http://localhost:3000 |
| API | http://localhost:8000 |
| Swagger / OpenAPI | http://localhost:8000/docs |

## 🪟 Setup automatizado no Windows

O projeto possui o script `setup.ps1`, que automatiza a inicialização da infraestrutura, backend, worker, scheduler e frontend.

```powershell
.\setup.ps1
```

## 🔐 Variáveis de ambiente

### Backend

Arquivo: `backend/.env`

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | Conexão assíncrona com PostgreSQL |
| `REDIS_URL` | Conexão com Redis |
| `SECRET_KEY` | Chave utilizada para assinatura dos tokens JWT |
| `ALGORITHM` | Algoritmo utilizado pelo JWT, padrão `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Tempo de validade do token de acesso |

> Em produção, utilize uma `SECRET_KEY` segura e diferente da utilizada em desenvolvimento.

### Frontend

Arquivo: `frontend/.env.local`

| Variável | Descrição |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL base da API utilizada pelo frontend |

## 🔌 API

### Autenticação

| Método | Endpoint | Descrição |
|---|---|---|
| `POST` | `/api/v1/auth/register` | Cria um usuário |
| `POST` | `/api/v1/auth/login` | Autentica e retorna um JWT |
| `GET` | `/api/v1/auth/me` | Retorna o usuário autenticado |

### Monitores

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/v1/monitors` | Lista os monitores do usuário |
| `POST` | `/api/v1/monitors` | Cria um monitor |
| `PATCH` | `/api/v1/monitors/{id}` | Atualiza um monitor |
| `DELETE` | `/api/v1/monitors/{id}` | Remove um monitor |
| `GET` | `/api/v1/monitors/{id}/logs` | Consulta o histórico de verificações |
| `GET` | `/api/v1/monitors/{id}/uptime` | Consulta uptime e latência média |
| `WS` | `/ws/incidents` | Recebe eventos de incidentes em tempo real |

## 🧪 Validação e correções

O projeto foi validado ponta a ponta utilizando PostgreSQL e Redis reais, API em execução, worker, scheduler e build de produção do frontend.

Durante a validação, foram identificados e corrigidos problemas relacionados a:

- Migration inicial ausente no Alembic.
- Incompatibilidade entre `passlib` e `bcrypt`.
- Conversão de `HttpUrl` do Pydantic para persistência no SQLAlchemy.
- Componente `Input` corrompido no frontend.
- BOM UTF-8 presente nos arquivos do projeto.
- Dependências do frontend com vulnerabilidades de segurança.
- Incompatibilidade do `asyncpg` com o event loop padrão do Windows.

### Fluxos validados

- Registro e autenticação de usuários.
- Endpoint `/auth/me`.
- CRUD completo de monitores.
- Histórico de verificações.
- Estatísticas de uptime e latência.
- Execução da task `check_endpoint`.
- Abertura e encerramento de incidentes.
- Comunicação via Redis Pub/Sub.
- Eventos em tempo real via WebSocket.
- Build de produção do frontend.
- Renderização do dashboard.

## 📌 Próximas melhorias

- Corrigir a lógica do indicador **"Fora do Ar"** para considerar o status real dos monitores, em vez de apenas `is_active = false`.
- Adicionar testes automatizados com `pytest` e `httpx.AsyncClient`.
- Criar as páginas de login e registro no frontend.
- Expandir a cobertura de testes dos fluxos de autenticação e monitoramento.

## 📄 Licença

Este projeto é destinado a fins de estudo, desenvolvimento de portfólio e demonstração de conhecimentos em desenvolvimento full-stack, APIs, processamento assíncrono e observabilidade.
