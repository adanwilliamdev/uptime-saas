# 🚀 Uptime SaaS

Plataforma full-stack para **monitoramento de disponibilidade de aplicações e APIs**, permitindo cadastrar endpoints HTTP, acompanhar status, latência, uptime e incidentes em tempo real.

O sistema utiliza uma arquitetura assíncrona baseada em **FastAPI, PostgreSQL, Redis e Taskiq**, com comunicação em tempo real via WebSocket.

---

## ✨ Funcionalidades

* 🔐 Autenticação com JWT
* 👤 Cadastro e gerenciamento de usuários
* 🌐 Cadastro e gerenciamento de monitores HTTP
* 📡 Verificação automática dos endpoints
* ⚡ Monitoramento assíncrono
* 📊 Histórico de verificações e latência
* 📈 Cálculo de uptime
* 🚨 Abertura e encerramento automático de incidentes
* 🔄 Atualizações de incidentes em tempo real
* 🔌 WebSocket integrado ao Redis Pub/Sub
* 🗄️ Migrations com Alembic
* 🐳 PostgreSQL e Redis via Docker Compose
* 📱 Interface responsiva com Next.js

---

## 🧩 Stack

### Backend

| Tecnologia       | Utilização           |
| ---------------- | -------------------- |
| **Python 3.12+** | Linguagem principal  |
| **FastAPI**      | API REST e WebSocket |
| **SQLAlchemy**   | ORM assíncrono       |
| **PostgreSQL**   | Banco de dados       |
| **Redis**        | Fila e Pub/Sub       |
| **Taskiq**       | Workers e scheduler  |
| **Alembic**      | Migrations           |
| **Pydantic**     | Validação de dados   |
| **JWT**          | Autenticação         |

### Frontend

| Tecnologia         | Utilização             |
| ------------------ | ---------------------- |
| **Next.js 16**     | Framework web          |
| **React 19**       | Interface              |
| **TypeScript**     | Tipagem                |
| **TanStack Query** | Gerenciamento de dados |
| **Tailwind CSS**   | Estilização            |
| **Axios**          | Comunicação com a API  |

### Infraestrutura

* Docker
* Docker Compose
* PostgreSQL
* Redis

---

## 🏗️ Arquitetura

```text
┌──────────────────────┐
│      Frontend        │
│   Next.js + React    │
└──────────┬───────────┘
           │
       REST + WS
           │
           ▼
┌──────────────────────┐
│       FastAPI        │
│       Backend        │
└──────────┬───────────┘
           │
     ┌─────┴─────┐
     │           │
     ▼           ▼
┌──────────┐  ┌──────────┐
│PostgreSQL│  │  Redis   │
│  Dados   │  │Fila/PubSub│
└──────────┘  └────┬─────┘
                   │
                   ▼
            ┌──────────────┐
            │ Taskiq Worker│
            │ + Scheduler  │
            └──────┬───────┘
                   │
                   ▼
             HTTP Monitors
```

### Fluxo de monitoramento

O scheduler verifica os monitores ativos a cada **10 segundos** e coloca uma task `check_endpoint` na fila.

O worker do Taskiq:

1. Consome a task da fila.
2. Realiza a requisição HTTP.
3. Registra o resultado em `ping_logs`.
4. Identifica alterações de disponibilidade.
5. Abre ou encerra incidentes.
6. Publica o evento no Redis Pub/Sub.
7. O WebSocket `/ws/incidents` transmite a atualização para o frontend.

---

## 📁 Estrutura do projeto

```text
uptime-saas/
│
├── backend/
│   ├── app/
│   │   ├── api/v1/            # Rotas REST e WebSocket
│   │   ├── core/              # Configurações e segurança
│   │   ├── db/                # SQLAlchemy e sessões
│   │   ├── models/            # Modelos ORM
│   │   ├── schemas/           # Schemas Pydantic
│   │   ├── services/          # Regras de negócio
│   │   └── workers/           # Tasks e scheduler
│   ├── alembic/               # Migrations
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── app/               # App Router
│   │   ├── components/ui/     # Componentes reutilizáveis
│   │   ├── hooks/             # Hooks de dados
│   │   ├── lib/               # Axios e utilitários
│   │   └── types/             # Tipos TypeScript
│   └── package.json
│
├── infra/
│   └── docker-compose.yml      # PostgreSQL + Redis
│
└── setup.ps1                   # Setup automatizado para Windows
```

---

## ⚙️ Pré-requisitos

Antes de executar o projeto, certifique-se de possuir:

* Python **3.12+**
* Node.js **20+**
* npm
* Docker Desktop
* Git

> Para utilizar o `setup.ps1`, é necessário Windows + PowerShell.

---

## 🚀 Instalação

Clone o repositório:

```bash
git clone https://github.com/adanwilliamdev/uptime-saas
cd uptime-saas
```

### 1. Infraestrutura

A partir da raiz do projeto:

```bash
cd infra
docker compose up -d
cd ..
```

Isso inicializa:

* PostgreSQL
* Redis

---

## 🐍 Backend

### macOS / Linux

```bash
cd backend

python3 -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt

alembic upgrade head

uvicorn app.main:app --reload --port 8000
```

### Windows PowerShell

```powershell
cd backend

python -m venv .venv
.\.venv\Scripts\Activate.ps1

pip install -r requirements.txt

alembic upgrade head

uvicorn app.main:app --reload --port 8000
```

Caso o PowerShell bloqueie a execução do ambiente virtual:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

O terminal deverá apresentar `(.venv)` antes dos comandos executados.

---

## ⚙️ Worker e Scheduler

Abra um novo terminal com o ambiente virtual ativado.

