import re
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "Tarot" in data["app"]


def test_get_all_cards():
    response = client.get("/api/v1/cards")
    assert response.status_code == 200
    cards = response.json()
    assert len(cards) == 78, f"Expected 78 cards, got {len(cards)}"

    # Check structure of first card
    first = cards[0]
    assert "id" in first
    assert "name" in first
    assert "arcana" in first
    assert "suit" in first
    assert "upright" in first
    assert "reversed" in first
    assert "image_url" in first


def test_get_single_card():
    response = client.get("/api/v1/cards/major_0")
    assert response.status_code == 200
    card = response.json()
    assert card["name"] == "The Fool"
    assert card["image_url"] == "/cards/major_0.jpg"


def test_get_cards_filtered_by_arcana():
    # Major Arcana
    resp_major = client.get("/api/v1/cards?arcana=major")
    assert resp_major.status_code == 200
    major_cards = resp_major.json()
    assert len(major_cards) == 22
    assert all(c["arcana"] == "major" and c["suit"] is None for c in major_cards)

    # Minor Arcana
    resp_minor = client.get("/api/v1/cards?arcana=minor")
    assert resp_minor.status_code == 200
    minor_cards = resp_minor.json()
    assert len(minor_cards) == 56
    assert all(c["arcana"] == "minor" for c in minor_cards)


def test_get_cards_filtered_by_suit():
    for suit in ["cups", "pentacles", "swords", "wands"]:
        resp = client.get(f"/api/v1/cards?suit={suit}")
        assert resp.status_code == 200
        suit_cards = resp.json()
        assert len(suit_cards) == 14
        assert all(c["suit"] == suit for c in suit_cards)


def test_draw_spread_default():
    response = client.post("/api/v1/spread", json={"spread_type": "three_card", "count": 3})
    assert response.status_code == 200
    data = response.json()

    assert "spread_id" in data
    assert data["spread_type"] == "three_card"
    assert len(data["cards"]) == 3

    # Ensure all 3 drawn cards are unique
    card_ids = [c["id"] for c in data["cards"]]
    assert len(set(card_ids)) == 3

    # Check orientations and positions
    positions = [c["position"] for c in data["cards"]]
    assert positions == ["Past", "Present", "Future"]

    for c in data["cards"]:
        assert c["orientation"] in ["upright", "reversed"]
        assert len(c["meaning"]) > 0
        assert c["image_url"] is not None


def test_draw_spread_one_card():
    response = client.post("/api/v1/spread", json={"spread_type": "one_card", "count": 1})
    assert response.status_code == 200
    data = response.json()
    assert len(data["cards"]) == 1
    assert data["cards"][0]["position"] == "Card of the Day"


def test_draw_spread_celtic_cross():
    response = client.post("/api/v1/spread", json={"spread_type": "celtic_cross", "count": 10})
    assert response.status_code == 200
    data = response.json()
    assert len(data["cards"]) == 10
    card_ids = [c["id"] for c in data["cards"]]
    assert len(set(card_ids)) == 10


def test_draw_spread_situation_action_outcome():
    payload = {
        "spread_type": "three_card",
        "count": 3,
        "position_theme": "situation_action_outcome"
    }
    response = client.post("/api/v1/spread", json=payload)
    assert response.status_code == 200
    data = response.json()
    positions = [c["position"] for c in data["cards"]]
    assert positions == ["Situation", "Action", "Outcome"]


def test_interpret_spread():
    spread_resp = client.post("/api/v1/spread", json={"spread_type": "three_card", "count": 3})
    assert spread_resp.status_code == 200
    spread_data = spread_resp.json()

    interpret_payload = {
        "cards": spread_data["cards"],
        "user_question": "What energy surrounds my creative project this week?"
    }
    response = client.post("/api/v1/interpret", json=interpret_payload)
    assert response.status_code == 200
    data = response.json()

    assert "interpretation" in data
    assert "created_at" in data

    text = data["interpretation"]
    assert "**" in text

    sentences = [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]
    assert 3 <= len(sentences) <= 5, f"Expected 3 to 5 sentences, got {len(sentences)}: {text}"


def test_interpret_empty_cards_fails():
    response = client.post("/api/v1/interpret", json={"cards": []})
    assert response.status_code == 400


def test_auth_session():
    response = client.post("/api/v1/auth/session")
    assert response.status_code == 200
    data = response.json()
    assert "session_token" in data
    assert "user_id" in data


def test_history_crud_and_favorites():
    # 1. Create reading
    spread_resp = client.post("/api/v1/spread", json={"spread_type": "three_card", "count": 3})
    cards = spread_resp.json()["cards"]
    spread_id = spread_resp.json()["spread_id"]

    reading_payload = {
        "spread_id": spread_id,
        "spread_type": "three_card",
        "position_theme": "past_present_future",
        "question": "Will my test pass?",
        "cards": cards,
        "interpretation": "Your path is clear and focused.",
        "is_mock": True,
        "is_favorite": False
    }

    create_resp = client.post("/api/v1/history", json=reading_payload)
    assert create_resp.status_code == 200
    saved = create_resp.json()
    assert saved["spread_id"] == spread_id
    assert saved["is_favorite"] is False

    # 2. Toggle favorite
    fav_resp = client.patch(f"/api/v1/history/{spread_id}/favorite")
    assert fav_resp.status_code == 200
    assert fav_resp.json()["is_favorite"] is True

    # 3. Get history (filter by favorite)
    list_fav = client.get("/api/v1/history?is_favorite=true")
    assert list_fav.status_code == 200
    assert any(r["spread_id"] == spread_id for r in list_fav.json())

    # 4. Get single
    single = client.get(f"/api/v1/history/{spread_id}")
    assert single.status_code == 200
    assert single.json()["spread_id"] == spread_id

    # 5. Delete single
    del_resp = client.delete(f"/api/v1/history/{spread_id}")
    assert del_resp.status_code == 200


def test_user_settings():
    get_resp = client.get("/api/v1/settings")
    assert get_resp.status_code == 200
    settings = get_resp.json()
    assert "default_spread_type" in settings

    update_resp = client.put("/api/v1/settings", json={
        "default_spread_type": "one_card",
        "default_position_theme": "daily",
        "preferred_theme": "light"
    })
    assert update_resp.status_code == 200
    assert update_resp.json()["default_spread_type"] == "one_card"
