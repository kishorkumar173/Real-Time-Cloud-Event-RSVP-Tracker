import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from backend.config import settings
from backend.database import engine, Base
from backend.routes import (
    auth_router, event_router, rsvp_router,
    announcement_router, analytics_router, notification_router
)
from realtime.realtime_service import manager
from cloud.database_service import CloudDatabaseService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("rsvp_backend")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure cloud database schema exists
    logger.info("Initializing Cloud Event RSVP database schema...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database initialized successfully.")
    yield
    # Shutdown
    logger.info("Application shutting down.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Real-Time Cloud-Based Event Planning & RSVP Tracker API with WebSockets and ACID Concurrency",
    lifespan=lifespan
)

# CORS configuration for cloud / local frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount REST API Routers
app.include_router(auth_router)
app.include_router(event_router)
app.include_router(rsvp_router)
app.include_router(announcement_router)
app.include_router(analytics_router)
app.include_router(notification_router)

# Health & Cloud Monitoring Endpoint
@app.get("/api/health", tags=["Monitoring"])
def health_check():
    db_health = CloudDatabaseService.health_check()
    return {
        "status": "UP",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "cloud_database": db_health
    }

# ----------------- Real-Time WebSocket Endpoints -----------------
@app.websocket("/ws/events/{event_id}")
async def event_websocket_endpoint(websocket: WebSocket, event_id: str):
    await manager.connect_event(websocket, event_id)
    try:
        while True:
            # Keep socket open and receive any incoming ping/pong or client action
            data = await websocket.receive_text()
            # If client sends a ping or echo
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect_event(websocket, event_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect_event(websocket, event_id)

@app.websocket("/ws/global")
async def global_websocket_endpoint(websocket: WebSocket):
    await manager.connect_global(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect_global(websocket)
    except Exception as e:
        logger.error(f"Global WebSocket error: {e}")
        manager.disconnect_global(websocket)

# Mount Frontend static files for 1-command unified hosting (fallback to UI)
import os
from fastapi.staticfiles import StaticFiles

frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="static")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app:app", host="0.0.0.0", port=8000, reload=True)
