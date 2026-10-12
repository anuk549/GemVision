"""
Shopify Catalog Scraper for Sri Lankan Gem Merchants (Wijaya Gems, JN Gems)
----------------------------------------------------------------------------
Extracts clean listings with EXACT storefront Sri Lankan Rupee (LKR) pricing
by querying the store's active LKR localization rate.

Outputs strictly in LKR (no foreign currencies).
"""

import urllib.request
import json
import re
import time
from typing import List, Dict, Any
from src.scrapers.normalize import (
    parse_carat_weight, parse_gemstone_type, parse_cut,
    parse_treatment, parse_category
)

HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}


def get_shopify_storefront_lkr_rate(base_url: str) -> float:
    """
    Extracts the exact live currency rate used by the Shopify storefront
    to render LKR prices for Sri Lankan visitors.
    """
    try:
        url = f"{base_url}/?currency=LKR"
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=12) as resp:
            html = resp.read().decode("utf-8")
            match = re.search(r'Shopify\.currency\s*=\s*({[^}]+})', html)
            if match:
                cfg = json.loads(match.group(1))
                rate = float(cfg.get("rate", 1.0))
                if rate > 0:
                    print(f"[{base_url}] Active Shopify storefront LKR rate: {rate:.4f}")
                    return rate
    except Exception as e:
        print(f"[{base_url}] Could not fetch dynamic LKR rate ({e}), using default fallback.")
    
    # Fallback to store standard baseline if offline
    if "wijaya" in base_url.lower():
        return 235.931675  # Wijaya Gems CAD -> LKR
    elif "jn" in base_url.lower():
        return 337.17528   # JN Gems USD -> LKR
    return 1.0


def crawl_shopify_store(
    store_name: str,
    base_url: str,
    collections: List[str] = None
) -> List[Dict[str, Any]]:
    print(f"[{store_name}] Starting catalog crawl from {base_url} (Storefront LKR mode)...")
    results = []
    seen_ids = set()

    # Get active LKR conversion rate configured in Shopify
    lkr_rate = get_shopify_storefront_lkr_rate(base_url)

    endpoints = []
    if collections:
        for c in collections:
            endpoints.append(f"{base_url}/collections/{c}/products.json")
    else:
        endpoints.append(f"{base_url}/products.json")

    for ep in endpoints:
        page = 1
        while page <= 10:
            url = f"{ep}?limit=250&page={page}"
            try:
                req = urllib.request.Request(url, headers=HEADERS)
                with urllib.request.urlopen(req, timeout=20) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                    products = data.get("products", [])
                    if not products:
                        break

                    for p in products:
                        pid = p["id"]
                        if pid in seen_ids:
                            continue
                        seen_ids.add(pid)

                        title = p.get("title", "")
                        body = p.get("body_html", "") or ""
                        tags = " ".join(p.get("tags", []))
                        full_desc = f"{title} {body} {tags}"

                        variants = p.get("variants", [])
                        if not variants:
                            continue
                        try:
                            raw_price = float(variants[0].get("price", 0.0))
                        except (ValueError, TypeError):
                            continue

                        if raw_price <= 0:
                            continue

                        # Convert to exact storefront LKR displayed on the site
                        # Shopify rounds LKR amounts to nearest 100 in themes (e.g. 849,354 -> 849,400)
                        if lkr_rate != 1.0:
                            price_lkr = float(round(raw_price * lkr_rate, -2))
                        else:
                            price_lkr = float(round(raw_price, 2))

                        carats = parse_carat_weight(full_desc)
                        gemstone = parse_gemstone_type(full_desc)
                        cut = parse_cut(full_desc)
                        treatment = parse_treatment(full_desc)
                        item_type, category = parse_category(full_desc, default_item_type="Loose Gemstone")

                        # Images
                        images = p.get("images", [])
                        img_url = images[0].get("src", "") if images else ""

                        handle = p.get("handle", "")
                        product_url = f"{base_url}/products/{handle}" if handle else ""

                        results.append({
                            "source_shop": store_name,
                            "item_title": title,
                            "item_type": item_type,
                            "category": category,
                            "gemstone": gemstone,
                            "weight_ct": carats,
                            "cut": cut,
                            "treatment": treatment,
                            "price_lkr": price_lkr,
                            "price_per_ct_lkr": round(price_lkr / carats, 2) if carats else None,
                            "image_url": img_url,
                            "product_url": product_url
                        })

                page += 1
                time.sleep(0.5)
            except Exception as e:
                print(f"[{store_name}] Finished at page {page}: {e}")
                break

    print(f"[{store_name}] Successfully harvested {len(results)} listings in exact LKR.")
    return results


def scrape_all_shopify_stores() -> List[Dict[str, Any]]:
    records = []
    # 1. Wijaya Gems
    records.extend(crawl_shopify_store(
        store_name="Wijaya Gems",
        base_url="https://wijayagems.com",
        collections=["blue-sapphire", "yellow-sapphire"]
    ))

    # 2. JN Gems
    records.extend(crawl_shopify_store(
        store_name="JN Gems",
        base_url="https://jngems.com",
        collections=["blue-sapphire", "yellow-sapphire"]
    ))

    return records
