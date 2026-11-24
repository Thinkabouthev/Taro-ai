from typing import Optional
from fastapi import APIRouter, Query, HTTPException, Header, Depends
from app.models.schemas import (
    Card,
    SpreadRequest,
    SpreadResponse,
    InterpretRequest,
    InterpretResponse,
    UserSession,
    ReadingCreate,
    ReadingResponse,
    FavoriteToggleRequest,
    UserSettings
)
from app.services.tarot_service import tarot_service
from app.services.ai_service import ai_service
from app.db.database import db

router = APIRouter()


def get_current_user_id(x_session_token: Optional[str] = Header(None, alias="X-Session-Token")) -> str:
    user = db.get_or_create_user(session_token=x_session_token)
    return user["user_id"]


# ==========================================
# 1. TAROT CARDS & SPREADS
# ==========================================

@router.get("/cards", response_model=list[Card], summary="Get all 78 tarot cards or filter by arcana/suit")
async def get_cards(
    arcana: Optional[str] = Query(None, description="Filter by arcana: 'major' or 'minor'"),
    suit: Optional[str] = Query(None, description="Filter by suit: 'cups', 'pentacles', 'swords', 'wands'")
):
    try:
        return tarot_service.get_cards(arcana=arcana, suit=suit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch cards: {str(e)}")


@router.get("/cards/{card_id}", response_model=Card, summary="Get details and image for a single tarot card")
async def get_card_by_id(card_id: str):
    card = tarot_service.get_card_by_id(card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    return card


@router.post("/spread", response_model=SpreadResponse, summary="Draw a random tarot spread without replacement")
async def create_spread(request: SpreadRequest = SpreadRequest()):
    try:
        return tarot_service.draw_spread(
            spread_type=request.spread_type,
            count=request.count,
            position_theme=request.position_theme or "past_present_future"
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to draw spread: {str(e)}")


@router.post("/interpret", response_model=InterpretResponse, summary="Generate an empathetic AI interpretation for a spread")
async def interpret_spread(request: InterpretRequest):
    if not request.cards:
        raise HTTPException(status_code=400, detail="Cards array cannot be empty")
    try:
        return await ai_service.interpret_spread(
            cards=request.cards,
            user_question=request.user_question
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Interpretation failed: {str(e)}")


# ==========================================
# 2. USER AUTHENTICATION / SESSIONS
# ==========================================

@router.post("/auth/session", response_model=UserSession, summary="Create or retrieve user session")
async def create_session(x_session_token: Optional[str] = Header(None, alias="X-Session-Token")):
    user = db.get_or_create_user(session_token=x_session_token)
    return UserSession(
        session_token=user["session_token"],
        user_id=user["user_id"],
        created_at=user["created_at"]
    )


@router.get("/auth/me", response_model=UserSession, summary="Get current session identity")
async def get_me(x_session_token: Optional[str] = Header(None, alias="X-Session-Token")):
    user = db.get_or_create_user(session_token=x_session_token)
    return UserSession(
        session_token=user["session_token"],
        user_id=user["user_id"],
        created_at=user["created_at"]
    )


# ==========================================
# 3. READING HISTORY & SAVED SPREADS
# ==========================================

@router.get("/history", response_model=list[ReadingResponse], summary="Get reading history for current user")
async def get_history(
    spread_type: Optional[str] = Query(None, description="Filter by spread type: 'one_card', 'three_card', 'celtic_cross'"),
    is_favorite: Optional[bool] = Query(None, description="Filter by favorite status"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user_id: str = Depends(get_current_user_id)
):
    try:
        return db.get_readings(
            user_id=user_id,
            spread_type=spread_type,
            is_favorite=is_favorite,
            limit=limit,
            offset=offset
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch history: {str(e)}")


@router.post("/history", response_model=ReadingResponse, summary="Save a new reading to database")
async def save_reading(
    reading: ReadingCreate,
    user_id: str = Depends(get_current_user_id)
):
    try:
        saved = db.save_reading(reading.model_dump(), user_id=user_id)
        return saved
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save reading: {str(e)}")


@router.get("/history/{spread_id}", response_model=ReadingResponse, summary="Get single reading by spread ID")
async def get_single_reading(spread_id: str):
    reading = db.get_reading(spread_id)
    if not reading:
        raise HTTPException(status_code=404, detail="Reading not found")
    return reading


@router.delete("/history/{spread_id}", summary="Delete single reading")
async def delete_reading(
    spread_id: str,
    user_id: str = Depends(get_current_user_id)
):
    deleted = db.delete_reading(spread_id=spread_id, user_id=user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Reading not found")
    return {"status": "deleted", "spread_id": spread_id}


@router.delete("/history", summary="Clear all history for user")
async def clear_history(user_id: str = Depends(get_current_user_id)):
    count = db.clear_readings(user_id=user_id)
    return {"status": "cleared", "deleted_count": count}


@router.patch("/history/{spread_id}/favorite", summary="Toggle or set favorite status for a reading")
async def toggle_favorite(
    spread_id: str,
    req: FavoriteToggleRequest = FavoriteToggleRequest(),
    user_id: str = Depends(get_current_user_id)
):
    new_status = db.toggle_favorite(spread_id=spread_id, user_id=user_id, is_favorite=req.is_favorite)
    return {"spread_id": spread_id, "is_favorite": new_status}


# ==========================================
# 4. USER SETTINGS
# ==========================================

@router.get("/settings", response_model=UserSettings, summary="Get user settings")
async def get_settings(user_id: str = Depends(get_current_user_id)):
    settings_data = db.get_settings(user_id)
    return UserSettings(**settings_data)


@router.put("/settings", response_model=UserSettings, summary="Update user settings")
async def update_settings(
    settings_req: UserSettings,
    user_id: str = Depends(get_current_user_id)
):
    saved = db.update_settings(user_id, settings_req.model_dump())
    return UserSettings(**saved)
