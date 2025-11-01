/**
 * Cloudflare Worker - US Market Indices Proxy
 * Bypasses CORS for Yahoo Finance API
 * Supports: S&P 500 (^GSPC), NASDAQ (^IXIC), DOW (^DJI), BIST 100 (XU100.IS)
 */

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(request.url);

    // Get symbol from path (e.g., /GSPC or /^GSPC)
    let symbol = url.pathname.replace('/', '').trim();

    // Query string fallback
    if (!symbol || symbol === '') {
      symbol = url.searchParams.get('symbol');
    }

    if (!symbol || symbol === '') {
      return new Response(JSON.stringify({
        error: 'Symbol required. Use: /GSPC or ?symbol=GSPC',
        examples: [
          '/GSPC (S&P 500)',
          '/IXIC (NASDAQ)',
          '/DJI (DOW JONES)',
          '/XU100.IS (BIST 100)'
        ]
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Add ^ prefix if not present (Yahoo Finance format)
    if (!symbol.startsWith('^') && !symbol.includes('.')) {
      symbol = '^' + symbol;
    }

    // Fetch from Yahoo Finance
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;

    const response = await fetch(yahooUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Yahoo Finance error: ${response.status}`);
    }

    const data = await response.json();

    // Return raw Yahoo Finance data
    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60' // Cache for 1 minute
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
