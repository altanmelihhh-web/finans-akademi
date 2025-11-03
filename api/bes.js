/**
 * Vercel Serverless Function - BES API Proxy
 *
 * Endpoint: /api/bes?code=AAK
 *
 * Note: BES fonları için gerçek API yok, şimdilik simüle edilmiş veri.
 * Gerçek veriler için EGM sitesinden scraping gerekiyor.
 */

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, s-maxage=3600'); // Cache 1 hour

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.query;

  // Validate parameters
  if (!code) {
    return res.status(400).json({
      error: 'Missing fund code',
      usage: '/api/bes?code=AAK'
    });
  }

  try {
    // TODO: Gerçek EGM verisi çekilecek
    // Şimdilik simüle edilmiş veri dönüyoruz

    // BES fund base prices (realistic ranges)
    const basePrices = {
      // Agresif fonlar (daha yüksek getiri, risk)
      'AAK': 0.1834, 'AEG': 0.2145, 'GAG': 0.1956, 'HEM': 0.2234,
      'IAG': 0.1789, 'VAG': 0.2012, 'YAG': 0.1923, 'ZAG': 0.2087,
      // Dengeli fonlar
      'AHD': 0.1645, 'AYE': 0.1534, 'AKD': 0.1723, 'GDN': 0.1612,
      'HDN': 0.1567, 'IDN': 0.1698, 'VDN': 0.1589, 'YDE': 0.1634, 'ZDE': 0.1701,
      // Hisse senedi fonları (en yüksek risk/getiri)
      'AKH': 0.2345, 'GHH': 0.2456, 'IHE': 0.2123
    };

    const fundCode = code.toUpperCase();
    const basePrice = basePrices[fundCode] || (0.15 + Math.random() * 0.1);

    // Günlük değişim: -%1 ile +%1 arası
    const dailyChange = (Math.random() - 0.5) * 2;
    const currentPrice = basePrice * (1 + dailyChange / 100);

    const mockData = [{
      FundCode: fundCode,
      FundName: `${fundCode} Emeklilik Yatırım Fonu`,
      Price: currentPrice.toFixed(4),
      PreviousPrice: basePrice.toFixed(4),
      Date: new Date().toISOString().split('T')[0],
      ChangePercent: dailyChange.toFixed(2),
      Volume: 0,
      note: 'Simulated data - Real EGM scraping to be implemented'
    }];

    return res.status(200).json(mockData);

  } catch (error) {
    console.error('BES fetch error:', error);
    return res.status(500).json({
      error: 'Failed to fetch BES data',
      message: error.message,
      code: code
    });
  }
}
