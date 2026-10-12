"""
Master Scraper Runner: Dual Dataset Architecture & Market Calibration (LKR Exclusive)
-------------------------------------------------------------------------------------
Executes all Sri Lankan merchant scrapers in pure Sri Lankan Rupees (LKR):
1. Loose Gemstones: Wijaya Gems, JN Gems, GemStock, Chanmel Gems
2. Mounted & Finished Jewelry: Chamathka Jewellers, Mallika Hemachandra, Nithyakalyani

Outputs strictly in LKR:
- data/pricing_dataset/loose_gemstones_dataset.csv
- data/pricing_dataset/finished_jewelry_dataset.csv
- data/pricing_dataset/scraped_market_listings.csv
"""

import sys
import os
import time

# Ensure project root is in sys.path when running as a standalone script
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import pandas as pd
import numpy as np

from src.scrapers.shopify_scraper import scrape_all_shopify_stores
from src.scrapers.woocommerce_scraper import scrape_all_woocommerce_stores
from src.common.config import get_base_dir


def safe_save_csv(df: pd.DataFrame, target_path: str):
    """Saves dataframe to CSV, using timestamped fallback if file is locked."""
    try:
        df.to_csv(target_path, index=False)
        print(f"Saved: {target_path}")
    except PermissionError:
        alt_path = target_path.replace(".csv", f"_updated_{int(time.time())}.csv")
        df.to_csv(alt_path, index=False)
        print(f"Notice: {os.path.basename(target_path)} locked by another app. Saved as: {os.path.basename(alt_path)}")


def run_crawlers_and_export():
    base_dir = get_base_dir()
    out_dir = os.path.join(base_dir, "data", "pricing_dataset")
    os.makedirs(out_dir, exist_ok=True)

    master_csv = os.path.join(out_dir, "scraped_market_listings.csv")
    loose_csv = os.path.join(out_dir, "loose_gemstones_dataset.csv")
    jewelry_csv = os.path.join(out_dir, "finished_jewelry_dataset.csv")

    print("=" * 70)
    print("SRI LANKAN GEM & JEWELRY DUAL-DATASET HARVESTER (LKR EXCLUSIVE)")
    print("=" * 70)

    # 1. Harvest Shopify (Loose Gems in Exact Storefront LKR)
    shopify_records = scrape_all_shopify_stores()

    # 2. Harvest WooCommerce & Retailers (Mounted Jewelry + Loose Gems in LKR)
    woo_records = scrape_all_woocommerce_stores()

    all_records = shopify_records + woo_records
    if not all_records:
        print("Error: No records harvested.")
        return

    df_all = pd.DataFrame(all_records)
    # Deduplicate by product URL
    df_all = df_all.drop_duplicates(subset=["product_url"]).reset_index(drop=True)
    df_all.insert(0, "market_id", [f"MKT_{i:04d}" for i in range(1, len(df_all) + 1)])

    # Ensure no raw_price or currency columns exist
    cols_to_drop = [c for c in ["raw_price", "currency"] if c in df_all.columns]
    if cols_to_drop:
        df_all = df_all.drop(columns=cols_to_drop)

    # Master save
    safe_save_csv(df_all, master_csv)

    # =========================================================================
    # Dataset 1: Loose Gemstones Dataset (LKR Only)
    # =========================================================================
    df_loose = df_all[df_all["item_type"] == "Loose Gemstone"].copy()
    mask_weight = df_loose["weight_ct"].notnull() & (df_loose["weight_ct"] > 0)
    df_loose.loc[mask_weight, "price_per_ct_lkr"] = (
        df_loose.loc[mask_weight, "price_lkr"] / df_loose.loc[mask_weight, "weight_ct"]
    ).round(2)
    # Drop unneeded metal columns from loose stones
    loose_drop = [c for c in ["metal", "metal_weight_g"] if c in df_loose.columns]
    if loose_drop:
        df_loose = df_loose.drop(columns=loose_drop)
    safe_save_csv(df_loose, loose_csv)

    # =========================================================================
    # Dataset 2: Finished & Mounted Jewelry Dataset (LKR Only)
    # =========================================================================
    df_jewelry = df_all[df_all["item_type"] == "Mounted Jewelry"].copy()
    safe_save_csv(df_jewelry, jewelry_csv)

    print("\n" + "=" * 70)
    print("EMPIRICAL HARVESTING SUMMARY (STRICTLY LKR)")
    print("=" * 70)

    print("\n--- Distribution by Source Merchant ---")
    print(df_all["source_shop"].value_counts())

    print("\n--- Distribution by Category ---")
    print(df_all["category"].value_counts())

    print("\n--- Finished Jewelry Metals Breakdown ---")
    if len(df_jewelry) > 0 and "metal" in df_jewelry.columns:
        print(df_jewelry["metal"].value_counts())

    valid_loose = df_loose[df_loose["weight_ct"].notnull() & (df_loose["weight_ct"] > 0)].copy()
    if len(valid_loose) > 0:
        print(f"\n--- Empirical Loose Sapphires (N={len(valid_loose)}) ---")
        print(f"Weight Range: {valid_loose['weight_ct'].min():.2f} ct - {valid_loose['weight_ct'].max():.2f} ct")
        print(f"Price Range (LKR): Rs. {valid_loose['price_lkr'].min():,.0f} - Rs. {valid_loose['price_lkr'].max():,.0f}")
        print(f"Median LKR/ct: Rs. {valid_loose['price_per_ct_lkr'].median():,.0f}")


if __name__ == "__main__":
    run_crawlers_and_export()
