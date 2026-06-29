"""AI service for generating legal responses."""
from __future__ import annotations

import asyncio
import logging

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)

MAX_RETRIES = 3
RETRY_DELAYS = [2, 5, 10]  # seconds


class AIService:
    """Calls an OpenAI-compatible chat completion API."""

    async def get_response(
        self,
        user_message: str,
        context: str = "",
        history: list[dict[str, str]] | None = None,
    ) -> str:
        settings = get_settings()
        if not settings.ai_api_key:
            return self._stub_response(user_message)

        system_prompt = (
            "Та Монгол улсын хуулийн зөвлөх туслах. "
            "Хэрэглэгчийн асуултад Монгол хуулийн үүднээс хариулна уу. "
            "Хариулт нь тодорхой, ойлгомжтой байх ёстой."
        )
        if context:
            system_prompt += f"\n\nХолбогдох хуулийн заалтууд:\n{context}"

        messages: list[dict[str, str]] = [{"role": "system", "content": system_prompt}]
        if history:
            messages.extend(history)
        messages.append({"role": "user", "content": user_message})

        for attempt in range(MAX_RETRIES):
            try:
                async with httpx.AsyncClient(timeout=60) as client:
                    url = f"{settings.ai_api_url}/chat/completions"
                    headers = {
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {settings.ai_api_key}",
                    }
                    response = await client.post(
                        url,
                        headers=headers,
                        json={
                            "model": settings.ai_model,
                            "messages": messages,
                            "max_tokens": 4096,
                        },
                    )
                    if response.status_code == 429 and attempt < MAX_RETRIES - 1:
                        delay = RETRY_DELAYS[attempt]
                        logger.info("Rate limited (429), retrying in %ds (attempt %d/%d)", delay, attempt + 1, MAX_RETRIES)
                        await asyncio.sleep(delay)
                        continue
                    response.raise_for_status()
                    data = response.json()
                    return data["choices"][0]["message"]["content"]
            except httpx.HTTPStatusError as exc:
                if exc.response.status_code == 429 and attempt < MAX_RETRIES - 1:
                    delay = RETRY_DELAYS[attempt]
                    logger.info("Rate limited (429), retrying in %ds (attempt %d/%d)", delay, attempt + 1, MAX_RETRIES)
                    await asyncio.sleep(delay)
                    continue
                logger.warning("AI API call failed (%s): %s", exc.response.status_code, exc.response.text)
                return self._stub_response(user_message)
            except Exception as exc:
                logger.warning("AI API call failed: %s", exc)
                return self._stub_response(user_message)

        return self._stub_response(user_message)

    def _stub_response(self, message: str) -> str:  # noqa: ARG002
        return (
            "AI үйлчилгээ одоогоор холбогдоогүй байна. "
            "Хуулийн зөвлөгөө авахын тулд мэргэжлийн хуульчтай холбоо барина уу."
        )
