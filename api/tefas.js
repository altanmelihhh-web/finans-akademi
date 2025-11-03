/**
 * Vercel Serverless Function - TEFAS API Proxy
 *
 * Endpoint: /api/tefas?code=AFH&date=2025-11-03
 */

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, s-maxage=300'); // Cache 5 minutes

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, date } = req.query;

  // Validate parameters
  if (!code) {
    return res.status(400).json({
      error: 'Missing fund code',
      usage: '/api/tefas?code=AFH&date=2025-11-03'
    });
  }

  if (!date) {
    return res.status(400).json({
      error: 'Missing date',
      usage: '/api/tefas?code=AFH&date=2025-11-03'
    });
  }

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({
      error: 'Invalid date format',
      expected: 'YYYY-MM-DD',
      received: date
    });
  }

  try {
    // Fetch from TEFAS API
    const tefasUrl = `https://ws.tefas.gov.tr/bultenapi/PortfolioInfo/${code.toUpperCase()}/${date}`;

    console.log(`Fetching TEFAS: ${tefasUrl}`);

    const response = await fetch(tefasUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'tr-TR,tr;q=0.9',
        'Referer': 'https://www.tefas.gov.tr/'
      }
    });

    if (!response.ok) {
      console.error(`TEFAS API error: ${response.status}`);
      return res.status(response.status).json({
        error: 'TEFAS API error',
        status: response.status,
        code: code,
        date: date
      });
    }

    const data = await response.json();

    // Return data
    return res.status(200).json(data);

  } catch (error) {
    console.error('TEFAS fetch error:', error);
    return res.status(500).json({
      error: 'Failed to fetch TEFAS data',
      message: error.message,
      code: code,
      date: date
    });
  }
}
