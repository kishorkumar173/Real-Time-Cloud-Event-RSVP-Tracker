import json
import logging
from typing import Dict, List
from fastapi import WebSocket

logger = logging.getLogger("realtime_service")

class ConnectionManager:
    def __init__(self):
        # Maps event_id -> List of active WebSocket connections
        self.active_event_connections: Dict[str, List[WebSocket]] = {}
        # Global connections (e.g. for organizer top-level stream or admin)
        self.global_connections: List[WebSocket] = []

    async def connect_event(self, websocket: WebSocket, event_id: str):
        await websocket.accept()
        if event_id not in self.active_event_connections:
            self.active_event_connections[event_id] = []
        self.active_event_connections[event_id].append(websocket)
        logger.info(f"WebSocket client connected to event: {event_id}. Total: {len(self.active_event_connections[event_id])}")

    def disconnect_event(self, websocket: WebSocket, event_id: str):
        if event_id in self.active_event_connections:
            if websocket in self.active_event_connections[event_id]:
                self.active_event_connections[event_id].remove(websocket)
                logger.info(f"WebSocket client disconnected from event: {event_id}. Remaining: {len(self.active_event_connections[event_id])}")
            if not self.active_event_connections[event_id]:
                del self.active_event_connections[event_id]

    async def connect_global(self, websocket: WebSocket):
        await websocket.accept()
        self.global_connections.append(websocket)
        logger.info(f"Global WebSocket client connected. Total: {len(self.global_connections)}")

    def disconnect_global(self, websocket: WebSocket):
        if websocket in self.global_connections:
            self.global_connections.remove(websocket)
            logger.info(f"Global WebSocket client disconnected. Remaining: {len(self.global_connections)}")

    async def broadcast_to_event(self, event_id: str, message: dict):
        payload = json.dumps(message)
        # Broadcast to specific event listeners
        if event_id in self.active_event_connections:
            dead_sockets = []
            for connection in self.active_event_connections[event_id]:
                try:
                    await connection.send_text(payload)
                except Exception as e:
                    logger.warning(f"Error sending message to websocket: {e}")
                    dead_sockets.append(connection)
            for dead in dead_sockets:
                self.disconnect_event(dead, event_id)

        # Also broadcast to global listeners (e.g. organizer multi-event overview)
        dead_global = []
        for connection in self.global_connections:
            try:
                await connection.send_text(payload)
            except Exception as e:
                logger.warning(f"Error sending to global websocket: {e}")
                dead_global.append(connection)
        for dead in dead_global:
            self.disconnect_global(dead)

manager = ConnectionManager()
