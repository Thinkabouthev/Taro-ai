import json
import random
import uuid
from typing import Optional
from pathlib import Path
from app.core.config import settings
from app.models.schemas import Card, SpreadCard, SpreadResponse

CELTIC_CROSS_POSITIONS = [
    "The Present",
    "The Challenge",
    "The Past",
    "The Future",
    "Above (Aspirations)",
    "Below (Subconscious)",
    "Advice (Inner Power)",
    "External Environment",
    "Hopes and Fears",
    "Outcome"
]


class TarotService:
    def __init__(self, data_path: Optional[Path] = None):
        self.data_path = data_path or settings.CARDS_DATA_PATH
        self._cards: list[Card] = []
        self._load_cards()

    def _load_cards(self):
        candidates = [
            self.data_path,
            Path(__file__).resolve().parent.parent.parent.parent / "parser" / "cards.json",
            Path(__file__).resolve().parent.parent / "data" / "cards.json",
            Path("parser/cards.json"),
            Path("app/data/cards.json")
        ]

        found_path = None
        for p in candidates:
            if p and Path(p).exists():
                found_path = Path(p)
                break

        if not found_path:
            raise FileNotFoundError(f"Tarot cards data file not found among candidates: {candidates}")

        with open(found_path, "r", encoding="utf-8") as f:
            raw_data = json.load(f)
            if isinstance(raw_data, dict) and "cards" in raw_data:
                raw_data = raw_data["cards"]
            
            # Ensure image_url is populated for all cards
            for item in raw_data:
                if not item.get("image_url"):
                    item["image_url"] = f"/cards/{item['id']}.jpg"
            
            self._cards = [Card(**item) for item in raw_data]

    def get_cards(self, arcana: Optional[str] = None, suit: Optional[str] = None) -> list[Card]:
        filtered = self._cards
        if arcana:
            filtered = [c for c in filtered if c.arcana.lower() == arcana.lower()]
        if suit:
            filtered = [c for c in filtered if c.suit and c.suit.lower() == suit.lower()]
        return filtered

    def get_card_by_id(self, card_id: str) -> Optional[Card]:
        for c in self._cards:
            if c.id == card_id:
                return c
        return None

    def draw_spread(
        self,
        spread_type: str = "three_card",
        count: int = 3,
        position_theme: str = "past_present_future"
    ) -> SpreadResponse:
        # Determine actual count based on spread type
        if spread_type == "one_card":
            count = 1
        elif spread_type == "celtic_cross":
            count = 10
        elif spread_type == "three_card":
            count = 3

        if count > len(self._cards):
            raise ValueError(f"Requested count {count} exceeds deck size {len(self._cards)}")

        # Position labeling logic
        if count == 1:
            positions = ["Card of the Day"]
        elif count == 10 or spread_type == "celtic_cross":
            positions = CELTIC_CROSS_POSITIONS
        elif position_theme == "situation_action_outcome":
            positions = ["Situation", "Action", "Outcome"]
        else:
            positions = ["Past", "Present", "Future"]

        # Sample cards without replacement
        drawn_raw = random.sample(self._cards, count)
        drawn_cards: list[SpreadCard] = []

        for idx, card in enumerate(drawn_raw):
            orientation = random.choice(["upright", "reversed"])
            meaning = card.upright if orientation == "upright" else card.reversed
            pos_label = positions[idx] if idx < len(positions) else f"Position {idx + 1}"

            drawn_cards.append(SpreadCard(
                id=card.id,
                name=card.name,
                orientation=orientation,
                meaning=meaning,
                position=pos_label,
                image_url=card.image_url or f"/cards/{card.id}.jpg"
            ))

        return SpreadResponse(
            spread_id=str(uuid.uuid4()),
            spread_type=spread_type,
            cards=drawn_cards
        )


tarot_service = TarotService()
