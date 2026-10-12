"""
WooCommerce & Retail Merchant Scrapers for Sri Lankan Jewellers & Gem Merchants
---------------------------------------------------------------------------------
Harvesters for:
1. Chamathka Jewellers (Mounted Jewelry - Silver & Gold with Blue/Yellow Sapphires)
   - Deep crawls product pages to extract exact carats, metals, dimensions, and high-res gallery images.
2. GemStock (Loose Blue & Yellow Sapphires)
   - Resolves full absolute image and product URLs, converts to LKR.
3. Chanmel Gems (Loose Ceylon Sapphires)
   - Converts to LKR, extracts carat weights and cert specs.
4. Mallika Hemachandra (Mounted Jewelry & Plain Gold)
   - Extracts exact metal weight (g), karatage (22kt/18kt), and LKR prices.
5. Nithyakalyani Jewellers (Gold Necklaces, Earrings, Rings)
   - Extracts 22kt gold items, lengths, and LKR prices.
6. Raja Jewellers (Gold & Gemstone Jewellery)
   - Extracts gold standards (18kt, 22kt, 24kt), categories, and LKR prices.

Outputs strictly in Sri Lankan Rupees (LKR).
"""

import re
import time
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from typing import List, Dict, Any

from src.scrapers.normalize import (
    parse_carat_weight, parse_metal_weight_grams, parse_metal_type,
    parse_gemstone_type, parse_cut, parse_treatment, parse_category,
    parse_dimensions
)
from src.common.precious_metals_api import metals_service

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
}


# =========================================================================
# 1. Chamathka Jewellers (Mounted Gemstone Jewelry)
# =========================================================================
def crawl_chamathka() -> List[Dict[str, Any]]:
    print("[Chamathka Jewellers] Harvesting mounted sapphire jewelry...")
    base_url = "https://www.chamathkajewellers.lk/product-category/bluesapphire"
    results = []
    seen_urls = set()
    prod_links = []

    for page in range(1, 4):
        url = f"{base_url}/page/{page}/" if page > 1 else f"{base_url}/"
        try:
            r = requests.get(url, headers=HEADERS, timeout=12)
            if r.status_code != 200:
                break
            soup = BeautifulSoup(r.text, "html.parser")
            for a in soup.find_all("a", href=True):
                href = a["href"].strip()
                if "/product/" in href and not any(k in href for k in ["add-to-cart", "wishlist"]):
                    full_link = urljoin("https://www.chamathkajewellers.lk", href)
                    if full_link not in seen_urls:
                        seen_urls.add(full_link)
                        prod_links.append(full_link)
            time.sleep(0.5)
        except Exception:
            break

    print(f"[Chamathka] Found {len(prod_links)} unique product links. Extracting full specifications...")

    for link in prod_links:
        try:
            r = requests.get(link, headers=HEADERS, timeout=12)
            if r.status_code != 200:
                continue
            soup = BeautifulSoup(r.text, "html.parser")

            h1 = soup.find("h1")
            title = h1.text.strip() if h1 else ""
            if not title or "404" in title:
                continue

            price_tag = soup.find(class_=lambda c: c and "price" in c)
            if not price_tag:
                continue
            # Use specific currency regex that stops at 2 decimal places to avoid installment text '3 X Rs.'
            p_match = re.search(r'(?:LKR|Rs\.?)\s*([0-9,]+(?:\.[0-9]{2})?)', price_tag.text)
            if not p_match:
                continue
            price_lkr = float(p_match.group(1).replace(",", ""))
            if price_lkr <= 100:  # Ignore test or 0-value items
                continue

            # Full image extraction: find large image and ignore placeholder GIF
            img_url = ""
            gallery = soup.find("div", class_=lambda c: c and "woocommerce-product-gallery" in c)
            if gallery:
                for img in gallery.find_all("img"):
                    src = img.get("data-large_image") or img.get("data-src") or img.get("src", "")
                    if src and "prod_loading" not in src and "wp-content/uploads" in src:
                        img_url = src
                        break

            if not img_url:
                for img in soup.find_all("img"):
                    src = img.get("data-large_image") or img.get("data-src") or img.get("src", "")
                    if src and "prod_loading" not in src and "wp-content/uploads" in src and any(k in src for k in ["Ring", "Pendant", "Earring"]):
                        img_url = src
                        break

            full_text = soup.get_text()
            weight_ct = parse_carat_weight(full_text)
            metal_type = parse_metal_type(full_text)
            gemstone = parse_gemstone_type(title + " " + full_text)
            dim = parse_dimensions(full_text)
            item_type, category = parse_category(title, default_item_type="Mounted Jewelry")

            results.append({
                "source_shop": "Chamathka Jewellers",
                "item_title": title,
                "item_type": "Mounted Jewelry",
                "category": category,
                "gemstone": gemstone,
                "weight_ct": weight_ct,
                "metal": metal_type,
                "metal_weight_g": None,
                "cut": parse_cut(full_text),
                "treatment": "Natural / Handcrafted",
                "dimensions_mm": dim,
                "price_lkr": price_lkr,
                "price_per_ct_lkr": round(price_lkr / weight_ct, 2) if weight_ct else None,
                "image_url": img_url,
                "product_url": link
            })
            time.sleep(0.3)
        except Exception:
            continue

    print(f"[Chamathka Jewellers] Successfully extracted {len(results)} mounted jewelry items.")
    return results


