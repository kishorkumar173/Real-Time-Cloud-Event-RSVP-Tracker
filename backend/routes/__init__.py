from backend.routes.auth_routes import router as auth_router
from backend.routes.event_routes import router as event_router
from backend.routes.rsvp_routes import router as rsvp_router
from backend.routes.announcement_routes import router as announcement_router
from backend.routes.analytics_routes import router as analytics_router
from backend.routes.notification_routes import router as notification_router

__all__ = ["auth_router", "event_router", "rsvp_router", "announcement_router", "analytics_router", "notification_router"]
