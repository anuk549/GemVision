"""
Prompt Synthesizer & Specification Decoupler
--------------------------------------------
Transforms structured user design preferences into:
1. Studio-grade Diffusion Prompts (omits unknown/noisy tokens, injects photorealistic cues).
2. Qualitative visual scale cues (decoupling raw carat numbers from 2D pixel scale).
"""

from typing import Dict, Any, Tuple


def build_diffusion_prompt(user_input: Dict[str, Any]) -> Tuple[str, str]:
    """
    Takes user input JSON and returns (narrative_prompt, tag_prompt).
    
    Example input:
    {
      "gemstone": "Sapphire",
      "gemstone_color": "Blue",
      "gemstone_weight": 2.5,
      "category": "Ring",
      "metal": "18K Yellow Gold",
      "setting": "Solitaire",
      "user_preference": "Minimal elegant design suitable for daily wear"
    }
    """
    category = str(user_input.get("category", "Ring")).strip().lower()
    if category.endswith("s"):
        category = category[:-1]

    gemstone = str(user_input.get("gemstone", "Sapphire")).strip().lower()
    color = str(user_input.get("gemstone_color", "Blue")).strip().lower()
    
    # Weight handling: decouple into qualitative visual cues
    weight = float(user_input.get("gemstone_weight", 2.0))
    if weight >= 3.5:
        scale_cue = "large prominent centerpiece"
    elif weight >= 1.5:
        scale_cue = "balanced centerpiece"
    else:
        scale_cue = "delicate dainty centerpiece"

    cut = str(user_input.get("gemstone_cut", "")).strip().lower()
    metal = str(user_input.get("metal", "")).strip().lower()
    setting = str(user_input.get("setting", "")).strip().lower()
    preference = str(user_input.get("user_preference", "minimal elegant design")).strip().lower()

    # Filter out "unknown"
    cut_desc = cut if cut and cut != "unknown" else "faceted"
    metal_desc = metal if metal and metal != "unknown" else ""
    setting_desc = setting if setting and setting != "unknown" else ""

    # Build narrative prompt
    article = "an" if category[0] in "aeiou" else "a"
    stone_desc = f"{color} {gemstone}"
    
    parts = [f"A professional studio photograph of {article} {category} featuring a {scale_cue} {cut_desc} {stone_desc}"]
    if setting_desc:
        parts.append(f"in a {setting_desc} setting")
    if metal_desc:
        parts.append(f"with a polished {metal_desc} band" if category == "ring" else f"crafted in polished {metal_desc}")
    if preference:
        parts.append(f"{preference}")
    
    parts.append("crisp macro jewelry product photography, clean studio lighting, sharp facets, high-end fine jewelry render")
    narrative_prompt = ", ".join(parts).strip()

    # Build tag prompt
    tags = [category, stone_desc, f"{weight:.1f}ct"]
    if cut_desc and cut_desc != "faceted":
        tags.append(cut_desc)
    if setting_desc:
        tags.append(f"{setting_desc} setting")
    if metal_desc:
        tags.append(f"{metal_desc} metal")
    if preference:
        tags.append(preference)
    tags.extend(["macro jewelry photography", "studio lighting", "crisp reflections", "4k fine jewelry"])
    tag_prompt = ", ".join(tags)

    return narrative_prompt, tag_prompt


if __name__ == "__main__":
    sample_input = {
        "gemstone": "Sapphire",
        "gemstone_color": "Blue",
        "gemstone_weight": 2.5,
        "category": "Ring",
        "metal": "18K Yellow Gold",
        "setting": "Solitaire",
        "user_preference": "Minimal elegant design suitable for daily wear"
    }
    narrative, tags = build_diffusion_prompt(sample_input)
    print("--- NARRATIVE PROMPT ---")
    print(narrative)
    print("\n--- TAG PROMPT ---")
    print(tags)