# =========================================================================
# 2. GemStock (Loose Ceylon Sapphires - Converted to LKR)
# =========================================================================
def crawl_gemstock() -> List[Dict[str, Any]]:
    print("[GemStock] Scraping loose sapphires with absolute URLs...")
    collections = [
        ("https://gemstock.org/collection/sapphire-blue", "Blue Sapphire"),
        ("https://gemstock.org/collection/sapphire-yellow", "Yellow Sapphire")
    ]
    results = []
    seen = set()
    prod_links = []

    for base_url, default_gem in collections:
        for page in range(1, 4):
            url = f"{base_url}/page/{page}/" if page > 1 else f"{base_url}/"
            try:
                r = requests.get(url, headers=HEADERS, timeout=12)
                if r.status_code != 200:
                    break
                soup = BeautifulSoup(r.text, "html.parser")
                for a in soup.find_all("a", href=True):
                    href = a["href"].strip()
                    if "/product/" in href:
                        full_link = urljoin("https://gemstock.org", href)
                        if full_link not in seen:
                            seen.add(full_link)
                            prod_links.append((full_link, default_gem))
                time.sleep(0.5)
            except Exception:
                break

    print(f"[GemStock] Found {len(prod_links)} product pages. Extracting specs & prices...")

    for link, default_gem in prod_links:
        try:
            r = requests.get(link, headers=HEADERS, timeout=12)
            if r.status_code != 200:
                continue
            soup = BeautifulSoup(r.text, "html.parser")
            h1 = soup.find("h1")
            title = h1.text.strip() if h1 else ""
            if not title:
                continue

            price_tag = soup.find(class_=lambda c: c and "price" in c)
            if not price_tag:
                continue
            p_text = price_tag.text.strip()

            m_usd = re.search(r'\$([0-9,.]+)', p_text)
            m_lkr = re.search(r'Rs\.?\s*([0-9,.]+)', p_text) or re.search(r'([0-9,.]+)\s*LKR', p_text)

            if m_usd:
                raw_price = float(m_usd.group(1).replace(",", ""))
                price_lkr = metals_service.convert_usd_to_lkr(raw_price)
            elif m_lkr:
                price_lkr = float(m_lkr.group(1).replace(",", ""))
            else:
                continue

            img = soup.find("div", class_=lambda c: c and "image" in c)
            img_url = ""
            if img and img.find("img"):
                img_url = img.find("img").get("data-src") or img.find("img").get("src", "")
            if not img_url and soup.find("img"):
                img_url = soup.find("img").get("src", "")
            img_url = urljoin("https://gemstock.org", img_url)

            carats = parse_carat_weight(title) or parse_carat_weight(soup.get_text())
            gemstone = parse_gemstone_type(title) or default_gem

            results.append({
                "source_shop": "GemStock",
                "item_title": title,
                "item_type": "Loose Gemstone",
                "category": "Loose Stone",
                "gemstone": gemstone,
                "weight_ct": carats,
                "metal": "None",
                "metal_weight_g": 0.0,
                "cut": parse_cut(title),
                "treatment": parse_treatment(title),
                "dimensions_mm": parse_dimensions(title),
                "price_lkr": price_lkr,
                "price_per_ct_lkr": round(price_lkr / carats, 2) if carats else None,
                "image_url": img_url,
                "product_url": link
            })
            time.sleep(0.3)
        except Exception:
            continue

    print(f"[GemStock] Successfully harvested {len(results)} loose gemstone listings in LKR.")
    return results


