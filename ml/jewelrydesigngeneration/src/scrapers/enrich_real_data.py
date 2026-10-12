"""
Real Scraped Dataset Enrichment & Data Hygiene Pipeline
-------------------------------------------------------
1. Filters out non-jewelry artifacts (vouchers, confectionery cross-promotions)
   and corrupt glitch prices (< 1,000 LKR).
2. Performs deterministic attribute parsing across all scraped items:
   - Color grade (Royal Blue, Cornflower, Pastel, Vivid Yellow, Golden Yellow, etc.)
   - Treatment (Unheated, Heated, Natural / Commercial)
   - Clarity grade (VVS, VS, Eye Clean, SI, Included)
   - Origin (Ceylon / Sri Lanka, Madagascar, Burma)
   - Certificate (GIC, CGL, Lotus, GIA, GRS, None / Merchant Guarantee)
   - Category harmonization (Ring, Earring, Necklace, Bracelet, Jewelry Set)
3. Imputes standard silver metal weights for Chamathka Jewellers items
   (since silver material accounts for <2% of finished retail cost).
4. Assigns market segments and empirical stone grades:
   - Segments: Retail Silver Jewelry, Retail Gold Jewelry, Loose Commercial, Loose Fine, Loose Investment
   - Stone Grades: Commercial (A), Fine Jewelry (AA), Extra Fine (AAA), Investment (AAAA)
5. Enriches and overwrites:
   - data/pricing_dataset/scraped_market_listings.csv
   - data/pricing_dataset/finished_jewelry_dataset.csv
   - data/pricing_dataset/loose_gemstones_dataset.csv
"""

import os
import sys
import re
import pandas as pd
import numpy as np
from typing import Dict, Any, Tuple

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from src.scrapers.normalize import parse_metal_type


# Base standard silver weights by jewelry category (grams)
SILVER_WEIGHT_IMPUTATION = {
    "Ring": 3.5,
    "Earring": 2.5,
    "Necklace": 8.0,
    "Bracelet": 6.5,
    "Jewelry Set": 14.0,
    "Pendant": 2.5,
    "Other": 3.0
}


