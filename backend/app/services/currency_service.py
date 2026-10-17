import logging
import time
from typing import Dict, Any
import httpx

logger = logging.getLogger(__name__)

FALLBACK_LKR_RATE = 331.25
CACHE_TTL_SECONDS = 1800  # 30 minutes in-memory cache


class CurrencyService:
    """
    Live Currency Service integrating https://api.exchangerate.fun
    Fetches real-time USD to LKR (and global fiat) exchange rates with memory caching
    and robust fallback resilience.
    """

    def __init__(self):
        self._cached_rate: float = FALLBACK_LKR_RATE
        self._last_fetched_ts: float = 0.0
        self._latest_payload: Dict[str, Any] = {
            "base": "USD",
            "rates": {"LKR": FALLBACK_LKR_RATE},
            "date": "live-default",
        }

    async def get_live_usd_to_lkr_rate(self) -> float:
        """
        Retrieves real-time USD/LKR exchange rate.
        Refreshes from https://api.exchangerate.fun/latest?base=USD with 30-min TTL.
        """
        now = time.time()
        if (now - self._last_fetched_ts) < CACHE_TTL_SECONDS and self._cached_rate > 0:
            return self._cached_rate

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.get("https://api.exchangerate.fun/latest?base=USD")
                if res.status_code == 200:
                    data = res.json()
                    rates = data.get("rates", {})
                    lkr = rates.get("LKR")
                    if lkr and isinstance(lkr, (int, float)) and lkr > 0:
                        self._cached_rate = round(float(lkr), 2)
                        self._last_fetched_ts = now
                        self._latest_payload = data
                        logger.info(f"Updated live USD/LKR exchange rate: 1 USD = {self._cached_rate} LKR")
                        return self._cached_rate
        except Exception as ex:
            logger.warning(
                f"Could not fetch live currency from api.exchangerate.fun ({ex}). Falling back to cached rate: {self._cached_rate}"
            )

        return self._cached_rate

    def get_cached_rate(self) -> float:
        return self._cached_rate or FALLBACK_LKR_RATE

    def get_latest_payload(self) -> Dict[str, Any]:
        return {
            "base": "USD",
            "target": "LKR",
            "rate": self._cached_rate,
            "cached": (time.time() - self._last_fetched_ts) < CACHE_TTL_SECONDS,
            "last_updated_epoch": self._last_fetched_ts,
            "source": "https://api.exchangerate.fun",
        }


currency_service = CurrencyService()
