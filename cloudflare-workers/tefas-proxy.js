/**
 * Cloudflare Worker - TEFAS API Proxy
 *
 * Purpose: Bypass CORS restrictions for TEFAS (Turkish mutual funds) API
 * Deploy: https://dash.cloudflare.com -> Workers -> Create Worker
 *
 * Usage:
 * https://your-worker.workers.dev/tefas/AFH/2025-01-15
 *
 * This worker proxies requests to https://ws.tefas.gov.tr/bultenapi
 * and adds CORS headers to allow browser access.
 */

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url);

  // Parse path: /tefas/{fundCode}/{date}
  const pathParts = url.pathname.split('/').filter(p => p);

  // Health check endpoint
  if (pathParts.length === 0 || pathParts[0] === 'health') {
    return new Response(JSON.stringify({
      status: 'ok',
      service: 'TEFAS API Proxy',
      version: '1.0.0',
      usage: '/tefas/{fundCode}/{date}',
      example: '/tefas/AFH/2025-01-15'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  // TEFAS endpoint
  if (pathParts[0] === 'tefas') {
    if (pathParts.length < 3) {
      return new Response(JSON.stringify({
        error: 'Invalid request',
        usage: '/tefas/{fundCode}/{date}',
        example: '/tefas/AFH/2025-01-15'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    const fundCode = pathParts[1].toUpperCase();
    const date = pathParts[2]; // Format: YYYY-MM-DD

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return new Response(JSON.stringify({
        error: 'Invalid date format',
        expected: 'YYYY-MM-DD',
        received: date
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    try {
      // Fetch from TEFAS API
      const tefasUrl = `https://ws.tefas.gov.tr/bultenapi/PortfolioInfo/${fundCode}/${date}`;
      console.log(`Fetching: ${tefasUrl}`);

      const response = await fetch(tefasUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; FinansAkademi/1.0)',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        return new Response(JSON.stringify({
          error: 'TEFAS API error',
          status: response.status,
          fundCode: fundCode,
          date: date
        }), {
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      const data = await response.json();

      // Return with CORS headers
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
        }
      });

    } catch (error) {
      return new Response(JSON.stringify({
        error: 'Fetch failed',
        message: error.message,
        fundCode: fundCode,
        date: date
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }

  // BES endpoint - Scrapes from EGM
  if (pathParts[0] === 'bes') {
    if (pathParts.length < 2) {
      return new Response(JSON.stringify({
        error: 'Invalid request',
        usage: '/bes/{fundCode}',
        example: '/bes/AAK'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    const fundCode = pathParts[1].toUpperCase();

    try {
      // BES fonları için gerçek veri kaynağını scrape et
      // EGM sitesinden veri çekiyoruz
      const egmUrl = `https://emeklilik.egm.org.tr/BESFonPerformance`;

      const response = await fetch(egmUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; FinansAkademi/1.0)',
          'Accept': 'text/html,application/xhtml+xml'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();

      // HTML'den BES fon verilerini parse et (örnek - gerçek parsing eklenecek)
      // Şimdilik simüle edilmiş veri dönüyoruz
      const mockData = {
        FundCode: fundCode,
        FundName: `${fundCode} Emeklilik Yatırım Fonu`,
        Price: (0.15 + Math.random() * 0.1).toFixed(4),
        Date: new Date().toISOString().split('T')[0],
        ChangePercent: ((Math.random() - 0.5) * 2).toFixed(2),
        note: 'Mock data - EGM scraping will be implemented'
      };

      return new Response(JSON.stringify([mockData]), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
        }
      });

    } catch (error) {
      return new Response(JSON.stringify({
        error: 'BES data fetch failed',
        message: error.message,
        fundCode: fundCode,
        note: 'Using fallback mock data until EGM scraping is fully implemented'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }

  // Unknown endpoint
  return new Response(JSON.stringify({
    error: 'Not found',
    availableEndpoints: ['/health', '/tefas/{fundCode}/{date}']
  }), {
    status: 404,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

// Handle CORS preflight requests
addEventListener('fetch', event => {
  if (event.request.method === 'OPTIONS') {
    event.respondWith(new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400'
      }
    }));
  }
});
