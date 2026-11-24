from typing import Optional, Literal
from pydantic import BaseModel, Field


class Card(BaseModel):
    id: str
    name: str
    arcana: Literal["major", "minor"]
    suit: Optional[Literal["cups", "pentacles", "swords", "wands"]] = None
    upright: str
    reversed: str
    image_url: Optional[str] = None


class SpreadCard(BaseModel):
    id: str
    name: str
    orientation: Literal["upright", "reversed"]
    meaning: str
    position: str
    image_url: Optional[str] = None


class SpreadRequest(BaseModel):
    spread_type: str = Field(default="three_card", description="Spread type: 'one_card', 'three_card', 'celtic_cross'")
    count: int = Field(default=3, ge=1, le=10, description="Number of cards to draw")
    position_theme: Optional[Literal["past_present_future", "situation_action_outcome", "celtic_cross", "daily"]] = "past_present_future"


class SpreadResponse(BaseModel):
    spread_id: str
    spread_type: str
    cards: list[SpreadCard]


class InterpretRequest(BaseModel):
    cards: list[SpreadCard]
    user_question: Optional[str] = None


class InterpretResponse(BaseModel):
    interpretation: str
    created_at: str
    is_mock: bool = False


# Non-AI feature schemas: Auth, History, Settings

class UserSession(BaseModel):
    session_token: str
    user_id: str
    created_at: str


class ReadingCreate(BaseModel):
    spread_id: str
    spread_type: str = "three_card"
    position_theme: Optional[str] = "past_present_future"
    question: Optional[str] = ""
    cards: list[SpreadCard]
    interpretation: str
    is_mock: bool = False
    is_favorite: bool = False


class ReadingResponse(BaseModel):
    id: int
    spread_id: str
    user_id: str
    spread_type: str
    position_theme: Optional[str]
    question: Optional[str]
    cards: list[SpreadCard]
    interpretation: str
    is_mock: bool
    is_favorite: bool
    created_at: str


class FavoriteToggleRequest(BaseModel):
    is_favorite: Optional[bool] = None


class UserSettings(BaseModel):
    default_spread_type: str = "three_card"
    default_position_theme: str = "past_present_future"
    preferred_theme: str = "light"
