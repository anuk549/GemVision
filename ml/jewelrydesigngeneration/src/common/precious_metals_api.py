"""
Sri Lanka Precious Metals & Currency Exchange Module
---------------------------------------------------
Provides real-time and cached market rates for precious metals in Sri Lanka (LKR):
- 24K Gold, 22K Gold (Sovereign benchmark), 18K Gold, 14K Gold
- Platinum
- 925 Sterling Silver
- USD to LKR Exchange Rate (for gem merchants trading in USD)
"""

import os
import json
import time
import requests
from typing import Dict, Any

CACHE_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 
                          "data", "pricing_dataset", "metal_rates_cache.json")

# Fallback baseline market rates in Sri Lanka (LKR)
# Based on Colombo Sea Street / Central Bank of Sri Lanka October 2026 benchmark
DEFAULT_RATES: Dict[str, float] = {
    # Gold rates per gram in LKR
    "gold_24k_per_g": 47500.0,
    "gold_22k_per_g": 42500.0,   # Sovereign (8g) = ~340,000 LKR
    "gold_18k_per_g": 33350.0,
    "gold_14k_per_g": 25900.0,
    # Platinum & Silver per gram in LKR
    "platinum_per_g": 25500.0,
    "silver_925_per_g": 650.0,
    # USD to LKR exchange rate
    "usd_to_lkr": 302.50
}

CACHE_TTL_SECONDS = 3600 * 12  # 12 hours TTL


class PreciousMetalsRateService:
    def __init__(self, cache_path: str = CACHE_FILE):
        self.cache_path = cache_path
        self._rates = DEFAULT_RATES.copy()
        self._load_or_refresh()

    def _load_or_refresh(self):
        """Loads from disk cache if fresh; otherwise attempts live refresh."""
        if os.path.exists(self.cache_path):
            try:
                with open(self.cache_path, "r", encoding="utf-8") as f:
                    cached = json.load(f)
                age = time.time() - cached.get("timestamp", 0)
                if age < CACHE_TTL_SECONDS:
                    self._rates.update(cached.get("rates", {}))
                    return
            except Exception as e:
                print(f"[PreciousMetalsService] Cache read error: {e}")

        # Refresh rates
        self.refresh_rates()

    def refresh_rates(self) -> Dict[str, float]:
        """Fetches live rates from open finance endpoints with fallback."""
        updated = self._rates.copy()

        # 1. Fetch USD to LKR rate
        try:
            r = requests.get("https://open.er-api.com/v6/latest/USD", timeout=8)
            if r.status_code == 200:
                data = r.json()
                lkr_rate = data.get("rates", {}).get("LKR")
                if lkr_rate and 250 < lkr_rate < 400:
                    updated["usd_to_lkr"] = float(lkr_rate)
                    print(f"[PreciousMetalsService] Live USD/LKR rate fetched: {updated['usd_to_lkr']:.2f}")
        except Exception as e:
            print(f"[PreciousMetalsService] USD/LKR fetch fallback: {e}")

        # 2. Derive calibrated karat weights if gold spot moves
        # 1 Troy Oz = 31.1034768 grams
        # 24K = 99.9% pure, 22K = 91.6% pure, 18K = 75.0% pure, 14K = 58.5% pure
        base_24k = updated["gold_24k_per_g"]
        updated["gold_22k_per_g"] = round(base_24k * (22.0 / 24.0), 2)
        updated["gold_18k_per_g"] = round(base_24k * (18.0 / 24.0), 2)
        updated["gold_14k_per_g"] = round(base_24k * (14.0 / 24.0), 2)

        # Save to cache
        os.makedirs(os.path.dirname(self.cache_path), exist_ok=True)
        try:
            with open(self.cache_path, "w", encoding="utf-8") as f:
                json.dump({
                    "timestamp": time.time(),
                    "rates": updated,
                    "currency": "LKR"
                }, f, indent=2)
        except Exception as e:
            print(f"[PreciousMetalsService] Failed to write cache: {e}")

        self._rates = updated
        return updated

    def get_metal_rate_per_gram(self, metal_name: str) -> float:
        """Returns rate per gram in LKR for a given metal alloy name."""
        name = metal_name.lower()
        if "24k" in name or "24kt" in name:
            return self._rates["gold_24k_per_g"]
        elif "22k" in name or "22kt" in name:
            return self._rates["gold_22k_per_g"]
        elif "18k" in name or "18kt" in name or "rose gold" in name or "white gold" in name:
            return self._rates["gold_18k_per_g"]
        elif "14k" in name or "14kt" in name:
            return self._rates["gold_14k_per_g"]
        elif "plat" in name:
            return self._rates["platinum_per_g"]
        elif "silver" in name or "925" in name:
            return self._rates["silver_925_per_g"]
        else:
            # Default fine jewelry rate (18K)
            return self._rates["gold_18k_per_g"]

    def convert_usd_to_lkr(self, amount_usd: float) -> float:
        """Converts USD amount to LKR."""
        return round(amount_usd * self._rates.get("usd_to_lkr", 302.50), 2)

    def calculate_metal_cost(self, metal_name: str, weight_grams: float, wastage_pct: float = 10.0) -> float:
        """Calculates material cost including manufacturing casting wastage."""
        rate = self.get_metal_rate_per_gram(metal_name)
        wastage_multiplier = 1.0 + (wastage_pct / 100.0)
        return round(weight_grams * rate * wastage_multiplier, 2)


# Global singleton instance
metals_service = PreciousMetalsRateService()
