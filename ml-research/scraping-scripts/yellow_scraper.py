import requests
from bs4 import BeautifulSoup
import pandas as pd
import time
import random

def scrape_yellow_sapphires():
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    product_links = []
    page = 1
    TARGET_RECORDS = 2000
    
    print("--- PHASE 1: Crawling Yellow Sapphire Catalog for Links ---")
    
    while len(product_links) < TARGET_RECORDS:
        print(f"Scanning catalog page {page}...")
        url = f"https://www.thenaturalsapphirecompany.com/yellow-sapphires/?page={page}"
        
        try:
            response = requests.get(url, headers=headers)
            soup = BeautifulSoup(response.text, 'html.parser')
            
            links = soup.find_all('a', href=True)
            page_links = []
            
            for a in links:
                href = a['href']
                # Target product detail URLs containing carat weight and yellow category
                if '/yellow-sapphires/' in href and 'ct-' in href.lower() and '?page=' not in href.lower():
                    full_url = "https://www.thenaturalsapphirecompany.com" + href if href.startswith('/') else href
                    if full_url not in product_links and full_url not in page_links:
                        page_links.append(full_url)
            
            if not page_links:
                print("No more links found on this page. Ending Phase 1 early.")
                break
                
            product_links.extend(page_links)
            print(f"Found {len(page_links)} new links. Total collected: {len(product_links)}")
            
            page += 1
            time.sleep(random.uniform(1.5, 3.0)) 
            
        except Exception as e:
            print(f"Error scanning page {page}: {e}")
            time.sleep(5)

    # Trim to exact target
    product_links = product_links[:TARGET_RECORDS]
    
    print(f"\n--- PHASE 2: Extracting Data from {len(product_links)} Yellow Sapphires ---")
    
    gemstone_data = []
    
    for idx, link in enumerate(product_links, 1):
        print(f"[{idx}/{len(product_links)}] Scraping: {link}")
        
        try:
            res = requests.get(link, headers=headers)
            detail_soup = BeautifulSoup(res.text, 'html.parser')
            
            # Helper for standard key-value table rows
            def get_val(test_id):
                row = detail_soup.find('tr', attrs={'data-testid': test_id})
                if row:
                    val_div = row.find('div', class_='table-component__value')
                    return val_div.text.strip() if val_div else None
                return None

            # Helper for nested dimensions (Length, Width, Height)
            def get_dim(test_id):
                div = detail_soup.find('div', attrs={'data-testid': test_id})
                if div:
                    return div.text.split(':')[-1].strip()
                return None

            item_id = get_val('row-item-id')
            weight = get_val('row-weight')
            color = get_val('row-color')
            intensity = get_val('row-color-intensity')
            clarity = get_val('row-clarity')
            shape = get_val('row-shape')
            cut = get_val('row-cut')
            treatment = get_val('row-enhancements')
            origin = get_val('row-origin')
            price_per_carat = get_val('row-per-carat-price')
            
            # Separate dimensions
            length = get_dim('dimensions-mm-length')
            width = get_dim('dimensions-mm-width')
            height = get_dim('dimensions-mm-height')
            
            # Extract and isolate USD price string
            total_price_div = detail_soup.find('div', attrs={'data-testid': 'details-item-price'})
            total_price_raw = total_price_div.text.strip() if total_price_div else None
            total_price = total_price_raw.split('USD')[0].strip() if total_price_raw else None

            gemstone_data.append({
                "Item_ID": item_id,
                "Total_Price": total_price,
                "Price_Per_Carat": price_per_carat,
                "Weight": weight,
                "Length": length,
                "Width": width,
                "Height": height,
                "Color": color,
                "Intensity": intensity,
                "Clarity": clarity,
                "Shape": shape,
                "Cut": cut,
                "Treatment": treatment,
                "Origin": origin,
                "URL": link
            })
            
        except Exception as e:
            print(f"Failed to scrape {link}. Error: {e}")
            
        time.sleep(random.uniform(1.5, 2.5))
        
        # Periodic autosave with write-lock protection
        if idx % 100 == 0:
            try:
                pd.DataFrame(gemstone_data).to_csv('yellow_sapphire_dataset_partial.csv', index=False)
                print("-> Backup saved to yellow_sapphire_dataset_partial.csv")
            except PermissionError:
                print("\n⚠️ WARNING: Backup file locked by another program. Continuing scrape...\n")

    # Final file output
    try:
        df = pd.DataFrame(gemstone_data)
        df.to_csv('yellow_sapphire_dataset_final.csv', index=False)
        print("\nSUCCESS! Dataset saved to yellow_sapphire_dataset_final.csv")
    except PermissionError:
        print("\n⚠️ Final file locked. Saving as 'yellow_sapphire_dataset_final_RECOVERY.csv'...")
        df.to_csv('yellow_sapphire_dataset_final_RECOVERY.csv', index=False)

if __name__ == "__main__":
    scrape_yellow_sapphires()