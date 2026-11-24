# Tarot AI App (Team 14) — MVP

A minimalist Progressive Web App (PWA) that allows users to perform random tarot spreads, receive AI-generated personalized interpretations in Markdown, and save their history locally.

## Features
- **3-Card Spreads**: Choose between *Past / Present / Future* and *Situation / Action / Outcome*.
- **Accurate 78-Card Deck**: Full Rider-Waite deck (22 Major Arcana and 56 Minor Arcana across Cups, Pentacles, Swords, and Wands) with traditional upright and reversed meanings.
- **AI-Powered Interpretation**:
  - Strictly **3 to 5 sentences**.
  - Empathetic, intuitive, and constructive guidance.
  - Key takeaways highlighted with clean Markdown bolding.
  - Fast response (&lt; 10s latency).
  - Built-in resilient fallback for offline or development mode without API keys.
- **Local History**: Anonymous sessions with client-side `localStorage` storing up to 50 previous spreads.
- **78-Card Encyclopedia**: Browse all cards, filter by Arcana and Suit, and inspect individual meanings.
- **PWA & Responsive**: Optimized for desktop and mobile screens with dark mystical aesthetic.

---

## Tech Stack
- **Backend**: FastAPI, Pydantic v2, HTTPX, Python-dotenv, Uvicorn
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, React Markdown
- **AI Models**: Google Gemini API (`GEMINI_API_KEY`) with fallback mock oracle

---

## Getting Started

### 1. Backend Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# (Optional) Add your Gemini API key to .env
cp .env.example .env
# Edit .env and set GEMINI_API_KEY=your_key_here

# Run the backend API server
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://127.0.0.1:8000`.
Interactive Swagger API docs: `http://127.0.0.1:8000/docs`

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## API Endpoints Architecture

### `GET /api/v1/cards`
Returns all 78 tarot cards or filters by query parameters.
- Query params: `arcana` (`major` | `minor`), `suit` (`cups` | `pentacles` | `swords` | `wands`)

### `POST /api/v1/spread`
Draws $N$ random cards without replacement and assigns orientation (`upright` or `reversed`).
- Request body:
  ```json
  {
    "spread_type": "three_card",
    "count": 3,
    "position_theme": "past_present_future"
  }
  ```

### `POST /api/v1/interpret`
Generates empathetic 3–5 sentence personalized interpretation.
- Request body:
  ```json
  {
    "cards": [
      {
        "id": "major_0",
        "name": "The Fool",
        "orientation": "upright",
        "meaning": "New beginnings, innocence...",
        "position": "Past"
      }
    ],
    "user_question": "What should I focus on this week?"
  }
  ```

---

## Running Tests

```bash
cd backend
.venv/bin/pytest tests/test_api.py -v
```
