#!/usr/bin/env python3
"""
Split Day 25 (which contains 25-30) into separate days
"""

# Gün 25 sonrası eklenecek içerik
days_26_30 = '''
                        <!-- GÜN 26: KRİPTO PARA -->
                        <div class="day-item">
                            <input type="checkbox" id="day26" class="day-checkbox">
                            <label for="day26" class="day-label">
                                <span class="day-number">Gün 26</span>
                                <span class="day-title">Kripto Para (Bitcoin, Ethereum)</span>
                            </label>
                            <div class="day-content">
                                <h4>₿ Bitcoin (BTC)</h4>
                                <ul>
                                    <li><strong>İlk kripto:</strong> 2009 - Satoshi Nakamoto</li>
                                    <li><strong>Max supply:</strong> 21 milyon BTC</li>
                                    <li><strong>Digital gold:</strong> Değer saklama aracı</li>
                                </ul>

                                <h4>⚡ Ethereum (ETH)</h4>
                                <ul>
                                    <li><strong>Smart Contracts:</strong> Programlanabilir blockchain</li>
                                    <li><strong>DeFi:</strong> Decentralized Finance uygulamaları</li>
                                    <li><strong>NFT:</strong> Non-Fungible Tokens</li>
                                </ul>

                                <h4>🔐 Wallet Türleri</h4>
                                <ul>
                                    <li><strong>Hot Wallet:</strong> Online (Binance, Coinbase) - Kolay ama riskli</li>
                                    <li><strong>Cold Wallet:</strong> Offline (Ledger, Trezor) - Güvenli</li>
                                </ul>

                                <div class="key-takeaways">
                                    <h4>🔑 Anahtar Noktalar:</h4>
                                    <ul>
                                        <li>✅ Bitcoin = Digital gold (değer saklama)</li>
                                        <li>✅ Ethereum = Smart contract platformu</li>
                                        <li>✅ Blockchain = Merkeziyetsiz, şeffaf sistem</li>
                                        <li>⚠️ Aşırı volatilite - portföyün max %10'u</li>
                                        <li>⚠️ Cold wallet kullan (güvenlik)</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <!-- GÜN 27: ALTIN VE EMTİA -->
                        <div class="day-item">
                            <input type="checkbox" id="day27" class="day-checkbox">
                            <label for="day27" class="day-label">
                                <span class="day-number">Gün 27</span>
                                <span class="day-title">Altın ve Emtia</span>
                            </label>
                            <div class="day-content">
                                <h4>🥇 Altın - Güvenli Liman</h4>
                                <ul>
                                    <li><strong>Enflasyon koruması:</strong> Değerini korur</li>
                                    <li><strong>Kriz dönemlerinde:</strong> Hisse düşer, altın yükselir</li>
                                    <li><strong>Negatif korelasyon:</strong> Dolara ters orantılı</li>
                                </ul>

                                <h4>🛢️ Petrol</h4>
                                <ul>
                                    <li><strong>WTI:</strong> West Texas Intermediate (US)</li>
                                    <li><strong>Brent:</strong> Kuzey Denizi (Europe)</li>
                                </ul>

                                <h4>📊 Emtia ETF'leri</h4>
                                <ul>
                                    <li><strong>GLD:</strong> Altın ETF</li>
                                    <li><strong>USO:</strong> Petrol ETF</li>
                                    <li><strong>SLV:</strong> Gümüş ETF</li>
                                </ul>

                                <div class="key-takeaways">
                                    <h4>🔑 Anahtar Noktalar:</h4>
                                    <ul>
                                        <li>✅ Altın = Enflasyon + kriz koruması</li>
                                        <li>✅ Emtia = Fiziksel varlıklar</li>
                                        <li>✅ Portföyde %10-15 altın tavsiye</li>
                                        <li>⚠️ Petrol çok volatil - riskli</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <!-- GÜN 28: GAYRİMENKUL (GYO/REIT) -->
                        <div class="day-item">
                            <input type="checkbox" id="day28" class="day-checkbox">
                            <label for="day28" class="day-label">
                                <span class="day-number">Gün 28</span>
                                <span class="day-title">Gayrimenkul Yatırımları (GYO/REIT)</span>
                            </label>
                            <div class="day-content">
                                <h4>🏢 GYO Nedir?</h4>
                                <p><strong>GYO:</strong> Gayrimenkul Yatırım Ortaklığı</p>
                                <p><strong>REIT:</strong> Real Estate Investment Trust (US)</p>

                                <h4>💰 Gelir Kaynağı</h4>
                                <ul>
                                    <li><strong>Kira geliri:</strong> %90+ kar dağıtımı (yasa gereği)</li>
                                    <li><strong>Sermaye kazancı:</strong> Hisse fiyat artışı</li>
                                </ul>

                                <h4>🇹🇷 Türkiye GYO Örnekleri</h4>
                                <ul>
                                    <li><strong>ISFIN:</strong> İş GYO</li>
                                    <li><strong>TRGYO:</strong> Torunlar GYO</li>
                                    <li><strong>EKGYO:</strong> Emlak Konut GYO</li>
                                </ul>

                                <div class="key-takeaways">
                                    <h4>🔑 Anahtar Noktalar:</h4>
                                    <ul>
                                        <li>✅ GYO = Likit gayrimenkul (hisse gibi alınır)</li>
                                        <li>✅ Düzenli kira geliri dağıtımı</li>
                                        <li>⚠️ Faiz artışında düşer</li>
                                        <li>⚠️ Gayrimenkul piyasasına bağlı</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <!-- GÜN 29: PASİF GELİR STRATEJİLERİ -->
                        <div class="day-item">
                            <input type="checkbox" id="day29" class="day-checkbox">
                            <label for="day29" class="day-label">
                                <span class="day-number">Gün 29</span>
                                <span class="day-title">Pasif Gelir Stratejileri</span>
                            </label>
                            <div class="day-content">
                                <h4>💰 Pasif Gelir Nedir?</h4>
                                <p><strong>Tanım:</strong> Aktif çalışmadan düzenli gelir</p>

                                <h4>📈 Temettü Hisseleri</h4>
                                <ul>
                                    <li><strong>Dividend Aristocrats:</strong> 25+ yıl temettü artıranlar</li>
                                    <li><strong>Örnekler:</strong> Coca-Cola (KO), Johnson & Johnson (JNJ), P&G</li>
                                    <li><strong>Hedef:</strong> %3-5 yıllık temettü verimi</li>
                                </ul>

                                <h4>🏦 Tahvil Kuponları</h4>
                                <ul>
                                    <li><strong>Devlet tahvili:</strong> Düşük risk, sabit gelir</li>
                                    <li><strong>Şirket tahvili:</strong> Daha yüksek getiri, biraz risk</li>
                                </ul>

                                <h4>🏠 GYO Kira Geliri</h4>
                                <ul>
                                    <li><strong>Aylık/üç aylık:</strong> Düzenli dağıtım</li>
                                    <li><strong>REIT dividend yield:</strong> %4-8 arası</li>
                                </ul>

                                <h4>🎯 Pasif Gelir Hedefi</h4>
                                <div class="example-box">
                                    <pre>
Hedef: Aylık 10.000 TL pasif gelir

Portföy:
• 500.000 TL Temettü hisseleri (%4 yield) → 20.000 TL/yıl
• 300.000 TL GYO (%6 yield) → 18.000 TL/yıl
• 200.000 TL Tahvil (%8 yield) → 16.000 TL/yıl

Toplam Yıllık: 54.000 TL
Aylık: 4.500 TL

10.000 TL için → 2.2 milyon TL portföy gerekli
                                    </pre>
                                </div>

                                <div class="key-takeaways">
                                    <h4>🔑 Anahtar Noktalar:</h4>
                                    <ul>
                                        <li>✅ Pasif gelir = Finansal özgürlük</li>
                                        <li>✅ Temettü + Tahvil + GYO kombinasyonu</li>
                                        <li>✅ Dividend Aristocrats güvenilir</li>
                                        <li>⚠️ Büyük sermaye gerekir</li>
                                        <li>⚠️ Enflasyonu hesaba kat</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <!-- GÜN 30: FINAL - 10 YILLIK PLAN -->
                        <div class="day-item">
                            <input type="checkbox" id="day30" class="day-checkbox">
                            <label for="day30" class="day-label">
                                <span class="day-number">Gün 30</span>
                                <span class="day-title">FINAL - Kendi 10 Yıllık Planını Oluştur</span>
                            </label>
                            <div class="day-content">'''

print("Days 26-30 content prepared!")
print(f"Length: {len(days_26_30)} characters")

# Write to file
with open('days_26_30_content.html', 'w', encoding='utf-8') as f:
    f.write(days_26_30)

print("✅ Saved to days_26_30_content.html")
