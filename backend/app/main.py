from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import auth, monitors, ws

app = FastAPI(title="Uptime SaaS API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(monitors.router, prefix="/api/v1")
app.include_router(ws.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
