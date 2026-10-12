"""
Normalization & Entity Extraction for Sri Lankan Gemstones & Jewelry
---------------------------------------------------------------------
Handles currency conversion (with live USD/LKR rate), entity parsing for
carat weights, precious metal alloys, cuts, dimensions, and categories.
"""

import re
from typing import Dict, Any, Optional, Tuple
from src.common.precious_metals_api import metals_service


def parse_carat_weight(text: str) -> Optional[float]:
    """Extracts numeric carat weight from titles, specs, or descriptions."""
    if not text:
        return None
    # Matches patterns like 'Carat Weight : 3.48 ct', '1.1 CTS', '0.09Cts.', '1.66 ct', '3.04 carats'
    patterns = [
        r'(?:carat\s*weight|weight|carats?|cts?)\s*[:=]?\s*(\d+\.?\d*)\s*(?:ct|carat|carats|cts)?\b',
        r'(\d+\.?\d*)\s*(?:ct|carat|carats|cts)\b'
    ]
    for p in patterns:
        match = re.search(p, text, re.IGNORECASE)
        if match:
            try:
                val = float(match.group(1))
                if 0.01 <= val <= 100.0:
                    return val
            except ValueError:
                pass
    return None


def parse_metal_weight_grams(text: str) -> Optional[float]:
    """Extracts metal weight in grams (e.g. 'Weight 0.800 g' or '4.2 grams')."""
    if not text:
        return None
    match = re.search(r'(?:weight|gross\s*weight|net\s*weight)?\s*[:=]?\s*(\d+\.?\d*)\s*(?:g|gm|gms|grams)\b', text, re.IGNORECASE)
    if match:
        try:
            val = float(match.group(1))
            if 0.2 <= val <= 250.0:
                return val
        except ValueError:
            pass
    return None


def parse_metal_type(text: str) -> Optional[str]:
    """Extracts standard precious metal alloy name with strict precedence. Returns None if not found."""
    if not text:
        return None
    t = text.lower()
    
    # Check specific gold alloys first
    if "18kt rose gold" in t or "18k rose gold" in t or "18kt pink gold" in t or "rose gold" in t:
        return "18K Rose Gold"
    elif "18kt white gold" in t or "18k white gold" in t or "white gold" in t:
        return "18K White Gold"
    elif "18kt" in t or "18k" in t or "18 kt" in t:
        return "18K Yellow Gold"
    elif "24kt" in t or "24k" in t or "24 kt" in t:
        return "24KT Gold"
    elif "22kt" in t or "22k" in t or "22 kt" in t:
        return "22KT Gold"
    elif "14kt" in t or "14k" in t or "14 kt" in t:
        return "14K Gold"
    elif "plat" in t:
        return "Platinum"
    elif "s925" in t or "925 silver" in t or "sterling silver" in t or "925" in t or "silver" in t:
        return "925 Sterling Silver"
    elif "gold" in t:
        return "22KT Gold"
    return None


def parse_dimensions(text: str) -> Optional[str]:
    """Extracts gemstone or jewelry dimensions in mm or cm. Returns None if not found."""
    if not text:
        return None
    match = re.search(r'(\d+\.?\d*\s*[xX*×]\s*\d+\.?\d*(?:\s*[xX*×]\s*\d+\.?\d*)?\s*(?:mm|cm)?)', text)
    if match:
        dim = match.group(1).strip().replace(" ", "")
        if "mm" not in dim.lower() and "cm" not in dim.lower():
            dim += "mm"
        return dim
    return None


def parse_gemstone_type(text: str) -> Optional[str]:
    """Extracts gemstone type. Returns None if not found."""
    if not text:
        return None
    t = text.lower()
    if "yellow sapphire" in t:
        return "Yellow Sapphire"
    elif "blue sapphire" in t or "ceylon sapphire" in t:
        return "Blue Sapphire"
    elif "padparadscha" in t:
        return "Padparadscha Sapphire"
    elif "pink sapphire" in t:
        return "Pink Sapphire"
    elif "white sapphire" in t:
        return "White Sapphire"
    elif "ruby" in t:
        return "Ruby"
    elif "cubic zirconia" in t or "cz" in t:
        return "Cubic Zirconia"
    elif "diamond" in t:
        return "Diamond"
    elif "sapphire" in t:
        return "Blue Sapphire"
    return None


def parse_cut(text: str) -> Optional[str]:
    """Extracts gemstone cut. Returns None if not found."""
    if not text:
        return None
    t = text.lower()
    if "cushion" in t: return "cushion cut"
    elif "oval" in t: return "oval cut"
    elif "round" in t: return "round brilliant cut"
    elif "emerald" in t: return "emerald cut"
    elif "pear" in t or "teardrop" in t: return "pear cut"
    elif "princess" in t: return "princess cut"
    elif "marquise" in t: return "marquise cut"
    elif "octagon" in t or "step" in t: return "octagon cut"
    elif "heart" in t: return "heart cut"
    return None


def parse_treatment(text: str) -> str:
    """Extracts treatment status. Defaults to 'Natural / Unspecified' if not found."""
    if not text:
        return "Natural / Unspecified"
    t = text.lower()
    if "unheated" in t or "no heat" in t or "un-heated" in t:
        return "Unheated"
    elif "heated" in t:
        return "Heated"
    return "Natural / Unspecified"


def parse_category(text: str, default_item_type: str = "Loose Gemstone") -> Tuple[str, str]:
    """Returns (item_type, category). Defaults to 'Other' or 'Loose Stone' if category cannot be parsed."""
    default_cat = "Loose Stone" if default_item_type == "Loose Gemstone" else "Other"
    if not text:
        return default_item_type, default_cat
    t = text.lower()
    if any(k in t for k in ["ring", "band"]):
        return "Mounted Jewelry", "Ring"
    elif any(k in t for k in ["necklace", "pendant", "chain", "choker", "cross"]):
        return "Mounted Jewelry", "Necklace"
    elif any(k in t for k in ["earring", "earrings", "earstud", "ear-stud", "stud", "studs", "drop"]):
        return "Mounted Jewelry", "Earring"
    elif any(k in t for k in ["bracelet", "bangle"]):
        return "Mounted Jewelry", "Bracelet"
    return default_item_type, default_cat


def convert_to_lkr(raw_price: float, currency: str) -> float:
    """Converts price in foreign currency to LKR using live exchange rates."""
    curr = currency.upper().strip()
    if curr == "LKR" or curr == "RS" or curr == "රු":
        return round(raw_price, 2)
    elif curr == "USD":
        return metals_service.convert_usd_to_lkr(raw_price)
    elif curr == "EUR":
        return round(raw_price * 360.0, 2)
    elif curr == "GBP":
        return round(raw_price * 425.0, 2)
    elif curr == "CAD":
        return round(raw_price * 240.0, 2)
    elif curr == "AUD":
        return round(raw_price * 220.0, 2)
    return round(raw_price, 2)
