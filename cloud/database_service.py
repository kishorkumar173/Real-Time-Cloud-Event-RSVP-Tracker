from sqlalchemy import text
from sqlalchemy.orm import Session
from backend.database import engine

class CloudDatabaseService:
    @staticmethod
    def health_check():
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return {"status": "HEALTHY", "engine": engine.name, "cloud_ready": True}
        except Exception as e:
            return {"status": "UNHEALTHY", "error": str(e), "cloud_ready": False}

    @staticmethod
    def log_audit(db: Session, action: str, entity: str, entity_id: str, user_id: str = None, details: str = None):
        from backend.models.db_models import AuditLog
        audit = AuditLog(action=action, entity=entity, entity_id=entity_id, user_id=user_id, details=details)
        db.add(audit)
        db.commit()
