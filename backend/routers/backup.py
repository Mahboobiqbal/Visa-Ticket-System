import os
import shutil
from datetime import datetime
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from auth import get_current_user

router = APIRouter(prefix="/api/backup", tags=["backup"])

DB_PATH = "visa_system.db"


@router.get("/export")
def export_database(user=Depends(get_current_user)):
    if not os.path.exists(DB_PATH):
        raise HTTPException(status_code=404, detail="Database file not found")

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"visa_backup_{timestamp}.db"

    return FileResponse(
        path=DB_PATH,
        filename=filename,
        media_type="application/octet-stream",
    )


@router.post("/import")
def import_database(file: UploadFile = File(...), user=Depends(get_current_user)):
    if not file.filename.endswith(".db"):
        raise HTTPException(status_code=400, detail="Only .db files are allowed")

    backup_path = f"{DB_PATH}.backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

    if os.path.exists(DB_PATH):
        shutil.copy2(DB_PATH, backup_path)

    try:
        with open(DB_PATH, "wb") as f:
            content = file.file.read()
            f.write(content)

        file_size = os.path.getsize(DB_PATH)
        if file_size < 100:
            raise Exception("File too small, likely corrupt")

        from database import engine
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("SELECT count(*) FROM users"))

        return {
            "detail": "Database imported successfully",
            "old_backup": backup_path,
            "size": file_size,
        }
    except Exception as e:
        if os.path.exists(backup_path):
            shutil.copy2(backup_path, DB_PATH)
        raise HTTPException(status_code=400, detail=f"Import failed: {str(e)}")


@router.get("/stats")
def backup_stats(user=Depends(get_current_user)):
    from database import get_db
    from models import Agent, TicketBooking, VisaProcessing, CashOut, Settings, User
    db = next(get_db())

    db_size = os.path.getsize(DB_PATH) if os.path.exists(DB_PATH) else 0

    backups = []
    for f in os.listdir("."):
        if f.startswith("visa_system.db.backup_"):
            fsize = os.path.getsize(f)
            ftime = os.path.getmtime(f)
            backups.append({
                "filename": f,
                "size": fsize,
                "date": datetime.fromtimestamp(ftime).isoformat(),
            })
    backups.sort(key=lambda x: x["date"], reverse=True)

    return {
        "db_size": db_size,
        "db_size_formatted": f"{db_size / 1024:.1f} KB" if db_size < 1024*1024 else f"{db_size / (1024*1024):.1f} MB",
        "records": {
            "users": db.query(User).count(),
            "agents": db.query(Agent).count(),
            "tickets": db.query(TicketBooking).count(),
            "visas": db.query(VisaProcessing).count(),
            "cashouts": db.query(CashOut).count(),
            "settings": db.query(Settings).count(),
        },
        "backups": backups,
    }