# =========================================================================
# 3. Chanmel Gems (Loose Ceylon Sapphires - Converted to LKR)
# =========================================================================
def crawl_chanmel_gems() -> List[Dict[str, Any]]:
    print("[Chanmel Gems] Scraping loose Ceylon sapphires (Converted to LKR)...")
    collections = [
        "https://www.chanmelgems.lk/product-category/gemstones/sapphires/blue-sapphire/",
        "https://www.chanmelgems.lk/product-category/gemstones/sapphires/yellow-sapphire/"
    ]
    results = []
    seen_links = set()
    prod_links = []

    for cat_url in collections:
        for page in range(1, 3):
            url = f"{cat_url}page/{page}/" if page > 1 else cat_url
            try:
                r = requests.get(url, headers=HEADERS, timeout=12)
                if r.status_code != 200:
                    break
                soup = BeautifulSoup(r.text, "html.parser")
                for a in soup.find_all("a", href=True):
                    href = a["href"].strip()
                    if "/product/" in href and not any(k in href for k in ["add-to-cart", "wishlist"]):
                        full_link = urljoin("https://www.chanmelgems.lk", href)
                        if full_link not in seen_links:
                            seen_links.add(full_link)
                            prod_links.append(full_link)
                time.sleep(0.5)
            except Exception:
                break

    print(f"[Chanmel Gems] Found {len(prod_links)} product pages. Extracting specs & prices...")

    for link in prod_links:
        try:
            r = requests.get(link, headers=HEADERS, timeout=12)
            if r.status_code != 200:
                continue
            soup = BeautifulSoup(r.text, "html.parser")

            h1 = soup.find("h1")
            title = h1.text.strip() if h1 else ""
            if not title:
                continue

            price_tag = soup.find(class_=lambda c: c and "price" in c)
            if not price_tag:
                continue
            usd_matches = re.findall(r'\$([0-9,.]+)', price_tag.text)
            if not usd_matches:
                continue
            usd_amounts = [float(p.replace(",", "")) for p in usd_matches if p.replace(",", "").replace(".", "").isdigit()]
            if not usd_amounts:
                continue
            price_usd = min(usd_amounts)
            price_lkr = metals_service.convert_usd_to_lkr(price_usd)

            full_text = soup.get_text()
            weight_ct = parse_carat_weight(full_text) or parse_carat_weight(title)
            gemstone = parse_gemstone_type(title + " " + full_text)
            cut = parse_cut(full_text)
            treatment = parse_treatment(full_text)
            dim = parse_dimensions(full_text)

            img_tag = soup.find("div", class_=lambda c: c and "woocommerce-product-gallery" in c)
            img_url = ""
            if img_tag and img_tag.find("img"):
                img_url = img_tag.find("img").get("data-large_image") or img_tag.find("img").get("src", "")
            if not img_url and soup.find("img"):
                img_url = soup.find("img").get("src", "")
            img_url = urljoin("https://www.chanmelgems.lk", img_url)

            results.append({
                "source_shop": "Chanmel Gems",
                "item_title": title,
                "item_type": "Loose Gemstone",
                "category": "Loose Stone",
                "gemstone": gemstone,
                "weight_ct": weight_ct,
                "metal": "None",
                "metal_weight_g": 0.0,
                "cut": cut,
                "treatment": treatment,
                "dimensions_mm": dim,
                "price_lkr": price_lkr,
                "price_per_ct_lkr": round(price_lkr / weight_ct, 2) if weight_ct else None,
                "image_url": img_url,
                "product_url": link
            })
            time.sleep(0.3)
        except Exception:
            continue

    print(f"[Chanmel Gems] Successfully harvested {len(results)} loose Ceylon sapphires in LKR.")
    return results


