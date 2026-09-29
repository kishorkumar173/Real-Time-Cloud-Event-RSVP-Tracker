import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.config import settings
from backend.database import engine, Base
from backend.routes import (
    auth_router, event_router, rsvp_router,
    announcement_router, analytics_router, notification_router
)
from realtime.realtime_service import manager
from cloud.database_service import CloudDatabaseService

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("rsvp_backend")

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(event_router)
app.include_router(rsvp_router)
app.include_router(announcement_router)
app.include_router(analytics_router)
app.include_router(notification_router)

@app.get("/api/health", tags=["Monitoring"])
def health_check():
    return {"status": "UP", "service": settings.PROJECT_NAME, "version": settings.VERSION, "cloud_database": CloudDatabaseService.health_check()}

@app.websocket("/ws/events/{event_id}")
async def event_websocket_endpoint(websocket: WebSocket, event_id: str):
    await manager.connect_event(websocket, event_id)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect_event(websocket, event_id)

frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("backend.app:app", host="0.0.0.0", port=port, reload=True)

