import asyncio
import json

import redis.asyncio as aioredis
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.config import settings

router = APIRouter()


@router.websocket("/ws/incidents")
async def incidents_ws(websocket: WebSocket):
    await websocket.accept()
    redis = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    pubsub = redis.pubsub()
    await pubsub.subscribe("incidents")

    try:
        async for message in pubsub.listen():
            if message["type"] != "message":
                continue
            await websocket.send_text(json.dumps({"event": "incident", "data": message["data"]}))
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        await pubsub.unsubscribe("incidents")
        await pubsub.close()
        await redis.close()