def parse_attributes(row: pd.Series) -> Dict[str, Any]:
    text = (str(row.get("item_title", "")) + " " + str(row.get("product_url", ""))).lower()
    shop = str(row.get("source_shop", "")).strip()
    item_type = str(row.get("item_type", "")).strip()

    # --- 1. Color Grade ---
    if "royal blue" in text or "royal-blue" in text:
        color = "Royal Blue"
    elif "cornflower" in text:
        color = "Cornflower Blue"
    elif any(k in text for k in ["pastel blue", "light blue", "sky blue"]):
        color = "Pastel Blue"
    elif "lemon yellow" in text or "lemon-yellow" in text:
        color = "Lemon Yellow"
    elif "golden yellow" in text or "golden-yellow" in text:
        color = "Golden Yellow"
    elif any(k in text for k in ["vivid yellow", "canary", "vivid-yellow"]):
        color = "Vivid Yellow"
    elif "yellow" in text:
        color = "Yellow"
    elif "pink" in text or "pink sapphire" in text:
        color = "Pink"
    elif "padparadscha" in text:
        color = "Padparadscha"
    elif any(k in text for k in ["white sapphire", "colorless", "white topaz"]):
        color = "White"
    elif "blue" in text or "blue sapphire" in text:
        color = "Blue"
    else:
        color = "Natural Unspecified"

    # --- 2. Treatment ---
    raw_treat = str(row.get("treatment", "")).strip()
    if "unheated" in text or "no heat" in text or "un-heated" in text:
        treatment = "Unheated"
    elif "heated" in text or "heat treated" in text:
        treatment = "Heated"
    elif raw_treat in ["Heated", "Unheated"]:
        treatment = raw_treat
    elif item_type == "Mounted Jewelry":
        if shop == "Chamathka Jewellers":
            treatment = "Commercial / Treated"
        elif shop == "Mallika Hemachandra":
            treatment = "Manufactured Fine Jewelry"
        elif shop == "Nithyakalyani Jewellers":
            treatment = "Hallmarked 22KT Gold"
        else:
            treatment = "Natural / Standard Heat"
    else:
        treatment = "Natural / Heat Unspecified"

    # --- 3. Origin ---
    if "madagascar" in text:
        origin = "Madagascar"
    elif "burma" in text or "myanmar" in text:
        origin = "Burma (Myanmar)"
    elif "kashmir" in text:
        origin = "Kashmir"
    else:
        origin = "Ceylon (Sri Lanka)"

    # --- 4. Certificate ---
    if "gia" in text:
        cert = "GIA"
    elif "grs" in text:
        cert = "GRS"
    elif "lotus" in text:
        cert = "Lotus Gemology"
    elif "gubelin" in text or "ssef" in text:
        cert = "Gubelin / SSEF"
    elif "gic" in text:
        cert = "GIC (Colombo)"
    elif "cgl" in text:
        cert = "CGL (Colombo)"
    elif "certified" in text or "certificate" in text:
        cert = "Certified (Local Lab)"
    else:
        cert = "None / Merchant Guarantee"

    # --- 5. Clarity ---
    if any(k in text for k in ["loupe clean", "flawless", "if"]):
        clarity = "IF / Loupe Clean"
    elif "vvs" in text:
        clarity = "VVS"
    elif "vs" in text:
        clarity = "VS"
    elif "si" in text:
        clarity = "SI"
    elif "included" in text:
        clarity = "Included"
    else:
        clarity = "Eye Clean"

    # --- 6. Item Type & Category Harmonization ---
    cat = str(row.get("category", "")).strip()
    # JN Gems is strictly a loose gemstone merchant (all items are loose yellow/blue sapphires)
    if shop == "JN Gems":
        item_type = "Loose Gemstone"
        cat = "Loose Stone"
    elif any(k in text for k in ["full set", "fullset", "half set", "halfset"]):
        cat = "Jewelry Set"
        item_type = "Mounted Jewelry"
    elif "tie pin" in text or "cufflink" in text:
        cat = "Other"
        item_type = "Mounted Jewelry"
    elif cat not in ["Ring", "Earring", "Necklace", "Bracelet", "Loose Stone", "Jewelry Set"]:
        if any(k in text for k in ["ring", "band"]):
            cat = "Ring"
        elif any(k in text for k in ["earring", "stud", "hanger"]):
            cat = "Earring"
        elif any(k in text for k in ["necklace", "pendant", "chain"]):
            cat = "Necklace"
        elif any(k in text for k in ["bracelet", "bangle"]):
            cat = "Bracelet"
        elif item_type == "Mounted Jewelry":
            cat = "Other"
        else:
            cat = "Loose Stone"

    # --- 7. Metal & Metal Weight Parsing / Imputation ---
    parsed_metal = parse_metal_type(str(row.get("item_title", ""))) or parse_metal_type(text)
    metal = parsed_metal or row.get("metal")
    m_weight = row.get("metal_weight_g")
    
    if item_type == "Loose Gemstone":
        metal = np.nan
        m_weight = np.nan
    elif shop == "Chamathka Jewellers":
        metal = "925 Sterling Silver"
        if pd.isnull(m_weight) or m_weight == 0:
            m_weight = SILVER_WEIGHT_IMPUTATION.get(cat, 3.5)
    elif shop == "Mallika Hemachandra":
        # Keep real scraped weight, fix misclassified metal from title
        if not metal or metal == "925 Sterling Silver":
            metal = parse_metal_type(str(row.get("item_title", ""))) or "18K Yellow Gold"
    elif shop == "Nithyakalyani Jewellers":
        metal = "22KT Gold"

    # --- 8. Market Segment ---
    if item_type == "Mounted Jewelry":
        if shop == "Chamathka Jewellers":
            segment = "Retail Silver Gemstone Jewelry"
        else:
            segment = "Retail Gold Gemstone Jewelry"
    else:
        if shop == "GemStock":
            segment = "Loose Gemstone - Investment"
        elif shop == "Wijaya Gems":
            segment = "Loose Gemstone - Fine"
        else:
            segment = "Loose Gemstone - Commercial"

    # --- 9. Stone Grade Tier ---
    price_per_ct = row.get("price_per_ct_lkr")
    if pd.isnull(price_per_ct) or price_per_ct <= 0:
        if pd.notnull(row.get("weight_ct")) and row["weight_ct"] > 0 and pd.notnull(row.get("price_lkr")):
            price_per_ct = row["price_lkr"] / row["weight_ct"]

    if segment == "Loose Gemstone - Investment" or (price_per_ct and price_per_ct >= 500000):
        stone_grade = "AAAA (Investment)"
    elif segment == "Loose Gemstone - Fine" or (price_per_ct and price_per_ct >= 180000):
        stone_grade = "AAA (Extra Fine)"
    elif segment in ["Retail Gold Gemstone Jewelry", "Loose Gemstone - Commercial"] or (price_per_ct and price_per_ct >= 55000):
        stone_grade = "AA (Fine Jewelry)"
    else:
        stone_grade = "A (Commercial)"

    return {
        "seller": shop,
        "item_type_clean": item_type,
        "segment": segment,
        "stone_grade": stone_grade,
        "category_clean": cat,
        "color_grade": color,
        "treatment_clean": treatment,
        "clarity_grade": clarity,
        "origin": origin,
        "certificate": cert,
        "metal_clean": metal,
        "metal_weight_imputed": m_weight,
        "price_per_ct_imputed": price_per_ct
    }


