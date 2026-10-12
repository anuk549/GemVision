"""
Gemini Vision Visual Feature Inspector & Bridge
------------------------------------------------
Audits generated jewelry renders from Model 1 (Diffusion Image Generator)
using Google Gemini Vision (or cached ground-truth extractions) to inspect:
1. Setting type (Prong, Bezel, Halo, Pave, Channel, Solitaire)
2. Accent stone count (Diamond melee count rendered on halo/band)
3. Design complexity (Simple vs. Complex)
4. Metal tone (Yellow Gold, White Gold / Silver, Rose Gold)
5. Gemstone cut (Round, Oval, Cushion, Pear, Emerald)

Judged purely on physical attribute accuracy, NOT on continuous currency/price.
Feeds audited physical specifications directly into the Parametric BOM Pricer.
"""

import os
import re
import json
import base64
import urllib.request
import urllib.error
from typing import Dict, Any, Optional
from PIL import Image

# Locate cache file
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CACHE_PATHS = [
    os.path.join(BASE_DIR, "..", "Jewelry Dataset", "gemini_vision_cache.json"),
    os.path.join(BASE_DIR, "data", "design_dataset", "gemini_vision_cache.json")
]


class GeminiVisionInspector:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
        self.cache: Dict[str, Any] = {}
        self._load_cache()

    def _load_cache(self):
        for p in CACHE_PATHS:
            norm_p = os.path.abspath(p)
            if os.path.exists(norm_p):
                try:
                    with open(norm_p, "r", encoding="utf-8") as f:
                        raw_cache = json.load(f)
                    self.cache = dict(raw_cache)
                    # Also map via metadata.csv if available
                    meta_path = os.path.join(os.path.dirname(norm_p), "metadata.csv")
                    if os.path.exists(meta_path):
                        import pandas as pd
                        df_meta = pd.read_csv(meta_path)
                        for _, row in df_meta.iterrows():
                            sf = row.get("source_file")
                            ip = row.get("image_path")
                            if sf in raw_cache and ip:
                                self.cache[ip] = raw_cache[sf]
                                self.cache[os.path.basename(ip)] = raw_cache[sf]
                    print(f"[GeminiVisionInspector] Loaded {len(raw_cache)} records (expanded to {len(self.cache)} keys) from {norm_p}")
                    return
                except Exception as e:
                    print(f"[GeminiVisionInspector] Warning: Could not read cache {norm_p}: {e}")

    def inspect_image(self, image_path: str, user_specs: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Extracts verified discrete jewelry attributes from an image.
        Prioritizes:
        1. Cache lookup by image path, basename or normalized relative path.
        2. Live Gemini 1.5/2.0 Vision API query if API key is present.
        3. Physical spec reconciliation fallback if offline.
        """
        user_specs = user_specs or {}
        basename = os.path.basename(image_path) if image_path else ""
        norm_path = image_path.replace("\\\\", "/").replace("\\", "/") if image_path else ""

        # 1. Direct or basename cache lookup
        if self.cache:
            if norm_path in self.cache:
                return self._normalize_cached_attributes(self.cache[norm_path], user_specs)
            if basename in self.cache:
                return self._normalize_cached_attributes(self.cache[basename], user_specs)
            for k, val in self.cache.items():
                if norm_path.endswith(k) or k.endswith(basename):
                    return self._normalize_cached_attributes(val, user_specs)

        # 2. Live Gemini Vision API Call
        if self.api_key and image_path and os.path.exists(image_path):
            try:
                live_result = self._query_gemini_api(image_path)
                if live_result:
                    return self._normalize_live_attributes(live_result, user_specs)
            except Exception as e:
                print(f"[GeminiVisionInspector] Live API query failed: {e}. Falling back to spec reconciliation.")

        # 3. Rule-Based Fallback using User Specs & Physics
        return self._fallback_reconcile(user_specs)

    def _normalize_cached_attributes(self, raw: Dict[str, Any], user_specs: Dict[str, Any]) -> Dict[str, Any]:
        raw_setting = str(raw.get("setting", "")).lower()
        if "halo" in raw_setting:
            setting_type = "Halo"
            accent_count = int(user_specs.get("number_of_accent_stones", 16))
            complexity = "Complex"
        elif "bezel" in raw_setting:
            setting_type = "Bezel"
            accent_count = int(user_specs.get("number_of_accent_stones", 0))
            complexity = "Simple"
        elif "pave" in raw_setting or "pavé" in raw_setting:
            setting_type = "Pave"
            accent_count = int(user_specs.get("number_of_accent_stones", 20))
            complexity = "Complex"
        elif "channel" in raw_setting:
            setting_type = "Channel"
            accent_count = int(user_specs.get("number_of_accent_stones", 10))
            complexity = "Complex"
        else:
            setting_type = "Prong"
            accent_count = int(user_specs.get("number_of_accent_stones", 0))
            complexity = "Simple"

        raw_metal = str(raw.get("metal", "")).lower()
        if "rose" in raw_metal:
            metal_tone = "Rose"
        elif any(k in raw_metal for k in ["white", "silver", "platinum"]):
            metal_tone = "White"
        else:
            metal_tone = "Yellow"

        cut = str(raw.get("gemstone_cut", user_specs.get("gemstone_cut", "oval cut"))).lower()

        return {
            "setting_type": setting_type,
            "number_of_accent_stones": accent_count,
            "design_complexity": complexity,
            "metal_tone": metal_tone,
            "gemstone_cut": cut,
            "audit_source": "gemini_vision_cache",
            "visual_description": raw.get("visual_description", "")
        }

    def _query_gemini_api(self, image_path: str) -> Optional[Dict[str, Any]]:
        with open(image_path, "rb") as f:
            b64_data = base64.b64encode(f.read()).decode("utf-8")

        prompt = (
            "Analyze this fine jewelry piece and respond strictly in JSON with these exact fields:\n"
            "{\n"
            '  "setting_type": "Prong" | "Bezel" | "Halo" | "Pave" | "Channel" | "Solitaire",\n'
            '  "number_of_accent_stones": <integer count of small melee diamonds/stones on halo or band>,\n'
            '  "design_complexity": "Simple" | "Complex",\n'
            '  "metal_tone": "Yellow" | "White" | "Rose",\n'
            '  "gemstone_cut": "round brilliant cut" | "oval cut" | "cushion cut" | "pear cut" | "emerald cut"\n'
            "}"
        )

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.api_key}"
        payload = {
            "contents": [{
                "parts": [
                    {"text": prompt},
                    {"inline_data": {"mime_type": "image/jpeg", "data": b64_data}}
                ]
            }],
            "generationConfig": {"response_mime_type": "application/json"}
        }

        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )

        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            candidate_text = data["candidates"][0]["content"]["parts"][0]["text"]
            return json.loads(candidate_text)

    def _normalize_live_attributes(self, raw: Dict[str, Any], user_specs: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "setting_type": raw.get("setting_type", "Prong"),
            "number_of_accent_stones": int(raw.get("number_of_accent_stones", user_specs.get("number_of_accent_stones", 0))),
            "design_complexity": raw.get("design_complexity", "Simple"),
            "metal_tone": raw.get("metal_tone", "Yellow"),
            "gemstone_cut": raw.get("gemstone_cut", user_specs.get("gemstone_cut", "oval cut")),
            "audit_source": "gemini_live_vision",
            "visual_description": "Audited via Gemini Vision API."
        }

    def _fallback_reconcile(self, user_specs: Dict[str, Any]) -> Dict[str, Any]:
        setting = user_specs.get("setting_type", "Prong")
        accents = int(user_specs.get("number_of_accent_stones", 16 if "halo" in setting.lower() else 0))
        complexity = user_specs.get("design_complexity", "Complex" if accents > 0 else "Simple")
        metal = str(user_specs.get("metal", "22KT Gold"))
        metal_tone = "Rose" if "rose" in metal.lower() else ("White" if "white" in metal.lower() or "silver" in metal.lower() else "Yellow")
        
        return {
            "setting_type": setting,
            "number_of_accent_stones": accents,
            "design_complexity": complexity,
            "metal_tone": metal_tone,
            "gemstone_cut": user_specs.get("gemstone_cut", "oval cut"),
            "audit_source": "user_spec_heuristic_fallback",
            "visual_description": "Heuristic fallback (offline mode)."
        }


# Global singleton instance
vision_inspector = GeminiVisionInspector()
