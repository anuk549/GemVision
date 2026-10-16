import logging
import re
from typing import Optional, Dict, Any
import httpx
from ..core.config import settings

logger = logging.getLogger(__name__)


class GeminiPromptEnhancer:
    """
    Intelligent Fine Jewelry Prompt Enhancer powered by Google Gemini.
    Transforms raw user concepts into production-grade diffusion prompts
    under the guidance of the Master Jeweler directive.
    """

    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model = settings.GEMINI_MODEL or "gemini-2.5-flash"
        self.master_prompt = settings.GEMINI_MASTER_PROMPT

    def _build_fallback_prompt(
        self,
        prompt: str,
        gemstone: str = "Blue Sapphire",
        gemstone_weight_ct: float = 2.5,
        metal: str = "22KT Gold",
        metal_weight_g: float = 5.0,
        aesthetic_style: str = "Modern",
    ) -> str:
        """
        Deterministic studio prompt builder used when Gemini API key
        is not yet configured or when offline.
        """
        clean_input = (prompt or "").strip()
        c = float(gemstone_weight_ct or 2.5)
        scale = "commanding centerpiece" if c >= 3.5 else "prominent centerpiece" if c >= 1.8 else "delicate centerpiece"

        if not clean_input:
            clean_input = f"A bespoke {aesthetic_style.lower()} fine jewelry ring showcasing a {scale} {c:.2f}ct natural {gemstone}"

        # Refine natural language phrases
        core_vision = clean_input
        if re.search(r"multiple lines|lines of|several lines|multi line|multi-line", core_vision, re.IGNORECASE):
            core_vision = re.sub(
                r"with multiple lines of this gem|with multiple lines|multiple lines of this gem|multiple lines",
                "featuring multiple intertwining fluid bands encrusted with micro-pavé melee lines",
                core_vision,
                flags=re.IGNORECASE,
            )

        core_vision = core_vision[0].upper() + core_vision[1:] if core_vision else core_vision

        has_gem = gemstone.lower() in core_vision.lower() or "gem" in core_vision.lower()
        has_metal = bool(re.search(r"gold|silver|platinum", core_vision, re.IGNORECASE))

        clauses = [core_vision]
        if not has_gem:
            clauses.append(f"featuring a {scale} {c:.2f}ct {gemstone}")
        if not has_metal:
            clauses.append(f"handcrafted in lustrous {metal} ({metal_weight_g}g)")

        style_directives = {
            "Vintage": "handcrafted vintage filigree detailing and Victorian milgrain flourishes",
            "Minimal": "understated minimalist silhouette with slender delicate shank and refined low-profile setting",
            "Modern": "contemporary architectural geometry with bold fluid contours",
            "Royal Halo": "majestic micro-pave diamond halo accentuating center stone brilliance",
        }
        if aesthetic_style in style_directives:
            clauses.append(style_directives[aesthetic_style])

        studio_directives = [
            "master goldsmith micro-prong architecture",
            "openwork pavilion gallery rail",
            "macro studio jewelry product photography",
            "sharp facet reflections",
            "high refractive dispersion",
            "specular caustic highlights",
            "neutral luxury studio lighting",
            "8k resolution fine jewelry render",
        ]
        clauses.extend(studio_directives)
        return ", ".join(clauses)

    async def enhance_prompt(
        self,
        prompt: str,
        gemstone: str = "Blue Sapphire",
        gemstone_weight_ct: float = 2.5,
        metal: str = "22KT Gold",
        metal_weight_g: float = 5.0,
        aesthetic_style: str = "Modern",
    ) -> Dict[str, Any]:
        """
        Enhances user design prompt using Google Gemini API.
        Tries primary configured model, then fallback candidate models.
        Falls back to deterministic fine jewelry prompt if API key is unset or all models fail.
        """
        import os
        api_key = (os.getenv("GEMINI_API_KEY") or settings.GEMINI_API_KEY).strip()
        configured_model = (os.getenv("GEMINI_MODEL") or settings.GEMINI_MODEL or "gemini-3.5-flash").strip()
        master_prompt = (os.getenv("GEMINI_MASTER_PROMPT") or settings.GEMINI_MASTER_PROMPT).strip()

        if not api_key:
            logger.info("GEMINI_API_KEY is not configured in .env; utilizing local master prompt builder.")
            fallback = self._build_fallback_prompt(
                prompt, gemstone, gemstone_weight_ct, metal, metal_weight_g, aesthetic_style
            )
            return {
                "original_prompt": prompt,
                "enhanced_prompt": fallback,
                "gemini_applied": False,
                "model_used": "local-fallback",
            }

        # Candidate models to try in order
        candidate_models = []
        for m in [configured_model, "gemini-3.5-flash", "gemini-3.1-flash-lite"]:
            if m and m not in candidate_models:
                candidate_models.append(m)

        # Prepare prompt for Gemini
        user_message = (
            f"Customer Jewelry Concept: \"{prompt or 'A bespoke luxury ring'}\"\n"
            f"Physical Specifications:\n"
            f"- Center Gemstone: {gemstone} ({gemstone_weight_ct} carats)\n"
            f"- Precious Metal: {metal} ({metal_weight_g} grams)\n"
            f"- Design Aesthetic Style: {aesthetic_style}\n\n"
            f"Adhering strictly to your Master Jeweler & AI Art Director role, craft the single enhanced prompt paragraph embodying the {aesthetic_style} fine jewelry aesthetic. "
            f"Describe the gemstone by its qualitative visual majesty (crystal cut, facets, saturation, brilliance) without embedding raw text numbers (like '2.5ct'), labels, or watermarks. Ensure the prompt yields pure clean jewelry with no typography or text rendered."
        )

        request_body = {
            "system_instruction": {
                "parts": [
                    {"text": master_prompt}
                ]
            },
            "contents": [
                {
                    "parts": [
                        {"text": user_message}
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.7,
                "topP": 0.9,
                "maxOutputTokens": 2048,
                "thinkingConfig": {
                    "thinkingBudget": 0
                },
            },
        }

        for model in candidate_models:
            endpoint_url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
            try:
                async with httpx.AsyncClient(timeout=25.0) as client:
                    response = await client.post(
                        endpoint_url,
                        json=request_body,
                        headers={"Content-Type": "application/json"},
                    )

                if response.status_code == 200:
                    data = response.json()
                    candidates = data.get("candidates", [])
                    if candidates and "content" in candidates[0]:
                        parts = candidates[0]["content"].get("parts", [])
                        if parts and "text" in parts[0]:
                            raw_text = parts[0]["text"].strip()
                            # Clean any surrounding quotation marks or markdown code blocks
                            cleaned = re.sub(r"^```[a-z]*\s*", "", raw_text, flags=re.IGNORECASE)
                            cleaned = re.sub(r"\s*```$", "", cleaned)
                            cleaned = cleaned.strip('"\' \n')
                            # Ensure no raw carat digits which cause typography diffusion on the gem
                            cleaned = re.sub(r"\b\d+(\.\d+)?\s*(ct|carats?|carat)\b", "prominent centerpiece", cleaned, flags=re.IGNORECASE)
                            if "no text" not in cleaned.lower():
                                cleaned += ", no text, no watermark, no typography, no labels, pristine fine jewelry render"
                            logger.info(f"Successfully enhanced prompt using Gemini ({model})")
                            return {
                                "original_prompt": prompt,
                                "enhanced_prompt": cleaned,
                                "gemini_applied": True,
                                "model_used": model,
                            }

                logger.warning(
                    f"Gemini model {model} returned status {response.status_code}: {response.text[:180]}. Trying next candidate if available."
                )
            except Exception as exc:
                logger.warning(f"Gemini API request failed for model {model} ({exc}). Trying next candidate.")

        logger.warning("All Gemini candidate models failed or unavailable. Falling back to local builder.")
        fallback = self._build_fallback_prompt(
            prompt, gemstone, gemstone_weight_ct, metal, metal_weight_g
        )
        return {
            "original_prompt": prompt,
            "enhanced_prompt": fallback,
            "gemini_applied": False,
            "model_used": "local-fallback",
        }


gemini_enhancer = GeminiPromptEnhancer()
