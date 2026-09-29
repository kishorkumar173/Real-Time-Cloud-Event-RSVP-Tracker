import json
import logging
from typing import Dict, List
from fastapi import WebSocket

logger = logging.getLogger("realtime_service")

class ConnectionManager:
    def __init__(self):
        self.active_event_connections: Dict[str, List[WebSocket]] = {}
        self.global_connections: List[WebSocket] = []

    async def connect_event(self, websocket: WebSocket, event_id: str):
        await websocket.accept()
        if event_id not in self.active_event_connections:
            self.active_event_connections[event_id] = []
        self.active_event_connections[event_id].append(websocket)

    def disconnect_event(self, websocket: WebSocket, event_id: str):
        if event_id in self.active_event_connections:
            if websocket in self.active_event_connections[event_id]:
                self.active_event_connections[event_id].remove(websocket)
            if not self.active_event_connections[event_id]:
                del self.active_event_connections[event_id]

    async def connect_global(self, websocket: WebSocket):
        await websocket.accept()
        self.global_connections.append(websocket)

    def disconnect_global(self, websocket: WebSocket):
        if websocket in self.global_connections:
            self.global_connections.remove(websocket)

    async def broadcast_to_event(self, event_id: str, message: dict):
        payload = json.dumps(message)
        if event_id in self.active_event_connections:
            dead_sockets = []
            for connection in self.active_event_connections[event_id]:
                try:
                    await connection.send_text(payload)
                except Exception:
                    dead_sockets.append(connection)
            for dead in dead_sockets:
                self.disconnect_event(dead, event_id)

manager = ConnectionManager()