# =========================================================================
# 4. Mallika Hemachandra (Mounted Jewelry & Plain Gold with Metal Weights)
# =========================================================================
def crawl_mallika_hemachandra() -> List[Dict[str, Any]]:
    print("[Mallika Hemachandra] Harvesting jewelry with exact metal weights & karatage...")
    categories = [
        "https://mallikahemachandra.com/product-category/rings/",
        "https://mallikahemachandra.com/product-category/necklaces/",
        "https://mallikahemachandra.com/product-category/ear-studs/"
    ]
    results = []
    seen = set()
    prod_links = []

    for cat_url in categories:
        for page in range(1, 3):
            url = f"{cat_url}page/{page}/" if page > 1 else cat_url
            try:
                r = requests.get(url, headers=HEADERS, timeout=12)
                if r.status_code != 200:
                    break
                soup = BeautifulSoup(r.text, "html.parser")
                for a in soup.find_all("a", href=True):
                    href = a["href"].strip()
                    if "/product/" in href and not any(k in href for k in ["add-to-cart", "wishlist"]):
                        full_link = urljoin("https://mallikahemachandra.com", href)
                        if full_link not in seen:
                            seen.add(full_link)
                            prod_links.append(full_link)
                time.sleep(0.5)
            except Exception:
                break

    print(f"[Mallika Hemachandra] Found {len(prod_links)} products. Parsing specifications...")

    for link in prod_links:
        try:
            r = requests.get(link, headers=HEADERS, timeout=12)
            if r.status_code != 200:
                continue
            soup = BeautifulSoup(r.text, "html.parser")

            h1 = soup.find("h1")
            title = h1.text.strip() if h1 else ""
            if not title:
                continue

            price_tag = soup.find(class_=lambda c: c and "price" in c)
            if not price_tag:
                continue
            m = re.search(r'Rs\.?\s*([0-9,.]+)', price_tag.text)
            if not m:
                continue
            price_lkr = float(m.group(1).replace(",", ""))

            full_text = soup.get_text()
            metal_weight = parse_metal_weight_grams(full_text)
            metal_type = parse_metal_type(title + " " + full_text)
            gemstone = parse_gemstone_type(title + " " + full_text)
            weight_ct = parse_carat_weight(full_text)
            item_type, category = parse_category(title, default_item_type="Mounted Jewelry")

            img_tag = soup.find("div", class_=lambda c: c and "woocommerce-product-gallery" in c)
            img_url = ""
            if img_tag and img_tag.find("img"):
                img_url = img_tag.find("img").get("data-large_image") or img_tag.find("img").get("src", "")
            img_url = urljoin("https://mallikahemachandra.com", img_url)

            results.append({
                "source_shop": "Mallika Hemachandra",
                "item_title": title,
                "item_type": "Mounted Jewelry",
                "category": category,
                "gemstone": gemstone,
                "weight_ct": weight_ct,
                "metal": metal_type,
                "metal_weight_g": metal_weight,
                "cut": parse_cut(full_text),
                "treatment": "Manufactured Fine Jewelry",
                "dimensions_mm": parse_dimensions(full_text),
                "price_lkr": price_lkr,
                "price_per_ct_lkr": None,
                "image_url": img_url,
                "product_url": link
            })
            time.sleep(0.3)
        except Exception:
            continue

    print(f"[Mallika Hemachandra] Successfully harvested {len(results)} jewelry items in LKR.")
    return results


# =========================================================================
# 5. Nithyakalyani Jewellers (22kt Gold Items, Necklaces, Rings, Earrings)
# =========================================================================
def crawl_nithyakalyani() -> List[Dict[str, Any]]:
    print("[Nithyakalyani Jewellers] Harvesting gold jewelry catalog...")
    endpoints = [
        "https://nithyakalyani.com/product-category/gold/necklaces/",
        "https://nithyakalyani.com/product-category/gold/earrings/",
        "https://nithyakalyani.com/product-category/gold/rings/"
    ]
    results = []
    seen = set()
    prod_links = []

    for ep in endpoints:
        for page in range(1, 3):
            url = f"{ep}page/{page}/" if page > 1 else ep
            try:
                r = requests.get(url, headers=HEADERS, timeout=12)
                if r.status_code != 200:
                    break
                soup = BeautifulSoup(r.text, "html.parser")
                for a in soup.find_all("a", href=True):
                    href = a["href"].strip()
                    if "/product/" in href and not any(k in href for k in ["add-to-cart", "wishlist"]):
                        full_link = urljoin("https://nithyakalyani.com", href)
                        if full_link not in seen:
                            seen.add(full_link)
                            prod_links.append(full_link)
                time.sleep(0.5)
            except Exception:
                break

    print(f"[Nithyakalyani] Found {len(prod_links)} products. Extracting details...")

    for link in prod_links:
        try:
            r = requests.get(link, headers=HEADERS, timeout=12)
            if r.status_code != 200:
                continue
            soup = BeautifulSoup(r.text, "html.parser")

            h1 = soup.find("h1")
            title = h1.text.strip() if h1 else ""
            if not title:
                continue

            price_tag = soup.find(class_=lambda c: c and "price" in c)
            if not price_tag:
                continue
            m = re.search(r'LKR\s*([0-9,.]+)', price_tag.text) or re.search(r'Rs\.?\s*([0-9,.]+)', price_tag.text)
            if not m:
                continue
            price_lkr = float(m.group(1).replace(",", ""))

            full_text = soup.get_text()
            item_type, category = parse_category(title + " " + link, default_item_type="Mounted Jewelry")
            metal_type = parse_metal_type(full_text)
            gemstone = parse_gemstone_type(full_text)

            gallery = soup.find("div", class_=lambda c: c and "woocommerce-product-gallery" in c)
            img_url = ""
            if gallery and gallery.find("img"):
                img_url = gallery.find("img").get("data-large_image") or gallery.find("img").get("src", "")
            img_url = urljoin("https://nithyakalyani.com", img_url)

            results.append({
                "source_shop": "Nithyakalyani Jewellers",
                "item_title": title,
                "item_type": "Mounted Jewelry",
                "category": category,
                "gemstone": gemstone,
                "weight_ct": None,
                "metal": metal_type,
                "metal_weight_g": parse_metal_weight_grams(full_text),
                "cut": "Traditional Craftsmanship",
                "treatment": "Hallmarked 22KT Gold",
                "dimensions_mm": parse_dimensions(full_text),
                "price_lkr": price_lkr,
                "price_per_ct_lkr": None,
                "image_url": img_url,
                "product_url": link
            })
            time.sleep(0.3)
        except Exception:
            continue

    print(f"[Nithyakalyani Jewellers] Successfully harvested {len(results)} gold items in LKR.")
    return results