### Worker

```bash
cd backend
taskiq worker app.workers.broker:broker app.workers.tasks
```

### Scheduler

Em outro terminal:

```bash
cd backend
python -m app.workers.scheduler
```

---

## 💻 Frontend

Em um novo terminal, a partir da raiz:

```bash
cd frontend

npm install
npm run dev
```

A aplicação ficará disponível em:

```text
http://localhost:3000
```

A API ficará disponível em:

```text
http://localhost:8000
```

Documentação interativa:

```text
http://localhost:8000/docs
```

---

## 🪟 Setup automatizado no Windows

O projeto possui um script para automatizar a configuração da infraestrutura, backend, worker, scheduler e frontend.

Execute no PowerShell:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\setup.ps1
```

---

## 🔐 Variáveis de ambiente

### Backend

Arquivo:

```text
backend/.env
```

| Variável                      | Descrição                                      |
| ----------------------------- | ---------------------------------------------- |
| `DATABASE_URL`                | Conexão assíncrona com PostgreSQL              |
| `REDIS_URL`                   | Conexão com Redis                              |
| `SECRET_KEY`                  | Chave utilizada para assinatura dos tokens JWT |
| `ALGORITHM`                   | Algoritmo utilizado pelo JWT                   |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Tempo de expiração do token                    |

### Frontend

Arquivo:

```text
frontend/.env.local
```

| Variável              | Descrição       |
| --------------------- | --------------- |
| `NEXT_PUBLIC_API_URL` | URL base da API |

> Nunca versione credenciais, tokens ou chaves secretas no repositório.

---

## 🔌 API

### Autenticação

| Método | Endpoint                | Descrição                     |
| ------ | ----------------------- | ----------------------------- |
| `POST` | `/api/v1/auth/register` | Cria um usuário               |
| `POST` | `/api/v1/auth/login`    | Autentica e retorna JWT       |
| `GET`  | `/api/v1/auth/me`       | Retorna o usuário autenticado |

### Monitores

| Método   | Endpoint                       | Descrição                 |
| -------- | ------------------------------ | ------------------------- |
| `GET`    | `/api/v1/monitors`             | Lista os monitores        |
| `POST`   | `/api/v1/monitors`             | Cria um monitor           |
| `PATCH`  | `/api/v1/monitors/{id}`        | Atualiza um monitor       |
| `DELETE` | `/api/v1/monitors/{id}`        | Remove um monitor         |
| `GET`    | `/api/v1/monitors/{id}/logs`   | Histórico de verificações |
| `GET`    | `/api/v1/monitors/{id}/uptime` | Uptime e latência média   |

### WebSocket

```text
/ws/incidents
```

Canal utilizado para receber eventos de incidentes em tempo real.

---

## 🧪 Validação

O fluxo principal da aplicação foi validado utilizando PostgreSQL e Redis reais, incluindo execução da API, worker, scheduler e build de produção do frontend.

### Fluxos validados

* ✅ Registro de usuário
* ✅ Login
* ✅ `/auth/me`
* ✅ CRUD de monitores
* ✅ Histórico de verificações
* ✅ Estatísticas de uptime
* ✅ Execução da task `check_endpoint`
* ✅ Abertura e encerramento de incidentes
* ✅ Redis Pub/Sub
* ✅ WebSocket de incidentes
* ✅ Build de produção do frontend
* ✅ Renderização do dashboard

---

## 🛠️ Correções técnicas relevantes

Durante a validação foram identificados e corrigidos problemas relacionados a:

* Migration inicial do banco de dados.
* Compatibilidade entre `passlib` e `bcrypt`.
* Conversão de `HttpUrl` para `str` antes da persistência.
* Componente `Input` do frontend.
* BOM UTF-8 em arquivos do projeto.
* Dependências vulneráveis do frontend.
* Compatibilidade do `asyncpg` com o event loop do Windows.
* Resolução de `localhost` para IPv6 no Windows.
* Conflitos de porta do PostgreSQL.
* Conexões instáveis entre Windows, Docker Desktop e WSL2.
* Ausência da página de autenticação no frontend.

---

## 📊 Status do projeto

| Área                 | Status |
| -------------------- | ------ |
| Autenticação         | ✅      |
| Monitoramento HTTP   | ✅      |
| Histórico de checks  | ✅      |
| Uptime               | ✅      |
| Incidentes           | ✅      |
| Redis Pub/Sub        | ✅      |
| WebSocket            | ✅      |
| Worker               | ✅      |
| Scheduler            | ✅      |
| PostgreSQL           | ✅      |
| Frontend             | ✅      |
| Build de produção    | ✅      |
| Testes automatizados | 🔲     |

---

## 🔭 Próximas melhorias

* [ ] Adicionar testes automatizados com `pytest`
* [ ] Adicionar testes de integração com `httpx.AsyncClient`
* [ ] Melhorar a identificação de monitores realmente offline
* [ ] Expandir métricas e observabilidade
* [ ] Adicionar gráficos históricos de disponibilidade e latência
* [ ] Implementar notificações de incidentes
* [ ] Adicionar suporte a múltiplos intervalos de monitoramento

---

## 📌 Observação

Atualmente, o indicador **"Fora do Ar"** considera monitores com `is_active = false`, representando monitoramento pausado. Uma evolução prevista é utilizar o último `ping_log` ou incidentes abertos para representar o estado real de disponibilidade.

O projeto ainda não possui uma suíte de testes automatizados. A validação atual foi realizada manualmente utilizando PostgreSQL, Redis, API, workers, scheduler e build de produção.

---

## 📄 Licença

Este projeto está disponível para fins de estudo, portfólio e evolução técnica.
