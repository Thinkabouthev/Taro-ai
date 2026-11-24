import datetime
import logging
from typing import Optional
import httpx
from app.core.config import settings
from app.models.schemas import SpreadCard, InterpretResponse

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = (
    "You are an empathetic, intuitive Tarot interpreter. Analyze the provided tarot spread for the user.\n"
    "Guidelines:\n"
    "1. Keep your answer strictly between 3 and 5 sentences.\n"
    "2. Be insightful, warm, and constructive. Avoid fluff or overly dramatic language.\n"
    "3. Format key terms with clean Markdown (bolding key takeaways)."
)


class AIService:
    def __init__(self):
        self.gemini_key = settings.GEMINI_API_KEY
        self.claude_key = settings.CLAUDE_API_KEY
        self.model = settings.GEMINI_MODEL

    async def interpret_spread(
        self,
        cards: list[SpreadCard],
        user_question: Optional[str] = None
    ) -> InterpretResponse:
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

        # Build card summary for the prompt
        cards_context_list = []
        for c in cards:
            cards_context_list.append(
                f"- **{c.position}**: {c.name} ({c.orientation.upper()}) — {c.meaning}"
            )
        cards_summary = "\n".join(cards_context_list)

        prompt_text = f"Spread details:\n{cards_summary}\n"
        if user_question:
            prompt_text += f"\nUser's question or intention: \"{user_question}\"\n"
        prompt_text += (
            "\nPlease provide an intuitive interpretation following all guidelines. "
            "Remember: exactly 3 to 5 sentences with **bolded key takeaways**."
        )

        # Attempt Gemini call if key is available
        if self.gemini_key:
            try:
                interpretation = await self._call_gemini(prompt_text)
                if interpretation:
                    return InterpretResponse(
                        interpretation=interpretation.strip(),
                        created_at=now_iso,
                        is_mock=False
                    )
            except Exception as e:
                logger.warning(f"Gemini API call failed, falling back to mock: {e}")

        # Attempt Claude call if key is available
        if self.claude_key:
            try:
                interpretation = await self._call_claude(prompt_text)
                if interpretation:
                    return InterpretResponse(
                        interpretation=interpretation.strip(),
                        created_at=now_iso,
                        is_mock=False
                    )
            except Exception as e:
                logger.warning(f"Claude API call failed, falling back to mock: {e}")

        # Resilient Mock Fallback
        mock_text = self._generate_mock_interpretation(cards, user_question)
        return InterpretResponse(
            interpretation=mock_text,
            created_at=now_iso,
            is_mock=True
        )

    async def _call_gemini(self, user_content: str) -> Optional[str]:
        # Using Gemini v1beta endpoint
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.gemini_key}"
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": f"{SYSTEM_PROMPT}\n\n{user_content}"}
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 300,
            }
        }
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                candidates = data.get("candidates", [])
                if candidates:
                    content_parts = candidates[0].get("content", {}).get("parts", [])
                    if content_parts:
                        return content_parts[0].get("text", "")
            else:
                logger.error(f"Gemini error {resp.status_code}: {resp.text}")
        return None

    async def _call_claude(self, user_content: str) -> Optional[str]:
        url = "https://api.anthropic.com/v1/messages"
        headers = {
            "x-api-key": self.claude_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }
        payload = {
            "model": "claude-3-haiku-20240307",
            "max_tokens": 300,
            "system": SYSTEM_PROMPT,
            "messages": [
                {"role": "user", "content": user_content}
            ]
        }
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                contents = data.get("content", [])
                if contents:
                    return contents[0].get("text", "")
        return None

    def _generate_mock_interpretation(self, cards: list[SpreadCard], user_question: Optional[str]) -> str:
        """
        Generates a contextual, empathetic 4-sentence interpretation strictly abiding
        by the 3 to 5 sentences rule and formatting key takeaways in bold.
        """
        c1 = cards[0] if len(cards) > 0 else None
        c2 = cards[1] if len(cards) > 1 else None
        c3 = cards[2] if len(cards) > 2 else None

        q_intro = f"Regarding your inquiry, \"{user_question}\", " if user_question else ""

        # Sentence 1: Foundation / Past / Situation
        s1 = (
            f"{q_intro}Your journey is anchored by **{c1.name} ({c1.orientation})**, showing that **{c1.meaning.lower().rstrip('.')}** "
            f"has set the current emotional and energetic foundation."
            if c1 else "Your path begins with a strong foundation of reflection."
        )

        # Sentence 2: Present / Action
        s2 = (
            f"Presently, the presence of **{c2.name} ({c2.orientation})** calls you to embrace **{c2.meaning.lower().rstrip('.')}** "
            f"by taking conscious, balanced steps forward."
            if c2 else "Now is the moment to align your inner focus."
        )

        # Sentence 3: Outcome / Future
        s3 = (
            f"Looking ahead, **{c3.name} ({c3.orientation})** illuminates a path toward **{c3.meaning.lower().rstrip('.')}**, "
            f"promising meaningful transformation if you remain true to your intuition."
            if c3 else "A positive resolution will unfold naturally."
        )

        # Sentence 4: Key Takeaway / Encouragement
        s4 = "Trust your inner wisdom and take **grounded, intentional action** as these energies unfold."

        return f"{s1} {s2} {s3} {s4}"


ai_service = AIService()
