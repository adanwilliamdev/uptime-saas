# Uptime SaaS

Aplicação full-stack de monitoramento de uptime: cadastre endpoints HTTP, acompanhe status, latência e incidentes em tempo real.

- **Backend**: FastAPI + SQLAlchemy (async) + PostgreSQL + Redis + Taskiq (worker/scheduler) + WebSocket
- **Frontend**: Next.js 16 (App Router) + React 19 + TanStack Query + Tailwind CSS

---

## Arquitetura

```
┌─────────────┐      REST + WS       ┌──────────────┐
│   Frontend   │ ───────────────────▶ │   FastAPI     │
│  (Next.js)   │ ◀─────────────────── │   Backend     │
└─────────────┘                       └──────┬───────┘
                                              │
                         ┌────────────────────┼───────────────────┐
                         ▼                    ▼                   ▼
                  ┌─────────────┐      ┌─────────────┐    ┌──────────────┐
                  │ PostgreSQL  │      │    Redis    │    │   Scheduler   │
                  │  (dados)    │      │ (fila+pubsub)│───▶│  + Worker     │
                  └─────────────┘      └─────────────┘    │  (Taskiq)     │
                                                            └──────┬───────┘
                                                                   │
                                                          faz ping HTTP nos
                                                          monitores ativos
```

O **scheduler** varre os monitores ativos a cada 10s e enfileira uma task `check_endpoint` por monitor. O **worker** (Taskiq) consome a fila, faz a requisição HTTP, grava o resultado em `ping_logs`, abre/fecha `incidents` conforme o status, e publica eventos no canal Redis `incidents`. O endpoint `/ws/incidents` repassa esses eventos ao frontend em tempo real.

---

## Estrutura do projeto

```
uptime-saas/
├── backend/
│   ├── app/
│   │   ├── api/v1/        # rotas (auth, monitors, websocket)
│   │   ├── core/          # config e segurança (JWT, hash de senha)
│   │   ├── db/            # engine/sessão SQLAlchemy async
│   │   ├── models/        # modelos ORM (User, Monitor, PingLog, Incident)
│   │   ├── schemas/       # schemas Pydantic
│   │   ├── services/      # regras de negócio (auth)
│   │   └── workers/       # broker, tasks e scheduler (Taskiq)
│   ├── alembic/           # migrations
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/           # páginas (App Router)
│   │   ├── components/ui/ # componentes de UI reutilizáveis
│   │   ├── hooks/         # hooks de dados (React Query)
│   │   ├── lib/           # cliente axios, utils
│   │   └── types/         # tipos TypeScript compartilhados
│   └── package.json
├── infra/
│   └── docker-compose.yml # Postgres + Redis
└── setup.ps1               # bootstrap automatizado (Windows/PowerShell)
```

---

## Pré-requisitos

- Python 3.12+
- Node.js 20+ e npm
- Docker (para Postgres/Redis) — ou instalações locais equivalentes
- Windows + PowerShell, caso use o `setup.ps1` (em Linux/macOS, siga os passos manuais abaixo)

---

## Como rodar

> Os comandos abaixo assumem que você está na raiz do projeto (a pasta `uptime-saas/`, que contém `backend/`, `frontend/` e `infra/`). Sempre que um passo pedir para voltar à raiz, use `cd ..` antes de entrar na próxima pasta — pular esse passo é a causa mais comum de erros como `cd : não é possível localizar o caminho` ou `pip install` falhando por "arquivo não encontrado".

### 1. Suba a infraestrutura (Postgres + Redis)

```bash
cd infra
docker compose up -d
cd ..
```

### 2. Backend

**macOS / Linux (bash/zsh):**

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
cd ..
```

**Windows (PowerShell):**

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
cd ..
```

Se o PowerShell bloquear a ativação do venv com um erro de política de execução, rode uma vez (na mesma sessão do terminal):

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

⚠️ **Confirme que o venv foi realmente ativado** antes de rodar `pip install`: o prompt do terminal deve passar a mostrar `(.venv)` no início da linha. Se a ativação falhar silenciosamente (ou você pular esse passo) e você rodar `pip install -r requirements.txt` mesmo assim, o `pip` vai instalar tudo no **Python global da sua máquina**, podendo rebaixar/alterar versões de pacotes usados por outros projetos seus (ex.: `fastapi`, `pydantic`, `httpx`, `alembic`). Se isso já aconteceu, reative o venv corretamente e reinstale ali; para restaurar o ambiente global, rode `pip install --upgrade` nos pacotes/projetos afetados para que o `pip` resolva versões compatíveis novamente.

