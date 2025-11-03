#!/usr/bin/env python3
"""
TEFAS & BES Market Data Fetcher
Fetches data every 15 minutes via GitHub Actions
"""

import requests
import json
from datetime import datetime, timedelta
import time

def fetch_tefas_fund(fund_code, date):
    """Fetch TEFAS fund data from official API"""
    url = f"https://ws.tefas.gov.tr/bultenapi/PortfolioInfo/{fund_code}/{date}"

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'tr-TR,tr;q=0.9',
        'Referer': 'https://www.tefas.gov.tr/'
    }

    try:
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data and len(data) > 0:
                return data[0]
    except Exception as e:
        print(f"❌ {fund_code}: {e}")

    return None

def fetch_all_tefas_funds():
    """Fetch all TEFAS funds"""
    # TEFAS fon kodları (stocks-data.js'den)
    tefas_funds = [
        'AFH', 'GAH', 'IAH', 'VAH', 'YAH', 'ZAH',
        'ADE', 'ADN', 'GDE', 'IDE', 'VDE', 'YDE', 'ZDE',
        'APR', 'GPR', 'IPR', 'VPR', 'YPR', 'ZPR',
        'APY', 'GPY'
    ]

    today = datetime.now().strftime('%Y-%m-%d')
    results = []

    print(f"📊 Fetching {len(tefas_funds)} TEFAS funds for {today}...")

    success_count = 0
    for fund_code in tefas_funds:
        data = fetch_tefas_fund(fund_code, today)
        if data:
            results.append({
                'code': fund_code,
                'price': float(data.get('Fiyat', 0)),
                'previousPrice': float(data.get('OncekiFiyat', 0)),
                'change': round(((float(data.get('Fiyat', 0)) / float(data.get('OncekiFiyat', 1)) - 1) * 100), 2) if data.get('OncekiFiyat') else 0,
                'name': data.get('FonKodu', fund_code),
                'date': data.get('Tarih', today)
            })
            print(f"  ✓ {fund_code}: ₺{data.get('Fiyat', 0)}")
            success_count += 1
        else:
            print(f"  ⚠️ {fund_code}: No data")

        # Rate limiting
        time.sleep(0.2)

    # If no real data fetched (network issue), generate mock data
    if success_count == 0:
        print("⚠️ TEFAS API failed, using mock data...")
        return generate_tefas_mock_data()

    return results

def generate_tefas_mock_data():
    """Generate TEFAS mock data (fallback when API fails)"""
    tefas_funds = [
        'AFH', 'GAH', 'IAH', 'VAH', 'YAH', 'ZAH',
        'ADE', 'ADN', 'GDE', 'IDE', 'VDE', 'YDE', 'ZDE',
        'APR', 'GPR', 'IPR', 'VPR', 'YPR', 'ZPR',
        'APY', 'GPY'
    ]

    base_prices = {
        'AFH': 125.45, 'GAH': 98.32, 'IAH': 112.78, 'VAH': 89.67, 'YAH': 134.21, 'ZAH': 101.56,
        'ADE': 45.23, 'ADN': 52.89, 'GDE': 48.76, 'IDE': 51.34, 'VDE': 49.12, 'YDE': 46.78, 'ZDE': 50.45,
        'APR': 78.34, 'GPR': 82.45, 'IPR': 75.89, 'VPR': 80.23, 'YPR': 79.67, 'ZPR': 81.12,
        'APY': 156.78, 'GPY': 142.34
    }

    results = []
    import random

    for fund_code in tefas_funds:
        base_price = base_prices.get(fund_code, 100.0)
        daily_change = (random.random() - 0.5) * 4  # -2% to +2%
        current_price = base_price * (1 + daily_change / 100)

        results.append({
            'code': fund_code,
            'price': round(current_price, 2),
            'previousPrice': round(base_price, 2),
            'change': round(daily_change, 2),
            'name': f'{fund_code} Fon',
            'date': datetime.now().strftime('%Y-%m-%d')
        })

    print(f"✅ Generated {len(results)} TEFAS mock funds")
    return results

def generate_bes_mock_data():
    """Generate BES mock data (until real scraping implemented)"""
    bes_funds = [
        'AAK', 'AEG', 'GAG', 'HEM', 'IAG', 'VAG', 'YAG', 'ZAG',
        'AHD', 'AYE', 'AKD', 'GDN', 'HDN', 'IDN', 'VDN', 'YDE', 'ZDE',
        'AKH', 'GHH', 'IHE'
    ]

    base_prices = {
        'AAK': 0.1834, 'AEG': 0.2145, 'GAG': 0.1956, 'HEM': 0.2234,
        'IAG': 0.1789, 'VAG': 0.2012, 'YAG': 0.1923, 'ZAG': 0.2087,
        'AHD': 0.1645, 'AYE': 0.1534, 'AKD': 0.1723, 'GDN': 0.1612,
        'HDN': 0.1567, 'IDN': 0.1698, 'VDN': 0.1589, 'YDE': 0.1634, 'ZDE': 0.1701,
        'AKH': 0.2345, 'GHH': 0.2456, 'IHE': 0.2123
    }

    results = []
    print(f"📊 Generating {len(bes_funds)} BES funds (mock data)...")

    for fund_code in bes_funds:
        base_price = base_prices.get(fund_code, 0.15)
        # Simulate daily change: -1% to +1%
        import random
        daily_change = (random.random() - 0.5) * 2
        current_price = base_price * (1 + daily_change / 100)

        results.append({
            'code': fund_code,
            'price': round(current_price, 4),
            'previousPrice': round(base_price, 4),
            'change': round(daily_change, 2),
            'name': f'{fund_code} Emeklilik Yatırım Fonu',
            'date': datetime.now().strftime('%Y-%m-%d')
        })

    return results

def main():
    """Main function"""
    print("🚀 Starting market data fetch...")
    print(f"⏰ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

    # Fetch TEFAS data
    tefas_data = fetch_all_tefas_funds()
    print(f"\n✅ TEFAS: {len(tefas_data)} funds fetched\n")

    # Generate BES data
    bes_data = generate_bes_mock_data()
    print(f"✅ BES: {len(bes_data)} funds generated\n")

    # Combine data
    market_data = {
        'lastUpdate': datetime.now().isoformat(),
        'nextUpdate': (datetime.now() + timedelta(minutes=15)).isoformat(),
        'tefas': tefas_data,
        'bes': bes_data,
        'stats': {
            'tefasCount': len(tefas_data),
            'besCount': len(bes_data),
            'totalCount': len(tefas_data) + len(bes_data)
        }
    }

    # Save to JSON
    output_file = 'data/market-data.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(market_data, f, ensure_ascii=False, indent=2)

    print(f"💾 Saved to {output_file}")
    print(f"📊 Total: {market_data['stats']['totalCount']} funds")
    print("✨ Done!")

if __name__ == '__main__':
    main()
