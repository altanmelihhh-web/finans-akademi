/**
 * Vercel Serverless Function - Health Check
 *
 * Endpoint: /api/health
 */

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache');

  return res.status(200).json({
    status: 'ok',
    service: 'Finans Akademi API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      tefas: '/api/tefas?code=AFH&date=2025-11-03',
      bes: '/api/bes?code=AAK'
    }
  });
}