Abra um **novo terminal** (com o venv ativado, repetindo a ativação acima) para o worker, e outro para o scheduler:

```bash
taskiq worker app.workers.broker:broker app.workers.tasks
```

```bash
python -m app.workers.scheduler
```

A API fica disponível em `http://localhost:8000` (docs interativas em `/docs`).

### 3. Frontend

Em outro terminal, a partir da raiz do projeto:

```bash
cd frontend
npm install
npm run dev
cd ..
```

A aplicação fica disponível em `http://localhost:3000`.

### Windows: script automatizado

O arquivo `setup.ps1` na raiz do projeto executa todos os passos acima (infra, backend, worker, scheduler e frontend) de uma vez, já com os comandos corretos para PowerShell:

```powershell
.\setup.ps1
```

---

## Variáveis de ambiente

**`backend/.env`**

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | string de conexão async do Postgres (`postgresql+asyncpg://...`) |
| `REDIS_URL` | string de conexão do Redis |
| `SECRET_KEY` | chave usada para assinar os tokens JWT — **troque em produção** |
| `ALGORITHM` | algoritmo do JWT (padrão `HS256`) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | validade do token de acesso |

**`frontend/.env.local`**

| Variável | Descrição |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL base da API consumida pelo frontend |

---

## Principais endpoints da API

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/v1/auth/register` | Cria um usuário |
| POST | `/api/v1/auth/login` | Autentica e retorna um JWT |
| GET | `/api/v1/auth/me` | Retorna o usuário autenticado |
| GET | `/api/v1/monitors` | Lista os monitores do usuário |
| POST | `/api/v1/monitors` | Cria um monitor |
| PATCH | `/api/v1/monitors/{id}` | Atualiza um monitor |
| DELETE | `/api/v1/monitors/{id}` | Remove um monitor |
| GET | `/api/v1/monitors/{id}/logs` | Histórico de checagens (ping logs) |
| GET | `/api/v1/monitors/{id}/uptime` | Percentual de uptime e latência média |
| WS | `/ws/incidents` | Stream em tempo real de eventos de incidente |

---

## Testes realizados e correções aplicadas

O projeto foi validado de ponta a ponta (Postgres + Redis reais, API rodando, worker executado manualmente, build de produção do frontend). Os seguintes problemas foram encontrados e corrigidos:

### 1. Migration inicial ausente (banco de dados vazio)
Não existia nenhum arquivo em `alembic/versions/`, então `alembic upgrade head` não criava nenhuma tabela — a aplicação subia, mas qualquer chamada ao banco falhava. **Correção:** gerada a migration inicial (`initial schema`) cobrindo `users`, `monitors`, `ping_logs` e `incidents`.

### 2. Incompatibilidade `passlib` × `bcrypt` (registro/login quebrados)
`requirements.txt` fixava `passlib[bcrypt]==1.7.4` mas não fixava a versão do `bcrypt`. O `pip` instalava a versão mais recente (5.x), incompatível com a detecção interna do `passlib`, causando erro 500 em **qualquer** cadastro ou login (`ValueError: password cannot be longer than 72 bytes`). **Correção:** fixada a versão `bcrypt==4.0.1`, compatível com `passlib==1.7.4`.

### 3. `HttpUrl` do Pydantic quebrando criação/edição de monitores
`MonitorCreate.url`/`MonitorUpdate.url` usam o tipo `HttpUrl` do Pydantic. Ao repassar `model_dump()` direto para o modelo SQLAlchemy, o valor ia como objeto `Url` (não `str`), e o driver `asyncpg` rejeitava a query (`DataError: expected str, got Url`), quebrando `POST` e `PATCH /monitors`. **Correção:** a URL agora é convertida explicitamente para `str` antes de ser persistida.

### 4. Componente `Input` do frontend corrompido
`frontend/src/components/ui/input.tsx` continha, no lugar do componente React, o texto literal `System.Collections.ArrayList+ArrayListEnumeratorSimple` — um artefato de um bug no script `setup.ps1` (provável `Get-Content`/junção de array mal feita ao gerar arquivos). Isso quebrava a página inteira, já que o componente é usado no dashboard. **Correção:** componente `Input` recriado seguindo o mesmo padrão dos demais componentes de UI do projeto (`Button`, `Card`, `Label`).

### 5. BOM (Byte Order Mark) no início de praticamente todos os arquivos
Quase todo o código-fonte (Python e TypeScript/CSS) tinha um BOM UTF-8 (`\ufeff`) no início do arquivo — outro efeito colateral da geração via PowerShell. Na maioria das linguagens isso passa despercebido, mas em `globals.css` ele quebrava o build do Next.js (Turbopack não consegue parsear CSS com BOM): `Error: Parsing CSS source code failed`. **Correção:** BOM removido de todos os arquivos do projeto (30 arquivos afetados).

### 6. Dependências do frontend com vulnerabilidade crítica (CVE-2025-66478 / CVE-2025-55182)
O projeto fixava `next@16.0.0` e `react`/`react-dom@19.0.0`, versões afetadas por uma vulnerabilidade crítica (CVSS 10.0) de execução remota de código no protocolo de React Server Components, com exploração confirmada. **Correção:** atualizado para `next@^16.0.7` e `react`/`react-dom@^19.2.1` (e `@types/*` correspondentes) — versões com o patch de segurança. Após a atualização, `npm audit` não reporta mais vulnerabilidades.

### 7. `asyncpg` incompatível com o event loop padrão do Windows
No Windows, o `asyncio` usa por padrão o `ProactorEventLoop`, que não é totalmente suportado pelo `asyncpg`. Isso causava falhas intermitentes de conexão logo no `alembic upgrade head` (e afetaria a API e os workers da mesma forma), com erros como `ConnectionDoesNotExistError: connection was closed in the middle of operation` e `OSError: [WinError 64] O nome da rede especificado não está mais disponível`. **Correção:** ao rodar no Windows, o projeto agora força o uso do `WindowsSelectorEventLoopPolicy` (recomendação oficial do próprio `asyncpg`) em `app/db/session.py` e `alembic/env.py`.

### 8. `localhost` resolvendo para IPv6 no Windows ("localhost trap")
Mesmo depois da correção acima, a conexão com o Postgres ainda podia falhar no Windows com `ConnectionResetError: [WinError 10054]`. Causa: no Windows, `localhost` é dual-stack e o sistema tenta `::1` (IPv6) primeiro; o Docker Desktop publica a porta do Postgres apenas em IPv4, então a tentativa IPv6 é recusada/resetada antes de cair para IPv4. **Correção:** `DATABASE_URL`/`REDIS_URL` em `backend/.env` agora usam `127.0.0.1` em vez de `localhost`, e `infra/docker-compose.yml` publica as portas explicitamente em `127.0.0.1` (`"127.0.0.1:5432:5432"` e `"127.0.0.1:6379:6379"`), eliminando a ambiguidade IPv4/IPv6 por completo.

### 9. Acentos corrompidos na saída do `setup.ps1` (mojibake)
Depois de remover o BOM de todos os arquivos do projeto para corrigir o `globals.css` (item 5), os textos acentuados do `setup.ps1` passaram a aparecer corrompidos no console (`dependÃªncias` em vez de `dependências`). Causa: o Windows PowerShell 5.1 (diferente do PowerShell 7+) só interpreta um `.ps1` como UTF-8 se o arquivo tiver o BOM; sem ele, usa a codepage padrão do sistema. **Correção:** o BOM foi restaurado especificamente em `setup.ps1` (mantendo-o removido dos demais arquivos, onde ele causava problemas).

### Fluxo validado após as correções
- Registro, login e `/auth/me` ✅
- CRUD completo de monitores (criar, listar, atualizar, remover) ✅
- Histórico de checagens (`/logs`) e estatísticas de uptime (`/uptime`) ✅
- Execução da task de checagem (`check_endpoint`): grava ping, abre e fecha incidentes corretamente ✅
- WebSocket `/ws/incidents` recebendo eventos publicados via Redis pub/sub ✅
- Build de produção do frontend (`next build`) e renderização do dashboard ✅

---

## Observações e possíveis melhorias futuras

- O card "Fora do Ar" no dashboard hoje conta monitores com `is_active = false` (monitoramento pausado), não monitores que estão de fato **fora do ar** no momento — vale considerar usar o status mais recente de `ping_logs`/`incidents` abertos para refletir isso com mais precisão.
- Não há testes automatizados no diretório `backend/tests` — os testes desta rodada foram feitos manualmente contra uma instância real (Postgres + Redis). Recomenda-se adicionar testes com `pytest` + `httpx.AsyncClient` cobrindo os fluxos de auth e monitores.
- Não existem páginas de login/registro no frontend; o interceptor do axios já redireciona para `/login` em caso de 401, mas essa rota ainda precisa ser criada.
