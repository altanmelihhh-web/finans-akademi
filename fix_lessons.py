#!/usr/bin/env python3
"""
Convert lesson-item divs to day-item format with checkboxes
"""

import re

# Read the file
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Define the day titles
day_titles = {
    10: "Trend Çizgileri ve Destek/Direnç",
    11: "Hareketli Ortalamalar (MA, EMA)",
    12: "RSI ve Momentum Göstergeleri",
    13: "MACD ve Sinyal Çizgileri",
    14: "Hafta 2 Tekrarı + Pratik",
    15: "Finansal Tablolar",
    16: "F/K, PD/DD Oranları",
    17: "Karlılık Metrikleri",
    18: "Nakit Akışı Analizi",
    19: "Sektör Analizi",
    20: "Şirket Değerleme",
    21: "Hafta 3 Tekrarı - Temel Analiz Ustası",
    22: "Portföy Yönetimi",
    23: "Risk Yönetimi",
    24: "Opsiyon ve Türevler (Giriş)",
    25: "İleri Konular (Özet)"  # Gün 25-30 birleşik
}

# Replace pattern for each day
for day_num in range(10, 26):
    # Find the old pattern
    old_pattern = f'<div class="lesson-item" data-day="{day_num}">\n' + \
                  r'\s*<div class="lesson-header">.*?</div>\n' + \
                  r'\s*<div class="lesson-content">'

    # New pattern
    new_pattern = f'''<div class="day-item">
                            <input type="checkbox" id="day{day_num}" class="day-checkbox">
                            <label for="day{day_num}" class="day-label">
                                <span class="day-number">Gün {day_num}</span>
                                <span class="day-title">{day_titles.get(day_num, f"Gün {day_num}")}</span>
                            </label>
                            <div class="day-content">'''

    # Replace
    content = re.sub(
        rf'<div class="lesson-item" data-day="{day_num}">\s*<div class="lesson-header">.*?</div>\s*<div class="lesson-content">',
        new_pattern,
        content,
        flags=re.DOTALL,
        count=1
    )

# Write back
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Converted all lesson-items to day-items!")
print("Converted days: 10-25")