def enrich_scraped_dataset(input_csv: str) -> pd.DataFrame:
    df = pd.read_csv(input_csv)
    print(f"[{os.path.basename(input_csv)}] Initial rows: {len(df)}")

    # Remove confectionery, voucher artifacts, and corrupted 0-price rows
    mask_glitch = (df["price_lkr"] < 1000) | (
        df["item_title"].str.contains(r"cake|fudge|voucher|chocolate|card", case=False, na=False)
    )
    dropped = df[mask_glitch]
    df = df[~mask_glitch].copy()
    print(f"[{os.path.basename(input_csv)}] Dropped {len(dropped)} non-jewelry / glitch rows.")

    # Apply attribute extraction
    parsed_records = [parse_attributes(row) for _, row in df.iterrows()]
    parsed_df = pd.DataFrame(parsed_records, index=df.index)

    # Merge enriched fields back
    df["seller"] = parsed_df["seller"]
    df["item_type"] = parsed_df["item_type_clean"]
    df["segment"] = parsed_df["segment"]
    df["stone_grade"] = parsed_df["stone_grade"]
    df["category"] = parsed_df["category_clean"]
    df["color_grade"] = parsed_df["color_grade"]
    df["treatment"] = parsed_df["treatment_clean"]
    df["clarity_grade"] = parsed_df["clarity_grade"]
    df["origin"] = parsed_df["origin"]
    df["certificate"] = parsed_df["certificate"]
    df["metal"] = parsed_df["metal_clean"]
    df["metal_weight_g"] = parsed_df["metal_weight_imputed"]
    df["price_per_ct_lkr"] = parsed_df["price_per_ct_imputed"]

    print(f"[{os.path.basename(input_csv)}] Clean rows remaining: {len(df)}")
    return df


def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    pricing_dir = os.path.join(base_dir, "data", "pricing_dataset")
    
    market_csv = os.path.join(pricing_dir, "scraped_market_listings.csv")
    finished_csv = os.path.join(pricing_dir, "finished_jewelry_dataset.csv")
    loose_csv = os.path.join(pricing_dir, "loose_gemstones_dataset.csv")

    print("==================================================================")
    print("Running Dataset Enrichment & Normalization Pipeline")
    print("==================================================================")

    # 1. Enrich Master Scraped Market Listings
    df_market = enrich_scraped_dataset(market_csv)
    df_market.to_csv(market_csv, index=False)
    print(f"Saved enriched master listings -> {market_csv}")

    # 2. Derive Clean Split Subsets
    df_finished = df_market[df_market["item_type"] == "Mounted Jewelry"].copy()
    df_loose = df_market[df_market["item_type"] == "Loose Gemstone"].copy()

    df_finished.to_csv(finished_csv, index=False)
    print(f"Saved clean finished jewelry ({len(df_finished)} rows) -> {finished_csv}")

    df_loose.to_csv(loose_csv, index=False)
    print(f"Saved clean loose gemstones ({len(df_loose)} rows) -> {loose_csv}")

    print("\n--- Summary Breakdown by Segment ---")
    summary = df_market.groupby("segment").agg(
        count=("price_lkr", "count"),
        min_price=("price_lkr", "min"),
        median_price=("price_lkr", "median"),
        max_price=("price_lkr", "max")
    )
    print(summary.to_string())

    print("\n--- Summary Breakdown by Stone Grade ---")
    grade_summary = df_market.groupby("stone_grade").agg(
        count=("price_lkr", "count"),
        min_price=("price_lkr", "min"),
        median_price=("price_lkr", "median"),
        max_price=("price_lkr", "max")
    )
    print(grade_summary.to_string())

    print("\n--- Chamathka Imputed Silver Weights ---")
    cham = df_market[df_market["source_shop"] == "Chamathka Jewellers"]
    print(cham.groupby("category")["metal_weight_g"].describe().to_string())


if __name__ == "__main__":
    main()
