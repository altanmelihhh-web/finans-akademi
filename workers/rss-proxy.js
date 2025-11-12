/**
 * Cloudflare Worker - RSS to JSON Proxy
 *
 * Deploy: wrangler publish
 * URL: https://rss-proxy.YOUR-SUBDOMAIN.workers.dev
 *
 * Usage:
 * GET /?url=https://www.foreks.com/rss/haber.xml
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
  }

  // Handle OPTIONS request (CORS preflight)
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(request.url)
    const rssUrl = url.searchParams.get('url')

    if (!rssUrl) {
      return new Response(JSON.stringify({
        error: 'Missing url parameter',
        usage: '/?url=https://example.com/rss'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      })
    }

    // Fetch RSS feed
    const rssResponse = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RSS Reader/1.0)',
      }
    })

    if (!rssResponse.ok) {
      throw new Error(`Failed to fetch RSS: ${rssResponse.status}`)
    }

    const rssText = await rssResponse.text()

    // Parse XML to JSON
    const items = parseRSSToJSON(rssText)

    // Return JSON response
    return new Response(JSON.stringify({
      status: 'ok',
      feed: {
        url: rssUrl,
        title: extractTitle(rssText),
      },
      items: items,
      count: items.length
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
      }
    })

  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message,
      status: 'error'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    })
  }
}

/**
 * Parse RSS XML to JSON
 */
function parseRSSToJSON(xmlText) {
  const items = []

  // Extract all <item> tags using regex (simple but effective)
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi
  const itemMatches = [...xmlText.matchAll(itemRegex)]

  for (const match of itemMatches.slice(0, 20)) { // Limit to 20 items
    const itemXml = match[1]

    const item = {
      title: extractTag(itemXml, 'title'),
      link: extractTag(itemXml, 'link'),
      description: extractTag(itemXml, 'description'),
      pubDate: extractTag(itemXml, 'pubDate'),
      author: extractTag(itemXml, 'author') || extractTag(itemXml, 'dc:creator'),
      category: extractTag(itemXml, 'category'),
      guid: extractTag(itemXml, 'guid')
    }

    // Try to extract image
    const enclosureMatch = itemXml.match(/<enclosure[^>]+url="([^"]+)"/i)
    if (enclosureMatch) {
      item.enclosure = { link: enclosureMatch[1] }
    }

    const mediaContentMatch = itemXml.match(/<media:content[^>]+url="([^"]+)"/i)
    if (mediaContentMatch) {
      item.thumbnail = mediaContentMatch[1]
    }

    const mediaThumbnailMatch = itemXml.match(/<media:thumbnail[^>]+url="([^"]+)"/i)
    if (mediaThumbnailMatch && !item.thumbnail) {
      item.thumbnail = mediaThumbnailMatch[1]
    }

    // Clean HTML from description
    if (item.description) {
      item.description = cleanHTML(item.description)
    }

    items.push(item)
  }

  return items
}

/**
 * Extract content from XML tag
 */
function extractTag(xml, tagName) {
  const regex = new RegExp(`<${tagName}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\/${tagName}>`, 'i')
  const cdataMatch = xml.match(regex)

  if (cdataMatch) {
    return cdataMatch[1].trim()
  }

  const simpleRegex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\/${tagName}>`, 'i')
  const match = xml.match(simpleRegex)

  return match ? match[1].trim() : null
}

/**
 * Extract feed title
 */
function extractTitle(xml) {
  const match = xml.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  return match ? cleanHTML(match[1]) : 'RSS Feed'
}

/**
 * Remove HTML tags from text
 */
function cleanHTML(html) {
  if (!html) return ''

  return html
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}