# =========================================================================
# 6. Raja Jewellers (Gold Standards & Fine Jewelry)
# =========================================================================
def crawl_raja_jewellers(max_items: int = 50) -> List[Dict[str, Any]]:
    print(f"[Raja Jewellers] Harvesting up to {max_items} jewelry listings via catalog sitemap...")
    results = []
    try:
        r = requests.get("https://www.rajajewellers.com/product-sitemap.xml", headers=HEADERS, timeout=12)
        if r.status_code != 200:
            return results
        urls = re.findall(r'<loc><!\[CDATA\[(https://www.rajajewellers.com/product/[^\]]+)\]\]></loc>', r.text)
        if not urls:
            urls = re.findall(r'<loc>\s*(https://www.rajajewellers.com/product/[^<]+)\s*</loc>', r.text)
        sample_locs = urls[:max_items]

        for link in sample_locs:
            try:
                rp = requests.get(link, headers=HEADERS, timeout=10)
                if rp.status_code != 200:
                    continue
                sp = BeautifulSoup(rp.text, "html.parser")
                h1 = sp.find("h1")
                title = h1.text.strip() if h1 else ""
                if not title:
                    continue

                price_tag = sp.find(class_=lambda c: c and "price" in c)
                if not price_tag:
                    continue
                m = re.search(r'(?:Rs\.?|රු|LKR)?\s*([0-9,.]+)', price_tag.text)
                if not m:
                    continue
                raw_num = m.group(1).replace(",", "")
                try:
                    price_lkr = float(raw_num)
                except ValueError:
                    continue

                if price_lkr < 5000:
                    continue

                full_text = sp.get_text()
                item_type, category = parse_category(title, default_item_type="Mounted Jewelry")
                metal_type = parse_metal_type(title + " " + full_text)
                gemstone = parse_gemstone_type(title + " " + full_text)

                gallery = sp.find("div", class_=lambda c: c and "woocommerce-product-gallery" in c)
                img_url = ""
                if gallery and gallery.find("img"):
                    img_url = gallery.find("img").get("data-large_image") or gallery.find("img").get("src", "")
                img_url = urljoin("https://www.rajajewellers.com", img_url)

                results.append({
                    "source_shop": "Raja Jewellers",
                    "item_title": title,
                    "item_type": "Mounted Jewelry",
                    "category": category,
                    "gemstone": gemstone,
                    "weight_ct": parse_carat_weight(full_text),
                    "metal": metal_type,
                    "metal_weight_g": parse_metal_weight_grams(full_text),
                    "cut": parse_cut(full_text),
                    "treatment": "Fine Handcrafted",
                    "dimensions_mm": parse_dimensions(full_text),
                    "price_lkr": price_lkr,
                    "price_per_ct_lkr": None,
                    "image_url": img_url,
                    "product_url": link
                })
                time.sleep(0.3)
            except Exception:
                continue
    except Exception as e:
        print(f"[Raja Jewellers] Error: {e}")

    print(f"[Raja Jewellers] Successfully harvested {len(results)} items in LKR.")
    return results


def scrape_all_woocommerce_stores() -> List[Dict[str, Any]]:
    records = []
    # 1. Chamathka (Mounted jewelry with real images & specs)
    records.extend(crawl_chamathka())
    # 2. GemStock (Loose sapphires with absolute URLs)
    records.extend(crawl_gemstock())
    # 3. Chanmel Gems (Loose Ceylon sapphires with USD converted to LKR)
    records.extend(crawl_chanmel_gems())
    # 4. Mallika Hemachandra (Mounted & plain gold with metal weights)
    records.extend(crawl_mallika_hemachandra())
    # 5. Nithyakalyani (Gold necklaces, rings, earrings)
    records.extend(crawl_nithyakalyani())
    return records
