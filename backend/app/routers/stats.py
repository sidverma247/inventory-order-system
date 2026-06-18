from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..config import get_settings
from ..database import get_db

router = APIRouter(prefix="/stats", tags=["dashboard"])


@router.get("", response_model=schemas.StatsOut)
def get_stats(db: Session = Depends(get_db)):
    settings = get_settings()
    return crud.stats(db, settings.low_stock_threshold)
